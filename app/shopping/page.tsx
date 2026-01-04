"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Role } from '@/types';
import { ShoppingCartIcon, SpinnerIcon } from '@/components/Icons';
import ToastContainer from '@/components/ToastContainer';
import { ShoppingSkeleton } from '@/components/skeletons/ShoppingSkeleton';

// Code Splitting: Dynamic imports
// Code Splitting: Dynamic imports with skeleton loading states
const ManagerShoppingView = dynamic(() => import('@/components/shopping/ManagerShoppingView'), {
    loading: () => <ShoppingSkeleton />, ssr: false // Client-side only
});

const MemberShoppingView = dynamic(() => import('@/components/shopping/MemberShoppingView'), {
    loading: () => <ShoppingSkeleton />,
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
                        <h1 className="text-2xl sm:text-3xl font-bold text-card-foreground">Fund Management</h1>
                    </div>
                </div>

                {user.role === Role.Manager ? <ManagerShoppingView /> : <MemberShoppingView />}
            </div>

        </AppLayout>
    );
}
