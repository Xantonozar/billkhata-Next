import webpush from 'web-push';

// Configure web-push with VAPID keys
webpush.setVapidDetails(
    'mailto:billkhata@app.com',
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
);

export interface PushSubscription {
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
}

export interface PushPayload {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    tag?: string;
    data?: {
        url?: string;
        [key: string]: any;
    };
}

/**
 * Send a push notification to a specific subscription
 */
export const sendPushNotification = async (
    subscription: PushSubscription,
    payload: PushPayload
): Promise<boolean> => {
    try {
        await webpush.sendNotification(
            subscription,
            JSON.stringify({
                title: payload.title,
                body: payload.body,
                icon: payload.icon || '/icons/icon-192x192.png',
                badge: payload.badge || '/icons/icon-72x72.png',
                tag: payload.tag,
                data: payload.data
            })
        );
        return true;
    } catch (error: any) {
        console.error('Push notification error:', error);
        // If subscription is expired or invalid, return false
        if (error.statusCode === 410 || error.statusCode === 404) {
            return false; // Subscription should be removed
        }
        return false;
    }
};

/**
 * Send push notification to multiple subscriptions
 * Returns array of failed subscription endpoints (for cleanup)
 */
export const sendPushToMany = async (
    subscriptions: PushSubscription[],
    payload: PushPayload
): Promise<string[]> => {
    const failedEndpoints: string[] = [];

    await Promise.all(
        subscriptions.map(async (sub) => {
            const success = await sendPushNotification(sub, payload);
            if (!success) {
                failedEndpoints.push(sub.endpoint);
            }
        })
    );

    return failedEndpoints;
};

export default webpush;
