"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Role } from '@/types';
import { MealIcon, XIcon } from '@/components/Icons';
import { useNotifications } from '@/contexts/NotificationContext';
import { api } from '@/services/api';
import AppLayout from '@/components/AppLayout';
import ToastContainer from '@/components/ToastContainer';

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

const MealQuantitySelector: React.FC<{
    meal: 'breakfast' | 'lunch' | 'dinner';
    label: string;
    icon: string;
    value: number;
    onChange: (value: number) => void;
    disabled: boolean;
}> = ({ meal, label, icon, value, onChange, disabled }) => (
    <div className="flex items-center justify-between py-1">
        <label className="font-medium text-gray-700 dark:text-gray-300 text-sm sm:text-base">{icon} {label}</label>
        <div className="flex items-center gap-3 sm:gap-4">
            <button
                onClick={() => onChange(Math.max(0, value - 0.5))}
                disabled={disabled}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 font-bold text-lg sm:text-xl disabled:opacity-50 flex items-center justify-center transition-colors"
            >−</button>
            <span className="w-8 sm:w-12 text-center font-bold text-lg sm:text-xl text-gray-900 dark:text-white">{value}</span>
            <button
                onClick={() => onChange(value + 0.5)}
                disabled={disabled}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 font-bold text-lg sm:text-xl disabled:opacity-50 flex items-center justify-center transition-colors"
            >+</button>
        </div>
    </div>
);

