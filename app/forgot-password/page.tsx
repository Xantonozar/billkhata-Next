"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import { SpinnerIcon, HomeIcon, KeyIcon, MailIcon } from '@/components/Icons';

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!email) {
            setError('Please enter your email address');
            return;
        }

        // Clear any existing timeout before setting a new one
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        setLoading(true);
        try {
            const result = await api.forgotPassword(email);
            setSuccess(result.message);
            // Redirect to reset password page after short delay
            timeoutRef.current = setTimeout(() => {
                router.push(`/reset-password?email=${encodeURIComponent(email)}`);
                timeoutRef.current = null;
            }, 1500);
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-slate-950">
            {/* Background Effects */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-600/20 rounded-full blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>

            <div className="w-full max-w-md relative z-10 animate-fade-in glass-panel rounded-2xl p-8 border border-slate-800/50">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 mx-auto mb-4 bg-red-600/20 rounded-full flex items-center justify-center">
                        <KeyIcon className="w-8 h-8 text-red-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">
                        Forgot Password?
                    </h1>
                    <p className="text-slate-400 text-sm">
                        No worries! Enter your email and we'll send you<br />
                        a code to reset your password.
                    </p>
                </div>

                <form className="space-y-5" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium text-slate-300 ml-1">
                            Email address
                        </label>
                        <div className="relative">
                            <MailIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input
                                id="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-900/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                                placeholder="Enter your email"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm text-center">
                            {success}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white font-semibold shadow-lg shadow-red-500/20 hover:shadow-red-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:hover:scale-100 flex items-center justify-center gap-2"
                    >
                        {loading ? <SpinnerIcon className="h-5 w-5" /> : 'Send Reset Code'}
                    </button>
                </form>

                <div className="mt-8 text-center space-y-4">
                    <p className="text-slate-400 text-sm">
                        Remember your password?{' '}
                        <Link href="/login" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
                            Log in
                        </Link>
                    </p>
                    <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm transition-colors">
                        <HomeIcon className="w-4 h-4" />
                        <span>Back to Home</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
