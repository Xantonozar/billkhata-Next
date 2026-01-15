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
    <div className="flex items-center justify-between py-1">
        <label className="font-medium text-foreground text-sm sm:text-base">{icon} {label}</label>
        <div className="flex items-center gap-3 sm:gap-4">
            <button
                onClick={() => onChange(Math.max(0, value - 0.5))}
                disabled={disabled}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-muted hover:bg-muted/80 font-bold text-lg sm:text-xl disabled:opacity-50 flex items-center justify-center transition-colors"
            >−</button>
            <span className="w-8 sm:w-12 text-center font-bold text-lg sm:text-xl text-foreground">{value}</span>
            <button
                onClick={() => onChange(value + 0.5)}
                disabled={disabled}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-muted hover:bg-muted/80 font-bold text-lg sm:text-xl disabled:opacity-50 flex items-center justify-center transition-colors"
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
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in p-4">
            <div className="bg-card rounded-xl shadow-2xl p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-card-foreground">Edit Meal - {member.name}</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-muted"><XIcon className="w-5 h-5" /></button>
                </div>
                <div className="border-t my-4 border-border"></div>

                <div className="space-y-4">
                    {isFinalized && <p className="p-2 text-sm text-yellow-800 bg-yellow-100 dark:text-yellow-200 dark:bg-yellow-900/50 rounded-md text-center">⚠️ Already finalized. Changes will update records.</p>}
                    <MealQuantitySelector meal="breakfast" icon="🌅" label="Breakfast" value={meals.breakfast} onChange={(v) => setMeals(p => ({ ...p, breakfast: v }))} disabled={false} />
                    <MealQuantitySelector meal="lunch" icon="🌞" label="Lunch" value={meals.lunch} onChange={(v) => setMeals(p => ({ ...p, lunch: v }))} disabled={false} />
                    <MealQuantitySelector meal="dinner" icon="🌙" label="Dinner" value={meals.dinner} onChange={(v) => setMeals(p => ({ ...p, dinner: v }))} disabled={false} />
                </div>

                <div className="flex gap-3 mt-6">
                    <button onClick={onClose} className="flex-1 py-2.5 bg-muted font-semibold rounded-lg hover:bg-muted/80 transition-colors">Cancel</button>
                    <button onClick={handleSubmit} className="flex-1 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-600 transition-colors">Save Changes</button>
                </div>

                {/* Lazy load history in modal */}
                <LazyHistoryList khataId={khataId} userId={member.id} title={`${member.name}'s History`} />
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

    return (
        <div className="space-y-6">
            {/* Meal Input Card */}
            <div className="bg-card rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Today's Meal Count</h3>
                {isFinalized ? (
                    <div className="space-y-3">
                        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg mb-4">
                            <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">🔒 Finalized by Manager - No changes allowed</p>
                        </div>
                        <div className="space-y-2 text-foreground">
                            <p className="flex justify-between"><span>🌅 Breakfast:</span> <span className="font-bold">{meals.breakfast}</span></p>
                            <p className="flex justify-between"><span>🌞 Lunch:</span> <span className="font-bold">{meals.lunch}</span></p>
                            <p className="flex justify-between"><span>🌙 Dinner:</span> <span className="font-bold">{meals.dinner}</span></p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <MealQuantitySelector meal="breakfast" icon="🌅" label="Breakfast" value={meals.breakfast} onChange={(v) => setMeals(prev => ({ ...prev, breakfast: v }))} disabled={saving} />
                        <MealQuantitySelector meal="lunch" icon="🌞" label="Lunch" value={meals.lunch} onChange={(v) => setMeals(prev => ({ ...prev, lunch: v }))} disabled={saving} />
                        <MealQuantitySelector meal="dinner" icon="🌙" label="Dinner" value={meals.dinner} onChange={(v) => setMeals(prev => ({ ...prev, dinner: v }))} disabled={saving} />
                    </div>
                )}

                {/* Inline Save Section */}
                <div className="mt-6 pt-4 border-t border-border">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground">
                                <span className="sm:hidden">Meals</span>
                                <span className="hidden sm:inline">Total Meals</span>
                            </span>
                            <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">{totalQty}</span>
                        </div>
                        <button
                            onClick={onSaveChanges}
                            disabled={isFinalized || saving}
                            className={`px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-bold rounded-xl shadow-lg shadow-primary-500/30 active:scale-95 transition-all flex items-center gap-2 ${saving || isFinalized ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-primary-500/50'}`}
                        >
                            {saving ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <>
                                    <span>
                                        <span className="sm:hidden">Save</span>
                                        <span className="hidden sm:inline">Save Changes</span>
                                    </span>
                                    <ChevronRightIcon className="w-5 h-5" />
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

    return (
        <div className="space-y-6">
            <div className="bg-card rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold mb-2">📅 Today - {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</h3>
                <div className="border-t border-border my-3"></div>
                <p className={`font-semibold ${isFinalized ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                    {isFinalized ? '✅ Status: Finalized' : '⏰ Status: Not Finalized'}
                </p>
                {!isFinalized && (
                    <>
                        <button onClick={onFinalize} className="mt-3 w-full py-2.5 bg-primary text-green-900 dark:text-green-200 font-semibold rounded-lg hover:bg-primary-600">📋 Finalize Today's Meals</button>
                        <p className="text-xs text-muted-foreground mt-1 text-center">(After this, members can't change)</p>
                    </>
                )}
            </div>

            <div className="bg-card rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold mb-2">📊 Today's Meal List</h3>
                <div className="border-t border-border my-3"></div>
                <div className="space-y-3">
                    {memberList.map(member => {
                        const total = member.meals.breakfast + member.meals.lunch + member.meals.dinner;
                        return (
                            <div key={member.id} className="p-3 sm:p-4 bg-muted rounded-lg">
                                <div className="flex justify-between items-start mb-2">
                                    <p className="font-bold text-foreground text-base sm:text-lg">{member.name}</p>
                                    <button
                                        onClick={() => setIsEditingMember(member.name)}
                                        className="text-xs sm:text-sm font-semibold text-primary hover:underline px-2 py-1 bg-background rounded shadow-sm"
                                    >
                                        Edit
                                    </button>
                                </div>
                                <div className="text-xs sm:text-sm mt-1 text-muted-foreground grid grid-cols-3 gap-2">
                                    <div className="bg-background p-2 rounded text-center">
                                        <div className="font-bold">{member.meals.breakfast}</div>
                                        <div className="text-[10px] uppercase text-muted-foreground">Brk</div>
                                    </div>
                                    <div className="bg-background p-2 rounded text-center">
                                        <div className="font-bold">{member.meals.lunch}</div>
                                        <div className="text-[10px] uppercase text-muted-foreground">Lun</div>
                                    </div>
                                    <div className="bg-background p-2 rounded text-center">
                                        <div className="font-bold">{member.meals.dinner}</div>
                                        <div className="text-[10px] uppercase text-muted-foreground">Din</div>
                                    </div>
                                </div>
                                <div className="border-t border-border my-2"></div>
                                <div className="flex justify-between items-center">
                                    <p className="text-sm font-semibold text-muted-foreground">Total Quantities</p>
                                    <p className="font-bold text-lg text-primary-600 dark:text-primary-400">{total}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="border-t border-border my-3"></div>
                <div className="text-center font-semibold">
                    <p>Total Today: {totalQuantities} quantities</p>
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
                    user.role === Role.Manager ? api.getMembersForRoom(user.khataId) : Promise.resolve([])
                ]);

                setIsFinalized(finalizationStatus.isFinalized);

                if (user.role === Role.Manager) {
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
                <div className="space-y-6 animate-fade-in">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <MealIcon className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Meal Management</h1>
                    </div>

                    {user.role === Role.Manager ? (
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

            {user.role === Role.Manager && isEditingMember && (
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