const ManagerEditModal: React.FC<{
    memberName: string;
    memberList: MemberMealData[];
    onClose: () => void;
    onSubmit: (edit: { memberName: string; newMeals: MealSet }) => void;
    isFinalized: boolean;
}> = ({ memberName, memberList, onClose, onSubmit, isFinalized }) => {
    const originalMemberData = useMemo(() => memberList.find(m => m.name === memberName), [memberName, memberList]);
    const originalMeals = useMemo(() => originalMemberData?.meals || { breakfast: 0, lunch: 0, dinner: 0 }, [originalMemberData]);
    const [meals, setMeals] = useState<MealSet>(originalMeals);

    const handleSubmit = () => {
        onSubmit({ memberName, newMeals: meals });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Edit Meal - {memberName}</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><XIcon className="w-5 h-5" /></button>
                </div>
                <div className="border-t my-4 border-gray-200 dark:border-gray-700"></div>

                <div className="space-y-4">
                    {isFinalized && <p className="p-2 text-sm text-yellow-800 bg-yellow-100 dark:text-yellow-200 dark:bg-yellow-900/50 rounded-md text-center">⚠️ Already finalized. Changes will update records.</p>}
                    <MealQuantitySelector meal="breakfast" icon="🌅" label="Breakfast" value={meals.breakfast} onChange={(v) => setMeals(p => ({ ...p, breakfast: v }))} disabled={false} />
                    <MealQuantitySelector meal="lunch" icon="🌞" label="Lunch" value={meals.lunch} onChange={(v) => setMeals(p => ({ ...p, lunch: v }))} disabled={false} />
                    <MealQuantitySelector meal="dinner" icon="🌙" label="Dinner" value={meals.dinner} onChange={(v) => setMeals(p => ({ ...p, dinner: v }))} disabled={false} />
                </div>

                <div className="flex gap-3 mt-6">
                    <button onClick={onClose} className="flex-1 py-2.5 bg-gray-200 dark:bg-gray-600 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">Cancel</button>
                    <button onClick={handleSubmit} className="flex-1 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-600 transition-colors">Save Changes</button>
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
}> = ({ isFinalized, meals, setMeals, onSaveChanges }) => {
    const totalQty = meals.breakfast + meals.lunch + meals.dinner;

    return (
        <div className="space-y-6 pb-32">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Today's Meal Count</h3>
                {isFinalized ? (
                    <div className="space-y-3">
                        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg mb-4">
                            <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">🔒 Finalized by Manager - No changes allowed</p>
                        </div>
                        <div className="space-y-2 text-gray-700 dark:text-gray-200">
                            <p className="flex justify-between"><span>🌅 Breakfast:</span> <span className="font-bold">{meals.breakfast}</span></p>
                            <p className="flex justify-between"><span>🌞 Lunch:</span> <span className="font-bold">{meals.lunch}</span></p>
                            <p className="flex justify-between"><span>🌙 Dinner:</span> <span className="font-bold">{meals.dinner}</span></p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <MealQuantitySelector meal="breakfast" icon="🌅" label="Breakfast" value={meals.breakfast} onChange={(v) => setMeals(prev => ({ ...prev, breakfast: v }))} disabled={false} />
                        <MealQuantitySelector meal="lunch" icon="🌞" label="Lunch" value={meals.lunch} onChange={(v) => setMeals(prev => ({ ...prev, lunch: v }))} disabled={false} />
                        <MealQuantitySelector meal="dinner" icon="🌙" label="Dinner" value={meals.dinner} onChange={(v) => setMeals(prev => ({ ...prev, dinner: v }))} disabled={false} />
                    </div>
                )}
            </div>

            {/* Sticky Bottom Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-gray-700 dark:bg-gray-900 text-white p-4 shadow-lg z-40 pb-6 sm:pb-4">
                <div className="max-w-4xl mx-auto text-center space-y-2">
                    <p className="text-base sm:text-lg font-semibold">Total Today: {totalQty} quantities</p>
                    <button
                        onClick={onSaveChanges}
                        disabled={isFinalized}
                        className="w-full max-w-md mx-auto py-3 sm:py-2.5 bg-white text-gray-900 font-bold rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

const ManagerMealView: React.FC<{
    isFinalized: boolean;
    onFinalize: () => void;
    setIsEditingMember: (name: string | null) => void;
    memberList: MemberMealData[];
}> = ({ isFinalized, onFinalize, setIsEditingMember, memberList }) => {
    const totalQuantities = memberList.reduce((acc, m) => acc + m.meals.breakfast + m.meals.lunch + m.meals.dinner, 0);

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold mb-2">📅 Today - {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</h3>
                <div className="border-t border-gray-200 dark:border-gray-700 my-3"></div>
                <p className={`font-semibold ${isFinalized ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                    {isFinalized ? '✅ Status: Finalized' : '⏰ Status: Not Finalized'}
                </p>
                {!isFinalized && (
                    <>
                        <button onClick={onFinalize} className="mt-3 w-full py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-600">📋 Finalize Today's Meals</button>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">(After this, members can't change)</p>
                    </>
                )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold mb-2">📊 Today's Meal List</h3>
                <div className="border-t border-gray-200 dark:border-gray-700 my-3"></div>
                <div className="space-y-3">
                    {memberList.map(member => {
                        const total = member.meals.breakfast + member.meals.lunch + member.meals.dinner;
                        return (
                            <div key={member.id} className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <div className="flex justify-between items-start mb-2">
                                    <p className="font-bold text-gray-800 dark:text-white text-base sm:text-lg">{member.name}</p>
                                    <button
                                        onClick={() => setIsEditingMember(member.name)}
                                        className="text-xs sm:text-sm font-semibold text-primary hover:underline px-2 py-1 bg-white dark:bg-gray-600 rounded shadow-sm"
                                    >
                                        Edit
                                    </button>
                                </div>
                                <div className="text-xs sm:text-sm mt-1 text-gray-600 dark:text-gray-300 grid grid-cols-3 gap-2">
                                    <div className="bg-white dark:bg-gray-600 p-2 rounded text-center">
                                        <div className="font-bold">{member.meals.breakfast}</div>
                                        <div className="text-[10px] uppercase text-gray-400 dark:text-gray-400">Brk</div>
                                    </div>
                                    <div className="bg-white dark:bg-gray-600 p-2 rounded text-center">
                                        <div className="font-bold">{member.meals.lunch}</div>
                                        <div className="text-[10px] uppercase text-gray-400 dark:text-gray-400">Lun</div>
                                    </div>
                                    <div className="bg-white dark:bg-gray-600 p-2 rounded text-center">
                                        <div className="font-bold">{member.meals.dinner}</div>
                                        <div className="text-[10px] uppercase text-gray-400 dark:text-gray-400">Din</div>
                                    </div>
                                </div>
                                <div className="border-t border-gray-200 dark:border-gray-600 my-2"></div>
                                <div className="flex justify-between items-center">
                                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total Quantities</p>
                                    <p className="font-bold text-lg text-primary-600 dark:text-primary-400">{total}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 my-3"></div>
                <div className="text-center font-semibold">
                    <p>Total Today: {totalQuantities} quantities</p>
                </div>
            </div>
        </div>
    );
};

export default function MealManagementPage() {
    const { user } = useAuth();
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
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const todayStr = today.toISOString();

                const meals = await api.getMeals(user.khataId, todayStr, todayStr);
                const finalizationStatus = await api.getFinalizationStatus(user.khataId, todayStr);
                setIsFinalized(finalizationStatus.isFinalized);

                if (user.role === Role.Manager) {
                    const members = await api.getMembersForRoom(user.khataId);
                    const mealList = members.map(member => {
                        const memberMeal = meals.find(m => m.userId === member.id);
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
                    const myMeal = meals.find(m => m.userId === user.id);
                    setMemberMeals(myMeal ? {
                        breakfast: myMeal.breakfast,
                        lunch: myMeal.lunch,
                        dinner: myMeal.dinner
                    } : { breakfast: 0, lunch: 0, dinner: 0 });
                }
            } catch (error) {
                console.error('Error fetching meals:', error);
                addToast({ type: 'error', title: 'Error', message: 'Failed to load meal data' });
            } finally {
                setLoading(false);
            }
        };

        fetchMeals();
    }, [user?.khataId, user?.role, user?.id]);

    const handleFinalize = async () => {
        if (!user?.khataId) return;

        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const success = await api.finalizeMeals(user.khataId, today.toISOString());
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
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            await api.submitMeal(user.khataId, {
                date: today.toISOString(),
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

    const handleSaveChanges = async () => {
        if (!user?.khataId) return;

        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            await api.submitMeal(user.khataId, {
                date: today.toISOString(),
                breakfast: memberMeals.breakfast,
                lunch: memberMeals.lunch,
                dinner: memberMeals.dinner
            });

            addToast({ type: 'success', title: 'Meals Updated', message: 'Your meal plan for today has been saved.' });
        } catch (error) {
            console.error('Error saving meal:', error);
            addToast({ type: 'error', title: 'Error', message: 'Failed to save meal' });
        }
    };

    if (loading) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary-500"></div>
                </div>
            </AppLayout>
        );
    }

    if (!user) return null;

    return (
        <>
            <AppLayout>
                <div className="space-y-6 animate-fade-in">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <MealIcon className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Meal Management</h1>
                    </div>

                    {user.role === Role.Manager ? (
                        <ManagerMealView
                            isFinalized={isFinalized}
                            onFinalize={handleFinalize}
                            setIsEditingMember={setIsEditingMember}
                            memberList={managerMealList}
                        />
                    ) : (
                        <MemberMealView
                            isFinalized={isFinalized}
                            meals={memberMeals}
                            setMeals={setMemberMeals}
                            onSaveChanges={handleSaveChanges}
                        />
                    )}
                </div>
            </AppLayout>

            {user.role === Role.Manager && isEditingMember && (
                <ManagerEditModal
                    memberName={isEditingMember}
                    memberList={managerMealList}
                    onClose={() => setIsEditingMember(null)}
                    onSubmit={handleManagerEditSubmit}
                    isFinalized={isFinalized}
                />
            )}

            <ToastContainer />
        </>
    );
}
