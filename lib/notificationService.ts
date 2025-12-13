import Notification from '@/models/Notification';
import { pushToUser } from '@/lib/pusher';
import { sendPushToUser } from '@/lib/pushHelper';

interface NotifyOptions {
    userId: string;
    khataId?: string; // Optional optimization
    title: string;
    message: string;
    type: string; // e.g. 'bill-created'
    link?: string;
    relatedId?: string; // id of bill/meal etc
}

/**
 * Unified Notification Service
 * Handles: DB Storage + In-App Socket + Web Push
 */
export const notifyUser = async (options: NotifyOptions) => {
    // Map granular events to DB-valid types
    let dbType = 'bill'; // default
    if (options.type.includes('deposit')) dbType = 'deposit';
    else if (options.type.includes('expense')) dbType = 'expense';
    else if (options.type.includes('bill')) dbType = 'bill';
    else if (options.type.includes('meal')) dbType = 'meal';
    else if (options.type.includes('room')) dbType = 'room';

    let targetKhataId = options.khataId;

    // Fetch khataId if not provided
    if (!targetKhataId) {
        const User = (await import('@/models/User')).default;
        const user = await User.findById(options.userId).select('khataId');
        if (user) targetKhataId = user.khataId;
    }

    if (!targetKhataId) {
        console.error('Cannot create notification: User has no khataId');
        return null;
    }

    // Prepare Promises

    // 1. DB Save
    const notificationPromise = Notification.create({
        userId: options.userId,
        khataId: targetKhataId,
        title: options.title,
        message: options.message,
        type: dbType,
        link: options.link,
        relatedId: options.relatedId,
        read: false,
        createdAt: new Date()
    });

    // 2. Real-time Socket
    const socketPromise = pushToUser(options.userId, 'notification', {
        type: options.type,
        message: options.message,
        title: options.title,
        link: options.link,
        // We might not have notificationId yet if running in parallel, 
        // but 'notification' event usually doesn't strictly need it for display.
        // If frontend needs it to mark as read, we might have a race condition.
        // However, fetching/syncing usually happens on mount/update.
        // Let's compromise: If we want strict correctness, we await DB first.
        // If we want speed, we parallelize.
        // Given 'delaying a lot', speed is key. We can omit notificationId in live toast.
    });

    // 3. Web Push
    const pushPromise = sendPushToUser(options.userId, {
        title: options.title,
        body: options.message,
        data: {
            url: options.link || '/dashboard'
        }
    });

    try {
        // Execute all in parallel
        // We use allSettled to ensure one failure doesn't block others (though usually we want to know)
        // But for speed in serverless, allSettled is good.
        // Wait: If we want to return the notification, we need that specific result.

        const [notificationResult, socketResult, pushResult] = await Promise.allSettled([
            notificationPromise,
            socketPromise,
            pushPromise
        ]);

        if (notificationResult.status === 'rejected') {
            console.error('DB Notification failed:', notificationResult.reason);
            return null;
        }

        if (socketResult.status === 'rejected') {
            console.error('Socket failed:', socketResult.reason);
        }

        if (pushResult.status === 'rejected') {
            console.error('Web Push failed:', pushResult.reason);
        }

        return notificationResult.value;

    } catch (error) {
        console.error('Notification creation failed:', error);
        return null;
    }
};

/**
 * Notify multiple users
 */
export const notifyUsers = async (userIds: string[], options: Omit<NotifyOptions, 'userId'>) => {
    // execute all user notifications in parallel
    await Promise.all(
        userIds.map(userId => notifyUser({ ...options, userId }))
    );
};
