import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import Room from '@/models/Room';
import connectDB from '@/lib/db';
import { getSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ khataId: string }> }) {
    try {
        await connectDB();
        const user = await getSession(req);

        if (!user) {
            return NextResponse.json({ message: 'Not authorized' }, { status: 401 });
        }

        const { khataId } = await params;

        // Only MasterManager can create members
        if (user.role !== 'MasterManager') {
            return NextResponse.json({ message: 'Only MasterManagers can create members directly' }, { status: 403 });
        }

        if (user.khataId !== khataId) {
            return NextResponse.json({ message: 'Access denied' }, { status: 403 });
        }

        const { name, email, password, avatarUrl } = await req.json();

        if (!name || name.trim().length < 2) {
            return NextResponse.json({ message: 'Name is required and must be at least 2 characters' }, { status: 400 });
        }

        // Generate dummy email if not provided
        const finalEmail = email && email.trim()
            ? email.trim().toLowerCase()
            : `member_${Date.now()}_${Math.random().toString(36).substring(7)}@dummy.local`;

        // Generate random password if not provided
        const finalPassword = password && password.trim()
            ? password.trim()
            : Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);

        // Check if email already exists
        const existingUser = await User.findOne({ email: finalEmail });
        if (existingUser) {
            return NextResponse.json({ message: 'Email already exists. Please use a different email.' }, { status: 400 });
        }

        // Create new member
        const newMember = await User.create({
            name: name.trim(),
            email: finalEmail,
            password: finalPassword,
            role: 'Member',
            roomStatus: 'Approved', // Auto-approve
            khataId: khataId,
            isDummyAccount: !email || !password, // Mark as dummy if credentials were auto-generated
            isVerified: true, // Auto-verify
            avatarUrl: avatarUrl || undefined
        });

        // Add member to Room
        await Room.findOneAndUpdate(
            { khataId },
            {
                $push: {
                    members: {
                        user: newMember._id,
                        status: 'Approved',
                        joinedAt: new Date()
                    }
                }
            }
        );

        // Don't send password back in response
        const memberResponse = {
            id: newMember._id.toString(),
            name: newMember.name,
            email: newMember.email,
            role: newMember.role,
            roomStatus: newMember.roomStatus,
            khataId: newMember.khataId,
            isDummyAccount: newMember.isDummyAccount
        };

        // Send notification to room
        try {
            const { pushToRoom } = await import('@/lib/pusher');
            await pushToRoom(khataId, 'member-added', {
                type: 'member-added',
                message: `${user.name} added ${newMember.name} to the room`,
                memberName: newMember.name
            });
        } catch (pusherErr) {
            console.error('Pusher error:', pusherErr);
        }

        return NextResponse.json({
            message: 'Member created successfully',
            member: memberResponse,
            generatedCredentials: newMember.isDummyAccount ? {
                email: finalEmail,
                password: finalPassword
            } : undefined
        }, { status: 201 });

    } catch (error: any) {
        console.error('Error creating member:', error);
        return NextResponse.json({
            message: error.message || 'Server error creating member'
        }, { status: 500 });
    }
}
