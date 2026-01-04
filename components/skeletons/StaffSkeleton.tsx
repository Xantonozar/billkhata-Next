import React from 'react';

export const StaffSkeleton = () => {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Header Skeleton */}
            <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div>
                    <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
                    <div className="h-4 w-64 bg-slate-200 dark:bg-slate-700 rounded"></div>
                </div>
                <div className="h-10 w-32 bg-slate-200 dark:bg-slate-700 rounded hidden sm:block"></div>
            </div>

            {/* Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                                <div className="space-y-2">
                                    <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
                                    <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                            <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
                            <div className="h-8 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
