"use client";

import React from 'react';

/**
 * A skeleton loading component for pages that require authentication.
 * Shows a pulse animation with placeholder content instead of a spinner,
 * providing better perceived performance during auth loading.
 */
export default function AuthSkeleton() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 sm:p-6">
            {/* Header skeleton */}
            <div className="animate-pulse">
                <div className="h-8 w-64 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
                <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded mb-6" />
            </div>

            {/* Stats grid skeleton */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-8 animate-pulse">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-white dark:bg-slate-800 p-3 sm:p-5 rounded-xl shadow-md">
                        <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
                        <div className="h-8 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
                        <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
                    </div>
                ))}
            </div>

            {/* Menu section skeleton */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md mb-8 animate-pulse">
                <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded mb-4" />
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex justify-between items-center p-3 border-b border-slate-100 dark:border-slate-700">
                            <div className="h-5 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
                            <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
                            <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom section skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-pulse">
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
                    <div className="h-6 w-40 bg-slate-200 dark:bg-slate-700 rounded mb-4" />
                    <div className="space-y-3">
                        {[1, 2].map(i => (
                            <div key={i} className="h-16 bg-slate-100 dark:bg-slate-700/50 rounded-lg" />
                        ))}
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
                    <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-4" />
                    <div className="grid grid-cols-4 gap-2">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-20 bg-slate-100 dark:bg-slate-700/50 rounded-xl" />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
