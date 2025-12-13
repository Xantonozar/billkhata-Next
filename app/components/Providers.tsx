"use client";

import React from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import ToastContainer from './ToastContainer';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider>
            <AuthProvider>
                <NotificationProvider>
                    {children}
                    <ToastContainer />
                </NotificationProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}
