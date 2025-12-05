"use client";

import React, { useEffect, useRef } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { XIcon, CheckCircleIcon, BellIcon, CreditCardIcon, MealIcon, HomeIcon, BanknotesIcon, ExclamationTriangleIcon } from './Icons';
import { useRouter } from 'next/navigation';

interface NotificationsPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ isOpen, onClose }) => {
    const { notifications, markAllAsRead, markAsRead, unreadCount } = useNotifications();
    const panelRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    const getIcon = (type: string) => {
        switch (type) {
            case 'bill': return <HomeIcon className="w-5 h-5 text-blue-500" />;
            case 'payment': return <CreditCardIcon className="w-5 h-5 text-green-500" />;
            case 'meal': return <MealIcon className="w-5 h-5 text-orange-500" />;
            case 'deposit': return <BanknotesIcon className="w-5 h-5 text-emerald-500" />;
            case 'expense': return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
            default: return <BellIcon className="w-5 h-5 text-gray-500" />;
        }
    };

    const handleNotificationClick = (notification: any) => {
        if (!notification.read) {
            markAsRead(notification.id);
        }
        if (notification.link) {
            router.push(notification.link);
            onClose();
        }
    };

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity" aria-hidden="true" />
            )}

            {/* Panel */}
            <div
                ref={panelRef}
                className={`fixed inset-y-0 right-0 w-full max-w-sm bg-white dark:bg-slate-900 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Notifications</h2>
                            {unreadCount > 0 && (
                                <span className="bg-primary-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                    {unreadCount} New
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors mr-2"
                                >
                                    Mark all read
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                                <XIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400 p-8 text-center">
                                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                    <BellIcon className="w-8 h-8 opacity-50" />
                                </div>
                                <p className="font-medium">No notifications yet</p>
                                <p className="text-sm mt-1 opacity-75">We'll notify you when something important happens.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer relative group ${!notification.read ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''
                                            }`}
                                    >
                                        <div className="flex gap-4">
                                            <div className="flex-shrink-0 mt-1">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${!notification.read ? 'bg-white dark:bg-slate-800 shadow-sm' : 'bg-slate-100 dark:bg-slate-800/50'
                                                    }`}>
                                                    {getIcon(notification.type)}
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start gap-2">
                                                    <p className={`text-sm font-semibold ${!notification.read ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'
                                                        }`}>
                                                        {notification.title}
                                                    </p>
                                                    <span className="text-xs text-slate-400 whitespace-nowrap">
                                                        {notification.timestamp}
                                                    </span>
                                                </div>
                                                <p className={`text-sm mt-1 line-clamp-2 ${!notification.read ? 'text-slate-700 dark:text-slate-300' : 'text-slate-500 dark:text-slate-500'
                                                    }`}>
                                                    {notification.message}
                                                </p>
                                                {notification.actionText && (
                                                    <span className="inline-block mt-2 text-xs font-medium text-primary-600 dark:text-primary-400 group-hover:underline">
                                                        {notification.actionText} →
                                                    </span>
                                                )}
                                            </div>
                                            {!notification.read && (
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-primary-500 rounded-full"></div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default NotificationsPanel;
