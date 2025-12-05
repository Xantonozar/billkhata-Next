"use client";

import React, { useState, useMemo, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Role } from '@/types';
import { MenuBookIcon, PencilIcon } from '@/components/Icons';
import { useNotifications } from '@/contexts/NotificationContext';
import { api } from '@/services/api';
import ToastContainer from '@/components/ToastContainer';

// Types
interface Menu {
    day: string;
    breakfast: string;
    lunch: string;
    dinner: string;
}

// Helper to generate default week menu structure
const generateDefaultWeekMenu = (): Menu[] => {
    return [
        { day: 'Monday', breakfast: '', lunch: '', dinner: '' },
        { day: 'Tuesday', breakfast: '', lunch: '', dinner: '' },
        { day: 'Wednesday', breakfast: '', lunch: '', dinner: '' },
        { day: 'Thursday', breakfast: '', lunch: '', dinner: '' },
        { day: 'Friday', breakfast: '', lunch: '', dinner: '' },
        { day: 'Saturday', breakfast: '', lunch: '', dinner: '' },
        { day: 'Sunday', breakfast: '', lunch: '', dinner: '' },
    ];
};

// Edit Modal Component
const EditMenuModal: React.FC<{
    editingDay: string | null;
    menuData: Menu[];
    onClose: () => void;
    onSave: (day: string, newMenu: Omit<Menu, 'day'>) => void;
    onSavePermanent: (newMenu: Menu[]) => void;
}> = ({ editingDay, menuData, onClose, onSave, onSavePermanent }) => {
    const isPermanentEdit = editingDay === 'Permanent';
    const dayData = useMemo(() => menuData.find(m => m.day === editingDay), [editingDay, menuData]);

    const [breakfast, setBreakfast] = useState(dayData?.breakfast || '');
    const [lunch, setLunch] = useState(dayData?.lunch || '');
    const [dinner, setDinner] = useState(dayData?.dinner || '');
    const [permanentMenuData, setPermanentMenuData] = useState<Menu[]>(menuData);

    // Update permanent menu data when a field changes
    const updatePermanentMenu = (day: string, field: 'breakfast' | 'lunch' | 'dinner', value: string) => {
        setPermanentMenuData(prev => prev.map(item =>
            item.day === day ? { ...item, [field]: value } : item
        ));
    };

    const handleSave = () => {
        if (editingDay && !isPermanentEdit) {
            onSave(editingDay, { breakfast, lunch, dinner });
        }
        onClose();
    };

    const handleSavePermanent = () => {
        if (isPermanentEdit) {
            onSavePermanent(permanentMenuData);
        }
        onClose();
    };

    if (isPermanentEdit) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in p-4" onClick={onClose}>
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                    <h2 className="text-xl font-bold font-sans mb-4 text-slate-900 dark:text-white">
                        Edit Permanent Menu Template
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                        This will set the default menu for all weeks. You can override specific days later.
                    </p>
                    <div className="border-t my-4 border-slate-200 dark:border-slate-700"></div>

                    <div className="space-y-6">
                        {permanentMenuData.map((item) => (
                            <div key={item.day} className="border-b pb-4 dark:border-slate-700 last:border-b-0">
                                <h3 className="font-semibold text-lg mb-3 text-slate-800 dark:text-slate-100">{item.day}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Breakfast:</label>
                                        <input
                                            type="text"
                                            value={item.breakfast}
                                            onChange={e => updatePermanentMenu(item.day, 'breakfast', e.target.value)}
                                            className="w-full mt-1 px-3 py-2 bg-slate-100 dark:bg-slate-700 border-2 border-transparent rounded-lg focus:outline-none focus:border-primary-500 transition-colors text-slate-900 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Lunch:</label>
                                        <input
                                            type="text"
                                            value={item.lunch}
                                            onChange={e => updatePermanentMenu(item.day, 'lunch', e.target.value)}
                                            className="w-full mt-1 px-3 py-2 bg-slate-100 dark:bg-slate-700 border-2 border-transparent rounded-lg focus:outline-none focus:border-primary-500 transition-colors text-slate-900 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Dinner:</label>
                                        <input
                                            type="text"
                                            value={item.dinner}
                                            onChange={e => updatePermanentMenu(item.day, 'dinner', e.target.value)}
                                            className="w-full mt-1 px-3 py-2 bg-slate-100 dark:bg-slate-700 border-2 border-transparent rounded-lg focus:outline-none focus:border-primary-500 transition-colors text-slate-900 dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-wrap gap-3 mt-6 justify-end border-t pt-4 dark:border-slate-700">
                        <button onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-800 dark:text-white">Cancel</button>
                        <button onClick={handleSavePermanent} className="px-4 py-2 bg-success-600 text-white font-semibold rounded-lg hover:bg-success-700">Save Permanent Menu</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold font-sans text-slate-900 dark:text-white">
                    Edit Menu for: {editingDay}
                </h2>
                <div className="border-t my-4 border-slate-200 dark:border-slate-700"></div>

                <div className="space-y-4">
                    <div>
                        <label className="font-semibold text-slate-700 dark:text-slate-300">Breakfast:</label>
                        <input type="text" value={breakfast} onChange={e => setBreakfast(e.target.value)} className="w-full mt-1 px-3 py-2 bg-slate-100 dark:bg-slate-700 border-2 border-transparent rounded-lg focus:outline-none focus:border-primary-500 transition-colors text-slate-900 dark:text-white" />
                    </div>
                    <div>
                        <label className="font-semibold text-slate-700 dark:text-slate-300">Lunch:</label>
                        <input type="text" value={lunch} onChange={e => setLunch(e.target.value)} className="w-full mt-1 px-3 py-2 bg-slate-100 dark:bg-slate-700 border-2 border-transparent rounded-lg focus:outline-none focus:border-primary-500 transition-colors text-slate-900 dark:text-white" />
                    </div>
                    <div>
                        <label className="font-semibold text-slate-700 dark:text-slate-300">Dinner:</label>
                        <input type="text" value={dinner} onChange={e => setDinner(e.target.value)} className="w-full mt-1 px-3 py-2 bg-slate-100 dark:bg-slate-700 border-2 border-transparent rounded-lg focus:outline-none focus:border-primary-500 transition-colors text-slate-900 dark:text-white" />
                    </div>
                </div>

                <div className="flex flex-wrap gap-3 mt-6 justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-800 dark:text-white">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700">Save Changes</button>
                </div>
            </div>
        </div>
    );
};

export default function MenuPage() {
    const { user } = useAuth();
    const { addToast } = useNotifications();
    const [weeklyMenu, setWeeklyMenu] = useState<Menu[]>(generateDefaultWeekMenu());
    const [editingDay, setEditingDay] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch menu from API
    useEffect(() => {
        const fetchMenu = async () => {
            if (!user?.khataId) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const menuData = await api.getMenu(user.khataId);

                if (menuData && menuData.length > 0) {
                    setWeeklyMenu(menuData);
                } else {
                    // No menu data, use default empty structure
                    setWeeklyMenu(generateDefaultWeekMenu());
                }
            } catch (error) {
                console.error('Error fetching menu:', error);
                addToast({ type: 'error', title: 'Error', message: 'Failed to load menu data' });
                setWeeklyMenu(generateDefaultWeekMenu());
            } finally {
                setLoading(false);
            }
        };

        fetchMenu();
    }, [user?.khataId]);

    const handleSaveMenu = async (day: string, newMenu: Omit<Menu, 'day'>) => {
        if (!user?.khataId) return;

        try {
            const success = await api.updateMenuDay(user.khataId, day, newMenu);

            if (success) {
                // Update local state
                setWeeklyMenu(currentMenu =>
                    currentMenu.map(item => item.day === day ? { ...item, ...newMenu } : item)
                );
                addToast({ type: 'success', title: 'Menu Updated', message: `${day}'s menu has been saved for this week.` });

                // Refresh menu from server
                const updatedMenu = await api.getMenu(user.khataId);
                if (updatedMenu && updatedMenu.length > 0) {
                    setWeeklyMenu(updatedMenu);
                }
            } else {
                addToast({ type: 'error', title: 'Error', message: 'Failed to save menu' });
            }
        } catch (error) {
            console.error('Error saving menu:', error);
            addToast({ type: 'error', title: 'Error', message: 'Failed to save menu' });
        }
    };

    const handleSavePermanentMenu = async (newMenu: Menu[]) => {
        if (!user?.khataId) return;

        try {
            const success = await api.saveMenu(user.khataId, newMenu, true);

            if (success) {
                addToast({ type: 'success', title: 'Permanent Menu Saved', message: 'The permanent menu has been updated.' });

                // Refresh menu from server
                const updatedMenu = await api.getMenu(user.khataId);
                if (updatedMenu && updatedMenu.length > 0) {
                    setWeeklyMenu(updatedMenu);
                }
            } else {
                addToast({ type: 'error', title: 'Error', message: 'Failed to save permanent menu' });
            }
        } catch (error) {
            console.error('Error saving permanent menu:', error);
            addToast({ type: 'error', title: 'Error', message: 'Failed to save permanent menu' });
        }
    };

    return (
        <AppLayout>
            <div className="space-y-6 animate-fade-in">
                <div className="flex items-center gap-4">
                    <MenuBookIcon className="w-8 h-8 text-primary-500" />
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">This Week's Menu</h1>
                </div>

                {loading ? (
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-8 text-center">
                        <div className="flex justify-center items-center space-x-2">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                            <span className="text-slate-600 dark:text-slate-300">Loading menu...</span>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-4 overflow-x-auto">
                        <table className="w-full min-w-max text-sm text-left">
                            <thead className="border-b dark:border-slate-700">
                                <tr>
                                    <th className="p-3 text-slate-900 dark:text-white font-semibold">Day</th>
                                    <th className="p-3 text-slate-900 dark:text-white font-semibold">Breakfast</th>
                                    <th className="p-3 text-slate-900 dark:text-white font-semibold">Lunch</th>
                                    <th className="p-3 text-slate-900 dark:text-white font-semibold">Dinner</th>
                                    {user?.role === Role.Manager && <th className="p-3 text-center text-slate-900 dark:text-white font-semibold">Edit</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {weeklyMenu.map(item => (
                                    <tr key={item.day} className="border-b dark:border-slate-700 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                        <td className="p-3 font-semibold text-slate-800 dark:text-slate-100">{item.day}</td>
                                        <td className="p-3 text-slate-600 dark:text-slate-300">{item.breakfast || '-'}</td>
                                        <td className="p-3 text-slate-600 dark:text-slate-300">{item.lunch || '-'}</td>
                                        <td className="p-3 text-slate-600 dark:text-slate-300">{item.dinner || '-'}</td>
                                        {user?.role === Role.Manager && (
                                            <td className="p-3 text-center">
                                                <button onClick={() => setEditingDay(item.day)} className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                                                    <PencilIcon className="w-5 h-5 text-primary-500" />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {user?.role === Role.Manager && (
                            <div className="mt-4 pt-4 border-t dark:border-slate-700 text-right">
                                <button onClick={() => setEditingDay('Permanent')} className="px-4 py-2 text-sm font-semibold bg-primary-100 text-primary-600 dark:bg-primary-500/20 dark:text-primary-400 rounded-md hover:bg-primary-200 dark:hover:bg-primary-500/30 transition-colors">
                                    Edit Permanent Menu
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {editingDay && (
                <EditMenuModal
                    editingDay={editingDay}
                    menuData={weeklyMenu}
                    onClose={() => setEditingDay(null)}
                    onSave={handleSaveMenu}
                    onSavePermanent={handleSavePermanentMenu}
                />
            )}
            <ToastContainer />
        </AppLayout>
    );
}
