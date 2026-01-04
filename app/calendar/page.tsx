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
            <label className="font-semibold text-lg text-foreground">{icon} {label}</label>
            <div className="flex items-center gap-x-4 mt-2">
                {[0, 0.50, 1.00, 2.00].map(q => (
                    <label key={q} className="flex items-center gap-2 cursor-pointer text-muted-foreground">
                        <input type="radio" name={label} value={q} checked={value === q} onChange={() => onChange(q)} className="w-5 h-5 text-primary-600 focus:ring-primary-500" />
                        <span>{q.toFixed(2)}</span>
                    </label>
                ))}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in p-4" onClick={onClose}>
            <div className="bg-card rounded-xl shadow-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold font-sans text-card-foreground">Log Meals - {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h2>
                <div className="border-t my-4 border-border"></div>

                <div className="space-y-4">
                    <MealRadioSelector label="Breakfast" icon="☕" value={meals.breakfast} onChange={v => setMeals(p => ({ ...p, breakfast: v }))} />
                    <MealRadioSelector label="Lunch" icon="🍛" value={meals.lunch} onChange={v => setMeals(p => ({ ...p, lunch: v }))} />
                    <MealRadioSelector label="Dinner" icon="🍜" value={meals.dinner} onChange={v => setMeals(p => ({ ...p, dinner: v }))} />
                </div>

                <div className="border-t my-4 border-border"></div>
                <div className="text-center font-semibold text-foreground">
                    <p>Total: {totalMeals} meals</p>
                    <p>Cost: ৳{totalCost.toFixed(2)} (@ ৳{COST_PER_QUANTITY.toFixed(2)}/meal)</p>
                </div>
                <div className="border-t my-4 border-border"></div>

                <div>
                    <label className="font-semibold text-sm text-muted-foreground">Notes (optional):</label>
                    <input type="text" value={notes} onChange={e => setNotes(e.target.value)} className="w-full mt-1 px-3 py-2 bg-muted border-2 border-transparent rounded-lg focus:outline-none focus:border-primary-500 transition-colors text-foreground" />
                </div>

                <div className="flex gap-3 mt-6">
                    <button onClick={onClose} className="flex-1 py-2.5 bg-muted font-semibold rounded-lg hover:bg-muted/80 text-foreground">Cancel</button>
                    <button onClick={handleSubmit} className="flex-1 py-2.5 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700">Save Entry</button>
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
            <h3 className="font-bold text-lg mb-2 text-foreground">{title}</h3>
            <div className="border rounded-lg overflow-hidden border-border">
                <div className="grid grid-cols-3 bg-muted p-2 font-semibold text-sm text-muted-foreground">
                    <div>Member Name</div>
                    <div className="text-center">Quantity</div>
                    <div className="text-right">Action</div>
                </div>
                {data.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">No meals recorded</div>
                ) : (
                    data.map((member, idx) => (
                        <div key={`${member.userId}-${idx}`} className="grid grid-cols-3 p-2 border-t border-border items-center text-foreground">
                            <div>{member.name}</div>
                            <div className="text-center">
                                {editingId === member.userId && editType === type ? (
                                    <div className="flex justify-center">
                                        <select
                                            value={editValue}
                                            onChange={e => setEditValue(parseFloat(e.target.value))}
                                            className="px-1 py-1 rounded border border-primary-500 bg-background text-sm w-16"
                                            onClick={e => e.stopPropagation()}
                                        >
                                            {[0, 0.50, 1.00, 1.50, 2.00, 2.50, 3.00].map(val => (
                                                <option key={val} value={val}>{val.toFixed(2)}</option>
                                            ))}
                                        </select>
                                    </div>
                                ) : (
                                    member.qty.toFixed(2)
                                )}
                            </div>
                            <div className="text-right">
                                {editingId === member.userId && editType === type ? (
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setEditingId(null); }}
                                            className="text-muted-foreground hover:text-foreground"
                                            disabled={loading}
                                        >
                                            <XIcon className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleSave(member.userId, member.original); }}
                                            className="text-success-600 hover:text-success-700"
                                            disabled={loading}
                                        >
                                            {loading ? '...' : 'Save'}
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleEditClick(member, type); }}
                                        className="text-primary-600 hover:underline dark:text-primary-400 flex items-center justify-end gap-1 ml-auto"
                                    >
                                        <PencilIcon className="w-4 h-4" /> <span className="text-xs">Edit</span>
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
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in p-4" onClick={onClose}>
            <div className="bg-card rounded-xl shadow-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold font-sans text-card-foreground">Meals - {date.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric' })} (Total: {dayDetails.total} Meals)</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-muted"><XIcon className="w-5 h-5 text-muted-foreground" /></button>
                </div>

                <div className="border-t my-4 border-border"></div>

                {/* Add New Meal Section */}
                <div className="mb-6">
                    {!isAddingMode ? (
                        <button
                            onClick={() => setIsAddingMode(true)}
                            className="w-full py-2 border-2 border-dashed border-border rounded-lg text-muted-foreground hover:border-primary-500 hover:text-primary-500 transition-colors flex items-center justify-center gap-2"
                        >
                            <PlusIcon className="w-5 h-5" /> Add Member Meal
                        </button>
                    ) : (
                        <div className="bg-muted p-4 rounded-lg border border-border">
                            <h3 className="font-bold text-foreground mb-3">Add Entry</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Select Member</label>
                                    <select
                                        className="w-full p-2 rounded-md border border-border bg-card text-foreground"
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
                                <div className="grid grid-cols-3 gap-2">
                                    {['breakfast', 'lunch', 'dinner'].map((type) => (
                                        <div key={type}>
                                            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1 capitalize">{type}</label>
                                            <select
                                                className="w-full p-2 rounded-md border border-border bg-card text-foreground text-sm"
                                                value={newMealData[type as keyof typeof newMealData]}
                                                onChange={e => setNewMealData({ ...newMealData, [type]: parseFloat(e.target.value) })}
                                            >
                                                {[0, 0.50, 1.00, 1.50, 2.00, 2.50, 3.00].map(v => <option key={v} value={v}>{v.toFixed(2)}</option>)}
                                            </select>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button onClick={() => setIsAddingMode(false)} className="flex-1 py-1.5 text-sm text-foreground hover:bg-background rounded">Cancel</button>
                                    <button
                                        onClick={handleAddNewMeal}
                                        disabled={!newMealMemberId || loading}
                                        className="flex-1 py-1.5 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <MealTable title="🥣 Breakfast" data={dayDetails.breakfast} type="breakfast" />
                    <MealTable title="🍛 Lunch" data={dayDetails.lunch} type="lunch" />
                    <MealTable title="🍜 Dinner" data={dayDetails.dinner} type="dinner" />
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
                const isManager = user.role === Role.Manager;
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

            if (user?.role === Role.Manager) {
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
                    className="border-r border-b border-border p-1 sm:p-2 min-h-[60px] sm:min-h-[80px] cursor-pointer hover:bg-muted transition-colors flex flex-col items-center sm:items-start"                    onClick={() => setSelectedDate(new Date(year, month, day))}
                >
                    <span className={`font-semibold text-xs sm:text-base ${isToday ? 'bg-primary-500 text-white rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center' : 'text-foreground'}`}>{day}</span>
                    {displayCount !== undefined && displayCount > 0 && <div className="text-xs mt-1 text-muted-foreground">🍽️{displayCount}</div>}
                </div>
            );
        }
        return days;
    }, [currentDate, monthlyMeals, user?.role, user?.id]);

    if (!user) return null;

    return (
        <AppLayout>
            <div className="space-y-4 animate-fade-in">
                <div className="flex items-center gap-3 sm:gap-4">
                    <CalendarIcon className="w-6 h-6 sm:w-8 sm:h-8 text-primary-500" />
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Meal Calendar</h1>
                </div>

                <div className="bg-card rounded-xl shadow-md p-4">
                    <div className="flex justify-between items-center mb-4">
                        <button onClick={handlePrevMonth} className="px-2 sm:px-3 py-1 text-sm sm:text-base font-semibold rounded-md hover:bg-muted text-muted-foreground">{"< Prev"}</button>
                        <h2 className="text-lg sm:text-xl font-bold text-card-foreground text-center">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
                        <button onClick={handleNextMonth} className="px-2 sm:px-3 py-1 text-sm sm:text-base font-semibold rounded-md hover:bg-muted text-muted-foreground">{"Next >"}</button>
                    </div>

                    {loading ? (
                        <div className="py-10 text-center text-muted-foreground">Loading calendar data...</div>
                    ) : (
                        <div className="grid grid-cols-7 text-center font-semibold text-sm text-muted-foreground border-t border-l border-border">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                <div key={day} className="py-2 border-r border-b border-border text-xs sm:text-sm">{day.slice(0, 3)}</div>
                            ))}
                            {calendarGrid}
                        </div>
                    )}

                    <p className="text-xs text-muted-foreground mt-2">Legend: {user?.role === Role.Manager ? 'Total meal count per day (all members)' : 'Your meal count per day'}</p>
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
            {selectedDate && user?.role === Role.Manager && (
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
