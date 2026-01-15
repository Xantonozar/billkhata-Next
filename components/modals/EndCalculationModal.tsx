"use client";

import React from 'react';
import { XIcon } from '../Icons';

interface EndCalculationModalProps {
    periodName: string;
    startDate: string;
    onClose: () => void;
    onConfirm: () => void;
}

const EndCalculationModal: React.FC<EndCalculationModalProps> = ({
    periodName,
    startDate,
    onClose,
    onConfirm,
}) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in p-4">
            <div className="bg-card rounded-xl shadow-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-card-foreground">End Calculation Period</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-muted transition-colors">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="border-t border-border my-4"></div>

                <div className="space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                        <p className="text-sm font-semibold text-card-foreground mb-2">Current Period</p>
                        <p className="font-bold text-lg text-primary-600 dark:text-primary-400">{periodName}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Started: {new Date(startDate).toLocaleDateString()}
                        </p>
                    </div>

                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                        <p className="text-sm font-semibold text-orange-800 dark:text-orange-200 mb-2">
                            ⚠️ Important
                        </p>
                        <ul className="text-sm text-orange-800 dark:text-orange-200 space-y-1 list-disc list-inside">
                            <li>This will finalize all data in this period</li>
                            <li>Members won&apos;t be able to add new entries</li>
                            <li>You&apos;ll need to start a new calculation to continue</li>
                            <li>This action cannot be undone</li>
                        </ul>
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 bg-muted font-semibold rounded-lg hover:bg-muted/80 transition-colors text-foreground"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 py-2.5 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors"
                    >
                        End Calculation
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EndCalculationModal;
