import { NextRequest, NextResponse } from 'next/server';
import Room from '@/models/Room';
import connectDB from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ khataId: string }> }) {
    try {
        await connectDB();
        const user = await getSession(req);
        if (!user) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

        const { khataId } = await params;

        if (user.khataId !== khataId) {
            return NextResponse.json({ message: 'Access denied' }, { status: 403 });
        }

        const room = await Room.findOne({ khataId })
            .populate('members.user', 'name email');

        if (!room) {
            return NextResponse.json({ message: 'Room not found' }, { status: 404 });
        }

        const approvedMembers = room.members
            .filter((m: any) => m.status === 'Approved')
            .map((m: any) => ({
                id: m.user._id,
                name: m.user.name
            }));

        return NextResponse.json(approvedMembers);

    } catch (error: any) {
        console.error('Error fetching members:', error);
        return NextResponse.json({ message: 'Server error fetching members' }, { status: 500 });
    }
}
