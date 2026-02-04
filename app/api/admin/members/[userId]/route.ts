import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { getSession } from '@/lib/auth';
import { Role } from '@/types';

export const dynamic = 'force-dynamic';

// PUT: Update member information (Master Manager only)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
    try {
        const currentUser = await getSession(req);
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only Master Managers can edit other members
        if (currentUser.role !== Role.MasterManager) {
            return NextResponse.json({ error: 'Only Master Managers can edit members' }, { status: 403 });
        }

        await dbConnect();

        const { userId } = await params;
        const body = await req.json();
        const { name, email, phone, whatsapp, facebook, role, avatarUrl, password } = body;

        // Prevent Master Manager from editing their own role
        if (userId === currentUser._id.toString() && role && role !== currentUser.role) {
            return NextResponse.json({ error: 'Cannot change your own role' }, { status: 403 });
        }

        // Validate role if provided
        if (role && !Object.values(Role).includes(role)) {
            return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
        }

        // Build update object with only provided fields
        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (email !== undefined) {
            // Check if email is already taken by another user
            const existingUser = await User.findOne({ email, _id: { $ne: userId } });
            if (existingUser) {
                return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
            }
            updateData.email = email;
        }
        if (phone !== undefined) updateData.phone = phone;
        if (whatsapp !== undefined) updateData.whatsapp = whatsapp;
        if (facebook !== undefined) updateData.facebook = facebook;
        if (role !== undefined) updateData.role = role;
        if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

        // Handle password update
        if (password && password.trim().length > 0) {
            if (password.length < 6) {
                return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
            }
            const bcrypt = await import('bcryptjs');
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(password, salt);
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password -otp -otpExpires');

        if (!updatedUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error('Error updating member:', error);
        return NextResponse.json(
            { error: 'Failed to update member' },
            { status: 500 }
        );
    }
}
