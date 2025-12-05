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

        const { khataId } = await req.json();

        if (!khataId) {
            return NextResponse.json({ message: 'Khata ID is required' }, { status: 400 });
        }

        // Check if room exists
        const room = await Room.findOne({ khataId });
        if (!room) {
            return NextResponse.json({ message: 'Room not found' }, { status: 404 });
        }

        // Check if user already in a room
        if (user.khataId) {
            return NextResponse.json({ message: 'You are already in a room' }, { status: 400 });
        }

        // Check if already requested
        const alreadyRequested = room.members.some(
            (m: any) => m.user.toString() === user._id.toString()
        );
        if (alreadyRequested) {
            return NextResponse.json({ message: 'Join request already pending' }, { status: 400 });
        }

        // Add member with pending status
        room.members.push({
            user: user._id,
            status: 'Pending'
        });
        await room.save();

        // Update user status
        await User.findByIdAndUpdate(user._id, {
            khataId,
            roomStatus: 'Pending'
        });

        // Notify manager about the join request
        try {
            const Notification = await import('@/models/Notification').then(mod => mod.default);
            console.log(`DEBUG: Creating join notification for manager ID: ${room.manager}, khataId: ${khataId}`);
            const notification = await Notification.create({
                userId: room.manager,
                khataId: khataId,
                type: 'room',
                title: 'New Join Request',
                message: `${user.name} has requested to join your room.`,
                actionText: 'Review Request',
                link: `/pending-approvals`,
                read: false,
                relatedId: user._id
            });
            console.log(`SUCCESS: Notification created with ID ${notification._id} for manager ${room.manager}`);
        } catch (notificationError) {
            console.error('Error creating join request notification:', notificationError);
        }

        return NextResponse.json({ message: 'Join request sent successfully' });

    } catch (error: any) {
        console.error('Join room error:', error);
        return NextResponse.json({ message: 'Server error joining room' }, { status: 500 });
    }
}
