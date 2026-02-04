"use client";

import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { CalculationPeriod } from '@/types';
import { ChevronDownIcon } from './Icons';

interface CalculationPeriodSelectorProps {
    selectedPeriodId: string | null;
    onPeriodChange: (periodId: string | null) => void;
}

const CalculationPeriodSelector: React.FC<CalculationPeriodSelectorProps> = ({
    selectedPeriodId,
    onPeriodChange,
}) => {
    const [periods, setPeriods] = useState<CalculationPeriod[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const fetchPeriods = async () => {
            try {
                setLoading(true);
                const data = await api.getCalculationPeriods();
                setPeriods(data);
            } catch (error) {
                console.error('Error fetching calculation periods:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPeriods();
    }, []);

    const selectedPeriod = periods.find(p => p._id === selectedPeriodId);
    const activePeriod = periods.find(p => p.status === 'Active');

    // Auto-select active period if none selected
    useEffect(() => {
        if (!selectedPeriodId && activePeriod) {
            onPeriodChange(activePeriod._id);
        }
    }, [activePeriod, selectedPeriodId, onPeriodChange]);

    if (loading) {
        return (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Loading periods...</span>
            </div>
        );
    }

    if (periods.length === 0) {
        return (
            <div className="text-sm text-muted-foreground">
                No calculation periods yet
            </div>
        );
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-card border border-border rounded-lg hover:bg-muted transition-colors whitespace-nowrap overflow-hidden"
            >
                <span className="text-sm font-medium text-card-foreground truncate max-w-[100px] sm:max-w-none">
                    {selectedPeriod ? (
                        <>
                            {selectedPeriod.name}
                            {selectedPeriod.status === 'Active' && (
                                <span className="ml-1.5 px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-[10px] rounded-full">
                                    Active
                                </span>
                            )}
                        </>
                    ) : (
                        'Select'
                    )}
                </span>
                <ChevronDownIcon className={`w-3.5 h-3.5 text-muted-foreground flex-none transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute top-full left-0 mt-2 w-64 bg-card border border-border rounded-lg shadow-lg z-20 max-h-80 overflow-y-auto">
                        {periods.map((period) => (
                            <button
                                key={period._id}
                                onClick={() => {
                                    onPeriodChange(period._id);
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-4 py-3 hover:bg-muted transition-colors border-b border-border last:border-0 ${selectedPeriodId === period._id ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-card-foreground">{period.name}</span>
                                    {period.status === 'Active' && (
                                        <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full">
                                            Active
                                        </span>
                                    )}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    {new Date(period.startDate).toLocaleDateString()}
                                    {period.endDate && ` - ${new Date(period.endDate).toLocaleDateString()}`}
                                </div>
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default CalculationPeriodSelector;
