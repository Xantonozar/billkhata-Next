import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { getSession } from '@/lib/auth';
import PushSubscription from '@/models/PushSubscription';
import webpush from 'web-push';

export const dynamic = 'force-dynamic';

webpush.setVapidDetails(
    process.env.NEXT_PUBLIC_VAPID_SUBJECT || 'mailto:test@example.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
);

export async function POST(req: NextRequest) {
    try {
        console.log('🔔 [API] Test Notification Triggered');
        await connectDB();
        const user = await getSession(req);
        if (!user) {
            console.warn('⚠️ [API] Unauthorized test attempt');
            return NextResponse.json({ message: 'Not authorized' }, { status: 401 });
        }
        console.log('👤 [API] User:', user.email, user._id);

        const subscriptions = await PushSubscription.find({ userId: user._id });
        console.log('📋 [API] Found subscriptions count:', subscriptions.length);

        if (subscriptions.length === 0) {
            console.warn('⚠️ [API] No subscriptions found for user');
            return NextResponse.json({ message: 'No subscriptions found' }, { status: 404 });
        }

        const notificationPayload = JSON.stringify({
            title: 'Test Notification',
            body: 'This is a test notification from BillKhata!',
            icon: '/icon.png',
            url: '/dashboard'
        });

        console.log('🚀 [API] Sending notifications...');
        const results = await Promise.allSettled(subscriptions.map(sub => {
            const pushSubscription = {
                endpoint: sub.endpoint,
                keys: sub.keys
            };
            return webpush.sendNotification(pushSubscription, notificationPayload);
        }));

        let successCount = 0;
        let failCount = 0;

        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                successCount++;
            } else {
                failCount++;
                console.error(`❌ [API] Failed to send to device ${index}:`, result.reason);
                // Optional: remove invalid subscription
                if (result.reason.statusCode === 410 || result.reason.statusCode === 404) {
                    console.log('🗑️ [API] Removing expired subscription');
                    PushSubscription.deleteOne({ _id: subscriptions[index]._id }).catch(e => console.error(e));
                }
            }
        });

        console.log(`✅ [API] Test send complete. Success: ${successCount}, Failed: ${failCount}`);

        return NextResponse.json({
            message: `Sent to ${successCount} devices. Failed: ${failCount}`,
            details: { success: successCount, failed: failCount }
        });
    } catch (error: any) {
        console.error('❌ [API] Push test error:', error);
        return NextResponse.json({ message: 'Server error: ' + error.message }, { status: 500 });
    }
}
