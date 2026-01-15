"use client";

import React, { useState } from 'react';
import { XIcon } from '../Icons';

interface StartCalculationModalProps {
    onClose: () => void;
    onSubmit: (name: string) => void;
}

const StartCalculationModal: React.FC<StartCalculationModalProps> = ({ onClose, onSubmit }) => {
    const [name, setName] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = () => {
        if (!name.trim()) {
            setError('Period name is required');
            return;
        }
        if (name.trim().length > 50) {
            setError('Period name must be 50 characters or less');
            return;
        }

        onSubmit(name.trim());
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in p-4">
            <div className="bg-card rounded-xl shadow-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-card-foreground">Start New Calculation</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-muted transition-colors">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="border-t border-border my-4"></div>

                <div className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                            💡 <strong>Tip:</strong> Use a descriptive name like &quot;January 2026&quot; or &quot;Week 1&quot;
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-card-foreground mb-2">
                            Calculation Period Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                setError('');
                            }}
                            placeholder="e.g., January 2026"
                            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                            maxLength={50}
                            autoFocus
                        />
                        {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
                        <p className="text-xs text-muted-foreground mt-1">{name.length}/50 characters</p>
                    </div>

                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                            ⚠️ Starting a new calculation will allow members to add meals, deposits, and shopping expenses for this period.
                        </p>
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
                        onClick={handleSubmit}
                        disabled={!name.trim()}
                        className="flex-1 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Start Calculation
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StartCalculationModal;
