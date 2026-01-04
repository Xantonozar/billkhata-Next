import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { Roster } from '../shopping/Modals';

const emptyRoster: Roster = {
    'Monday': { name: '', status: 'Upcoming', amount: 0 },
    'Tuesday': { name: '', status: 'Upcoming', amount: 0 },
    'Wednesday': { name: '', status: 'Upcoming', amount: 0 },
    'Thursday': { name: '', status: 'Upcoming', amount: 0 },
    'Friday': { name: '', status: 'Upcoming', amount: 0 },
    'Saturday': { name: '', status: 'Upcoming', amount: 0 },
    'Sunday': { name: '', status: 'Upcoming', amount: 0 },
};

const MemberDutyView: React.FC = () => {
    const { user } = useAuth();
    const [roster, setRoster] = useState(emptyRoster);

    useEffect(() => {
        if (user?.khataId) {
            api.getShoppingRoster(user.khataId).then(items => {
                if (items?.length > 0) {
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
        }
    }, [user?.khataId]);

    // Get current day
    const dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayDay = dayOrder[new Date().getDay()];
    const myName = user?.name || '';

    const myDutyToday = roster[todayDay]?.name === myName;

    const nextDutyDay = Object.entries(roster).find(([day, duty]) => {
        return duty.name === myName && dayOrder.indexOf(day) > dayOrder.indexOf(todayDay);
    });

    const dutyText = myDutyToday
        ? "Today is your shopping day! 🛒"
        : nextDutyDay
            ? `Your next shopping duty is on ${nextDutyDay[0]}.`
            : "You have no upcoming shopping duties this week.";

    return (
        <div className="space-y-6">
            <div className="bg-primary-50 dark:bg-primary-500/10 p-4 rounded-lg text-center">
                <p className="font-semibold text-primary-700 dark:text-primary-300">{dutyText}</p>
            </div>

            {/* Weekly Shopping Roster */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
                <h3 className="font-semibold text-lg mb-3 text-slate-900 dark:text-white">This Week's Shopping Duty</h3>
                <div className="border-t border-slate-200 dark:border-slate-700 pt-3 space-y-2 text-sm">
                    {Object.entries(roster).map(([day, duty]) => {
                        const displayName = duty.name || 'None';
                        const isMyDuty = duty.name === myName;
                        return (
                            <div key={day} className={`flex justify-between items-center p-2 rounded ${isMyDuty ? 'bg-primary-50 dark:bg-primary-500/10' : ''}`}>
                                <span className={`font-medium ${isMyDuty ? 'text-primary-700 dark:text-primary-300' : 'text-slate-600 dark:text-slate-300'}`}>
                                    {day}: {displayName} {isMyDuty ? '(You)' : ''}
                                </span>
                                <span className={`${duty.status === 'Completed' ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                    {duty.status === 'Completed' ? `✅ Completed` : duty.status === 'Assigned' ? '🔄 Assigned' : ''}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default MemberDutyView;
