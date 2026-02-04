import { NextRequest, NextResponse } from 'next/server';
import Room from '@/models/Room';
import User from '@/models/User';
import connectDB from '@/lib/db';
import { getSession, requireManager } from '@/lib/auth';
import { globalCache } from '@/lib/cache';
import { CreateRoomSchema, validateBody } from '@/lib/validation';

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const user = await getSession(req);

        // Check authorization
        const authError = requireManager(user);
        if (authError) return authError;

        // Parse and validate body
        const body = await req.json();
        const validation = validateBody(CreateRoomSchema, body);

        if (!validation.success) {
            return NextResponse.json({ message: validation.error }, { status: 400 });
        }

        const { name, khataId } = validation.data;

        // Check if room already exists
        const roomExists = await Room.findOne({ khataId });
        if (roomExists) {
            return NextResponse.json(
                { message: 'Room with this Khata ID already exists' },
                { status: 400 }
            );
        }

        // Check if user already has a room
        if (user.khataId) {
            return NextResponse.json(
                { message: 'You already have a room' },
                { status: 400 }
            );
        }

        // Create room
        const room = await Room.create({
            name,
            khataId,
            manager: user._id,
            members: []
        });

        // Update user and get new state
        const updatedUser = await User.findByIdAndUpdate(user._id, {
            khataId,
            roomStatus: 'Approved'
        }, { new: true }).select('-password');

        // Invalidate user cache so next request gets fresh data
        globalCache.delete(`user:${user._id}`);

        return NextResponse.json({
            message: 'Room created successfully',
            room: {
                id: room._id,
                name: room.name,
                khataId: room.khataId
            },
            user: {
                id: updatedUser?._id,
                name: updatedUser?.name,
                email: updatedUser?.email,
                role: updatedUser?.role,
                roomStatus: updatedUser?.roomStatus,
                khataId: updatedUser?.khataId,
                avatarUrl: updatedUser?.avatarUrl,
                whatsapp: updatedUser?.whatsapp,
                facebook: updatedUser?.facebook,
                isVerified: updatedUser?.isVerified === true
            }
        }, { status: 201 });

    } catch (error: any) {
        console.error('Create room error:', error);
        return NextResponse.json(
            { message: 'Server error creating room' },
            { status: 500 }
        );
    }
}
