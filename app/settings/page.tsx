"use client";

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';

import {
    UserCircleIcon, BellIcon, LogoutIcon,
    KeyIcon, CreditCardIcon, MenuBookIcon, PhoneIcon
} from '@/components/Icons';
import AppLayout from '@/components/AppLayout';
import { useNotifications } from '@/contexts/NotificationContext';
import ToastContainer from '@/components/ToastContainer';


// Helper for VAPID key conversion
function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

function PushNotificationSettings() {
    const [permissionState, setPermissionState] = useState<NotificationPermission>('default');
    const [subscription, setSubscription] = useState<PushSubscription | null>(null);
    const [isCompatible, setIsCompatible] = useState(false);

    // Split loading states to avoid confusing UX
    const [isInitializing, setIsInitializing] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    // 1. Check Compatibility ON LOAD
    React.useEffect(() => {
        const checkCompatibility = async () => {
            setIsInitializing(true);
            try {
                // strict compatibility check
                if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
                    setIsCompatible(false);
                    return;
                }

                setIsCompatible(true);
                setPermissionState(Notification.permission);

                const registration = await navigator.serviceWorker.getRegistration();
                if (registration) {
                    const sub = await registration.pushManager.getSubscription();
                    if (sub) {
                        setSubscription(sub);
                    }
                }
            } catch (error) {
                console.error('Compatibility check error:', error);
                setIsCompatible(false);
            } finally {
                setIsInitializing(false);
            }
        };

        checkCompatibility();
    }, []);

    // 2. Enable Notifications
    const enableNotifications = async () => {
        setIsProcessing(true);
        try {
            const currentPerm = Notification.permission;
            if (currentPerm === 'denied') {
                throw new Error('Notifications are blocked by browser. Please reset permissions.');
            }

            if (currentPerm !== 'granted') {
                const permission = await Notification.requestPermission();
                if (permission !== 'granted') {
                    throw new Error('Permission denied by user.');
                }
                setPermissionState(permission);
            }

            // 1. Clean Slate
            const existingRegs = await navigator.serviceWorker.getRegistrations();
            for (const reg of existingRegs) {
                await reg.unregister();
            }

            const registration = await navigator.serviceWorker.register('/custom-sw.js', {
                scope: '/',
                updateViaCache: 'none'
            });

            // Robust wait for active state
            const waitForActive = async () => {
                if (registration.active?.state === 'activated') return;
                return Promise.race([
                    navigator.serviceWorker.ready,
                    new Promise((resolve, reject) => {
                        let checks = 0;
                        const interval = setInterval(() => {
                            if (registration.active?.state === 'activated') {
                                clearInterval(interval);
                                resolve(true);
                            }
                            checks++;
                            if (checks > 20) { // 10s
                                clearInterval(interval);
                                reject(new Error('Activation Timeout'));
                            }
                        }, 500);
                    })
                ]);
            };

            await waitForActive();

            const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
            if (!vapidKey) throw new Error('Missing VAPID Key');

            const readyReg = await navigator.serviceWorker.ready;
            const sub = await readyReg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidKey)
            });

            await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sub)
            });

            setSubscription(sub);
            alert('✅ Notifications Enabled!');
        } catch (error: any) {
            console.error('Enable Error:', error);
            alert('Error: ' + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    // 3. Disable Notifications
    const disableNotifications = async () => {
        setIsProcessing(true);
        try {
            if (subscription) {
                await subscription.unsubscribe();
                await fetch('/api/push/subscribe', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ endpoint: subscription.endpoint })
                });
                setSubscription(null);
            }
        } catch (error) {
            console.error('Disable Error:', error);
        } finally {
            setIsProcessing(false);
        }
    };



    // UI RENDER
    if (isInitializing) {
        return <div className="text-slate-400 text-sm animate-pulse">Checking compatibility...</div>;
    }

    if (!isCompatible) {
        return (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
                ❌ Not Compatible. Please use Chrome, Edge, or Safari on an updated device.
            </div>
        );
    }

    if (permissionState === 'denied') {
        return (
            <div className="p-3 bg-orange-50 text-orange-600 rounded-lg text-sm border border-orange-100">
                ⚠️ Notifications blocked. Please reset permissions in your browser settings.
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        Push Notifications
                        {subscription ? (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">Active</span>
                        ) : (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">Inactive</span>
                        )}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md">
                        {subscription
                            ? 'You are all set! You will receive real-time updates directly to your device.'
                            : 'Enable this to receive instant alerts about bills, meals, and tasks, even when the app is closed.'}
                    </p>
                </div>

                <div className="flex gap-3 w-full sm:w-auto">
                    {subscription ? (
                        <>
                            <button
                                onClick={disableNotifications}
                                disabled={isProcessing}
                                className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-all border border-transparent hover:border-red-200 disabled:opacity-50"
                            >
                                {isProcessing ? '...' : 'Disable'}
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={enableNotifications}
                            disabled={isProcessing}
                            className={`flex-1 sm:flex-none px-6 py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-lg shadow-md hover:bg-primary-700 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${isProcessing ? 'animate-pulse' : ''}`}
                        >
                            {isProcessing ? (
                                <><span>Processing...</span></>
                            ) : (
                                <>
                                    <span>Enable Notifications</span>
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
            {/* Debug Log Removed for production polish */}
        </div>
    );
}

export default function SettingsPage() {
    const { user, logout, setUser } = useAuth();
    const { addToast } = useNotifications();
    const [name, setName] = useState(user?.name || '');
    const [whatsapp, setWhatsapp] = useState(user?.whatsapp || '');
    const [facebook, setFacebook] = useState(user?.facebook || '');
    const [editing, setEditing] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleSaveProfile = async () => {
        try {
            await api.updateProfile({ name, whatsapp, facebook });
            addToast({ type: 'success', title: 'Profile Updated', message: 'Your profile changes have been saved.' });
            setEditing(false);
            // Optional: Reload to reflect changes if context doesn't auto-update
            window.location.reload();
        } catch (error) {
            addToast({ type: 'error', title: 'Error', message: 'Failed to update profile' });
        }
    };

    const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            try {
                addToast({ type: 'warning', title: 'Uploading...', message: 'Please wait while we upload your image.' });
                console.log('📤 Uploading file...', file.name);
                const url = await api.uploadImage(file);
                console.log('📥 Upload result URL:', url);
                if (url) {
                    const updatedUser = await api.updateProfile({ avatarUrl: url });
                    console.log('👤 Updated user from API:', updatedUser);
                    console.log('🖼️ Avatar URL in response:', updatedUser?.avatarUrl);
                    if (updatedUser) {
                        // Update the user context instead of reloading
                        setUser(updatedUser);
                        addToast({ type: 'success', title: 'Success', message: 'Profile picture updated!' });
                    } else {
                        console.error('❌ updatedUser is null/undefined');
                        addToast({ type: 'error', title: 'Error', message: 'Failed to update profile' });
                    }
                } else {
                    console.error('❌ Upload returned null URL');
                    addToast({ type: 'error', title: 'Error', message: 'Failed to upload image' });
                }
            } catch (error) {
                console.error('❌ Avatar upload error:', error);
                addToast({ type: 'error', title: 'Error', message: 'Something went wrong' });
            }
        }
    };

    const handleCopyId = () => {
        if (user?.khataId) {
            navigator.clipboard.writeText(user.khataId);
            addToast({ type: 'success', title: 'Copied', message: 'Room ID copied to clipboard' });
        }
    };

    if (!user) return null;

    return (
        <AppLayout>
            <div className="max-w-4xl mx-auto space-y-4 sm:space-y-8 animate-fade-in relative">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-4 sm:mb-6 px-1">Settings</h1>

                {/* Profile Section */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
                        <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-800 dark:text-white">
                            <UserCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
                            Profile Information
                        </h2>
                    </div>
                    <div className="p-4 sm:p-6 space-y-4">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                            <div className="relative group">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary-100 flex items-center justify-center text-2xl sm:text-3xl font-bold text-primary-700 overflow-hidden border-2 border-transparent group-hover:border-primary-500 transition-all cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                    {user.avatarUrl ? (
                                        <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        user.name.charAt(0).toUpperCase()
                                    )}
                                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-white text-xs font-medium">Change</span>
                                    </div>
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleUploadAvatar}
                                />
                            </div>
                            <div className="flex-1 text-center sm:text-left w-full">
                                {editing ? (
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Full Name</label>
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="w-full max-w-sm px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                                placeholder="Enter your name"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-500 font-semibold uppercase tracking-wider">WhatsApp Number</label>
                                            <input
                                                type="text"
                                                value={whatsapp}
                                                onChange={(e) => setWhatsapp(e.target.value)}
                                                className="w-full max-w-sm px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                                placeholder="e.g. +88017..."
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Facebook/Social Link</label>
                                            <input
                                                type="text"
                                                value={facebook}
                                                onChange={(e) => setFacebook(e.target.value)}
                                                className="w-full max-w-sm px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                                placeholder="Profile Link"
                                            />
                                        </div>
                                        <div className="flex gap-2 justify-center sm:justify-start pt-2">
                                            <button
                                                onClick={() => setEditing(false)}
                                                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleSaveProfile}
                                                className="px-4 py-2 text-sm font-semibold bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
                                            >
                                                Save
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{name}</h3>
                                        <p className="text-slate-500 text-sm sm:text-base">{user.email}</p>
                                        {(user.whatsapp || user.facebook) && (
                                            <div className="pt-2 space-y-1 text-sm text-slate-600 dark:text-slate-400">
                                                {user.whatsapp && (
                                                    <p className="flex items-center gap-2">
                                                        <span className="font-semibold w-20">WhatsApp:</span> {user.whatsapp}
                                                    </p>
                                                )}
                                                {user.facebook && (
                                                    <p className="flex items-center gap-2">
                                                        <span className="font-semibold w-20">Facebook:</span>
                                                        <a href={user.facebook} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline truncate max-w-[200px]">
                                                            {user.facebook}
                                                        </a>
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            {!editing && (
                                <button
                                    onClick={() => setEditing(true)}
                                    className="w-full sm:w-auto px-4 py-2 text-sm font-semibold bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors"
                                >
                                    Edit Profile
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Room Settings */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
                        <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-800 dark:text-white">
                            <KeyIcon className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                            Room Configuration
                        </h2>
                    </div>
                    <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-500 mb-1">Current Room ID</label>
                            <div className="flex gap-2">
                                <code className="flex-1 bg-slate-100 dark:bg-slate-900 p-2 sm:p-3 rounded-lg font-mono text-base sm:text-lg text-slate-800 dark:text-slate-200 text-center sm:text-left">
                                    {user.khataId || 'Not assigned'}
                                </code>
                                <button
                                    onClick={handleCopyId}
                                    className="px-3 sm:px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 text-sm sm:text-base"
                                >
                                    Copy
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-500 mb-1">My Role</label>
                            <div className="p-2 sm:p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg font-semibold text-primary-600 border border-slate-200 dark:border-slate-700 text-base sm:text-lg">
                                {user.role}
                            </div>
                        </div>
                    </div>
                </div>



                {/* Notification Settings */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
                        <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-800 dark:text-white">
                            <BellIcon className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                            Notifications
                        </h2>
                    </div>
                    <div className="p-4 sm:p-6">
                        <PushNotificationSettings />
                    </div>
                </div>

                {/* Report Issue & Logout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
                    <button className="flex items-center justify-between p-4 sm:p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all group text-left">
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="p-2 sm:p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                                <PhoneIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">Contact Support</h3>
                                <p className="text-xs sm:text-sm text-slate-500">Report a bug or suggest feature</p>
                            </div>
                        </div>
                        <MenuBookIcon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                    </button>

                    <button
                        onClick={logout}
                        className="flex items-center justify-between p-4 sm:p-6 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/20 transition-all group text-left"
                    >
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="p-2 sm:p-3 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-lg">
                                <LogoutIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-red-700 dark:text-red-400 text-sm sm:text-base">Log Out</h3>
                                <p className="text-xs sm:text-sm text-red-600/70 dark:text-red-400/70">Sign out of your account</p>
                            </div>
                        </div>
                    </button>
                </div>
            </div>

        </AppLayout>
    );
}
