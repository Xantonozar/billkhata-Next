import { NextRequest, NextResponse } from 'next/server';
import Room from '@/models/Room';
import User from '@/models/User';
import connectDB from '@/lib/db';
import { getSession } from '@/lib/auth';
import { globalCache } from '@/lib/cache';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
    try {
        await connectDB();
        const user = await getSession(req);
        if (!user) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

        const { roomId } = await params;

        // Verify user is in this room
        if (user.khataId !== roomId) {
            return NextResponse.json({ message: 'You are not in this room' }, { status: 403 });
        }

        // Managers cannot leave - they must delete the room
        if (user.role === 'Manager') {
            return NextResponse.json({ message: 'Managers cannot leave. Use Delete Room instead.' }, { status: 400 });
        }

        const room = await Room.findOne({ khataId: roomId });
        if (!room) {
            return NextResponse.json({ message: 'Room not found' }, { status: 404 });
        }

        // Remove member from room
        room.members = room.members.filter((m: any) => m.user.toString() !== user._id.toString());
        await room.save();

        // Update user status
        await User.findByIdAndUpdate(user._id, {
            roomStatus: 'NoRoom',
            khataId: null
        });

        // Invalidate user cache
        globalCache.delete(`user:${user._id}`);

        // Create notification for manager
        await import('@/models/Notification').then(mod => mod.default.create({
            userId: room.manager,
            khataId: roomId,
            type: 'room',
            title: 'Member Left',
            message: `${user.name} has left the room.`,
            read: false
        }));

        return NextResponse.json({ message: 'Successfully left the room' });

    } catch (error: any) {
        console.error('Leave room error:', error);
        return NextResponse.json({ message: 'Server error leaving room' }, { status: 500 });
    }
}
