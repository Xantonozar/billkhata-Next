"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Role } from '@/types';
import { SpinnerIcon, HomeIcon } from '@/components/Icons';

export default function SignUpPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<Role | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signup } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!role) {
            setError('Please select a role.');
            return;
        }
        setError('');
        setLoading(true);
        try {
            await signup(name, email, password, role);
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-slate-950">
            {/* Background Effects */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary-600/30 rounded-full blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-light-cyan-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1.5s' }}></div>

            <div className="w-full max-w-lg relative z-10 animate-fade-in glass-panel rounded-2xl p-8 border border-slate-800/50">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-400 to-light-cyan-400 bg-clip-text text-transparent">
                        Create Account
                    </h1>
                    <p className="text-slate-400 mt-2 text-sm">Join BillKhata to manage expenses smartly.</p>
                </div>

                <form className="space-y-5" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-medium text-slate-300 ml-1">
                            Full Name
                        </label>
                        <input
                            id="name"
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                            placeholder="John Doe"
                        />
                    </div>

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
                            placeholder="john@example.com"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="password" className="text-sm font-medium text-slate-300 ml-1">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-medium text-slate-300 ml-1">I want to:</label>
                        <div className="grid grid-cols-2 gap-4">
                            {[Role.Manager, Role.Member].map((r) => (
                                <label
                                    key={r}
                                    className={`relative flex flex-col items-center justify-center p-4 rounded-xl cursor-pointer border transition-all duration-200 group ${role === r
                                        ? 'bg-primary-600/20 border-primary-500 shadow-[0_0_20px_rgba(168,85,247,0.15)]'
                                        : 'bg-slate-900/50 border-slate-700 hover:border-slate-500 hover:bg-slate-800/50'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="role"
                                        value={r}
                                        checked={role === r}
                                        onChange={() => setRole(r)}
                                        className="sr-only"
                                    />
                                    <span className={`font-semibold text-base transition-colors ${role === r ? 'text-primary-300' : 'text-slate-300 group-hover:text-white'}`}>
                                        {r}
                                    </span>
                                    <span className="text-xs text-slate-500 mt-1">
                                        {r === Role.Manager ? 'Create & Manage Room' : 'Join Existing Room'}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:hover:scale-100 flex items-center justify-center gap-2"
                    >
                        {loading ? <SpinnerIcon className="h-5 w-5" /> : 'Create Account'}
                    </button>
                </form>

                <div className="mt-8 text-center space-y-4">
                    <p className="text-slate-400 text-sm">
                        Already have an account?{' '}
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
