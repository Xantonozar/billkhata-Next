import PushSubscription from '@/models/PushSubscription';
import { sendPushNotification, PushPayload } from '@/lib/webPush';
import connectDB from '@/lib/db';

/**
 * Send push notification to a specific user
 */
export const sendPushToUser = async (
    userId: string,
    payload: PushPayload
): Promise<void> => {
    await connectDB();

    // Get all subscriptions for this user
    const subscriptions = await PushSubscription.find({ userId }).lean();

    if (subscriptions.length === 0) {
        console.log(`No push subscriptions for user ${userId}`);
        return;
    }

    // Send to all user's devices
    const failedEndpoints: string[] = [];

    await Promise.all(
        subscriptions.map(async (sub) => {
            const success = await sendPushNotification(
                {
                    endpoint: sub.endpoint,
                    keys: sub.keys
                },
                payload
            );

            if (!success) {
                failedEndpoints.push(sub.endpoint);
            }
        })
    );

    // Clean up failed/expired subscriptions
    if (failedEndpoints.length > 0) {
        await PushSubscription.deleteMany({
            endpoint: { $in: failedEndpoints }
        });
    }
};

/**
 * Send push notification to multiple users
 */
export const sendPushToUsers = async (
    userIds: string[],
    payload: PushPayload
): Promise<void> => {
    await Promise.all(
        userIds.map(userId => sendPushToUser(userId, payload))
    );
};

/**
 * Send push notification to all members of a room
 */
export const sendPushToRoom = async (
    khataId: string,
    payload: PushPayload,
    excludeUserId?: string
): Promise<void> => {
    await connectDB();

    // Get all users in the room
    const Room = (await import('@/models/Room')).default;
    const room = await Room.findOne({ khataId }).populate('members.user', '_id').lean();

    if (!room) return;

    // Get all member user IDs except excluded one
    const memberIds = room.members
        .filter((m: any) => m.status === 'Approved')
        .map((m: any) => m.user._id.toString())
        .filter((id: string) => id !== excludeUserId);

    // Add manager if not excluded
    if (room.manager.toString() !== excludeUserId) {
        memberIds.push(room.manager.toString());
    }

    await sendPushToUsers(memberIds, payload);
};
