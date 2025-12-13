import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { getSession } from '@/lib/auth';
import PushSubscription from '@/models/PushSubscription';

export const dynamic = 'force-dynamic';

// Subscribe to push notifications
export async function POST(req: NextRequest) {
    try {
        console.log('📥 [API] Push Subscribe Request Received');
        await connectDB();
        const user = await getSession(req);
        if (!user) {
            console.warn('⚠️ [API] Unauthorized subscribe attempt');
            return NextResponse.json({ message: 'Not authorized' }, { status: 401 });
        }
        console.log('👤 [API] User:', user.email, user._id);

        const subscription = await req.json();
        console.log('📦 [API] Subscription Body:', JSON.stringify(subscription, null, 2));

        // Validate subscription data
        if (!subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
            console.error('❌ [API] Invalid subscription data');
            return NextResponse.json({ message: 'Invalid subscription data' }, { status: 400 });
        }

        // Upsert subscription (update if exists, create if not)
        const result = await PushSubscription.findOneAndUpdate(
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
        console.log('✅ [API] Subscription stored successfully:', result._id);

        return NextResponse.json({ message: 'Subscribed successfully' });
    } catch (error: any) {
        console.error('❌ [API] Push subscribe error:', error);
        return NextResponse.json({ message: 'Server error: ' + error.message }, { status: 500 });
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
