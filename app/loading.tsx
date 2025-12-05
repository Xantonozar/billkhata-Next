import React from 'react';

export default function Loading() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50 dark:bg-slate-950">
            <div className="flex flex-col items-center">
                <div className="relative w-24 h-24 mb-4">
                    <div className="absolute inset-0 border-4 border-slate-200 dark:border-slate-800 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-primary-500 rounded-full border-t-transparent animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain animate-pulse" />
                    </div>
                </div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white animate-pulse">BillKhata</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Loading your finances...</p>
            </div>
        </div>
    );
}
