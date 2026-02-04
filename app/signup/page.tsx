"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Role } from '@/types';
import { SpinnerIcon } from '@/components/Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, Crown, Home, Users, ChevronRight, AlertCircle } from 'lucide-react';

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

    const roles = [
        {
            id: Role.Manager,
            label: 'Manager',
            description: 'Create & Manage Room',
            icon: Home,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10'
        },
        {
            id: Role.MasterManager,
            label: 'Master Manager',
            description: 'Full Control + Add Members',
            icon: Crown,
            color: 'text-amber-500',
            bg: 'bg-amber-500/10'
        },
        {
            id: Role.Member,
            label: 'Member',
            description: 'Join Existing Room',
            icon: Users,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10'
        }
    ];

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-background text-foreground">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-background to-background opacity-70"></div>
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1.5s' }}></div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-xl relative z-10"
            >
                <div className="bg-card/80 backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl p-6 sm:p-8 md:p-10">
                    <div className="text-center mb-8 space-y-2">
                        <motion.h1
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl font-bold bg-gradient-to-r from-primary-600 via-primary-400 to-primary-600 bg-clip-text text-transparent"
                        >
                            Create Account
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-muted-foreground"
                        >
                            Start your journey with BillKhata today
                        </motion.p>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            {/* Name Input */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 }}
                                className="space-y-2"
                            >
                                <label className="text-sm font-medium ml-1">Full Name</label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <input
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-muted/50 border border-input focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground/50"
                                        placeholder="John Doe"
                                    />
                                </div>
                            </motion.div>

                            {/* Email Input */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 }}
                                className="space-y-2"
                            >
                                <label className="text-sm font-medium ml-1">Email Address</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-muted/50 border border-input focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground/50"
                                        placeholder="john@example.com"
                                    />
                                </div>
                            </motion.div>

                            {/* Password Input */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 }}
                                className="space-y-2"
                            >
                                <label className="text-sm font-medium ml-1">Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-muted/50 border border-input focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground/50"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </motion.div>
                        </div>

                        {/* Role Selection */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="space-y-3"
                        >
                            <label className="text-sm font-medium ml-1">I want to be a:</label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {roles.map((r) => {
                                    const Icon = r.icon;
                                    const isSelected = role === r.id;
                                    return (
                                        <div
                                            key={r.id}
                                            onClick={() => setRole(r.id)}
                                            className={`
                                                relative cursor-pointer p-4 rounded-2xl border transition-all duration-300
                                                flex flex-col items-center text-center gap-3
                                                ${isSelected
                                                    ? `border-primary bg-primary/5 ring-2 ring-primary/20 scale-[1.02] shadow-lg`
                                                    : 'border-input hover:border-primary/50 hover:bg-muted/50'
                                                }
                                            `}
                                        >
                                            <div className={`p-3 rounded-full ${isSelected ? 'bg-primary text-primary-foreground' : `${r.bg} ${r.color}`}`}>
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className={`font-semibold text-sm ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                                                    {r.label}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground leading-tight">
                                                    {r.description}
                                                </p>
                                            </div>
                                            {isSelected && (
                                                <motion.div
                                                    layoutId="check"
                                                    className="absolute top-2 right-2 text-primary"
                                                >
                                                    <div className="w-2 h-2 rounded-full bg-primary" />
                                                </motion.div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>

                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center gap-3 text-destructive text-sm"
                                >
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <span>{error}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <motion.button
                            type="submit"
                            disabled={loading}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary-500 to-primary-700 text-white font-bold shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 transition-all disabled:opacity-70 disabled:hover:scale-100 flex items-center justify-center gap-2 text-lg"
                        >
                            {loading ? <SpinnerIcon className="h-6 w-6" /> : (
                                <>
                                    Create Account
                                    <ChevronRight className="w-5 h-5" />
                                </>
                            )}
                        </motion.button>
                    </form>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="mt-8 text-center space-y-4"
                    >
                        <p className="text-muted-foreground text-sm">
                            Already have an account?{' '}
                            <Link href="/login" className="text-primary hover:text-primary-600 font-semibold transition-colors">
                                Log in
                            </Link>
                        </p>
                    </motion.div>
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="mt-6 text-center"
                >
                    <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm transition-colors py-2 px-4 rounded-full hover:bg-muted/50">
                        <Home className="w-4 h-4" />
                        <span>Back to Home</span>
                    </Link>
                </motion.div>
            </motion.div>
        </div>
    );
}
