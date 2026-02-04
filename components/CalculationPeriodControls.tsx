"use client";

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { api } from '@/services/api';
import StartCalculationModal from './modals/StartCalculationModal';
import EndCalculationModal from './modals/EndCalculationModal';
import { Role } from '@/types';

interface CalculationPeriodControlsProps {
    activePeriod: any | null;
    onPeriodStarted: () => void;
    onPeriodEnded: () => void;
}

const CalculationPeriodControls: React.FC<CalculationPeriodControlsProps> = ({
    activePeriod,
    onPeriodStarted,
    onPeriodEnded,
}) => {
    const { user } = useAuth();
    const { addToast } = useNotifications();
    const [showStartModal, setShowStartModal] = useState(false);
    const [showEndModal, setShowEndModal] = useState(false);

    // Only managers can see these controls
    if (user?.role !== Role.Manager && user?.role !== Role.MasterManager) {
        return null;
    }

    const handleStartPeriod = async (name: string) => {
        try {
            await api.startCalculationPeriod(name);
            addToast({
                type: 'success',
                title: 'Calculation Started',
                message: `${name} has been started successfully.`,
            });
            setShowStartModal(false);
            onPeriodStarted();
        } catch (error: any) {
            addToast({
                type: 'error',
                title: 'Error',
                message: error.message || 'Failed to start calculation period',
            });
        }
    };

    const handleEndPeriod = async () => {
        if (!activePeriod) return;

        try {
            await api.endCalculationPeriod(activePeriod._id);
            addToast({
                type: 'success',
                title: 'Calculation Ended',
                message: `${activePeriod.name} has been ended successfully.`,
            });
            setShowEndModal(false);
            onPeriodEnded();
        } catch (error: any) {
            addToast({
                type: 'error',
                title: 'Error',
                message: error.message || 'Failed to end calculation period',
            });
        }
    };

    return (
        <>
            <div className="flex gap-2">
                {!activePeriod ? (
                    <button
                        onClick={() => setShowStartModal(true)}
                        className="px-3 sm:px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-600 transition-colors whitespace-nowrap text-sm sm:text-base"
                    >
                        Start Calculation
                    </button>
                ) : (
                    <button
                        onClick={() => setShowEndModal(true)}
                        className="px-3 sm:px-4 py-2 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors whitespace-nowrap text-sm sm:text-base"
                    >
                        End Calculation
                    </button>
                )}
            </div>

            {showStartModal && (
                <StartCalculationModal
                    onClose={() => setShowStartModal(false)}
                    onSubmit={handleStartPeriod}
                />
            )}

            {showEndModal && activePeriod && (
                <EndCalculationModal
                    periodName={activePeriod.name}
                    startDate={activePeriod.startDate}
                    onClose={() => setShowEndModal(false)}
                    onConfirm={handleEndPeriod}
                />
            )}
        </>
    );
};

export default CalculationPeriodControls;
