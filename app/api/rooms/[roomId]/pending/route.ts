import { NextRequest, NextResponse } from 'next/server';
import Room from '@/models/Room';
import connectDB from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
    try {
        await connectDB();
        const user = await getSession(req);
        if (!user) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

        const { roomId } = await params;

        const room = await Room.findOne({ khataId: roomId })
            .populate('members.user', 'name email');

        if (!room) {
            return NextResponse.json({ message: 'Room not found' }, { status: 404 });
        }

        // Verify manager
        if (room.manager.toString() !== user._id.toString()) {
            return NextResponse.json({ message: 'Not authorized' }, { status: 403 });
        }

        const pendingMembers = room.members
            .filter((m: any) => m.status === 'Pending')
            .map((m: any) => ({
                id: m.user._id,
                name: m.user.name,
                email: m.user.email,
                requestedAt: m.joinedAt
            }));

        return NextResponse.json(pendingMembers);

    } catch (error: any) {
        console.error('Get pending error:', error);
        return NextResponse.json({ message: 'Server error fetching pending requests' }, { status: 500 });
    }
}
