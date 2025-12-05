"use client";

import React from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import Toast from './Toast';

const ToastContainer: React.FC = () => {
    const { toasts } = useNotifications();

    return (
        <div
            aria-live="assertive"
            className="fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start z-[100]"
        >
            <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
                {toasts.map(toast => (
                    <Toast
                        key={toast.id}
                        toast={toast}
                        onClose={() => { /* Closing handled by timeout in context */ }}
                    />
                ))}
            </div>
        </div>
    );
};

export default ToastContainer;
