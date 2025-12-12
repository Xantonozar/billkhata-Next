import { NextRequest, NextResponse } from 'next/server';
import Room from '@/models/Room';
import User from '@/models/User';
import connectDB from '@/lib/db';
import { getSession } from '@/lib/auth';
import { globalCache } from '@/lib/cache';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ roomId: string; userId: string }> }) {
    try {
        await connectDB();
        const user = await getSession(req);
        if (!user) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

        const { roomId, userId } = await params;

        const room = await Room.findOne({ khataId: roomId });

        if (!room) {
            return NextResponse.json({ message: 'Room not found' }, { status: 404 });
        }

        // Verify manager
        if (room.manager.toString() !== user._id.toString()) {
            return NextResponse.json({ message: 'Not authorized' }, { status: 403 });
        }

        // Find member
        const memberIndex = room.members.findIndex(
            (m: any) => m.user.toString() === userId && m.status === 'Pending'
        );

        if (memberIndex === -1) {
            return NextResponse.json({ message: 'Pending request not found' }, { status: 404 });
        }

        // Approve member
        room.members[memberIndex].status = 'Approved';
        await room.save();

        // Update user status
        await User.findByIdAndUpdate(userId, {
            roomStatus: 'Approved'
        });

        // Invalidate user cache so they see the update immediately
        globalCache.delete(`user:${userId}`);

        // Create notification for the approved user
        await import('@/models/Notification').then(mod => mod.default.create({
            userId: userId,
            khataId: roomId,
            type: 'room',
            title: 'Welcome to BillKhata!',
            message: `Your request to join room "${room.name}" has been approved.`,
            actionText: 'Go to Dashboard',
            link: '/dashboard',
            read: false,
            relatedId: room._id
        }));

        return NextResponse.json({ message: 'Member approved successfully' });

    } catch (error: any) {
        console.error('Approve member error:', error);
        return NextResponse.json({ message: 'Server error approving member' }, { status: 500 });
    }
}
