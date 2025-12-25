"use client";

import React, { useState } from 'react';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { BellIcon, SpinnerIcon } from '@/components/Icons';

type ReminderType = 'add_meal' | 'pay_bill' | 'approve_deposit' | 'approve_expense' | 'shopping';

interface ReminderButtonProps {
    type: ReminderType;
    billId?: string;
    className?: string;
    variant?: 'icon' | 'button' | 'dropdown-item';
    onSuccess?: (sent: number) => void;
}

const REMINDER_LABELS: Record<ReminderType, string> = {
    add_meal: 'Remind to Add Meals',
    pay_bill: 'Remind to Pay Bill',
    approve_deposit: 'Remind: Pending Deposits',
    approve_expense: 'Remind: Pending Expenses',
    shopping: 'Remind Shopper'
};

export default function ReminderButton({
    type,
    billId,
    className = '',
    variant = 'button',
    onSuccess
}: ReminderButtonProps) {
    const { user } = useAuth();
    const { addToast } = useNotifications();
    const [loading, setLoading] = useState(false);

    // Only show for managers
    if (user?.role !== 'Manager') {
        return null;
    }

    const handleSendReminder = async () => {
        if (!user?.khataId) return;

        setLoading(true);
        try {
            const result = await api.sendReminder(user.khataId, type, { billId });

            if (result.sent > 0) {
                addToast({
                    type: 'success',
                    title: 'Reminder Sent',
                    message: `Reminder sent to ${result.sent} member${result.sent > 1 ? 's' : ''}`
                });
                onSuccess?.(result.sent);
            } else {
                addToast({
                    type: 'warning',
                    title: 'No Recipients',
                    message: 'No members found for this reminder'
                });
            }
        } catch (error: any) {
            addToast({
                type: 'error',
                title: 'Failed',
                message: error.message || 'Failed to send reminder'
            });
        } finally {
            setLoading(false);
        }
    };

    if (variant === 'icon') {
        return (
            <button
                onClick={handleSendReminder}
                disabled={loading}
                className={`p-2 rounded-lg text-slate-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors disabled:opacity-50 ${className}`}
                title={REMINDER_LABELS[type]}
            >
                {loading ? <SpinnerIcon className="w-5 h-5" /> : <BellIcon className="w-5 h-5" />}
            </button>
        );
    }

    if (variant === 'dropdown-item') {
        return (
            <button
                onClick={handleSendReminder}
                disabled={loading}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 ${className}`}
            >
                {loading ? <SpinnerIcon className="w-4 h-4" /> : <BellIcon className="w-4 h-4" />}
                {REMINDER_LABELS[type]}
            </button>
        );
    }

    return (
        <button
            onClick={handleSendReminder}
            disabled={loading}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-white font-medium hover:bg-amber-600 active:scale-95 transition-all disabled:opacity-50 text-sm ${className}`}
        >
            {loading ? <SpinnerIcon className="w-4 h-4" /> : <BellIcon className="w-4 h-4" />}
            {REMINDER_LABELS[type]}
        </button>
    );
}
