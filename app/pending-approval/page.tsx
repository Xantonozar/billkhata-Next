"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { RoomStatus } from '@/types';
import { useNotifications } from '@/contexts/NotificationContext';
import { api } from '@/services/api';
import ToastContainer from '@/components/ToastContainer';

export default function PendingApprovalPage() {
    const { user, setUser, logout } = useAuth();
    const { addToast } = useNotifications();
    const [checking, setChecking] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const checkApprovalStatus = async () => {
            if (checking) return;

            setChecking(true);
            try {
                const updatedUser = await api.getCurrentUser();

                if (updatedUser && updatedUser.roomStatus === RoomStatus.Approved) {
                    setUser(updatedUser);
                    addToast({
                        type: 'success',
                        title: 'Approved!',
                        message: 'Your request has been approved. Welcome to the room!'
                    });
                    router.push('/dashboard');
                }
            } catch (error) {
                console.error('Error checking approval status:', error);
            } finally {
                setChecking(false);
            }
        };

        checkApprovalStatus();
        const interval = setInterval(checkApprovalStatus, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleWithdraw = () => {
        if (user) {
            const updatedUser = { ...user, roomStatus: RoomStatus.NoRoom };
            setUser(updatedUser);
            addToast({ type: 'warning', title: 'Request Withdrawn', message: 'You have withdrawn your request to join the room.' });
            router.push(user.role === 'Manager' ? '/create-room' : '/join-room');
        }
    };

    const handleRefresh = async () => {
        setChecking(true);
        try {
            const updatedUser = await api.getCurrentUser();

            if (updatedUser) {
                setUser(updatedUser);

                if (updatedUser.roomStatus === RoomStatus.Approved) {
                    addToast({
                        type: 'success',
                        title: 'Approved!',
                        message: 'Your request has been approved. Welcome to the room!'
                    });
                    router.push('/dashboard');
                } else {
                    addToast({
                        type: 'warning',
                        title: 'Still Pending',
                        message: 'Your request is still awaiting approval.'
                    });
                }
            }
        } catch (error) {
            console.error('Error refreshing status:', error);
            addToast({ type: 'error', title: 'Error', message: 'Failed to refresh status' });
        } finally {
            setChecking(false);
        }
    };

    return (
        <>
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 p-4 text-center">
                <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-xl shadow-lg p-10">
                    <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto">
                        <svg className="w-8 h-8 text-yellow-500 dark:text-yellow-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mt-6">Request Sent!</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">
                        Your request to join the room is now pending approval from the manager.
                        {checking && <span className="block mt-2 text-primary-500">Checking for updates...</span>}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                        Auto-refreshing every 5 seconds
                    </p>
                    <div className="mt-8 space-y-3">
                        <button
                            onClick={handleRefresh}
                            disabled={checking}
                            className="w-full px-4 py-2.5 bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {checking ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Checking...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Check Status Now
                                </>
                            )}
                        </button>
                        <button
                            onClick={handleWithdraw}
                            className="w-full px-4 py-2.5 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors"
                        >
                            Withdraw Request
                        </button>
                        <button onClick={logout} className="w-full px-4 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                            Logout
                        </button>
                    </div>
                </div>
            </div>
            <ToastContainer />
        </>
    );
}
