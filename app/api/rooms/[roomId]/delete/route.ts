import { NextRequest, NextResponse } from 'next/server';
import Room from '@/models/Room';
import User from '@/models/User';
import Bill from '@/models/Bill';
import Deposit from '@/models/Deposit';
import Expense from '@/models/Expense';
import Menu from '@/models/Menu';
import connectDB from '@/lib/db';
import { getSession } from '@/lib/auth';
import { globalCache } from '@/lib/cache';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
    try {
        await connectDB();
        const user = await getSession(req);
        if (!user) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

        const { roomId } = await params;

        const room = await Room.findOne({ khataId: roomId });
        if (!room) {
            return NextResponse.json({ message: 'Room not found' }, { status: 404 });
        }

        // Verify caller is the manager
        if (room.manager.toString() !== user._id.toString()) {
            return NextResponse.json({ message: 'Only the manager can delete this room' }, { status: 403 });
        }

        // Get all member IDs (including pending)
        const memberIds = room.members.map((m: any) => m.user);

        // Reset all members' status
        await User.updateMany(
            { _id: { $in: memberIds } },
            { roomStatus: 'NoRoom', khataId: null }
        );

        // Reset manager's status
        await User.findByIdAndUpdate(user._id, {
            roomStatus: 'NoRoom',
            khataId: null
        });

        // Delete all room data
        const Meal = (await import('@/models/Meal')).default;
        const Notification = (await import('@/models/Notification')).default;

        await Promise.all([
            Bill.deleteMany({ khataId: roomId }),
            Meal.deleteMany({ khataId: roomId }),
            Deposit.deleteMany({ khataId: roomId }),
            Expense.deleteMany({ khataId: roomId }),
            Menu.deleteMany({ khataId: roomId }),
            Notification.deleteMany({ khataId: roomId }),
            Room.deleteOne({ khataId: roomId })
        ]);

        // Invalidate caches
        globalCache.delete(`user:${user._id}`);
        memberIds.forEach((id: any) => globalCache.delete(`user:${id}`));

        return NextResponse.json({ message: 'Room deleted successfully' });

    } catch (error: any) {
        console.error('Delete room error:', error);
        return NextResponse.json({ message: 'Server error deleting room' }, { status: 500 });
    }
}
