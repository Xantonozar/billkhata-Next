'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff } from 'lucide-react'

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
}

export default function PushNotificationManager() {
    const [isSupported, setIsSupported] = useState(false)
    const [subscription, setSubscription] = useState<PushSubscription | null>(null)

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true)
            registerServiceWorker()
        }
    }, [])

    async function registerServiceWorker() {
        const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
            updateViaCache: 'none',
        })
        const sub = await registration.pushManager.getSubscription()
        setSubscription(sub)
    }

    async function subscribeToPush() {
        try {
            const registration = await navigator.serviceWorker.ready
            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(
                    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
                ),
            })
            setSubscription(sub)
            await fetch('/api/push/subscribe', {
                method: 'POST',
                body: JSON.stringify(sub),
                headers: {
                    'Content-Type': 'application/json',
                },
            })
            alert('Subscribed to notifications!')
        } catch (error) {
            console.error('Error subscribing to push:', error)
            alert('Error subscribing to notifications. Please try again.')
        }
    }

    async function unsubscribeFromPush() {
        try {
            if (subscription) {
                await subscription.unsubscribe()
                await fetch('/api/push/subscribe', {
                    method: 'DELETE',
                    body: JSON.stringify({ endpoint: subscription.endpoint }),
                    headers: {
                        'Content-Type': 'application/json',
                    },
                })
                setSubscription(null)
                alert('Unsubscribed from notifications!')
            }
        } catch (error) {
            console.error('Error unsubscribing:', error)
        }
    }

    if (!isSupported) {
        return null
    }

    return null;
}
