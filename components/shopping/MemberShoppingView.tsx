import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { CheckCircleIcon } from '@/components/Icons';
import { Roster, AddDepositModal, AddExpenseModal } from './Modals';

const emptyRoster: Roster = {
    'Monday': { name: '', status: 'Upcoming', amount: 0 },
    'Tuesday': { name: '', status: 'Upcoming', amount: 0 },
    'Wednesday': { name: '', status: 'Upcoming', amount: 0 },
    'Thursday': { name: '', status: 'Upcoming', amount: 0 },
    'Friday': { name: '', status: 'Upcoming', amount: 0 },
    'Saturday': { name: '', status: 'Upcoming', amount: 0 },
    'Sunday': { name: '', status: 'Upcoming', amount: 0 },
};

const initialMemberSummary = {
    totalDeposits: 0,
    mealCost: 0,
    refundable: 0,
};

const MemberShoppingView: React.FC = () => {
    const { user } = useAuth();
    const router = useRouter();
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [historyTab, setHistoryTab] = useState<'deposits' | 'expenses'>('deposits');
    const [roster, setRoster] = useState(emptyRoster);
    const [myDeposits, setMyDeposits] = useState<any[]>([]);
    const [myExpenses, setMyExpenses] = useState<any[]>([]);
    const [memberSummary, setMemberSummary] = useState(initialMemberSummary);

    useEffect(() => {
        if (user?.khataId) {
            const fetchData = async () => {
                const [summaryData, rosterItems, deposits, expenses] = await Promise.all([
                    api.getShoppingSummary(user.khataId as string),
                    api.getShoppingRoster(user.khataId as string),
                    api.getDeposits(user.khataId as string),
                    api.getExpenses(user.khataId as string)
                ]);

                if (summaryData?.memberSummary) {
                    setMemberSummary(summaryData.memberSummary);
                }

                if (rosterItems?.length > 0) {
                    const newRoster: Roster = { ...emptyRoster };
                    rosterItems.forEach((item: any) => {
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

                // Filter for my items (keeping existing logic)
                const myDeposits = deposits.filter((d: any) => (d.userId?._id || d.userId) === user.id);
                setMyDeposits(myDeposits);

                const myExpenses = expenses.filter((e: any) => (e.userId?._id || e.userId) === user.id);
                setMyExpenses(myExpenses);
            };

            fetchData();
        }
    }, [user?.khataId, user?.id]);

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

    const handleDepositSubmit = () => {
        // Refresh deposits and summary
        if (user?.khataId) {
            api.getDeposits(user.khataId).then(deposits => {
                const myOwn = deposits.filter((d: any) => (d.userId?._id || d.userId) === user.id);
                setMyDeposits(myOwn);
            });
            api.getShoppingSummary(user.khataId).then(data => {
                if (data && data.memberSummary) {
                    setMemberSummary(data.memberSummary);
                }
            });
        }
    };

    const handleExpenseSubmit = () => {
        // Refresh expenses
        if (user?.khataId) {
            api.getExpenses(user.khataId).then(expenses => {
                const myOwn = expenses.filter((e: any) => (e.userId?._id || e.userId) === user.id);
                setMyExpenses(myOwn);
            });
        }
    };

    return (
        <>
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

                <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => setIsDepositModalOpen(true)} className="py-4 text-center bg-white dark:bg-slate-800 rounded-xl shadow-md font-semibold text-slate-700 dark:text-slate-200 hover:scale-105 transition-transform active:scale-95">
                        💰 Add Deposit
                    </button>
                    <button onClick={() => setIsExpenseModalOpen(true)} className="py-4 text-center bg-white dark:bg-slate-800 rounded-xl shadow-md font-semibold text-slate-700 dark:text-slate-200 hover:scale-105 transition-transform active:scale-95">
                        🛒 Add Expense
                    </button>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 grid grid-cols-2 divide-x dark:divide-slate-700 text-center">
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Deposit Balance</p>
                        <p className="text-2xl font-bold text-slate-800 dark:text-white font-numeric">৳{memberSummary.totalDeposits.toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Due / Refund</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400 font-numeric">{memberSummary.refundable >= 0 ? '+' : ''}৳{memberSummary.refundable.toLocaleString()}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md">
                    <div className="p-4 border-b dark:border-slate-700">
                        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-700 rounded-lg">
                            <button onClick={() => setHistoryTab('deposits')} className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors ${historyTab === 'deposits' ? 'bg-white dark:bg-slate-600 shadow text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                                Deposit History
                            </button>
                            <button onClick={() => setHistoryTab('expenses')} className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors ${historyTab === 'expenses' ? 'bg-white dark:bg-slate-600 shadow text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                                Expense History
                            </button>
                        </div>
                    </div>
                    <div className="p-4 space-y-2">
                        {historyTab === 'deposits' && (
                            myDeposits.length > 0 ? (
                                myDeposits.slice(0, 3).map(d => (
                                    <div key={d._id} className="flex justify-between items-center text-sm p-2 bg-slate-50 dark:bg-slate-700/50 rounded-md">
                                        <span className="text-slate-700 dark:text-slate-300">{new Date(d.createdAt).toLocaleDateString()} - {d.paymentMethod}</span>
                                        <span className="font-semibold flex items-center gap-1 text-slate-800 dark:text-white">
                                            ৳{d.amount.toLocaleString()}
                                            {d.status === 'Approved' && <CheckCircleIcon className="w-4 h-4 text-green-500" />}
                                            {d.status === 'Pending' && <span className="text-yellow-500 text-xs">⏳ Pending</span>}
                                            {d.status === 'Rejected' && <span className="text-red-500 text-xs">❌ Rejected</span>}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-slate-500 dark:text-slate-400 py-4">No deposit history found.</p>
                            )
                        )}
                        {historyTab === 'expenses' && (
                            myExpenses.length > 0 ? (
                                myExpenses.slice(0, 3).map(e => (
                                    <div key={e._id} className="flex justify-between items-center text-sm p-2 bg-slate-50 dark:bg-slate-700/50 rounded-md">
                                        <span className="text-slate-700 dark:text-slate-300">{new Date(e.createdAt).toLocaleDateString()}</span>
                                        <span className="font-semibold flex items-center gap-1 text-slate-800 dark:text-white">
                                            ৳{e.amount.toLocaleString()}
                                            {e.status === 'Approved' && <span className="text-green-600 dark:text-green-400 text-xs">✅ Approved</span>}
                                            {e.status === 'Pending' && <span className="text-yellow-600 dark:text-yellow-400 text-xs">⏳ Pending</span>}
                                            {e.status === 'Rejected' && <span className="text-red-600 dark:text-red-400 text-xs">❌ Rejected</span>}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-slate-500 dark:text-slate-400 py-4">No expense history found.</p>
                            )
                        )}
                        <button onClick={() => router.push('/shopping/history')} className="text-sm font-semibold text-primary-600 hover:underline mt-2 w-full text-center p-2 dark:text-primary-400">View All →</button>
                    </div>
                </div>
            </div>

            {isDepositModalOpen && <AddDepositModal onClose={() => setIsDepositModalOpen(false)} onSubmit={handleDepositSubmit} />}
            {isExpenseModalOpen && <AddExpenseModal onClose={() => setIsExpenseModalOpen(false)} onSubmit={handleExpenseSubmit} />}
        </>
    );
};

export default MemberShoppingView;
