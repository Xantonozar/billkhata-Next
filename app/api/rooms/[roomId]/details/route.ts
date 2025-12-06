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

        const room = await Room.findOne({ khataId: roomId });

        if (!room) {
            return NextResponse.json({ message: 'Room not found' }, { status: 404 });
        }

        // Check if user is a member of this room
        const isMember = room.members.some((m: any) => m.user.toString() === user._id.toString() && m.status === 'Approved') || room.manager.toString() === user._id.toString();

        if (!isMember) {
            return NextResponse.json({ message: 'Not authorized to view this room' }, { status: 403 });
        }

        const approvedMembersCount = room.members.filter((m: any) => m.status === 'Approved').length;
        // Include manager in count if not already in members list (usually manager is separate or also in members)
        // Schema says manager is separate field, but usually added to members too. Let's assume standard count.

        return NextResponse.json({
            name: room.name,
            khataId: room.khataId,
            memberCount: approvedMembersCount,
            managerId: room.manager,
            createdAt: room.createdAt
        });

    } catch (error: any) {
        console.error('Get room details error:', error);
        return NextResponse.json({ message: 'Server error fetching room details' }, { status: 500 });
    }
}
