"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Role, MealHistory } from '@/types';
import { MealIcon, XIcon, ChevronRightIcon, ChevronDownIcon } from '@/components/Icons';
import { useNotifications } from '@/contexts/NotificationContext';
import { api } from '@/services/api';
import AppLayout from '@/components/AppLayout';

const COST_PER_QUANTITY = 45.50;

interface MealSet {
    breakfast: number;
    lunch: number;
    dinner: number;
}

interface MemberMealData {
    id: string;
    name: string;
    meals: MealSet;
}

// Skeleton component for meal page loading state
const MealPageSkeleton: React.FC = () => (
    <AppLayout>
        <div className="space-y-6 animate-pulse">
            {/* Header */}
            <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-muted rounded" />
                <div className="h-8 w-48 bg-muted rounded" />
            </div>

            {/* Status Card */}
            <div className="bg-card rounded-xl shadow-md p-6">
                <div className="h-6 w-64 bg-muted rounded mb-3" />
                <div className="h-px bg-muted my-3" />
                <div className="h-5 w-40 bg-muted rounded mb-3" />
                <div className="h-10 w-full bg-muted rounded" />
            </div>

            {/* Meal List Card */}
            <div className="bg-card rounded-xl shadow-md p-6">
                <div className="h-6 w-40 bg-muted rounded mb-3" />
                <div className="h-px bg-muted my-3" />
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="p-4 bg-muted rounded-lg">
                            <div className="h-5 w-32 bg-muted rounded mb-3" />
                            <div className="grid grid-cols-3 gap-2">
                                {[1, 2, 3].map(j => (
                                    <div key={j} className="bg-background p-2 rounded h-12" />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </AppLayout>
);

const MealQuantitySelector: React.FC<{
    meal: 'breakfast' | 'lunch' | 'dinner';
    label: string;
    icon: string;
    value: number;
    onChange: (value: number) => void;
    disabled: boolean;
}> = ({ meal, label, icon, value, onChange, disabled }) => (
    <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-700/50 hover:border-primary-200 dark:hover:border-primary-800/50 transition-all">
        <label className="font-semibold text-foreground text-base sm:text-lg flex items-center gap-2">
            <span className="text-2xl">{icon}</span>
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{label.substring(0, 3)}</span>
        </label>
        <div className="flex items-center gap-3 sm:gap-4">
            <button
                onClick={() => onChange(Math.max(0, value - 0.25))}
                disabled={disabled || value === 0}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 hover:from-slate-200 hover:to-slate-300 dark:hover:from-slate-600 dark:hover:to-slate-700 font-bold text-xl sm:text-2xl disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all active:scale-95 shadow-md hover:shadow-lg text-slate-700 dark:text-slate-200"
                aria-label={`Decrease ${label}`}
            >−</button>
            <span className="w-12 sm:w-16 text-center font-bold text-xl sm:text-2xl text-foreground tabular-nums">{value}</span>
            <button
                onClick={() => onChange(value + 0.25)}
                disabled={disabled}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 font-bold text-xl sm:text-2xl disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all active:scale-95 shadow-md hover:shadow-lg shadow-primary-500/20 text-white"
                aria-label={`Increase ${label}`}
            >+</button>
        </div>
    </div>
);

// Lazy-loaded history component - only fetches when expanded
const LazyHistoryList: React.FC<{
    khataId: string;
    userId?: string;
    title?: string;
}> = ({ khataId, userId, title }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [history, setHistory] = useState<MealHistory[]>([]);
    const [loading, setLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchHistory = async () => {
        if (loaded && !error) return; // Already loaded successfully, don't refetch

        try {
            setLoading(true);
            setError(null); // Clear any previous error when retrying
            const data = await api.getMealHistory(khataId, userId);
            setHistory(data);
            setLoaded(true);
        } catch (error) {
            console.error('Failed to fetch history', error);
            const errorMessage = error instanceof Error
                ? error.message
                : 'Failed to load meal history. Please try again.';
            setError(errorMessage);
            setLoaded(false); // Allow retry by resetting loaded flag
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = () => {
        const newExpanded = !isExpanded;
        setIsExpanded(newExpanded);
        if (newExpanded && (!loaded || error)) {
            fetchHistory();
        }
    };

    return (
        <div className="mt-6 bg-card rounded-xl shadow-md overflow-hidden">
            <button
                onClick={handleToggle}
                className="w-full p-4 flex items-center justify-between hover:bg-muted transition-colors"
            >
                <h4 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
                    🕒 {title || (userId ? 'Meal History' : 'Room Activity Log')}
                </h4>
                <ChevronDownIcon className={`w-5 h-5 text-slate-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
            </button>

            {isExpanded && (
                <div className="px-4 pb-4">
                    {loading ? (
                        <div className="text-center py-4 text-muted-foreground text-sm">Loading history...</div>
                    ) : error ? (
                        <div className="text-center py-4">
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-3">
                                <p className="text-red-800 dark:text-red-200 text-sm font-medium mb-2">
                                    {error}
                                </p>
                                <button
                                    onClick={fetchHistory}
                                    disabled={loading}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                >
                                    Retry
                                </button>
                            </div>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground text-sm">No history found.</div>
                    ) : (
                        <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                            {history.map((record: MealHistory) => (
                                <div key={record._id} className="bg-muted p-3 rounded-lg border border-border text-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <span className="font-bold text-foreground block">
                                                {new Date(record.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                            </span>
                                            {!userId && record.targetUserId && (
                                                <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">
                                                    Member: {record.targetUserId.name}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-muted-foreground bg-background px-2 py-1 rounded-full">
                                            {new Date(record.createdAt).toLocaleString(undefined, { hour: 'numeric', minute: 'numeric', hour12: true })}
                                        </span>
                                    </div>

                                    <div className="flex gap-2 mb-2">
                                        <div className="flex-1 bg-background rounded p-1.5 text-center border border-border">
                                            <span className="text-xs text-muted-foreground block">B</span>
                                            <span className="font-bold text-foreground text-sm">{record.breakfast}</span>
                                        </div>
                                        <div className="flex-1 bg-background rounded p-1.5 text-center border border-border">
                                            <span className="text-xs text-muted-foreground block">L</span>
                                            <span className="font-bold text-foreground text-sm">{record.lunch}</span>
                                        </div>
                                        <div className="flex-1 bg-background rounded p-1.5 text-center border border-border">
                                            <span className="text-xs text-muted-foreground block">D</span>
                                            <span className="font-bold text-foreground text-sm">{record.dinner}</span>
                                        </div>
                                    </div>

                                    <div className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                                        <span>by</span>
                                        <span className={`font-semibold px-1.5 py-0.5 rounded ${record.changedByUserId?.role === 'Manager'
                                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                                            : 'bg-background text-foreground'
                                            }`}>
                                            {record.changedByUserId?.role === 'Manager' ? 'Manager' : (record.changedByUserId?.name || 'Unknown')}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const ManagerEditModal: React.FC<{
    member: MemberMealData;
    onClose: () => void;
    onSubmit: (edit: { memberName: string; newMeals: MealSet }) => void;
    isFinalized: boolean;
    khataId: string;
}> = ({ member, onClose, onSubmit, isFinalized, khataId }) => {
    const originalMeals = useMemo(() => member.meals || { breakfast: 0, lunch: 0, dinner: 0 }, [member]);
    const [meals, setMeals] = useState<MealSet>(originalMeals);

    useEffect(() => {
        setMeals(originalMeals);
    }, [originalMeals]);

    const handleSubmit = () => {
        onSubmit({ memberName: member.name, newMeals: meals });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 animate-fade-in p-0 sm:p-4" onClick={onClose}>
            <div className="bg-card rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto border-t-4 sm:border-t-0 border-primary-500" onClick={e => e.stopPropagation()}>
                {/* Header with Gradient Accent */}
                <div className="sticky top-0 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 border-b border-primary-200 dark:border-primary-800 px-6 py-5 backdrop-blur-sm">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-xl sm:text-2xl font-bold text-card-foreground">Edit Meal</h3>
                            <p className="text-sm text-muted-foreground mt-1">Adjusting meals for <span className="font-semibold text-primary-600 dark:text-primary-400">{member.name}</span></p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-white dark:hover:bg-slate-800 transition-colors"
                            aria-label="Close"
                        >
                            <XIcon className="w-6 h-6 text-muted-foreground" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {isFinalized && (
                        <div className="mb-6 p-4 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-xl">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">⚠️</span>
                                <div>
                                    <p className="text-sm font-bold text-yellow-900 dark:text-yellow-200">Already Finalized</p>
                                    <p className="text-xs text-yellow-800 dark:text-yellow-300">Changes will update historical records</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        <MealQuantitySelector meal="breakfast" icon="🌅" label="Breakfast" value={meals.breakfast} onChange={(v) => setMeals(p => ({ ...p, breakfast: v }))} disabled={false} />
                        <MealQuantitySelector meal="lunch" icon="🌞" label="Lunch" value={meals.lunch} onChange={(v) => setMeals(p => ({ ...p, lunch: v }))} disabled={false} />
                        <MealQuantitySelector meal="dinner" icon="🌙" label="Dinner" value={meals.dinner} onChange={(v) => setMeals(p => ({ ...p, dinner: v }))} disabled={false} />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-8">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl transition-all active:scale-95"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="flex-1 py-3.5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white font-bold rounded-xl shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 transition-all active:scale-95"
                        >
                            Save Changes
                        </button>
                    </div>

                    {/* Lazy load history in modal */}
                    <div className="mt-6">
                        <LazyHistoryList khataId={khataId} userId={member.id} title={`${member.name}'s History`} />
                    </div>
                </div>
            </div>
        </div>
    );
};

const MemberMealView: React.FC<{
    isFinalized: boolean;
    meals: MealSet;
    setMeals: React.Dispatch<React.SetStateAction<MealSet>>;
    onSaveChanges: () => void;
    saving: boolean;
    khataId: string;
    userId: string;
    userName: string;
}> = ({ isFinalized, meals, setMeals, onSaveChanges, saving, khataId, userId, userName }) => {
    const totalQty = meals.breakfast + meals.lunch + meals.dinner;
    const totalCost = totalQty * COST_PER_QUANTITY;

    return (
        <div className="space-y-6">
            {/* Meal Input Card with Gradient Header */}
            <div className="bg-card rounded-2xl shadow-lg border border-border/50 overflow-hidden">
                {/* Gradient Header */}
                <div className="bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 p-6 text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xl sm:text-2xl font-bold">Today's Meal Count</h3>
                            <div className="px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold">
                                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </div>
                        </div>
                        <p className="text-primary-100 text-sm sm:text-base">Track your meals for today</p>
                    </div>
                </div>

                {/* Meal Selectors */}
                <div className="p-6">
                    {isFinalized ? (
                        <div className="space-y-4">
                            <div className="p-4 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-xl">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-2xl">🔒</span>
                                    <p className="text-sm sm:text-base font-bold text-yellow-900 dark:text-yellow-200">Finalized by Manager</p>
                                </div>
                                <p className="text-xs sm:text-sm text-yellow-800 dark:text-yellow-300 ml-11">No changes allowed for today's meals</p>
                            </div>
                            <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                                <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-700">
                                    <span className="flex items-center gap-2 text-base font-medium"><span className="text-xl">🌅</span> Breakfast</span>
                                    <span className="font-bold text-lg">{meals.breakfast}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-700">
                                    <span className="flex items-center gap-2 text-base font-medium"><span className="text-xl">🌞</span> Lunch</span>
                                    <span className="font-bold text-lg">{meals.lunch}</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="flex items-center gap-2 text-base font-medium"><span className="text-xl">🌙</span> Dinner</span>
                                    <span className="font-bold text-lg">{meals.dinner}</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <MealQuantitySelector meal="breakfast" icon="🌅" label="Breakfast" value={meals.breakfast} onChange={(v) => setMeals(prev => ({ ...prev, breakfast: v }))} disabled={saving} />
                            <MealQuantitySelector meal="lunch" icon="🌞" label="Lunch" value={meals.lunch} onChange={(v) => setMeals(prev => ({ ...prev, lunch: v }))} disabled={saving} />
                            <MealQuantitySelector meal="dinner" icon="🌙" label="Dinner" value={meals.dinner} onChange={(v) => setMeals(prev => ({ ...prev, dinner: v }))} disabled={saving} />
                        </div>
                    )}

                    {/* Summary Section */}
                    <div className="mt-6 pt-6 border-t-2 border-dashed border-slate-200 dark:border-slate-700">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
                                <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide block mb-1">Total Meals</span>
                                <span className="text-3xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">{totalQty}</span>
                            </div>
                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-100 dark:border-green-800">
                                <span className="text-xs font-semibold text-green-700 dark:text-green-300 uppercase tracking-wide block mb-1">Est. Cost</span>
                                <span className="text-3xl font-bold text-green-600 dark:text-green-400 tabular-nums">৳{totalCost.toFixed(0)}</span>
                            </div>
                        </div>

                        {/* Floating Action Button Style Save */}
                        <button
                            onClick={onSaveChanges}
                            disabled={isFinalized || saving}
                            className={`w-full py-4 sm:py-5 bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 text-white font-bold rounded-xl sm:rounded-2xl shadow-xl shadow-primary-500/30 transition-all flex items-center justify-center gap-3 text-base sm:text-lg ${saving || isFinalized
                                ? 'opacity-50 cursor-not-allowed'
                                : 'hover:shadow-2xl hover:shadow-primary-500/40 hover:scale-[1.02] active:scale-[0.98]'
                                }`}
                        >
                            {saving ? (
                                <>
                                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>Saving Changes...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span>Save Today's Meals</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Lazy-loaded History Section */}
            <LazyHistoryList khataId={khataId} userId={userId} />
        </div>
    );
};

const ManagerMealView: React.FC<{
    isFinalized: boolean;
    onFinalize: () => void;
    setIsEditingMember: (name: string | null) => void;
    memberList: MemberMealData[];
    khataId: string;
}> = ({ isFinalized, onFinalize, setIsEditingMember, memberList, khataId }) => {
    const totalQuantities = memberList.reduce((acc, m) => acc + m.meals.breakfast + m.meals.lunch + m.meals.dinner, 0);
    const totalBreakfast = memberList.reduce((acc, m) => acc + m.meals.breakfast, 0);
    const totalLunch = memberList.reduce((acc, m) => acc + m.meals.lunch, 0);
    const totalDinner = memberList.reduce((acc, m) => acc + m.meals.dinner, 0);
    const estimatedCost = totalQuantities * COST_PER_QUANTITY;

    return (
        <div className="space-y-6">
            {/* Enhanced Status Card with Statistics */}
            <div className="bg-card rounded-2xl shadow-xl border border-border/50 overflow-hidden">
                {/* Gradient Header */}
                <div className="bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 p-6 sm:p-8 text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent"></div>
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
                    <div className="relative z-10">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                    </svg>
                                    <h3 className="text-2xl sm:text-3xl font-bold">
                                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                    </h3>
                                </div>
                                <p className="text-primary-100 text-sm sm:text-base">Meal management dashboard</p>
                            </div>
                            <div className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 backdrop-blur-sm ${isFinalized
                                ? 'bg-green-400/20 text-white border-2 border-green-300/30'
                                : 'bg-yellow-400/20 text-white border-2 border-yellow-300/30'
                                }`}>
                                <span className={`w-2.5 h-2.5 rounded-full ${isFinalized ? 'bg-green-300' : 'bg-yellow-300 animate-pulse'}`}></span>
                                {isFinalized ? 'Finalized' : 'Accepting Meals'}
                            </div>
                        </div>

                        {/* Statistics Mini Cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/20">
                                <div className="text-white/70 text-xs font-semibold uppercase tracking-wide mb-1">Total Meals</div>
                                <div className="text-2xl sm:text-3xl font-bold tabular-nums">{totalQuantities}</div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/20">
                                <div className="text-white/70 text-xs font-semibold uppercase tracking-wide mb-1 flex items-center gap-1">
                                    <span className="text-base">🌅</span> Breakfast
                                </div>
                                <div className="text-2xl sm:text-3xl font-bold tabular-nums">{totalBreakfast}</div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/20">
                                <div className="text-white/70 text-xs font-semibold uppercase tracking-wide mb-1 flex items-center gap-1">
                                    <span className="text-base">🌞</span> Lunch
                                </div>
                                <div className="text-2xl sm:text-3xl font-bold tabular-nums">{totalLunch}</div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/20">
                                <div className="text-white/70 text-xs font-semibold uppercase tracking-wide mb-1 flex items-center gap-1">
                                    <span className="text-base">🌙</span> Dinner
                                </div>
                                <div className="text-2xl sm:text-3xl font-bold tabular-nums">{totalDinner}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Section */}
                {!isFinalized && (
                    <div className="p-6 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900/30 border-t border-border/50">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <p className="text-sm font-semibold text-muted-foreground mb-1">Ready to finalize?</p>
                                <p className="text-xs text-muted-foreground">This will lock meal counts for all members</p>
                            </div>
                            <button
                                onClick={onFinalize}
                                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white font-bold rounded-xl shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                </svg>
                                <span>Finalize Today's Meals</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Member Meal Cards */}
            <div>
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <span className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-xl flex items-center justify-center text-lg shadow-lg shadow-primary-500/20">
                            👥
                        </span>
                        Member Overview
                    </h3>
                    <div className="px-3 py-1.5 bg-muted rounded-lg text-xs font-semibold text-muted-foreground">
                        {memberList.length} {memberList.length === 1 ? 'member' : 'members'}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {memberList.map(member => {
                        const total = member.meals.breakfast + member.meals.lunch + member.meals.dinner;
                        return (
                            <div
                                key={member.id}
                                className="group relative bg-gradient-to-br from-card to-slate-50 dark:to-slate-900/50 hover:from-white hover:to-slate-50 dark:hover:from-slate-800 dark:hover:to-slate-800/80 rounded-2xl border-2 border-slate-200/60 dark:border-slate-700/60 hover:border-primary-300 dark:hover:border-primary-700 p-5 sm:p-6 transition-all duration-300 hover:shadow-xl hover:shadow-primary-500/10 hover:-translate-y-1"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <h4 className="font-bold text-base sm:text-lg text-foreground group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors mb-1">
                                            {member.name}
                                        </h4>
                                        {total > 0 ? (
                                            <p className="text-xs sm:text-sm font-semibold flex items-center gap-1.5">
                                                <span className="text-green-600 dark:text-green-400">{total} meals</span>
                                                <span className="text-muted-foreground">•</span>
                                                <span className="text-muted-foreground">৳{(total * COST_PER_QUANTITY).toFixed(0)}</span>
                                            </p>
                                        ) : (
                                            <p className="text-xs sm:text-sm font-medium text-slate-400">No meals added</p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setIsEditingMember(member.name)}
                                        className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-primary-600 dark:hover:bg-primary-600 rounded-lg transition-all shadow-sm hover:shadow-md flex items-center gap-1.5"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Edit
                                    </button>
                                </div>

                                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                                    <div className="flex flex-col items-center bg-white dark:bg-slate-900/70 p-3 rounded-xl border border-slate-200 dark:border-slate-800 group-hover:border-orange-200 dark:group-hover:border-orange-900/50 transition-colors">
                                        <span className="text-xl sm:text-2xl mb-1 transition-all group-hover:scale-110">🌅</span>
                                        <span className="text-lg sm:text-xl font-bold text-slate-700 dark:text-slate-200 tabular-nums">{member.meals.breakfast}</span>
                                        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">Brkfst</span>
                                    </div>
                                    <div className="flex flex-col items-center bg-white dark:bg-slate-900/70 p-3 rounded-xl border border-slate-200 dark:border-slate-800 group-hover:border-yellow-200 dark:group-hover:border-yellow-900/50 transition-colors">
                                        <span className="text-xl sm:text-2xl mb-1 transition-all group-hover:scale-110">🌞</span>
                                        <span className="text-lg sm:text-xl font-bold text-slate-700 dark:text-slate-200 tabular-nums">{member.meals.lunch}</span>
                                        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">Lunch</span>
                                    </div>
                                    <div className="flex flex-col items-center bg-white dark:bg-slate-900/70 p-3 rounded-xl border border-slate-200 dark:border-slate-800 group-hover:border-blue-200 dark:group-hover:border-blue-900/50 transition-colors">
                                        <span className="text-xl sm:text-2xl mb-1 transition-all group-hover:scale-110">🌙</span>
                                        <span className="text-lg sm:text-xl font-bold text-slate-700 dark:text-slate-200 tabular-nums">{member.meals.dinner}</span>
                                        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">Dinner</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Lazy-loaded Global History List for Managers */}
            <LazyHistoryList khataId={khataId} title="Room Activity Log" />
        </div>
    );
};

export default function MealManagementPage() {
    const { user, loading: authLoading } = useAuth();
    const { addToast } = useNotifications();
    const [isFinalized, setIsFinalized] = useState(false);
    const [memberMeals, setMemberMeals] = useState<MealSet>({ breakfast: 0, lunch: 0, dinner: 0 });
    const [isEditingMember, setIsEditingMember] = useState<string | null>(null);
    const [managerMealList, setManagerMealList] = useState<MemberMealData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMeals = async () => {
            if (!user?.khataId) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);

                const now = new Date();
                const startOfDayUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
                const endOfDayUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999));

                const todayStr = startOfDayUTC.toISOString();
                const endOfDayStr = endOfDayUTC.toISOString();

                // Fetch all required data in parallel - NO history fetch on initial load
                const [meals, finalizationStatus, members] = await Promise.all([
                    api.getMeals(user.khataId, todayStr, endOfDayStr),
                    api.getFinalizationStatus(user.khataId, todayStr),
                    (user.role === Role.Manager || user.role === Role.MasterManager) ? api.getMembersForRoom(user.khataId) : Promise.resolve([])
                ]);

                setIsFinalized(finalizationStatus.isFinalized);

                if (user.role === Role.Manager || user.role === Role.MasterManager) {
                    const mealList = members.map(member => {
                        const memberMeal = meals.find(m => {
                            const mealUserId = typeof m.userId === 'object' ? m.userId._id : m.userId;
                            return mealUserId === member.id;
                        });
                        return {
                            id: member.id,
                            name: member.name,
                            meals: {
                                breakfast: memberMeal?.breakfast || 0,
                                lunch: memberMeal?.lunch || 0,
                                dinner: memberMeal?.dinner || 0
                            }
                        };
                    });
                    setManagerMealList(mealList);
                } else {
                    const myMeal = meals.find(m => {
                        const mealUserId = typeof m.userId === 'object' ? m.userId._id : m.userId;
                        return mealUserId === user.id;
                    });
                    setMemberMeals(myMeal ? {
                        breakfast: myMeal.breakfast ?? 0,
                        lunch: myMeal.lunch ?? 0,
                        dinner: myMeal.dinner ?? 0
                    } : { breakfast: 0, lunch: 0, dinner: 0 });
                }
            } catch (error) {
                console.error('Error fetching meals:', error);
                addToast({ type: 'error', title: 'Error', message: 'Failed to load meal data' });
            } finally {
                setLoading(false);
            }
        };

        if (!authLoading && user) {
            fetchMeals();
        }
    }, [user?.khataId, user?.role, user?.id, authLoading]);

    const handleFinalize = async () => {
        if (!user?.khataId) return;

        try {
            const now = new Date();
            const todayUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

            const success = await api.finalizeMeals(user.khataId, todayUTC.toISOString());
            if (success) {
                setIsFinalized(true);
                addToast({ type: 'success', title: 'Meals Finalized', message: "Today's meal counts are now locked." });
            } else {
                addToast({ type: 'error', title: 'Error', message: 'Failed to finalize meals' });
            }
        } catch (error) {
            console.error('Error finalizing meals:', error);
            addToast({ type: 'error', title: 'Error', message: 'Failed to finalize meals' });
        }
    };

    const handleManagerEditSubmit = async (editData: { memberName: string; newMeals: MealSet }) => {
        const { memberName, newMeals } = editData;
        if (!user?.khataId) return;

        const member = managerMealList.find(m => m.name === memberName);
        if (!member) return;

        try {
            const now = new Date();
            const todayUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

            await api.submitMeal(user.khataId, {
                date: todayUTC.toISOString(),
                breakfast: newMeals.breakfast,
                lunch: newMeals.lunch,
                dinner: newMeals.dinner,
                userId: member.id,
                userName: member.name
            });

            setManagerMealList(prevList =>
                prevList.map(m =>
                    m.id === member.id ? { ...m, meals: newMeals } : m
                )
            );

            addToast({ type: 'success', title: 'Meals Updated', message: `${memberName}'s meals have been updated.` });
        } catch (error) {
            console.error('Error updating meal:', error);
            addToast({ type: 'error', title: 'Error', message: 'Failed to update meal' });
        }

        setIsEditingMember(null);
    };

    const [saving, setSaving] = useState(false);

    const handleSaveChanges = async () => {
        if (!user?.khataId) return;

        try {
            setSaving(true);
            const now = new Date();
            const todayUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

            await api.submitMeal(user.khataId, {
                date: todayUTC.toISOString(),
                breakfast: memberMeals.breakfast,
                lunch: memberMeals.lunch,
                dinner: memberMeals.dinner
            });

            addToast({ type: 'success', title: 'Meals Updated', message: 'Your meal plan for today has been saved.' });
        } catch (error) {
            console.error('Error saving meal:', error);
            addToast({ type: 'error', title: 'Error', message: 'Failed to save meal' });
        } finally {
            setSaving(false);
        }
    };

    // Show skeleton while auth or data is loading
    if (authLoading || loading) {
        return <MealPageSkeleton />;
    }

    if (!user) return null;

    return (
        <>
            <AppLayout>
                <div className="space-y-6">
                    {/* Enhanced Page Header */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-primary-500/10 via-primary-400/5 to-transparent dark:from-primary-900/20 dark:via-primary-800/10 rounded-2xl p-6 sm:p-8 border border-primary-200/30 dark:border-primary-800/30">
                        <div className="absolute inset-0 bg-gradient-to-r from-white/40 to-transparent dark:from-white/5 dark:to-transparent"></div>
                        <div className="relative z-10 flex items-center gap-4">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30 animate-pulse">
                                <MealIcon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">Meal Management</h1>
                                <p className="text-sm sm:text-base text-muted-foreground mt-1">Track and manage daily meal counts</p>
                            </div>
                        </div>
                    </div>

                    {(user.role === Role.Manager || user.role === Role.MasterManager) ? (
                        <ManagerMealView
                            isFinalized={isFinalized}
                            onFinalize={handleFinalize}
                            setIsEditingMember={setIsEditingMember}
                            memberList={managerMealList}
                            khataId={user.khataId || ''}
                        />
                    ) : (
                        <MemberMealView
                            isFinalized={isFinalized}
                            meals={memberMeals}
                            setMeals={setMemberMeals}
                            onSaveChanges={handleSaveChanges}
                            saving={saving}
                            khataId={user.khataId || ''}
                            userId={user.id}
                            userName={user.name || ''}
                        />
                    )}
                </div>
            </AppLayout>

            {(user.role === Role.Manager || user.role === Role.MasterManager) && isEditingMember && (
                <ManagerEditModal
                    member={managerMealList.find(m => m.name === isEditingMember)!}
                    onClose={() => setIsEditingMember(null)}
                    onSubmit={handleManagerEditSubmit}
                    isFinalized={isFinalized}
                    khataId={user.khataId || ''}
                />
            )}
        </>
    );
}
