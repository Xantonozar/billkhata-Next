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
                    <div className="border-t border-border pt-4 space-y-2 sm:space-y-3 text-sm sm:text-base">
                        {Object.entries(roster).map(([day, duty]) => {
                            const displayName = duty.name || 'None';
                            return (
                                <div key={day} className="flex justify-between items-center p-2 sm:p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors">
                                    <span className="font-medium text-muted-foreground w-24 sm:w-1/3">{day}</span>
                                    <span className="font-bold text-card-foreground flex-1 mx-2 truncate">{displayName}</span>
                                    <span className={`text-xs sm:text-sm whitespace-nowrap ${duty.status === 'Completed' ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                        {duty.status === 'Completed' ? `✅ ৳${duty.amount}` : duty.status === 'Assigned' ? '🔄 Assigned' : ''}
                                    </span>
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
