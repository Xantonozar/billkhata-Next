"use client";

import React, { useEffect, useState } from 'react';
import { Toast as ToastType } from '@/contexts/NotificationContext';
import { CheckCircleSolidIcon, ExclamationTriangleIcon, XCircleIcon, XIcon, SparklesIcon } from './Icons';

interface ToastProps {
    toast: ToastType;
    onClose: () => void;
}

const toastConfig = {
    success: {
        icon: CheckCircleSolidIcon,
        bgColor: 'bg-green-100 dark:bg-green-800',
        borderColor: 'border-l-4 border-green-600 dark:border-green-400',
        iconColor: 'text-green-700 dark:text-green-300',
        titleColor: 'text-green-900 dark:text-green-100',
        messageColor: 'text-green-800 dark:text-green-200'
    },
    warning: {
        icon: ExclamationTriangleIcon,
        bgColor: 'bg-yellow-100 dark:bg-yellow-800',
        borderColor: 'border-l-4 border-yellow-600 dark:border-yellow-400',
        iconColor: 'text-yellow-700 dark:text-yellow-300',
        titleColor: 'text-yellow-900 dark:text-yellow-100',
        messageColor: 'text-yellow-800 dark:text-yellow-200'
    },
    error: {
        icon: XCircleIcon,
        bgColor: 'bg-red-100 dark:bg-red-800',
        borderColor: 'border-l-4 border-red-600 dark:border-red-400',
        iconColor: 'text-red-700 dark:text-red-300',
        titleColor: 'text-red-900 dark:text-red-100',
        messageColor: 'text-red-800 dark:text-red-200'
    },
    info: {
        icon: SparklesIcon,
        bgColor: 'bg-blue-100 dark:bg-blue-800',
        borderColor: 'border-l-4 border-blue-600 dark:border-blue-400',
        iconColor: 'text-blue-700 dark:text-blue-300',
        titleColor: 'text-blue-900 dark:text-blue-100',
        messageColor: 'text-blue-800 dark:text-blue-200'
    }
};

const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
    const { type, title, message } = toast;
    const config = toastConfig[type];
    const Icon = config.icon;
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setVisible(true), 10);
        return () => clearTimeout(timer);
    }, []);

    const handleClose = () => {
        setVisible(false);
        setTimeout(onClose, 300);
    };

    return (
        <div
            className={`w-full max-w-md rounded-xl shadow-2xl pointer-events-auto overflow-hidden transition-all duration-300 ease-in-out ${config.bgColor} ${config.borderColor} ${visible ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-full opacity-0 scale-95'}`}
        >
            <div className="p-5">
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                        <Icon className={`h-7 w-7 ${config.iconColor}`} aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className={`text-base font-bold font-sans ${config.titleColor}`}>{title}</p>
                        <p className={`mt-1.5 text-sm leading-relaxed ${config.messageColor}`}>{message}</p>
                    </div>
                    <div className="flex-shrink-0">
                        <button
                            className={`inline-flex rounded-lg p-1.5 ${config.iconColor} hover:bg-black/5 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${config.iconColor.replace('text-', 'focus:ring-')}`}
                            onClick={handleClose}
                        >
                            <span className="sr-only">Close</span>
                            <XIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Toast;
