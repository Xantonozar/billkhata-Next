import Pusher from 'pusher';

// Server-side Pusher instance
const pusherServer = new Pusher({
    appId: process.env.PUSHER_APP_ID!,
    key: process.env.PUSHER_KEY!,
    secret: process.env.PUSHER_SECRET!,
    cluster: process.env.PUSHER_CLUSTER!,
    useTLS: true
});

// Event types for type safety
export type PusherEventType =
    | 'member-approved'
    | 'member-rejected'
    | 'bill-approved'
    | 'bill-rejected'
    | 'deposit-approved'
    | 'deposit-rejected'
    | 'expense-approved'
    | 'expense-rejected'
    | 'notification'
    | 'pending-count-update'
    // Events for manager (when member submits)
    | 'new-deposit'
    | 'new-expense'
    | 'new-join-request'
    | 'new-bill-payment'
    // New unified events
    | 'new-bill'
    | 'menu-updated'
    | 'meal-updated'
    | 'shopping-roster-updated';

export interface PusherEventData {
    type: string;
    message?: string;
    userId?: string;
    itemId?: string;
    [key: string]: any;
}

/**
 * Send a real-time event to a specific user
 */
export const pushToUser = async (
    userId: string,
    event: PusherEventType,
    data: PusherEventData
) => {
    try {
        await pusherServer.trigger(`user-${userId}`, event, data);
    } catch (error) {
        console.error('Pusher error:', error);
        // Silently fail - notifications are not critical
    }
};

/**
 * Send a real-time event to all members of a room
 */
export const pushToRoom = async (
    khataId: string,
    event: PusherEventType,
    data: PusherEventData
) => {
    try {
        await pusherServer.trigger(`room-${khataId}`, event, data);
    } catch (error) {
        console.error('Pusher error:', error);
    }
};

/**
 * Send notification to manager of a room
 */
export const pushToManager = async (
    managerId: string,
    event: PusherEventType,
    data: PusherEventData
) => {
    try {
        await pusherServer.trigger(`manager-${managerId}`, event, data);
    } catch (error) {
        console.error('Pusher error:', error);
    }
};

export default pusherServer;
