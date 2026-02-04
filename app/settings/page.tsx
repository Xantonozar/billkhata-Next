"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { MIN_PASSWORD_LENGTH } from '@/lib/passwordConfig';

import {
    UserCircleIcon, BellIcon, LogoutIcon,
    KeyIcon, CreditCardIcon, MenuBookIcon, PhoneIcon,
    ShieldCheckIcon, EyeIcon, EyeOffIcon, SpinnerIcon,
    CheckCircleIcon, MailIcon, SunIcon, MoonIcon
} from '@/components/Icons';
import AppLayout from '@/components/AppLayout';
import { useNotifications } from '@/contexts/NotificationContext';
import ToastContainer from '@/components/ToastContainer';
import { useTheme } from '@/contexts/ThemeContext';
import ReminderButton from '@/components/ReminderButton';


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
        return <div className="text-muted-foreground text-sm animate-pulse">Checking compatibility...</div>;
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
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 bg-muted/50 rounded-xl border border-border shadow-sm">
                <div>
                    <h3 className="font-semibold text-card-foreground flex items-center gap-2">
                        Push Notifications
                        {subscription ? (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">Active</span>
                        ) : (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Inactive</span>
                        )}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-md">
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

function ChangePasswordSection() {
    const { addToast } = useNotifications();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPasswords, setShowPasswords] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (newPassword.length < MIN_PASSWORD_LENGTH) {
            setError(`New password must be at least ${MIN_PASSWORD_LENGTH} characters`);
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const result = await api.changePassword(currentPassword, newPassword);
            addToast({ type: 'success', title: 'Success', message: result.message || 'Password changed successfully' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setError(err.message || 'Failed to change password');
            addToast({ type: 'error', title: 'Error', message: err.message || 'Failed to change password' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-border">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-card-foreground">
                    <ShieldCheckIcon className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                    Security
                </h2>
            </div>
            <form onSubmit={handleChangePassword} className="p-4 sm:p-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                        Current Password
                    </label>
                    <div className="relative">
                        <input
                            type={showPasswords ? 'text' : 'password'}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full px-4 py-2.5 pr-12 rounded-lg border border-border bg-background text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                            placeholder="Enter current password"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPasswords(!showPasswords)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            {showPasswords ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">
                            New Password
                        </label>
                        <input
                            type={showPasswords ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                            placeholder="Enter new password"
                            required
                            minLength={MIN_PASSWORD_LENGTH}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">
                            Confirm New Password
                        </label>
                        <input
                            type={showPasswords ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                            placeholder="Confirm new password"
                            required
                        />
                    </div>
                </div>

                {error && (
                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading || !currentPassword || !newPassword || !confirmPassword}
                    className="px-6 py-2.5 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {loading ? <SpinnerIcon className="w-5 h-5" /> : null}
                    {loading ? 'Changing...' : 'Change Password'}
                </button>
            </form>
        </div>
    );
}

function ThemeSettingsSection() {
    const { theme, setTheme } = useTheme();

    return (
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-border">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-card-foreground">
                    <SunIcon className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
                    Appearance
                </h2>
            </div>
            <div className="p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Light Mode Option */}
                    <button
                        onClick={() => setTheme('light')}
                        className={`relative p-4 rounded-xl border-2 transition-all text-left group ${theme === 'light'
                            ? 'border-primary-500 bg-primary-50/50'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                            }`}
                    >
                        <div className="aspect-video w-full bg-white border border-slate-200 rounded-lg mb-3 overflow-hidden shadow-sm flex items-center justify-center">
                            <SunIcon className="w-8 h-8 text-orange-400" />
                        </div>
                        <h3 className="font-semibold text-card-foreground">Light Mode</h3>
                        <p className="text-xs text-slate-500">Classic clean look</p>
                        {theme === 'light' && (
                            <div className="absolute top-3 right-3 text-primary-600">
                                <CheckCircleIcon className="w-5 h-5" />
                            </div>
                        )}
                    </button>

                    {/* Earthy Green Option */}
                    <button
                        onClick={() => setTheme('earthy-green')}
                        className={`relative p-4 rounded-xl border-2 transition-all text-left group ${theme === 'earthy-green'
                            ? 'border-lime-500 bg-lime-50/50'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                            }`}
                    >
                        <div className="aspect-video w-full bg-[#f4f6f3] border border-[#daddd8] rounded-lg mb-3 overflow-hidden shadow-sm flex items-center justify-center">
                            <div className="w-8 h-8 rounded-full bg-[#8fb339]" />
                        </div>
                        <h3 className="font-semibold text-card-foreground">Earthy Green</h3>
                        <p className="text-xs text-slate-500">Natural & calming</p>
                        {theme === 'earthy-green' && (
                            <div className="absolute top-3 right-3 text-lime-600">
                                <CheckCircleIcon className="w-5 h-5" />
                            </div>
                        )}
                    </button>

                    {/* Dark Mode Option */}
                    <button
                        onClick={() => setTheme('dark')}
                        className={`relative p-4 rounded-xl border-2 transition-all text-left group ${theme === 'dark'
                            ? 'border-primary-500 bg-slate-800'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                            }`}
                    >
                        <div className="aspect-video w-full bg-slate-900 border border-slate-800 rounded-lg mb-3 overflow-hidden shadow-sm flex items-center justify-center">
                            <MoonIcon className="w-8 h-8 text-primary-400" />
                        </div>
                        <h3 className="font-semibold text-card-foreground">Dark Mode</h3>
                        <p className="text-xs text-slate-500">Easy on the eyes</p>
                        {theme === 'dark' && (
                            <div className="absolute top-3 right-3 text-primary-500">
                                <CheckCircleIcon className="w-5 h-5" />
                            </div>
                        )}
                    </button>
                </div>
            </div>
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
                <h1 className="text-2xl sm:text-3xl font-bold text-card-foreground mb-4 sm:mb-6 px-1">Settings</h1>

                {/* Profile Section */}
                <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                    <div className="p-4 sm:p-6 border-b border-border">
                        <h2 className="text-lg font-semibold flex items-center gap-2 text-card-foreground">
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
                                            <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Full Name</label>
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="w-full max-w-sm px-3 py-2 border rounded-lg bg-background border-border text-card-foreground"
                                                placeholder="Enter your name"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">WhatsApp Number</label>
                                            <input
                                                type="text"
                                                value={whatsapp}
                                                onChange={(e) => setWhatsapp(e.target.value)}
                                                className="w-full max-w-sm px-3 py-2 border rounded-lg bg-background border-border text-card-foreground"
                                                placeholder="e.g. +88017..."
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Facebook/Social Link</label>
                                            <input
                                                type="text"
                                                value={facebook}
                                                onChange={(e) => setFacebook(e.target.value)}
                                                className="w-full max-w-sm px-3 py-2 border rounded-lg bg-background border-border text-card-foreground"
                                                placeholder="Profile Link"
                                            />
                                        </div>
                                        <div className="flex gap-2 justify-center sm:justify-start pt-2">
                                            <button
                                                onClick={() => setEditing(false)}
                                                className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted rounded-lg transition-colors"
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
                                        <h3 className="text-xl sm:text-2xl font-bold text-card-foreground">{name}</h3>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="text-muted-foreground text-sm sm:text-base">{user.email}</p>
                                            {user.isVerified ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                    <CheckCircleIcon className="w-3 h-3" />
                                                    Verified
                                                </span>
                                            ) : (
                                                <Link
                                                    href="/verify-email"
                                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/40 transition-colors"
                                                >
                                                    <MailIcon className="w-3 h-3" />
                                                    Unverified - Click to verify
                                                </Link>)}
                                        </div>
                                        {(user.whatsapp || user.facebook) && (
                                            <div className="pt-2 space-y-1 text-sm text-muted-foreground">
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
                <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                    <div className="p-4 sm:p-6 border-b border-border">
                        <h2 className="text-lg font-semibold flex items-center gap-2 text-card-foreground">
                            <KeyIcon className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                            Room Configuration
                        </h2>
                    </div>
                    <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">Current Room ID</label>
                            <div className="flex gap-2">
                                <code className="flex-1 bg-muted p-2 sm:p-3 rounded-lg font-mono text-base sm:text-lg text-card-foreground text-center sm:text-left">
                                    {user.khataId || 'Not assigned'}
                                </code>
                                <button
                                    onClick={handleCopyId}
                                    className="px-3 sm:px-4 py-2 bg-muted rounded-lg font-semibold hover:bg-muted/80 text-sm sm:text-base"
                                >
                                    Copy
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">My Role</label>
                            <div className="p-2 sm:p-3 bg-muted rounded-lg font-semibold text-primary border border-border text-base sm:text-lg">
                                {user.role}
                            </div>
                        </div>
                    </div>
                </div>



                {/* Notification Settings */}
                <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                    <div className="p-4 sm:p-6 border-b border-border">
                        <h2 className="text-lg font-semibold flex items-center gap-2 text-card-foreground">
                            <BellIcon className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                            Notifications
                        </h2>
                    </div>
                    <div className="p-4 sm:p-6">
                        <PushNotificationSettings />
                    </div>
                </div>

                {/* Reminders Section (Managers Only) */}
                {(user.role === 'Manager' || user.role === 'MasterManager') && (
                    <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                        <div className="p-4 sm:p-6 border-b border-border">
                            <h2 className="text-lg font-semibold flex items-center gap-2 text-card-foreground">
                                <BellIcon className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />
                                Send Reminders
                            </h2>
                        </div>
                        <div className="p-4 sm:p-6">
                            <p className="text-sm text-muted-foreground mb-4">
                                Send notification reminders to room members for various activities.
                            </p>
                            <div className="flex flex-wrap gap-2 sm:gap-3">
                                <ReminderButton type="add_meal" />
                                <ReminderButton type="pay_bill" />
                                <ReminderButton type="shopping" />
                                <ReminderButton type="approve_deposit" />
                                <ReminderButton type="approve_expense" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Theme Settings */}
                <ThemeSettingsSection />

                {/* Security Settings - Change Password */}
                <ChangePasswordSection />

                {/* Report Issue & Logout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
                    <button className="flex items-center justify-between p-4 sm:p-6 bg-card rounded-xl shadow-sm border border-border hover:shadow-md transition-all group text-left">
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="p-2 sm:p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                                <PhoneIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-card-foreground text-sm sm:text-base">Contact Support</h3>
                                <p className="text-xs sm:text-sm text-muted-foreground">Report a bug or suggest feature</p>
                            </div>
                        </div>
                        <MenuBookIcon className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
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
