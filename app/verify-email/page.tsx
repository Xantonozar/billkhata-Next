"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { SpinnerIcon, HomeIcon, CheckCircleIcon, MailIcon } from '@/components/Icons';

export default function VerifyEmailPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, setUser } = useAuth();
    const emailParam = searchParams.get('email') || '';

    const [email, setEmail] = useState(emailParam);
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [countdown, setCountdown] = useState(0);

    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const handleOtpChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return; // Only allow digits

        const newOtp = [...otp];
        newOtp[index] = value.slice(-1); // Take only last digit
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        const newOtp = [...otp];
        pastedData.split('').forEach((char, i) => {
            if (i < 6) newOtp[i] = char;
        });
        setOtp(newOtp);
        // Focus last filled input or first empty
        const lastFilledIndex = Math.min(pastedData.length, 5);
        inputRefs.current[lastFilledIndex]?.focus();
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const otpString = otp.join('');
        if (otpString.length !== 6) {
            setError('Please enter the complete 6-digit code');
            return;
        }

        if (!email) {
            setError('Email is required');
            return;
        }

        setLoading(true);
        try {
            const result = await api.verifyEmail(email, otpString);
            setSuccess(result.message || 'Email verified successfully!');

            // Update user state in AuthContext to reflect verification
            if (user) {
                setUser({ ...user, isVerified: true });
            }

            setTimeout(() => {
                router.push('/dashboard');
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (countdown > 0 || !email) return;

        setResending(true);
        setError('');
        try {
            await api.resendOTP(email);
            setSuccess('A new verification code has been sent to your email');
            setCountdown(60); // 60 second cooldown
            setOtp(['', '', '', '', '', '']);
        } catch (err: any) {
            setError(err.message || 'Failed to resend code');
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-slate-950">
            {/* Background Effects */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-600/30 rounded-full blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-light-cyan-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>

            <div className="w-full max-w-md relative z-10 animate-fade-in glass-panel rounded-2xl p-8 border border-slate-800/50">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 mx-auto mb-4 bg-primary-600/20 rounded-full flex items-center justify-center">
                        <MailIcon className="w-8 h-8 text-primary-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">
                        Verify Your Email
                    </h1>
                    <p className="text-slate-400 text-sm">
                        We've sent a 6-digit code to your email.<br />
                        Enter it below to verify your account.
                    </p>
                </div>

                <form className="space-y-6" onSubmit={handleVerify}>
                    {!emailParam && (
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium text-slate-300 ml-1">
                                Email address
                            </label>
                            <input
                                id="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                                placeholder="Enter your email"
                            />
                        </div>
                    )}

                    {/* OTP Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300 ml-1">
                            Verification Code
                        </label>
                        <div className="flex gap-2 justify-center" onPaste={handlePaste}>
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(el) => { inputRefs.current[index] = el; }}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleOtpChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    className="w-12 h-14 text-center text-xl font-bold rounded-xl bg-slate-900/50 border border-slate-700 text-white focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/50 transition-all"
                                />
                            ))}
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm text-center flex items-center justify-center gap-2">
                            <CheckCircleIcon className="w-4 h-4" />
                            {success}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:hover:scale-100 flex items-center justify-center gap-2"
                    >
                        {loading ? <SpinnerIcon className="h-5 w-5" /> : 'Verify Email'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-slate-400 text-sm mb-2">
                        Didn't receive the code?
                    </p>
                    <button
                        onClick={handleResend}
                        disabled={resending || countdown > 0}
                        className="text-primary-400 hover:text-primary-300 font-medium transition-colors disabled:text-slate-500 disabled:cursor-not-allowed"
                    >
                        {resending ? (
                            <span className="flex items-center gap-2 justify-center">
                                <SpinnerIcon className="h-4 w-4" />
                                Sending...
                            </span>
                        ) : countdown > 0 ? (
                            `Resend in ${countdown}s`
                        ) : (
                            'Resend Code'
                        )}
                    </button>
                </div>

                <div className="mt-8 text-center">
                    <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm transition-colors">
                        <HomeIcon className="w-4 h-4" />
                        <span>Back to Dashboard</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
