"use client";

import { useEffect, useRef, useCallback } from 'react';
import Pusher from 'pusher-js';

// Client-side Pusher configuration
const PUSHER_KEY = process.env.NEXT_PUBLIC_PUSHER_KEY!;
const PUSHER_CLUSTER = process.env.NEXT_PUBLIC_PUSHER_CLUSTER!;

// Singleton Pusher instance
let pusherClient: Pusher | null = null;

const getPusherClient = () => {
    if (!pusherClient && typeof window !== 'undefined') {
        pusherClient = new Pusher(PUSHER_KEY, {
            cluster: PUSHER_CLUSTER,
        });
    }
    return pusherClient;
};

export type PusherEventHandler = (data: any) => void;

/**
 * Hook to subscribe to a Pusher channel and listen for events
 */
export const usePusherChannel = (
    channelName: string | null,
    eventName: string,
    callback: PusherEventHandler
) => {
    const callbackRef = useRef(callback);
    callbackRef.current = callback;

    useEffect(() => {
        if (!channelName) return;

        const pusher = getPusherClient();
        if (!pusher) return;

        const channel = pusher.subscribe(channelName);

        const handler = (data: any) => {
            callbackRef.current(data);
        };

        channel.bind(eventName, handler);

        return () => {
            channel.unbind(eventName, handler);
            pusher.unsubscribe(channelName);
        };
    }, [channelName, eventName]);
};

/**
 * Hook to subscribe to user-specific events
 */
export const usePusherUser = (
    userId: string | undefined,
    onEvent: (eventName: string, data: any) => void
) => {
    const callbackRef = useRef(onEvent);
    callbackRef.current = onEvent;

    useEffect(() => {
        if (!userId) return;

        const pusher = getPusherClient();
        if (!pusher) return;

        const channel = pusher.subscribe(`user-${userId}`);

        // Listen for all relevant events
        const events = [
            'member-approved',
            'member-rejected',
            'bill-approved',
            'bill-rejected',
            'deposit-approved',
            'deposit-rejected',
            'expense-approved',
            'expense-rejected',
            'notification'
        ];

        events.forEach(eventName => {
            channel.bind(eventName, (data: any) => {
                callbackRef.current(eventName, data);
            });
        });

        return () => {
            events.forEach(eventName => {
                channel.unbind(eventName);
            });
            pusher.unsubscribe(`user-${userId}`);
        };
    }, [userId]);
};

/**
 * Hook to subscribe to room-wide events (for managers)
 */
export const usePusherRoom = (
    khataId: string | undefined,
    onEvent: (eventName: string, data: any) => void
) => {
    const callbackRef = useRef(onEvent);
    callbackRef.current = onEvent;

    useEffect(() => {
        if (!khataId) return;

        const pusher = getPusherClient();
        if (!pusher) return;

        const channel = pusher.subscribe(`room-${khataId}`);

        const events = ['pending-count-update', 'notification'];

        events.forEach(eventName => {
            channel.bind(eventName, (data: any) => {
                callbackRef.current(eventName, data);
            });
        });

        return () => {
            events.forEach(eventName => {
                channel.unbind(eventName);
            });
            pusher.unsubscribe(`room-${khataId}`);
        };
    }, [khataId]);
};
