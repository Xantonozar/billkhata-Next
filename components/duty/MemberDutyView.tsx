import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { Roster } from '../shopping/Modals';
import { ShoppingCartIcon, CalendarIcon, CheckCircleIcon, ClockIcon } from 'lucide-react';

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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.khataId) {
            setLoading(true);
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
                setLoading(false);
            });
        }
    }, [user?.khataId]);

    // Get current day
    const dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayIndex = new Date().getDay();
    const todayDay = dayOrder[todayIndex];
    const myName = user?.name || '';

    const myDutyToday = roster[todayDay]?.name === myName;

    const nextDutyDay = Object.entries(roster).find(([day, duty]) => {
        return duty.name === myName && dayOrder.indexOf(day) > todayIndex;
    });

    // Sort roster starting from today
    const sortedDays = [...dayOrder.slice(todayIndex), ...dayOrder.slice(0, todayIndex)];

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Summary Card */}
            <div className={`relative overflow-hidden p-6 rounded-2xl shadow-lg transition-all duration-300 
                ${myDutyToday
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-600 dark:from-emerald-600 dark:to-teal-800 text-white'
                    : 'bg-white dark:bg-slate-800 earthy-green:bg-white border border-slate-100 dark:border-slate-700 earthy-green:border-primary-100'}`}>

                {/* Background Decoration */}
                <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4">
                    <ShoppingCartIcon size={120} />
                </div>

                <div className="relative z-10 flex items-center gap-4">
                    <div className={`p-3 rounded-full ${myDutyToday ? 'bg-white/20 backdrop-blur-md' : 'bg-primary-50 dark:bg-slate-700 earthy-green:bg-primary-50 text-primary-600 dark:text-primary-400 earthy-green:text-primary-700'}`}>
                        {myDutyToday ? <ShoppingCartIcon size={32} className="text-white" /> : <CalendarIcon size={32} />}
                    </div>
                    <div>
                        <h2 className={`text-lg font-bold ${myDutyToday ? 'text-white' : 'text-slate-900 dark:text-white earthy-green:text-primary-900'}`}>
                            {myDutyToday ? "It's Your Shopping Day!" : "Your Shopping Duty Status"}
                        </h2>
                        <p className={`text-sm ${myDutyToday ? 'text-emerald-50' : 'text-slate-500 dark:text-slate-400 earthy-green:text-primary-600'}`}>
                            {myDutyToday
                                ? "Check the shopping list and ready your wallet! 🛒"
                                : nextDutyDay
                                    ? `Next duty is coming up on ${nextDutyDay[0]}.`
                                    : "Relax! No duties assigned for the rest of this week."}
                        </p>
                    </div>
                </div>
            </div>

            {/* Weekly Roster Grid */}
            <div>
                <h3 className="flex items-center gap-2 font-bold text-lg mb-4 text-slate-800 dark:text-white earthy-green:text-primary-900 px-1">
                    <span className="w-1.5 h-6 bg-gradient-to-b from-primary-500 to-indigo-500 earthy-green:from-primary-600 earthy-green:to-primary-400 rounded-full"></span>
                    This Week's Roster
                </h3>

                <div className="space-y-3">
                    {dayOrder.map((day, index) => {
                        const duty = roster[day];
                        const isToday = day === todayDay;
                        const isMyDuty = duty.name === myName;
                        const hasDuty = !!duty.name;
                        const isPast = index < todayIndex;

                        return (
                            <div key={day} className={`relative flex items-center justify-between p-3 rounded-xl border transition-all duration-300 hover:shadow-md
                                ${isToday
                                    ? 'bg-white dark:bg-slate-800 border-primary-500/50 dark:border-primary-400/50 shadow-md ring-1 ring-primary-500/20'
                                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 earthy-green:bg-primary-50/30 earthy-green:border-primary-100'}
                                ${isMyDuty ? 'bg-indigo-50/50 dark:bg-indigo-900/10 earthy-green:bg-primary-100/40' : ''}
                                ${!hasDuty ? 'opacity-80' : ''}
                            `}>
                                {/* Day & Indicator */}
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold uppercase tracking-wider
                                        ${isToday
                                            ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                                            : 'text-slate-500 dark:text-slate-400 bg-slate-200/50 dark:bg-slate-700/50 earthy-green:text-primary-600 earthy-green:bg-primary-100/50'}`}>
                                        {day.substring(0, 3)}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className={`text-sm font-semibold ${isToday ? 'text-primary-700 dark:text-primary-300' : 'text-slate-700 dark:text-slate-300'}`}>
                                            {day}
                                        </span>
                                        {isToday && <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400 animate-pulse">TODAY</span>}
                                    </div>
                                </div>

                                {/* Assignee & Status */}
                                <div className="flex items-center gap-3">
                                    {hasDuty ? (
                                        <>
                                            <div className="flex items-center gap-2 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className={`text-sm font-bold ${isMyDuty ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-900 dark:text-white earthy-green:text-primary-900'}`}>
                                                        {isMyDuty ? 'You' : duty.name}
                                                    </span>
                                                    {/* Status Badge */}
                                                    <div>
                                                        {duty.status === 'Completed' ? (
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                                                                <CheckCircleIcon size={10} /> Done
                                                            </span>
                                                        ) : isPast ? (
                                                            <span className="text-[10px] text-slate-400 dark:text-slate-500">Missed?</span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                                                                <ClockIcon size={10} /> Pending
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm 
                                                    ${isMyDuty
                                                        ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                                                        : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 earthy-green:text-primary-800 earthy-green:border-primary-200'}`}>
                                                    {duty.name.substring(0, 2).toUpperCase()}
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex items-center gap-2 opacity-50">
                                            <span className="text-sm text-slate-500 dark:text-slate-400 italic">No Duty</span>
                                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                                <span className="text-xs">-</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default MemberDutyView;
