"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Role } from '@/types';
import { ClipboardCheckIcon } from '@/components/Icons';
import { ShoppingSkeleton } from '@/components/skeletons/ShoppingSkeleton';

// Dynamic imports
const ManagerDutyView = dynamic(() => import('@/components/duty/ManagerDutyView'), {
    loading: () => <ShoppingSkeleton />,
    ssr: false
});

const MemberDutyView = dynamic(() => import('@/components/duty/MemberDutyView'), {
    loading: () => <ShoppingSkeleton />,
    ssr: false
});

export default function DutyPage() {
    const { user } = useAuth();

    if (!user) return null;

    return (
        <AppLayout>
            <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <ClipboardCheckIcon className="w-6 h-6 sm:w-8 sm:h-8 text-primary-500" />
                        <h1 className="text-2xl sm:text-3xl font-bold text-card-foreground">Shopping Duty</h1>
                    </div>
                </div>

                {(user.role === Role.Manager || user.role === Role.MasterManager) ? <ManagerDutyView /> : <MemberDutyView />}
            </div>
        </AppLayout>
    );
}
