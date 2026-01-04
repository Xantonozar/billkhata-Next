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
    totalBillPayments: 0,
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

                <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => setIsDepositModalOpen(true)} className="py-4 text-center bg-white dark:bg-slate-800 rounded-xl shadow-md font-semibold text-slate-700 dark:text-slate-200 hover:scale-105 transition-transform active:scale-95">
                        💰 Add Deposit
                    </button>
                    <button onClick={() => setIsExpenseModalOpen(true)} className="py-4 text-center bg-white dark:bg-slate-800 rounded-xl shadow-md font-semibold text-slate-700 dark:text-slate-200 hover:scale-105 transition-transform active:scale-95">
                        🛒 Add Expense
                    </button>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="text-center">
                            <p className="text-sm text-slate-500 dark:text-slate-400">Deposit Balance</p>
                            <p className="text-2xl font-bold text-slate-800 dark:text-white font-numeric">৳{memberSummary.totalDeposits.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-slate-500 dark:text-slate-400">Due / Refund</p>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400 font-numeric">{memberSummary.refundable >= 0 ? '+' : ''}৳{memberSummary.refundable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                    </div>
                    {memberSummary.totalBillPayments > 0 && (
                        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Other Costs (Bill Payments)</p>
                            <p className="text-lg font-bold text-orange-600 dark:text-orange-400 font-numeric">৳{memberSummary.totalBillPayments.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Deducted from your meal fund balance</p>
                        </div>
                    )}
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
                                            ৳{d.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            {d.status === 'Approved' && <CheckCircleIcon className="w-4 h-4 text-green-500" />}
                                            {d.status === 'Pending' && <span className="text-yellow-500 text-xs">⏳ Pending</span>}
                                            {d.status === 'Rejected' && <span className="text-red-500 text-xs">❌ Rejected</span>}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-6 text-center text-slate-500 dark:text-slate-400">
                                    <p className="mb-2 text-2xl">💰</p>
                                    <p className="text-sm">No deposit history found.</p>
                                </div>
                            )
                        )}
                        {historyTab === 'expenses' && (
                            myExpenses.length > 0 ? (
                                myExpenses.slice(0, 3).map(e => (
                                    <div key={e._id} className="flex justify-between items-center text-sm p-2 bg-slate-50 dark:bg-slate-700/50 rounded-md">
                                        <span className="text-slate-700 dark:text-slate-300">{new Date(e.createdAt).toLocaleDateString()}</span>
                                        <span className="font-semibold flex items-center gap-1 text-slate-800 dark:text-white">
                                            ৳{e.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            {e.status === 'Approved' && <span className="text-green-600 dark:text-green-400 text-xs">✅ Approved</span>}
                                            {e.status === 'Pending' && <span className="text-yellow-600 dark:text-yellow-400 text-xs">⏳ Pending</span>}
                                            {e.status === 'Rejected' && <span className="text-red-600 dark:text-red-400 text-xs">❌ Rejected</span>}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-6 text-center text-slate-500 dark:text-slate-400">
                                    <p className="mb-2 text-2xl">🛒</p>
                                    <p className="text-sm">No expense history found.</p>
                                </div>
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
