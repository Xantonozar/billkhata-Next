"use client";

import React from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import ToastContainer from './ToastContainer';
import UnverifiedBanner from './UnverifiedBanner';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider>
            <AuthProvider>
                <NotificationProvider>
                    <UnverifiedBanner />
                    {children}
                    <ToastContainer />
                </NotificationProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}

