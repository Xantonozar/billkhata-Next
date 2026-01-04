"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { SpinnerIcon, HomeIcon } from '@/components/Icons';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-background text-foreground">
            {/* Background Effects - using semantic colors */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>

            <div className="w-full max-w-md relative z-10 animate-fade-in bg-card text-card-foreground rounded-2xl p-8 border border-border shadow-xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        BillKhata
                    </h1>
                    <p className="text-muted-foreground mt-2 text-sm">Welcome back! Please login to continue.</p>
                </div>

                <form className="space-y-5" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium text-foreground ml-1">
                            Email address
                        </label>
                        <input
                            id="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                            placeholder="Enter your email"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="password" className="text-sm font-medium text-foreground ml-1">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:hover:scale-100 flex items-center justify-center gap-2"
                    >
                        {loading ? <SpinnerIcon className="h-5 w-5" /> : 'Sign In'}
                    </button>
                </form>

                <div className="mt-8 text-center space-y-4">
                    <Link href="/forgot-password" className="text-primary hover:text-primary/80 font-medium transition-colors text-sm">
                        Forgot your password?
                    </Link>
                    <p className="text-muted-foreground text-sm">
                        Don't have an account?{' '}
                        <Link href="/signup" className="text-primary hover:text-primary/80 font-medium transition-colors">
                            Create one now
                        </Link>
                    </p>
                    <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm transition-colors">
                        <HomeIcon className="w-4 h-4" />
                        <span>Back to Home</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
