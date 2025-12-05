import { NextRequest, NextResponse } from 'next/server';
import Room from '@/models/Room';
import User from '@/models/User';
import connectDB from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const user = await getSession(req);
        if (!user) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

        if (user.role !== 'Manager') {
            return NextResponse.json({ message: 'Not authorized as Manager' }, { status: 403 });
        }

        const { name, khataId } = await req.json();

        if (!name || !khataId) {
            return NextResponse.json({ message: 'Name and Khata ID are required' }, { status: 400 });
        }

        // Check if room already exists
        const roomExists = await Room.findOne({ khataId });
        if (roomExists) {
            return NextResponse.json({ message: 'Room with this Khata ID already exists' }, { status: 400 });
        }

        // Check if user already has a room
        if (user.khataId) {
            return NextResponse.json({ message: 'You already have a room' }, { status: 400 });
        }

        // Create room
        const room = await Room.create({
            name,
            khataId,
            manager: user._id,
            members: []
        });

        // Update user
        await User.findByIdAndUpdate(user._id, {
            khataId,
            roomStatus: 'Approved'
        });

        return NextResponse.json({
            message: 'Room created successfully',
            room: {
                id: room._id,
                name: room.name,
                khataId: room.khataId
            }
        }, { status: 201 });

    } catch (error: any) {
        console.error('Create room error:', error);
        return NextResponse.json({ message: 'Server error creating room' }, { status: 500 });
    }
}
