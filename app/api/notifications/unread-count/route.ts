import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Notification from '@/models/Notification';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const user = await getSession(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const count = await Notification.countDocuments({
            userId: user._id,
            read: false
        });

        return NextResponse.json({ count });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
