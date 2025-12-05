"use client";

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
    UserCircleIcon, BellIcon, MoonIcon, LogoutIcon,
    KeyIcon, CreditCardIcon, MenuBookIcon, PhoneIcon
} from '@/components/Icons';
import AppLayout from '@/components/AppLayout';
import { useNotifications } from '@/contexts/NotificationContext';
import ToastContainer from '@/components/ToastContainer';

export default function SettingsPage() {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { addToast } = useNotifications();
    const [name, setName] = useState(user?.name || '');
    const [editing, setEditing] = useState(false);

    const handleSaveProfile = () => {
        // Here we would call API to update user name
        // await api.updateProfile({ name });
        addToast({ type: 'success', title: 'Profile Updated', message: 'Your profile changes have been saved.' });
        setEditing(false);
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
            <div className="max-w-4xl mx-auto space-y-8 animate-fade-in relative">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Settings</h1>

                {/* Profile Section */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                        <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-800 dark:text-white">
                            <UserCircleIcon className="w-6 h-6 text-primary-600" />
                            Profile Information
                        </h2>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-2xl font-bold text-primary-700">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                                {editing ? (
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full max-w-sm px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                    />
                                ) : (
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{name}</h3>
                                )}
                                <p className="text-slate-500">{user.email}</p>
                            </div>
                            <button
                                onClick={() => editing ? handleSaveProfile() : setEditing(true)}
                                className="px-4 py-2 text-sm font-semibold bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors"
                            >
                                {editing ? 'Save Changes' : 'Edit Profile'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Room Settings */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                        <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-800 dark:text-white">
                            <KeyIcon className="w-6 h-6 text-green-600" />
                            Room Configuration
                        </h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-500 mb-1">Current Room ID</label>
                            <div className="flex gap-2">
                                <code className="flex-1 bg-slate-100 dark:bg-slate-900 p-3 rounded-lg font-mono text-lg text-slate-800 dark:text-slate-200">
                                    {user.khataId || 'Not assigned'}
                                </code>
                                <button
                                    onClick={handleCopyId}
                                    className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg font-semibold hover:bg-slate-300 dark:hover:bg-slate-600"
                                >
                                    Copy
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-500 mb-1">My Role</label>
                            <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg font-semibold text-primary-600 border border-slate-200 dark:border-slate-700">
                                {user.role}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Report Issue & Logout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <button className="flex items-center justify-between p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all group text-left">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                                <PhoneIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white">Contact Support</h3>
                                <p className="text-sm text-slate-500">Report a bug or suggest feature</p>
                            </div>
                        </div>
                        <MenuBookIcon className="w-5 h-5 text-slate-400" />
                    </button>

                    <button
                        onClick={logout}
                        className="flex items-center justify-between p-6 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/20 transition-all group text-left"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-lg">
                                <LogoutIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-red-700 dark:text-red-400">Log Out</h3>
                                <p className="text-sm text-red-600/70 dark:text-red-400/70">Sign out of your account</p>
                            </div>
                        </div>
                    </button>
                </div>
            </div>
            <ToastContainer />
        </AppLayout>
    );
}
