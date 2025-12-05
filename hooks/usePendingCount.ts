"use client";

import { useState, useEffect } from 'react';
import { api } from '@/services/api';

export const usePendingCount = (khataId: string | undefined, isManager: boolean) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        const fetchPendingCount = async () => {
            if (!khataId || !isManager) {
                setCount(0);
                return;
            }

            try {
                const [deposits, expenses] = await Promise.all([
                    api.getDeposits(khataId),
                    api.getExpenses(khataId)
                ]);

                const pendingDeposits = deposits.filter((d: any) => d.status === 'Pending').length;
                const pendingExpenses = expenses.filter((e: any) => e.status === 'Pending').length;

                setCount(pendingDeposits + pendingExpenses);
            } catch (error) {
                console.error('Error fetching pending count:', error);
                setCount(0);
            }
        };

        fetchPendingCount();

        const interval = setInterval(fetchPendingCount, 30000);
        return () => clearInterval(interval);
    }, [khataId, isManager]);

    return count;
};
