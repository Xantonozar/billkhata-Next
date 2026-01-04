import React from 'react';

export const ShoppingSkeleton = () => {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Top Banner (Duty) */}
            <div className="h-14 w-full bg-primary-50 dark:bg-primary-500/10 rounded-lg"></div>

            {/* Roster Card */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
                <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
                <div className="border-t border-slate-100 dark:border-slate-700/50 pt-3 space-y-3">
                    {[1, 2, 3, 4, 5, 6, 7].map(i => (
                        <div key={i} className="flex justify-between items-center">
                            <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
                            <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Action Buttons Grid */}
            <div className="grid grid-cols-2 gap-4">
                <div className="h-16 bg-white dark:bg-slate-800 rounded-xl shadow-md"></div>
                <div className="h-16 bg-white dark:bg-slate-800 rounded-xl shadow-md"></div>
            </div>

            {/* Stats Grid */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 grid grid-cols-2 gap-4">
                <div>
                    <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
                    <div className="h-8 w-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
                </div>
                <div>
                    <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
                    <div className="h-8 w-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
                </div>
            </div>

            {/* Bottom Section (History/Approvals) */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-4">
                <div className="flex gap-2 mb-4">
                    <div className="h-8 flex-1 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    <div className="h-8 flex-1 bg-slate-200 dark:bg-slate-700 rounded"></div>
                </div>
                <div className="space-y-2">
                    <div className="h-10 w-full bg-slate-50 dark:bg-slate-700/50 rounded"></div>
                    <div className="h-10 w-full bg-slate-50 dark:bg-slate-700/50 rounded"></div>
                </div>
            </div>
        </div>
    );
};
