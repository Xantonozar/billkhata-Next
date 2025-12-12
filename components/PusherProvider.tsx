"use client";

import React, { useEffect, useRef } from 'react';
import Pusher from 'pusher-js';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { Role } from '@/types';

const PUSHER_KEY = process.env.NEXT_PUBLIC_PUSHER_KEY;
const PUSHER_CLUSTER = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

interface PusherProviderProps {
    children: React.ReactNode;
    onPendingCountUpdate?: () => void;
}

/**
 * Global Pusher provider that handles real-time notifications
 * - Shows toasts to managers when members submit requests
 * - Shows toasts to members when managers approve/reject
 * - Updates pending count in real-time
 */
export const PusherProvider: React.FC<PusherProviderProps> = ({
    children,
    onPendingCountUpdate
}) => {
    const { user } = useAuth();
    const { addToast, refreshNotifications } = useNotifications();
    const pusherRef = useRef<Pusher | null>(null);
    const channelsRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (!user?.id || !PUSHER_KEY || !PUSHER_CLUSTER) return;

        // Initialize Pusher
        if (!pusherRef.current) {
            pusherRef.current = new Pusher(PUSHER_KEY, {
                cluster: PUSHER_CLUSTER,
            });
        }

        const pusher = pusherRef.current;

        // Subscribe to user-specific channel
        const userChannel = pusher.subscribe(`user-${user.id}`);
        channelsRef.current.add(`user-${user.id}`);

        // If manager, also subscribe to room channel
        if (user.role === Role.Manager && user.khataId) {
            const roomChannel = pusher.subscribe(`room-${user.khataId}`);
            channelsRef.current.add(`room-${user.khataId}`);

            // Manager receives notifications when members submit requests
            roomChannel.bind('new-deposit', (data: any) => {
                addToast({ type: 'info' as any, title: '💰 New Deposit', message: data.message });
                onPendingCountUpdate?.();
                refreshNotifications();
            });

            roomChannel.bind('new-expense', (data: any) => {
                addToast({ type: 'info' as any, title: '🧾 New Expense', message: data.message });
                onPendingCountUpdate?.();
                refreshNotifications();
            });

            roomChannel.bind('new-join-request', (data: any) => {
                addToast({ type: 'info' as any, title: '👤 Join Request', message: data.message });
                onPendingCountUpdate?.();
                refreshNotifications();
            });

            roomChannel.bind('new-bill-payment', (data: any) => {
                addToast({ type: 'info' as any, title: '📄 Bill Payment', message: data.message });
                onPendingCountUpdate?.();
                refreshNotifications();
            });

            roomChannel.bind('pending-count-update', () => {
                onPendingCountUpdate?.();
            });

            roomChannel.bind('meal-updated', (data: any) => {
                // Manager usually gets notified if a MEMBER updates their meal
                addToast({ type: 'info' as any, title: '🍽️ Meal Update', message: data.message });
                onPendingCountUpdate?.();
                refreshNotifications();
            });
        }

        // Member receives notifications when manager approves/rejects
        userChannel.bind('member-approved', (data: any) => {
            addToast({ type: 'success', title: '🎉 Approved!', message: data.message });
            refreshNotifications();
        });

        userChannel.bind('member-rejected', (data: any) => {
            addToast({ type: 'error', title: '❌ Rejected', message: data.message });
            refreshNotifications();
        });

        userChannel.bind('deposit-approved', (data: any) => {
            addToast({ type: 'success', title: '✅ Deposit Approved', message: data.message });
            refreshNotifications();
        });

        userChannel.bind('deposit-rejected', (data: any) => {
            addToast({ type: 'error', title: '❌ Deposit Rejected', message: data.message });
            refreshNotifications();
        });

        userChannel.bind('expense-approved', (data: any) => {
            addToast({ type: 'success', title: '✅ Expense Approved', message: data.message });
            refreshNotifications();
        });

        userChannel.bind('expense-rejected', (data: any) => {
            addToast({ type: 'error', title: '❌ Expense Rejected', message: data.message });
            refreshNotifications();
        });

        userChannel.bind('bill-approved', (data: any) => {
            addToast({ type: 'success', title: '✅ Payment Approved', message: data.message });
            refreshNotifications();
        });

        userChannel.bind('bill-rejected', (data: any) => {
            refreshNotifications();
        });

        // Global events for all members (including manager but usually targeted at members)
        const roomChannelName = user.khataId ? `room-${user.khataId}` : null;
        if (roomChannelName) {
            const roomChannel = pusher.subscribe(roomChannelName);
            channelsRef.current.add(roomChannelName);

            roomChannel.bind('new-bill', (data: any) => {
                if (user.role === Role.Member) {
                    addToast({ type: 'info' as any, title: '📄 New Bill', message: data.message });
                    refreshNotifications();
                }
            });

            roomChannel.bind('menu-updated', (data: any) => {
                addToast({ type: 'info' as any, title: '🍳 Menu Updated', message: data.message });
                refreshNotifications();
            });

            roomChannel.bind('shopping-roster-updated', (data: any) => {
                addToast({ type: 'info' as any, title: '🛒 Shopping Duty', message: data.message });
                // Optionally refetch shopping data if we had a global store or SWR
            });
        }

        userChannel.bind('meal-updated', (data: any) => {
            // Member gets notified if MANAGER updates their meal
            addToast({ type: 'info' as any, title: '🍽️ Your Meal Updated', message: data.message });
            refreshNotifications();
        });

        // Cleanup
        return () => {
            channelsRef.current.forEach(channelName => {
                pusher.unsubscribe(channelName);
            });
            channelsRef.current.clear();
        };
    }, [user?.id, user?.khataId, user?.role, addToast, refreshNotifications, onPendingCountUpdate]);

    return <>{children}</>;
};

export default PusherProvider;
