import React from 'react';

export const MenuSkeleton = () => {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded"></div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <div key={i} className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-4 space-y-4">
                        <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-100 dark:border-slate-700">
                            <div className="h-6 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
                            <div className="h-6 w-12 bg-slate-200 dark:bg-slate-700 rounded"></div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                                <div className="flex-1 space-y-1">
                                    <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
                                    <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded"></div>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                                <div className="flex-1 space-y-1">
                                    <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
                                    <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded"></div>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                                <div className="flex-1 space-y-1">
                                    <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
                                    <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
