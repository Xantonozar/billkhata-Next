"use client";

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { api } from '@/services/api';

export type ToastType = 'success' | 'warning' | 'error' | 'info';
export interface Toast {
    id: number;
    type: ToastType;
    title: string;
    message: string;
}

export type NotificationType = 'bill' | 'payment' | 'meal' | 'room' | 'deposit' | 'expense';
export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    actionText?: string;
    timestamp: string;
    read: boolean;
    link?: string;
    createdAt?: string;
}

interface NotificationContextType {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, 'id'>) => void;
    notifications: Notification[];
    unreadCount: number;
    markAllAsRead: () => void;
    markAsRead: (id: string) => void;
    refreshNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        if (user) {
            try {
                const data = await api.getNotifications();
                const formattedNotifications = data.map((n: any) => ({
                    id: n._id,
                    type: n.type,
                    title: n.title,
                    message: n.message,
                    actionText: n.actionText,
                    timestamp: new Date(n.createdAt).toLocaleString(),
                    read: n.read,
                    link: n.link,
                    createdAt: n.createdAt
                }));
                setNotifications(formattedNotifications);

                const count = await api.getUnreadCount();
                setUnreadCount(count);
            } catch (error) {
                console.error("Failed to fetch notifications", error);
            }
        } else {
            setNotifications([]);
            setUnreadCount(0);
        }
    };

    useEffect(() => {
        fetchNotifications();

        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, [user]);

    const addToast = (toast: Omit<Toast, 'id'>) => {
        const newToast = { ...toast, id: Date.now() };
        setToasts(prev => [...prev, newToast]);
        setTimeout(() => {
            setToasts(currentToasts => currentToasts.filter(t => t.id !== newToast.id));
        }, 5000);
    };

    const markAllAsRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);

        await api.markAllNotificationsRead();
        fetchNotifications();
    };

    const markAsRead = async (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));

        await api.markNotificationRead(id);
        fetchNotifications();
    };

    return (
        <NotificationContext.Provider value={{
            toasts,
            addToast,
            notifications,
            unreadCount,
            markAllAsRead,
            markAsRead,
            refreshNotifications: fetchNotifications
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
