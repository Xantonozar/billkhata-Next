"use client";

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/services/api';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export interface UsePushNotificationsResult {
    isSupported: boolean;
    isSubscribed: boolean;
    isLoading: boolean;
    permission: NotificationPermission | 'unsupported';
    subscribe: () => Promise<boolean>;
    unsubscribe: () => Promise<boolean>;
}

export const usePushNotifications = (): UsePushNotificationsResult => {
    const [isSupported, setIsSupported] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('unsupported');

    // Check support and existing subscription
    useEffect(() => {
        const checkSupport = async () => {
            if (typeof window === 'undefined') {
                setIsLoading(false);
                return;
            }

            const supported = 'serviceWorker' in navigator && 'PushManager' in window;
            setIsSupported(supported);
            setPermission(supported ? Notification.permission : 'unsupported');

            if (!supported) {
                setIsLoading(false);
                return;
            }

            try {
                // Register service worker for push
                const registration = await navigator.serviceWorker.register('/push-sw.js');

                // Check if already subscribed
                const subscription = await registration.pushManager.getSubscription();
                setIsSubscribed(!!subscription);
            } catch (error) {
                console.error('Push notification check error:', error);
            } finally {
                setIsLoading(false);
            }
        };

        checkSupport();
    }, []);

    const subscribe = useCallback(async (): Promise<boolean> => {
        if (!isSupported || !VAPID_PUBLIC_KEY) return false;

        setIsLoading(true);
        try {
            // Request permission
            const permission = await Notification.requestPermission();
            setPermission(permission);

            if (permission !== 'granted') {
                setIsLoading(false);
                return false;
            }

            // Get service worker registration
            const registration = await navigator.serviceWorker.ready;

            // Subscribe to push
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource
            });

            // Send subscription to server
            const response = await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subscription.toJSON())
            });

            if (response.ok) {
                setIsSubscribed(true);
                setIsLoading(false);
                return true;
            }
        } catch (error) {
            console.error('Push subscription error:', error);
        }

        setIsLoading(false);
        return false;
    }, [isSupported]);

    const unsubscribe = useCallback(async (): Promise<boolean> => {
        if (!isSupported) return false;

        setIsLoading(true);
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                // Unsubscribe from browser
                await subscription.unsubscribe();

                // Remove from server
                await fetch('/api/push/subscribe', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ endpoint: subscription.endpoint })
                });
            }

            setIsSubscribed(false);
            setIsLoading(false);
            return true;
        } catch (error) {
            console.error('Push unsubscribe error:', error);
        }

        setIsLoading(false);
        return false;
    }, [isSupported]);

    return {
        isSupported,
        isSubscribed,
        isLoading,
        permission,
        subscribe,
        unsubscribe
    };
};
