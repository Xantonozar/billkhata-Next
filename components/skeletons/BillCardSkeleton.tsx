import React from 'react';

export const BillCardSkeleton = ({ announce = true }: { announce?: boolean }) => {
    return (
        <div 
            className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-3 sm:p-5 flex flex-row items-center justify-between border border-slate-100 dark:border-slate-700/50" 
            {...(announce ? { role: "status", "aria-busy": "true", "aria-label": "Loading bill card" } : { "aria-hidden": "true" })}
        >
            <div className="flex-grow space-y-2">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse"></div>
                    <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                </div>
                <div className="h-8 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                <div className="h-4 w-40 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
            </div>

            <div className="flex flex-col items-end gap-2 ml-3">
                <div className="hidden sm:block w-32 h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                <div className="w-20 h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
            </div>
        </div>
    );
};

export const BillsOverviewSkeleton = () => {
    return (
        <div className="space-y-6 animate-fade-in" role="status" aria-busy="true" aria-label="Loading bills overview">
            <div className="flex items-center justify-between">
                <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                <div className="h-10 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
            </div>

            {/* Summary Card Skeleton */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
                <div className="h-6 w-40 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-4"></div>
                <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex flex-col items-center gap-2">
                            <div className="h-4 w-12 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                            <div className="h-8 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <BillCardSkeleton key={i} announce={false} />
                ))}
            </div>
        </div>
    );
};


export const BillDetailSkeleton = () => {
    return (
        <div className="space-y-4 sm:space-y-6 animate-pulse" role="status" aria-busy="true" aria-label="Loading bill details">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                    <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded"></div>
                </div>
                <div className="h-10 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>
            <div className="flex justify-end">
                <div className="h-10 w-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-4 sm:p-6 space-y-4">
                <div className="h-6 w-1/3 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
                <div className="space-y-2">
                    <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-700 rounded"></div>
                </div>
                <div className="pt-4 border-t border-slate-100 dark:border-slate-700/50 mt-4 space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex justify-between">
                            <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
                            <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};