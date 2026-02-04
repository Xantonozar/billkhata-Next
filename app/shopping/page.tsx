"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Role } from '@/types';
import { ShoppingCartIcon } from '@/components/Icons';
import { ShoppingSkeleton } from '@/components/skeletons/ShoppingSkeleton';
import CalculationPeriodSelector from '@/components/CalculationPeriodSelector';
import CalculationPeriodControls from '@/components/CalculationPeriodControls';
import { api } from '@/services/api';

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
    const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
    const [activePeriod, setActivePeriod] = useState<any | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        const fetchActivePeriod = async () => {
            const period = await api.getActiveCalculationPeriod();
            setActivePeriod(period);
            // Always update selected period to the active one when it changes
            // This ensures auto-switch after ending/starting periods
            if (period) {
                setSelectedPeriodId(period._id);
            }
        };

        if (user) {
            fetchActivePeriod();
        }
    }, [user, refreshKey]);

    const handlePeriodChanged = () => {
        // Trigger refetch of active period and auto-select it
        setRefreshKey(prev => prev + 1);
    };

    if (!user) return null;

    const isViewingActivePeriod = activePeriod && selectedPeriodId === activePeriod._id;

    return (
        <AppLayout>
            <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <ShoppingCartIcon className="w-6 h-6 sm:w-8 sm:h-8 text-primary-500" />
                        <h1 className="text-2xl sm:text-3xl font-bold text-card-foreground">Fund Management</h1>
                    </div>

                    <div className="flex flex-row items-center justify-between w-full sm:w-auto sm:justify-end gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                        <div className="flex-none sm:flex-initial">
                            <CalculationPeriodSelector
                                selectedPeriodId={selectedPeriodId}
                                onPeriodChange={setSelectedPeriodId}
                            />
                        </div>
                        <div className="flex-none">
                            <CalculationPeriodControls
                                activePeriod={activePeriod}
                                onPeriodStarted={handlePeriodChanged}
                                onPeriodEnded={handlePeriodChanged}
                            />
                        </div>
                    </div>
                </div>

                {!activePeriod && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                        <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                            ⚠️ No active calculation period. {(user.role === Role.Manager || user.role === Role.MasterManager) ? 'Click "Start Calculation" to begin.' : 'Ask the manager to start a new calculation period.'}
                        </p>
                    </div>
                )}

                {selectedPeriodId && !isViewingActivePeriod && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                            📊 Viewing historical calculation period (read-only)
                        </p>
                    </div>
                )}

                {(user.role === Role.Manager || user.role === Role.MasterManager) ? (
                    <ManagerShoppingView
                        selectedPeriodId={selectedPeriodId}
                        isActivePeriod={isViewingActivePeriod}
                    />
                ) : (
                    <MemberShoppingView
                        selectedPeriodId={selectedPeriodId}
                        isActivePeriod={isViewingActivePeriod}
                    />
                )}
            </div>

        </AppLayout>
    );
}
