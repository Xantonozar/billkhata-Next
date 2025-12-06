import { NextRequest, NextResponse } from 'next/server';
import Room from '@/models/Room';
import User from '@/models/User';
import connectDB from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
    try {
        await connectDB();
        const user = await getSession(req);
        if (!user) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

        const { roomId } = await params;

        const room = await Room.findOne({ khataId: roomId });

        if (!room) {
            return NextResponse.json({ message: 'Room not found' }, { status: 404 });
        }

        // Only manager can regenerate code
        if (room.manager.toString() !== user._id.toString()) {
            return NextResponse.json({ message: 'Only the manager can regenerate the room code' }, { status: 403 });
        }

        // Generate new 6-char code
        let newCode = '';
        let isUnique = false;
        while (!isUnique) {
            newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            const existing = await Room.findOne({ khataId: newCode });
            if (!existing) isUnique = true;
        }

        const oldKhataId = room.khataId;

        // Update Room
        room.khataId = newCode;
        await room.save();

        // Update all members (including manager)
        // Note: 'members' array in Room has references to users, but users also store 'khataId'
        // We need to update user docs.

        // Find all users with the old khataId
        await User.updateMany(
            { khataId: oldKhataId },
            { khataId: newCode }
        );

        return NextResponse.json({
            message: 'Room code regenerated successfully',
            newCode: newCode
        });

    } catch (error: any) {
        console.error('Regenerate code error:', error);
        return NextResponse.json({ message: 'Server error regenerating code' }, { status: 500 });
    }
}
