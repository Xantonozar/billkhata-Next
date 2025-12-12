"use client";

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/services/api';

export const usePendingCount = (khataId: string | undefined, isManager: boolean) => {
    const [count, setCount] = useState(0);

    const fetchPendingCount = useCallback(async () => {
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
    }, [khataId, isManager]);

    useEffect(() => {
        fetchPendingCount();

        // Reduced to 60s since Pusher handles real-time updates
        const interval = setInterval(fetchPendingCount, 60000);
        return () => clearInterval(interval);
    }, [fetchPendingCount]);

    return { count, refetch: fetchPendingCount };
};
