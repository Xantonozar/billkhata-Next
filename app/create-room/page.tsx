"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { HouseIcon, SpinnerIcon, ClipboardIcon, CheckCircleIcon } from '@/components/Icons';
import { useNotifications } from '@/contexts/NotificationContext';
import { api } from '@/services/api';
import ToastContainer from '@/components/ToastContainer';

export default function CreateRoomPage() {
    const [roomName, setRoomName] = useState('');
    const [loading, setLoading] = useState(false);
    const [generatedCode, setGeneratedCode] = useState('');
    const [copied, setCopied] = useState(false);
    const { user, setUser, logout } = useAuth();
    const { addToast } = useNotifications();
    const router = useRouter();

    const handleCreateRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const code = Math.random().toString(36).substring(2, 8).toUpperCase();
            const success = await api.createRoom(roomName, code);

            if (success) {
                setGeneratedCode(code);
                addToast({ type: 'success', title: 'Success!', message: 'Room created successfully.' });
            } else {
                addToast({ type: 'error', title: 'Error', message: 'Failed to create room. Please try again.' });
            }
        } catch (error) {
            console.error('Create room error:', error);
            addToast({ type: 'error', title: 'Error', message: 'Failed to create room. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        if (!generatedCode) return;
        navigator.clipboard.writeText(generatedCode);
        setCopied(true);
        addToast({ type: 'success', title: 'Copied!', message: 'Room code copied to clipboard.' });
        setTimeout(() => setCopied(false), 2000);
    };

    const finishOnboarding = async () => {
        if (user) {
            const updatedUser = await api.getCurrentUser();
            if (updatedUser) {
                setUser(updatedUser);
                router.push('/dashboard');
            }
        }
    };

    return (
        <>
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-primary-600">BillKhata</h1>
                    <p className="text-slate-500 dark:text-slate-400">Welcome, {user?.name}!</p>
                </div>

                <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 text-center">
                    {!generatedCode ? (
                        <>
                            <HouseIcon className="w-16 h-16 mx-auto text-primary-500 opacity-80" />
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mt-4">Create Your Room</h2>
                            <p className="text-slate-500 dark:text-slate-400 mt-2 mb-6">Give your shared space a name to get started.</p>
                            <form onSubmit={handleCreateRoom}>
                                <input
                                    type="text"
                                    placeholder='e.g., "Apartment 3B"'
                                    value={roomName}
                                    onChange={(e) => setRoomName(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 border-2 border-transparent rounded-lg focus:outline-none focus:border-primary-500 transition-colors dark:text-white"
                                    required
                                />
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full mt-4 px-4 py-3 bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors flex items-center justify-center"
                                >
                                    {loading ? <SpinnerIcon className="w-6 h-6" /> : 'Create Room'}
                                </button>
                            </form>
                        </>
                    ) : (
                        <>
                            <CheckCircleIcon className="w-16 h-16 mx-auto text-green-500" />
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mt-4">Room Created!</h2>
                            <p className="text-slate-500 dark:text-slate-400 mt-2 mb-6">Share this code with your members so they can join.</p>

                            <div
                                className="w-full flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-700 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 cursor-pointer"
                                onClick={handleCopy}
                            >
                                <p className="text-3xl font-mono tracking-widest text-slate-700 dark:text-slate-200">{generatedCode}</p>
                                {copied ? <CheckCircleIcon className="w-6 h-6 text-green-500" /> : <ClipboardIcon className="w-6 h-6 text-slate-500" />}
                            </div>

                            <button
                                onClick={finishOnboarding}
                                className="w-full mt-6 px-4 py-3 bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-600 transition-colors"
                            >
                                Go to Dashboard
                            </button>
                        </>
                    )}
                </div>
                <button onClick={logout} className="mt-8 text-sm text-slate-500 hover:underline">
                    Logout
                </button>
            </div>
            <ToastContainer />
        </>
    );
}
