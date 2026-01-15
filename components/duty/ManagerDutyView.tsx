import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { api } from '@/services/api';
import { Roster, EditRosterModal } from '../shopping/Modals';

const emptyRoster: Roster = {
    'Monday': { name: '', status: 'Upcoming', amount: 0 },
    'Tuesday': { name: '', status: 'Upcoming', amount: 0 },
    'Wednesday': { name: '', status: 'Upcoming', amount: 0 },
    'Thursday': { name: '', status: 'Upcoming', amount: 0 },
    'Friday': { name: '', status: 'Upcoming', amount: 0 },
    'Saturday': { name: '', status: 'Upcoming', amount: 0 },
    'Sunday': { name: '', status: 'Upcoming', amount: 0 },
};

const ManagerDutyView: React.FC = () => {
    const { user } = useAuth();
    const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);
    const [roster, setRoster] = useState(emptyRoster);
    const [members, setMembers] = useState<{ id: string; name: string }[]>([]);
    const { addToast } = useNotifications();

    useEffect(() => {
        if (user?.khataId) {
            // Fetch roster
            api.getShoppingRoster(user.khataId).then(items => {
                if (items && items.length > 0) {
                    const newRoster: Roster = { ...emptyRoster };
                    items.forEach((item: any) => {
                        if (newRoster[item.day]) {
                            newRoster[item.day] = {
                                name: item.userName || '',
                                status: item.status,
                                amount: item.amount
                            };
                        }
                    });
                    setRoster(newRoster);
                }
            });

            // Fetch members
            api.getShoppingMembers(user.khataId).then(m => {
                setMembers(m);
            });
        }
    }, [user?.khataId]);

    const handleSaveRoster = async (newRoster: Roster) => {
        if (!user?.khataId) return;

        const items = Object.entries(newRoster).map(([day, duty]) => ({
            day,
            userName: duty.name,
            status: duty.status,
            amount: duty.amount,
            userId: members.find(m => m.name === duty.name)?.id
        }));

        const success = await api.saveShoppingRoster(user.khataId, items);
        if (success) {
            setRoster(newRoster);
            addToast({ type: 'success', title: 'Roster Updated', message: 'The shopping duty roster has been saved.' });
            setIsRosterModalOpen(false);
        } else {
            addToast({ type: 'error', title: 'Error', message: 'Failed to save roster.' });
        }
    };

    return (
        <>
            <div className="flex justify-center items-center min-h-[calc(100vh-140px)]">
                <div className="bg-card rounded-xl shadow-md p-4 sm:p-6 w-full max-w-2xl transform transition-all">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-lg sm:text-xl text-card-foreground">This Week's Shopping Duty</h3>
                        <button onClick={() => setIsRosterModalOpen(true)} className="px-3 py-1.5 sm:px-4 sm:py-2 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg text-sm font-semibold hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors">Edit Roster</button>
                    </div>
                    <div className="space-y-3 mt-4">
                        {Object.entries(roster).map(([day, duty]) => {
                            const displayName = duty.name || 'None';
                            const hasDuty = !!duty.name;
                            const isToday = day === new Date().toLocaleDateString('en-US', { weekday: 'long' });

                            return (
                                <div key={day} className={`group flex items-center justify-between p-3 rounded-xl border transition-all duration-300 hover:shadow-md
                                    ${isToday
                                        ? 'bg-white dark:bg-slate-800 border-primary-500/50 dark:border-primary-400/50 shadow-sm ring-1 ring-primary-500/20'
                                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800'}`}>

                                    {/* Day Column */}
                                    <div className="flex items-center gap-3 w-1/3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold uppercase tracking-wider
                                            ${isToday
                                                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'
                                                : 'bg-slate-200/50 text-slate-500 dark:bg-slate-700/50 dark:text-slate-400'}`}>
                                            {day.substring(0, 3)}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className={`text-sm font-semibold ${isToday ? 'text-primary-700 dark:text-primary-300' : 'text-slate-700 dark:text-slate-300'}`}>
                                                {day}
                                            </span>
                                            {isToday && <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400 animate-pulse">TODAY</span>}
                                        </div>
                                    </div>

                                    {/* Assignee Column */}
                                    <div className="flex items-center gap-2 flex-1 justify-center">
                                        {hasDuty ? (
                                            <>
                                                <span className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[120px]">
                                                    {displayName}
                                                </span>
                                            </>
                                        ) : (
                                            <span className="text-sm text-slate-400 dark:text-slate-500 italic">No Duty</span>
                                        )}
                                    </div>

                                    {/* Status Column */}
                                    <div className="w-1/3 flex justify-end">
                                        {duty.status === 'Completed' ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                                ✅ <span className="hidden sm:inline">Done</span> ৳{duty.amount}
                                            </span>
                                        ) : duty.status === 'Assigned' ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                                                🔄 <span className="hidden sm:inline">Assigned</span>
                                            </span>
                                        ) : (
                                            <span className="w-8 flex justify-center text-slate-300 dark:text-slate-600">-</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            {isRosterModalOpen && (
                <EditRosterModal
                    onClose={() => setIsRosterModalOpen(false)}
                    roster={roster}
                    members={members}
                    onSave={handleSaveRoster}
                />
            )}
        </>
    );
};

export default ManagerDutyView;
