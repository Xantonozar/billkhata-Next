"use client";

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { KeyIcon, SpinnerIcon } from '@/components/Icons';
import { useNotifications } from '@/contexts/NotificationContext';
import { api } from '@/services/api';
import ToastContainer from '@/components/ToastContainer';

export default function JoinRoomPage() {
    const [codes, setCodes] = useState(Array(6).fill(''));
    const [loading, setLoading] = useState(false);
    const { user, setUser, logout } = useAuth();
    const { addToast } = useNotifications();
    const router = useRouter();
    const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const { value } = e.target;
        if (/^[a-zA-Z0-9]$/.test(value) || value === '') {
            const newCodes = [...codes];
            newCodes[index] = value.toUpperCase();
            setCodes(newCodes);

            if (value && index < 5) {
                inputsRef.current[index + 1]?.focus();
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Backspace' && !codes[index] && index > 0) {
            inputsRef.current[index - 1]?.focus();
        }
    };

    const handleJoinRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        const roomCode = codes.join('');
        if (roomCode.length !== 6) return;

        setLoading(true);

        try {
            const success = await api.joinRoom(roomCode);

            if (success) {
                const updatedUser = await api.getCurrentUser();
                if (updatedUser) {
                    setUser(updatedUser);
                    router.push('/pending-approval');
                }
                addToast({ type: 'success', title: 'Request Sent', message: 'Your join request is now pending manager approval.' });
            } else {
                addToast({ type: 'error', title: 'Error', message: 'Failed to join room. Please check the code and try again.' });
            }
        } catch (error) {
            console.error('Join room error:', error);
            addToast({ type: 'error', title: 'Error', message: 'Failed to join room. Please try again.' });
        } finally {
            setLoading(false);
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
                    <KeyIcon className="w-16 h-16 mx-auto text-primary-500 opacity-80" />
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mt-4">Join a Room</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 mb-6">Enter the 6-digit room code from your manager.</p>

                    <form onSubmit={handleJoinRoom}>
                        <div className="flex justify-center gap-2 mb-4">
                            {codes.map((code, index) => (
                                <input
                                    key={index}
                                    ref={el => { inputsRef.current[index] = el; }}
                                    type="text"
                                    maxLength={1}
                                    value={code}
                                    onChange={(e) => handleInputChange(e, index)}
                                    onKeyDown={(e) => handleKeyDown(e, index)}
                                    className="w-12 h-14 text-center text-2xl font-bold bg-slate-100 dark:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
                                />
                            ))}
                        </div>

                        <button
                            type="submit"
                            disabled={loading || codes.join('').length < 6}
                            className="w-full mt-4 px-4 py-3 bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors flex items-center justify-center"
                        >
                            {loading ? <SpinnerIcon className="w-6 h-6" /> : 'Request to Join'}
                        </button>
                    </form>
                </div>
                <button onClick={logout} className="mt-8 text-sm text-slate-500 hover:underline">
                    Logout
                </button>
            </div>
            <ToastContainer />
        </>
    );
}
