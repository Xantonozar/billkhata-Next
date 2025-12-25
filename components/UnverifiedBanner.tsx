"use client";

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { MailIcon, XIcon } from '@/components/Icons';
import { useState, useEffect } from 'react';

export default function UnverifiedBanner() {
    const { user } = useAuth();
    const [dismissed, setDismissed] = useState(true); // Start hidden to avoid flash

    useEffect(() => {
        // Check localStorage for dismissed state
        if (typeof window !== 'undefined' && user && !user.isVerified) {
            const dismissedUntil = localStorage.getItem('unverified_banner_dismissed');
            if (dismissedUntil) {
                // Check if dismissal is still valid (within 24 hours)
                const dismissedTime = parseInt(dismissedUntil, 10);
                if (Date.now() < dismissedTime) {
                    setDismissed(true);
                    return;
                }
            }
            setDismissed(false);
        }
    }, [user]);

    const handleDismiss = () => {
        // Dismiss for 24 hours
        const dismissUntil = Date.now() + (24 * 60 * 60 * 1000);
        localStorage.setItem('unverified_banner_dismissed', dismissUntil.toString());
        setDismissed(true);
    };

    // Don't show if user is verified, not logged in, or dismissed
    if (!user || user.isVerified || dismissed) {
        return null;
    }

    return (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-3 relative">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <MailIcon className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm font-medium">
                        Your email is not verified.{' '}
                        <Link
                            href={`/verify-email?email=${encodeURIComponent(user.email)}`}
                            className="underline hover:no-underline font-semibold"
                        >
                            Verify now
                        </Link>
                        {' '}to unlock all features.
                    </p>
                </div>
                <button
                    onClick={handleDismiss}
                    className="p-1 hover:bg-white/20 rounded-full transition-colors flex-shrink-0"
                    aria-label="Dismiss"
                >
                    <XIcon className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
