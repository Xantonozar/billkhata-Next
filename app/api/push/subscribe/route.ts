import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { getSession } from '@/lib/auth';
import PushSubscription from '@/models/PushSubscription';

export const dynamic = 'force-dynamic';

// Subscribe to push notifications
export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const user = await getSession(req);
        if (!user) {
            return NextResponse.json({ message: 'Not authorized' }, { status: 401 });
        }

        const subscription = await req.json();

        // Validate subscription data
        if (!subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
            return NextResponse.json({ message: 'Invalid subscription data' }, { status: 400 });
        }

        // Upsert subscription (update if exists, create if not)
        await PushSubscription.findOneAndUpdate(
            { endpoint: subscription.endpoint },
            {
                userId: user._id,
                endpoint: subscription.endpoint,
                keys: {
                    p256dh: subscription.keys.p256dh,
                    auth: subscription.keys.auth
                }
            },
            { upsert: true, new: true }
        );

        return NextResponse.json({ message: 'Subscribed successfully' });
    } catch (error: any) {
        console.error('Push subscribe error:', error);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}

// Unsubscribe from push notifications
export async function DELETE(req: NextRequest) {
    try {
        await connectDB();
        const user = await getSession(req);
        if (!user) {
            return NextResponse.json({ message: 'Not authorized' }, { status: 401 });
        }

        const { endpoint } = await req.json();

        if (!endpoint) {
            return NextResponse.json({ message: 'Endpoint required' }, { status: 400 });
        }

        await PushSubscription.deleteOne({ userId: user._id, endpoint });

        return NextResponse.json({ message: 'Unsubscribed successfully' });
    } catch (error: any) {
        console.error('Push unsubscribe error:', error);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}
