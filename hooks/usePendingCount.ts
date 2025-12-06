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
                const total = await api.getPendingCounts(khataId);
                setCount(total);
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
