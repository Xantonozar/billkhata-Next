import Notification from '@/models/Notification';
import { pushToUser } from '@/lib/pusher';
import { sendPushToUser } from '@/lib/pushHelper';

interface NotifyOptions {
    userId: string;
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
    try {
        // Map granular events to DB-valid types
        let dbType = 'bill'; // default
        if (options.type.includes('deposit')) dbType = 'deposit';
        else if (options.type.includes('expense')) dbType = 'expense';
        else if (options.type.includes('bill')) dbType = 'bill';
        else if (options.type.includes('meal')) dbType = 'meal';
        else if (options.type.includes('room')) dbType = 'room';

        // 1. Save to DB
        // We probably also need khataId. For now, fetch or derive?
        // Actually, Notification model REQUIRES khataId.
        // We must add khataId to NotifyOptions or fetch user's khataId.
        // Let's UPDATE NotifyOptions to include khataId as optional, or fetch it.
        // Given performance, better to pass it. Checking usages... all usages involve user in a room.

        // Wait, the current usages don't pass khataId! My simplified service skipped it.
        // Notification model: khataId (required).
        // I need to:
        // 1. Update NotifyOptions to include khataId (required for DB).
        // 2. Map the type.

        // Let's assume we need to update the key places to pass khataId.
        // Or fetch it here (slower).

        // Let's fetch it for now to be safe and compatible with existing calls, 
        // OR better: update the calls to pass khataId since it's available in all contexts.

        // BUT to fix the immediate crash without refactoring ALL calls immediately:
        // I will fetch the user and getting khataId if not passed.
        // Wait, `notifyUser` is called with { userId, title, message, ... }

        const User = (await import('@/models/User')).default;
        const user = await User.findById(options.userId).select('khataId');

        if (!user || !user.khataId) {
            console.error('Cannot create notification: User has no khataId');
            return null;
        }

        const notification = await Notification.create({
            userId: options.userId,
            khataId: user.khataId,
            title: options.title,
            message: options.message,
            type: dbType, // use mapped valid enum
            link: options.link,
            relatedId: options.relatedId,
            read: false,
            createdAt: new Date()
        });

        // 2. Send Real-time (Socket) - Fire and forget
        // Use the ORIGINAL detailed type for the socket so the frontend listener works!
        pushToUser(options.userId, 'notification', {
            type: options.type, // e.g. 'new-deposit'
            message: options.message,
            title: options.title,
            link: options.link,
            notificationId: notification._id
        }).catch(err => console.error('Socket error:', err));

        // 3. Send Web Push (Device) - Fire and forget
        sendPushToUser(options.userId, {
            title: options.title,
            body: options.message,
            data: {
                url: options.link || '/dashboard'
            }
        }).catch(err => console.error('Push error:', err));


        return notification;
    } catch (error) {
        console.error('Notification creation failed:', error);
        // Don't throw, just log. Notifications shouldn't break the main flow.
        return null;
    }
};

/**
 * Notify multiple users
 */
export const notifyUsers = async (userIds: string[], options: Omit<NotifyOptions, 'userId'>) => {
    await Promise.all(
        userIds.map(userId => notifyUser({ ...options, userId }))
    );
};
