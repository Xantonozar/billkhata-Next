"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Role } from '@/types';
import { ShoppingCartIcon, SpinnerIcon } from '@/components/Icons';
import ToastContainer from '@/components/ToastContainer';

// Code Splitting: Dynamic imports
// Loading state uses a spinner
const ManagerShoppingView = dynamic(() => import('@/components/shopping/ManagerShoppingView'), {
    loading: () => <div className="flex justify-center p-12"><SpinnerIcon className="w-8 h-8 text-primary-500 animate-spin" /></div>,
    ssr: false // Client-side only
});

const MemberShoppingView = dynamic(() => import('@/components/shopping/MemberShoppingView'), {
    loading: () => <div className="flex justify-center p-12"><SpinnerIcon className="w-8 h-8 text-primary-500 animate-spin" /></div>,
    ssr: false
});

export default function ShoppingPage() {
    const { user } = useAuth();

    if (!user) return null;

    return (
        <AppLayout>
            <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <ShoppingCartIcon className="w-6 h-6 sm:w-8 sm:h-8 text-primary-500" />
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Shopping & Funds</h1>
                    </div>
                </div>

                {user.role === Role.Manager ? <ManagerShoppingView /> : <MemberShoppingView />}
            </div>
            <ToastContainer />
        </AppLayout>
    );
}
