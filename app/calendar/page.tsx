"use client";

import React, { useState, useMemo, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Role } from '@/types';
import { CalendarIcon, XIcon, PencilIcon, PlusIcon } from '@/components/Icons';
import { useNotifications } from '@/contexts/NotificationContext';
import { api } from '@/services/api';
import ToastContainer from '@/components/ToastContainer';

const COST_PER_QUANTITY = 45.50;

const getUserId = (userObj: any): string | null => {
    if (!userObj) return null;
    if (typeof userObj === 'string') return userObj;
    return userObj._id || userObj.id || null;
};

// --- MODALS ---

interface LogMealsModalProps {
    date: Date;
    onClose: () => void;
    onSubmit: (data: any) => void;
    initialData?: any;
}
const LogMealsModal: React.FC<LogMealsModalProps> = ({ date, onClose, onSubmit, initialData }) => {
    const [meals, setMeals] = useState({
        breakfast: initialData?.breakfast || 0,
        lunch: initialData?.lunch || 0,
        dinner: initialData?.dinner || 0
    });
    const [notes, setNotes] = useState('');
    const totalMeals = meals.breakfast + meals.lunch + meals.dinner;
    const totalCost = totalMeals * COST_PER_QUANTITY;

    const handleSubmit = () => {
        onSubmit({ date, meals, notes, totalMeals });
        onClose();
    };

    const MealRadioSelector: React.FC<{ label: string, icon: string, value: number, onChange: (val: number) => void }> = ({ label, icon, value, onChange }) => (
        <div>
            <label className="font-semibold text-sm sm:text-lg text-foreground mb-2 sm:mb-3 flex items-center gap-2">
                <span className="text-xl sm:text-2xl">{icon}</span>
                {label}
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-4 gap-1.5 sm:gap-2 mt-2">
                {[0, 0.25, 0.50, 0.75, 1.00, 1.25, 1.50, 2.00].map(q => (
                    <label
                        key={q}
                        className={`flex items-center justify-center gap-1 cursor-pointer px-1 py-2 sm:px-3 sm:py-3 rounded-lg sm:rounded-xl border-2 transition-all ${value === q
                            ? 'bg-gradient-to-br from-primary-500 to-primary-600 border-primary-500 text-white shadow shadow-primary-500/30'
                            : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-muted-foreground hover:border-primary-300 dark:hover:border-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/20'
                            }`}
                    >
                        <input
                            type="radio"
                            name={label}
                            value={q}
                            checked={value === q}
                            onChange={() => onChange(q)}
                            className="sr-only"
                        />
                        <span className="font-bold tabular-nums text-xs sm:text-sm">{q % 1 === 0 ? q : q.toFixed(2)}</span>
                    </label>
                ))}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 animate-fade-in p-0 sm:p-4" onClick={onClose}>
            <div className="bg-card rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto border-t-4 sm:border-t-0 border-primary-500" onClick={e => e.stopPropagation()}>
                {/* Gradient Header */}
                <div className="sticky top-0 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 p-6 text-white relative overflow-hidden z-10">
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent"></div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h2 className="text-xl sm:text-2xl font-bold">Log Your Meals</h2>
                                <p className="text-primary-100 text-sm mt-2">{date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-white/20 transition-colors"
                                aria-label="Close"
                            >
                                <XIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="space-y-6">
                        <MealRadioSelector label="Breakfast" icon="🌅" value={meals.breakfast} onChange={v => setMeals(p => ({ ...p, breakfast: v }))} />
                        <MealRadioSelector label="Lunch" icon="🌞" value={meals.lunch} onChange={v => setMeals(p => ({ ...p, lunch: v }))} />
                        <MealRadioSelector label="Dinner" icon="🌙" value={meals.dinner} onChange={v => setMeals(p => ({ ...p, dinner: v }))} />
                    </div>

                    {/* Summary Cards */}
                    <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-3 sm:p-4 border border-blue-100 dark:border-blue-800 flex items-center justify-between sm:block">
                                <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide block sm:mb-1">Total Meals</span>
                                <span className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">{totalMeals}</span>
                            </div>
                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-3 sm:p-4 border border-green-100 dark:border-green-800 flex items-center justify-between sm:block">
                                <span className="text-xs font-semibold text-green-700 dark:text-green-300 uppercase tracking-wide block sm:mb-1">Est. Cost</span>
                                <span className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400 tabular-nums">৳{totalCost.toFixed(0)}</span>
                            </div>
                        </div>
                        <p className="text-[10px] text-center text-muted-foreground">@ ৳{COST_PER_QUANTITY.toFixed(2)} per meal</p>
                    </div>

                    {/* Notes Input */}
                    <div className="mt-6">
                        <label className="block text-sm font-semibold text-muted-foreground mb-2">Notes (optional)</label>
                        <input
                            type="text"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Add any notes about your meals..."
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-primary-500 transition-colors text-foreground placeholder:text-muted-foreground"
                        />
                    </div>

                    {/* Floating Action Button Style Save */}
                    <button
                        onClick={handleSubmit}
                        className="w-full mt-6 py-4 sm:py-5 bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 text-white font-bold rounded-xl sm:rounded-2xl shadow-xl shadow-primary-500/30 hover:shadow-2xl hover:shadow-primary-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-base sm:text-lg"
                    >
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Save Entry</span>
                    </button>
                </div>
            </div>
        </div>
    );
};


interface ManageMealsModalProps {
    date: Date;
    onClose: () => void;
    mealsForDay: any[];
    onUpdate: (userId: string, meals: any) => Promise<void>;
    members: any[];
}

const ManageMealsModal: React.FC<ManageMealsModalProps> = ({ date, onClose, mealsForDay, onUpdate, members }) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<number>(0);
    const [editType, setEditType] = useState<'breakfast' | 'lunch' | 'dinner' | null>(null);
    const [loading, setLoading] = useState(false);

    // Adding new entry state
    const [isAddingMode, setIsAddingMode] = useState(false);
    const [newMealMemberId, setNewMealMemberId] = useState('');
    const [newMealData, setNewMealData] = useState({ breakfast: 0, lunch: 0, dinner: 0 });

    // Process data for the view
    const dayDetails = useMemo(() => {
        // We need all unique users who have ANY meal or are in the list
        const userMap = new Map();

        mealsForDay.forEach(m => {
            const uid = getUserId(m.userId);
            if (uid) {
                userMap.set(uid, {
                    userId: uid,
                    name: m.userName || (typeof m.userId === 'object' ? m.userId.name : 'Unknown Members'),
                    breakfast: m.breakfast || 0,
                    lunch: m.lunch || 0,
                    dinner: m.dinner || 0,
                    original: m
                });
            }
        });

        const users = Array.from(userMap.values());

        const breakfast = users.filter(u => u.breakfast > 0).map(u => ({ ...u, qty: u.breakfast, type: 'breakfast' }));
        const lunch = users.filter(u => u.lunch > 0).map(u => ({ ...u, qty: u.lunch, type: 'lunch' }));
        const dinner = users.filter(u => u.dinner > 0).map(u => ({ ...u, qty: u.dinner, type: 'dinner' }));

        const total = users.reduce((acc, curr) => acc + curr.breakfast + curr.lunch + curr.dinner, 0);

        return { total, breakfast, lunch, dinner, userMap };
    }, [mealsForDay]);

    const handleEditClick = (item: any, type: 'breakfast' | 'lunch' | 'dinner') => {
        setEditingId(item.userId);
        setEditType(type);
        setEditValue(item.qty);
        setIsAddingMode(false);
    };

    const handleSave = async (userId: string, original: any) => {
        if (!editType) return;
        setLoading(true);
        try {
            const updatedMeals = {
                breakfast: original.breakfast || 0,
                lunch: original.lunch || 0,
                dinner: original.dinner || 0,
                [editType]: editValue
            };

            await onUpdate(userId, updatedMeals);
            setEditingId(null);
            setEditType(null);
        } catch (error) {
            console.error("Failed to update", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddNewMeal = async () => {
        if (!newMealMemberId) return;
        setLoading(true);
        try {
            await onUpdate(newMealMemberId, newMealData);
            setIsAddingMode(false);
            setNewMealData({ breakfast: 0, lunch: 0, dinner: 0 });
            setNewMealMemberId('');
        } catch (error) {
            console.error("Failed to add meal", error);
        } finally {
            setLoading(false);
        }
    }

    const MealTable: React.FC<{ title: string, data: any[], type: 'breakfast' | 'lunch' | 'dinner' }> = ({ title, data, type }) => (
        <div>
            <h3 className="font-bold text-base sm:text-lg mb-3 text-foreground flex items-center gap-2">
                <span className="text-xl">{title}</span>
                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-semibold text-muted-foreground">{data.length}</span>
            </h3>
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                <div className="grid grid-cols-[1.5fr,1fr,1.3fr] sm:grid-cols-3 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-800/50 p-2 sm:p-3 font-bold text-[10px] sm:text-sm text-slate-700 dark:text-slate-300">
                    <div className="px-1">Member</div>
                    <div className="text-center">Qty</div>
                    <div className="text-right px-1">Action</div>
                </div>
                {data.length === 0 ? (
                    <div className="p-6 text-center">
                        <div className="text-slate-300 dark:text-slate-700 text-4xl mb-2">🍽️</div>
                        <p className="text-muted-foreground text-sm font-medium">No meals recorded</p>
                    </div>
                ) : (
                    data.map((member, idx) => (
                        <div key={`${member.userId}-${idx}`} className="grid grid-cols-[1.5fr,1fr,1.3fr] sm:grid-cols-3 p-2 sm:p-3 border-t border-slate-200 dark:border-slate-700 items-center text-foreground bg-white dark:bg-slate-900/30 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <div className="font-medium text-xs sm:text-sm truncate px-1" title={member.name}>{member.name}</div>
                            <div className="text-center">
                                {editingId === member.userId && editType === type ? (
                                    <div className="flex justify-center">
                                        <select
                                            value={editValue}
                                            onChange={e => setEditValue(parseFloat(e.target.value))}
                                            className="px-2 py-1.5 rounded-lg border-2 border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-sm w-20 font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            onClick={e => e.stopPropagation()}
                                        >
                                            {[0, 0.25, 0.50, 0.75, 1.00, 1.25, 1.50, 2.00, 2.50, 3.00].map(val => (
                                                <option key={val} value={val}>{val.toFixed(2)}</option>
                                            ))}
                                        </select>
                                    </div>
                                ) : (
                                    <span className="font-bold tabular-nums text-slate-700 dark:text-slate-200">{member.qty.toFixed(2)}</span>
                                )}
                            </div>
                            <div className="text-right">
                                {editingId === member.userId && editType === type ? (
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setEditingId(null); }}
                                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                            disabled={loading}
                                        >
                                            <XIcon className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleSave(member.userId, member.original); }}
                                            className="px-3 py-1.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-xs font-bold rounded-lg transition-all shadow-sm"
                                            disabled={loading}
                                        >
                                            {loading ? 'Saving...' : 'Save'}
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleEditClick(member, type); }}
                                        className="px-2 py-1.5 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors flex items-center justify-end gap-1 ml-auto font-semibold text-xs whitespace-nowrap"
                                    >
                                        <PencilIcon className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline">Edit</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 animate-fade-in p-0 sm:p-4" onClick={onClose}>
            <div className="bg-card rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto border-t-4 sm:border-t-0 border-primary-500" onClick={e => e.stopPropagation()}>
                {/* Gradient Header */}
                <div className="sticky top-0 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 p-6 text-white relative overflow-hidden z-10">
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent"></div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-xl sm:text-2xl font-bold">Manage Meals</h2>
                                <p className="text-primary-100 text-sm mt-2">{date.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric' })}</p>
                                <div className="mt-3 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-sm font-semibold">Total: {dayDetails.total} meals</span>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-white/20 transition-colors"
                                aria-label="Close"
                            >
                                <XIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Add New Meal Section */}
                    <div className="mb-6">
                        {!isAddingMode ? (
                            <button
                                onClick={() => setIsAddingMode(true)}
                                className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-muted-foreground hover:border-primary-400 dark:hover:border-primary-600 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all flex items-center justify-center gap-2 font-semibold"
                            >
                                <PlusIcon className="w-5 h-5" />
                                Add Member Meal
                            </button>
                        ) : (
                            <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900/30 p-5 rounded-2xl border-2 border-primary-200 dark:border-primary-800">
                                <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                                    <PlusIcon className="w-5 h-5 text-primary-600" />
                                    Add New Entry
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-muted-foreground uppercase mb-2 tracking-wide">Select Member</label>
                                        <select
                                            className="w-full p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-foreground font-medium focus:border-primary-500 focus:outline-none transition-colors"
                                            value={newMealMemberId}
                                            onChange={(e) => {
                                                const selectedId = e.target.value;
                                                setNewMealMemberId(selectedId);
                                                // If member already has data, prefill it
                                                if (dayDetails.userMap.has(selectedId)) {
                                                    const existing = dayDetails.userMap.get(selectedId);
                                                    setNewMealData({
                                                        breakfast: existing.breakfast,
                                                        lunch: existing.lunch,
                                                        dinner: existing.dinner
                                                    });
                                                } else {
                                                    setNewMealData({ breakfast: 0, lunch: 0, dinner: 0 });
                                                }
                                            }}
                                        >
                                            <option value="">-- Select Member --</option>
                                            {members.map(m => (
                                                <option key={m.id} value={m.id}>
                                                    {m.name} {dayDetails.userMap.has(m.id) ? '(Update)' : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-3">
                                        {[{ key: 'breakfast', icon: '🌅', label: 'Breakfast' }, { key: 'lunch', icon: '🌞', label: 'Lunch' }, { key: 'dinner', icon: '🌙', label: 'Dinner' }].map(({ key, icon, label }) => (
                                            <div key={key}>
                                                <label className="block text-xs font-bold text-muted-foreground uppercase mb-2 flex items-center gap-1">
                                                    <span className="text-sm">{icon}</span>
                                                    {label}
                                                </label>
                                                <select
                                                    className="w-full p-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-foreground text-sm font-bold tabular-nums focus:border-primary-500 focus:outline-none"
                                                    value={newMealData[key as keyof typeof newMealData]}
                                                    onChange={e => setNewMealData({ ...newMealData, [key]: parseFloat(e.target.value) })}
                                                >
                                                    {[0, 0.25, 0.50, 0.75, 1.00, 1.25, 1.50, 2.00, 2.50, 3.00].map(v => <option key={v} value={v}>{v.toFixed(2)}</option>)}
                                                </select>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <button
                                            onClick={() => setIsAddingMode(false)}
                                            className="flex-1 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleAddNewMeal}
                                            disabled={!newMealMemberId || loading}
                                            className="flex-1 py-2.5 text-sm font-bold bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl hover:from-primary-700 hover:to-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary-500/20"
                                        >
                                            {loading ? 'Saving...' : 'Save Entry'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        <MealTable title="🌅 Breakfast" data={dayDetails.breakfast} type="breakfast" />
                        <MealTable title="🌞 Lunch" data={dayDetails.lunch} type="lunch" />
                        <MealTable title="🌙 Dinner" data={dayDetails.dinner} type="dinner" />
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- MAIN PAGE ---
export default function CalendarPage() {
    const { user } = useAuth();
    const { addToast } = useNotifications();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [monthlyMeals, setMonthlyMeals] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [members, setMembers] = useState<any[]>([]);

    const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    const refreshMeals = async () => {
        if (!user?.khataId) return;
        try {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const startDate = new Date(year, month, 1);
            const endDate = new Date(year, month + 1, 0);
            const meals = await api.getMeals(user.khataId, startDate.toISOString(), endDate.toISOString());
            setMonthlyMeals(meals);
        } catch (e) {
            console.error("Failed to refresh meals", e);
        }
    };

    // Fetch meals and members in parallel for better performance
    useEffect(() => {
        const fetchCalendarData = async () => {
            if (!user?.khataId) return;

            setLoading(true);
            try {
                // Calculate start and end of the month
                const year = currentDate.getFullYear();
                const month = currentDate.getMonth();
                const startDate = new Date(year, month, 1);
                const endDate = new Date(year, month + 1, 0);

                const startStr = startDate.toISOString();
                const endStr = endDate.toISOString();

                // Fetch meals and members in parallel
                const isManager = user.role === Role.Manager || user.role === Role.MasterManager;
                const [meals, membersData] = await Promise.all([
                    api.getMeals(user.khataId, startStr, endStr),
                    isManager ? api.getMembersForRoom(user.khataId) : Promise.resolve([])
                ]);

                setMonthlyMeals(meals);
                if (isManager) {
                    setMembers(membersData);
                }
            } catch (error) {
                console.error("Failed to fetch calendar data", error);
                addToast({ type: 'error', title: 'Error', message: 'Failed to load calendar data' });
            } finally {
                setLoading(false);
            }
        };

        fetchCalendarData();
    }, [currentDate, user?.khataId, user?.role, addToast]);

    const formatDateForApi = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handleSubmitMealEntry = async (data: any) => {
        if (!user?.khataId) return;

        try {
            await api.submitMeal(user.khataId, {
                date: formatDateForApi(data.date),
                breakfast: data.meals.breakfast,
                lunch: data.meals.lunch,
                dinner: data.meals.dinner
            });

            addToast({ type: 'success', title: 'Entry Saved', message: 'Your meal entry has been updated.' });
            await refreshMeals();

        } catch (error) {
            console.error("Failed to save meal", error);
            addToast({ type: 'error', title: 'Error', message: 'Failed to save meal entry' });
        }
    };

    const handleManagerUpdateMeal = async (targetUserId: string, meals: any) => {
        if (!user?.khataId || !selectedDate) return;

        // Find existing meal for this user on this day to merge if we are only updating one field
        // But here 'meals' usually comes from the edit modal as specific field or full object
        // If it comes from 'Add New', it is full object.
        // If it comes from 'Edit Row', it is full object constructed in handleSave.
        // So we can just send it.

        try {
            await api.submitMeal(user.khataId, {
                date: formatDateForApi(selectedDate),
                userId: targetUserId,
                breakfast: meals.breakfast,
                lunch: meals.lunch,
                dinner: meals.dinner
            });

            addToast({ type: 'success', title: 'Updated', message: 'Member meal entry updated.' });
            await refreshMeals();
        } catch (error) {
            console.error("Failed to update meal", error);
            addToast({ type: 'error', title: 'Error', message: 'Failed to update meal.' });
        }
    };

    // Helper to get meals for a specific day
    const getMealsForDay = (day: number) => {
        return monthlyMeals.filter(meal => {
            const mealDate = new Date(meal.date);
            return mealDate.getDate() === day &&
                mealDate.getMonth() === currentDate.getMonth() &&
                mealDate.getFullYear() === currentDate.getFullYear();
        });
    };

    // Helper to get current user's meal for a specific day
    const getUserMealForDay = (day: number) => {
        const dayMeals = getMealsForDay(day);
        return dayMeals.find(m => getUserId(m.userId) === user?.id);
    };

    const calendarGrid = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();

        let days = [];
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="border-r border-b border-slate-200 dark:border-slate-700"></div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

            // Calculate display count based on role
            let displayCount: number | undefined;
            const dayMeals = getMealsForDay(day);

            if (user?.role === Role.Manager || user?.role === Role.MasterManager) {
                // Manager sees total of all meals
                displayCount = dayMeals.reduce((acc, curr) => acc + (curr.breakfast || 0) + (curr.lunch || 0) + (curr.dinner || 0), 0);
            } else {
                // Member sees only their own meals
                const myMeal = dayMeals.find(m => getUserId(m.userId) === user?.id);
                if (myMeal) {
                    displayCount = (myMeal.breakfast || 0) + (myMeal.lunch || 0) + (myMeal.dinner || 0);
                }
            }

            days.push(
                <div
                    key={day}
                    className={`group relative p-1.5 sm:p-3 min-h-[60px] sm:min-h-[90px] cursor-pointer transition-all duration-300 flex flex-col ${isToday
                        ? 'bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/20 border-2 border-primary-300 dark:border-primary-700'
                        : 'bg-white dark:bg-slate-900/30 hover:bg-gradient-to-br hover:from-slate-50 hover:to-white dark:hover:from-slate-800/50 dark:hover:to-slate-800/30 hover:shadow-lg hover:shadow-primary-500/5 hover:-translate-y-0.5 border border-slate-200 dark:border-slate-700 hover:border-primary-200 dark:hover:border-primary-800'
                        }`}
                    onClick={() => setSelectedDate(new Date(year, month, day))}
                >
                    <div className="flex justify-between items-start mb-1">
                        <span className={`font-bold text-xs sm:text-base tabular-nums ${isToday
                            ? 'w-5 h-5 sm:w-7 sm:h-7 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-full flex items-center justify-center shadow-md shadow-primary-500/30 ring-1 sm:ring-2 ring-primary-200 dark:ring-primary-800'
                            : 'text-slate-700 dark:text-slate-300'
                            }`}>
                            {day}
                        </span>
                        {isToday && (
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary-500 rounded-full animate-pulse"></div>
                        )}
                    </div>
                    {displayCount !== undefined && displayCount > 0 && (
                        <div className="mt-auto flex justify-center sm:justify-start">
                            <div className="inline-flex items-center gap-0.5 sm:gap-1 px-1 sm:px-2 py-0.5 sm:py-1 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 border border-green-200 dark:border-green-800 rounded sm:rounded-lg text-[10px] sm:text-xs font-bold text-green-700 dark:text-green-300 shadow-sm overflow-hidden truncate max-w-full">
                                <span className="text-xs sm:text-sm">🍽️</span>
                                <span className="tabular-nums">{displayCount}</span>
                            </div>
                        </div>
                    )}
                </div>
            );
        }
        return days;
    }, [currentDate, monthlyMeals, user?.role, user?.id]);

    if (!user) return null;

    return (
        <AppLayout>
            <div className="space-y-6">
                {/* Enhanced Page Header */}
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-500/10 via-primary-400/5 to-transparent dark:from-primary-900/20 dark:via-primary-800/10 rounded-2xl p-4 sm:p-8 border border-primary-200/30 dark:border-primary-800/30">
                    <div className="absolute inset-0 bg-gradient-to-r from-white/40 to-transparent dark:from-white/5 dark:to-transparent"></div>
                    <div className="relative z-10 flex items-center gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30 animate-pulse">
                            <CalendarIcon className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold text-foreground">Meal Calendar</h1>
                            <p className="text-xs sm:text-base text-muted-foreground mt-0.5">Track daily meals across the month</p>
                        </div>
                    </div>
                </div>

                {/* Modern Calendar Card */}
                <div className="bg-card rounded-2xl shadow-xl border border-border/50 overflow-hidden">
                    {/* Month Navigation Header with Gradient */}
                    <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/30 border-b-2 border-primary-200 dark:border-primary-800/50 px-3 py-3 sm:px-6 sm:py-4">
                        <div className="flex justify-between items-center gap-2">
                            <button
                                onClick={handlePrevMonth}
                                className="p-2 sm:px-4 sm:py-2 bg-white dark:bg-slate-800 hover:bg-gradient-to-r hover:from-primary-50 hover:to-primary-100 dark:hover:from-primary-900/30 dark:hover:to-primary-800/30 text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400 font-semibold rounded-lg sm:rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95 flex items-center gap-1 sm:gap-2 border border-slate-200 dark:border-slate-700"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                <span className="hidden sm:inline">Previous</span>
                            </button>

                            <div className="flex-1 text-center">
                                <div className="inline-block px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg sm:rounded-xl shadow-lg shadow-primary-500/20">
                                    <h2 className="text-sm sm:text-xl font-bold whitespace-nowrap">
                                        {currentDate.toLocaleString('default', { month: 'short', year: 'numeric' })}
                                        <span className="hidden sm:inline"> ({currentDate.toLocaleString('default', { month: 'long' })})</span>
                                    </h2>
                                </div>
                            </div>

                            <button
                                onClick={handleNextMonth}
                                className="p-2 sm:px-4 sm:py-2 bg-white dark:bg-slate-800 hover:bg-gradient-to-r hover:from-primary-50 hover:to-primary-100 dark:hover:from-primary-900/30 dark:hover:to-primary-800/30 text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400 font-semibold rounded-lg sm:rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95 flex items-center gap-1 sm:gap-2 border border-slate-200 dark:border-slate-700"
                            >
                                <span className="hidden sm:inline">Next</span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Calendar Grid */}
                    <div className="p-4 sm:p-6">
                        {loading ? (
                            <div className="py-20 text-center">
                                <div className="inline-block w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4"></div>
                                <p className="text-muted-foreground font-medium">Loading calendar data...</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-7 text-center border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                                {/* Weekday Headers */}
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
                                    <div
                                        key={day}
                                        className="py-1.5 sm:py-3 font-bold text-[10px] sm:text-sm bg-gradient-to-b from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-800/50 text-slate-700 dark:text-slate-300 border-b-2 border-slate-200 dark:border-slate-700"
                                    >
                                        <span className="hidden sm:inline">{day}</span>
                                        <span className="sm:hidden">{day.slice(0, 3)}</span>
                                    </div>
                                ))}
                                {calendarGrid}
                            </div>
                        )}

                        <div className="mt-4 flex items-center justify-center gap-2 text-xs sm:text-sm text-muted-foreground bg-slate-50 dark:bg-slate-900/30 px-4 py-2 rounded-lg">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <span>{(user?.role === Role.Manager || user?.role === Role.MasterManager) ? 'Shows total meal count per day (all members)' : 'Shows your meal count per day'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {selectedDate && user?.role === Role.Member && (
                <LogMealsModal
                    date={selectedDate}
                    onClose={() => setSelectedDate(null)}
                    onSubmit={handleSubmitMealEntry}
                    initialData={getUserMealForDay(selectedDate.getDate())}
                />
            )}
            {selectedDate && (user?.role === Role.Manager || user?.role === Role.MasterManager) && (
                <ManageMealsModal
                    date={selectedDate}
                    onClose={() => setSelectedDate(null)}
                    mealsForDay={getMealsForDay(selectedDate.getDate())}
                    onUpdate={handleManagerUpdateMeal}
                    members={members}
                />
            )}

        </AppLayout>
    );
}
