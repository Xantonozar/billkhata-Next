import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { api } from '@/services/api';
import { CheckCircleIcon } from '@/components/Icons';
import { Roster, AddDepositModal, AddExpenseModal } from './Modals';
import { Plus, Banknote } from 'lucide-react';

interface MemberShoppingViewProps {
    selectedPeriodId: string | null;
    isActivePeriod: boolean;
}

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

const MemberShoppingView: React.FC<MemberShoppingViewProps> = ({ selectedPeriodId, isActivePeriod }) => {
    const { user } = useAuth();
    const router = useRouter();
    const { addToast } = useNotifications();
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [historyTab, setHistoryTab] = useState<'deposits' | 'expenses'>('deposits');
    const [roster, setRoster] = useState(emptyRoster);
    const [myDeposits, setMyDeposits] = useState<any[]>([]);
    const [myExpenses, setMyExpenses] = useState<any[]>([]);
    const [memberSummary, setMemberSummary] = useState(initialMemberSummary);
    const [fundStatus, setFundStatus] = useState<{ totalMeals: number; rate: number } | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user?.khataId) {
            const fetchData = async () => {
                setLoading(true);
                try {
                    const [summaryData, rosterItems, deposits, expenses] = await Promise.all([
                        api.getShoppingSummary(user.khataId as string, selectedPeriodId || undefined),
                        isActivePeriod ? api.getShoppingRoster(user.khataId as string) : Promise.resolve([]),
                        api.getDeposits(user.khataId as string, { limit: 50, calculationPeriodId: selectedPeriodId || undefined }),
                        api.getExpenses(user.khataId as string, { limit: 50, calculationPeriodId: selectedPeriodId || undefined })
                    ]);

                    if (summaryData?.memberSummary) {
                        setMemberSummary(summaryData.memberSummary);
                    }

                    if (summaryData?.fundStatus) {
                        setFundStatus({
                            totalMeals: summaryData.fundStatus.totalMeals || 0,
                            rate: summaryData.fundStatus.rate || 0
                        });
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
                    } else {
                        setRoster(emptyRoster);
                    }

                    // Deposits should be array
                    const myDepositsFiltered = (deposits || []).filter((d: any) => (d.userId?._id || d.userId) === user.id);
                    setMyDeposits(myDepositsFiltered);

                    // Expenses should be array
                    const expensesList = Array.isArray(expenses) ? expenses : ((expenses as any)?.data || []);
                    const myExpensesFiltered = expensesList.filter((e: any) => (e.userId?._id || e.userId) === user.id);
                    setMyExpenses(myExpensesFiltered);

                } catch (error) {
                    console.error("Error fetching member shopping data", error);
                    addToast({ type: 'error', title: 'Error', message: "Failed to load data" });
                } finally {
                    setLoading(false);
                }
            };

            fetchData();
        }
    }, [user?.khataId, user?.id, selectedPeriodId, isActivePeriod, addToast]);

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
            api.getDeposits(user.khataId, { limit: 50, calculationPeriodId: selectedPeriodId || undefined }).then(deposits => {
                const myOwn = (deposits || []).filter((d: any) => (d.userId?._id || d.userId) === user.id);
                setMyDeposits(myOwn);
            });
            api.getShoppingSummary(user.khataId, selectedPeriodId || undefined).then(data => {
                if (data && data.memberSummary) {
                    setMemberSummary(data.memberSummary);
                }
            });
        }
    };

    const handleExpenseSubmit = () => {
        // Refresh expenses
        if (user?.khataId) {
            api.getExpenses(user.khataId, { limit: 50, calculationPeriodId: selectedPeriodId || undefined }).then(expenses => {
                const expensesList = Array.isArray(expenses) ? expenses : ((expenses as any)?.data || []);
                const myOwn = expensesList.filter((e: any) => (e.userId?._id || e.userId) === user.id);
                setMyExpenses(myOwn);
            });
        }
    };

    return (
        <>
            <div className="space-y-6">
                {isActivePeriod && (
                    <div className="bg-primary-50 dark:bg-primary-500/10 p-4 rounded-lg text-center">
                        <p className="font-semibold text-primary-700 dark:text-primary-300">{dutyText}</p>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => setIsDepositModalOpen(true)}
                        className={`flex items-center justify-center py-4 rounded-xl shadow-md font-semibold transition-transform active:scale-95 ${!isActivePeriod ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:scale-105'}`}
                        disabled={!isActivePeriod}
                    >
                        <Banknote className="w-5 h-5 mr-2" />
                        Add Deposit
                    </button>
                    <button
                        onClick={() => setIsExpenseModalOpen(true)}
                        className={`flex items-center justify-center py-4 rounded-xl shadow-md font-semibold transition-transform active:scale-95 ${!isActivePeriod ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:scale-105'}`}
                        disabled={!isActivePeriod}
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Add Expense
                    </button>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
                    <div className="flex flex-row items-center justify-between pb-2 p-0 mb-4">
                        <h3 className="text-lg font-medium">My Contributions</h3>
                    </div>
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

                {fundStatus && fundStatus.totalMeals > 0 ? (
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
                        <div className="flex flex-row items-center justify-between pb-2 p-0 mb-4">
                            <h3 className="text-lg font-medium">Meal Statistics</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                                <p className="text-sm text-slate-500 dark:text-slate-400">Total Meals</p>
                                <p className="text-2xl font-bold text-slate-800 dark:text-white font-numeric">{fundStatus.totalMeals.toLocaleString()}</p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">All members</p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-slate-500 dark:text-slate-400">Meal Rate</p>
                                <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 font-numeric">৳{fundStatus.rate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Per meal</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-6">
                        <div className="flex flex-col items-center justify-center text-center py-4">
                            <span className="text-4xl mb-3 opacity-50">📊</span>
                            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1">No meal data yet</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Meal statistics will appear once meals are recorded in the current calculation period</p>
                        </div>
                    </div>
                )}

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
                                            {d.status === 'Approved' &&
                                                // Assuming CheckCircleIcon is available, else simple check mark
                                                <CheckCircleIcon className="w-4 h-4 text-green-500" />
                                            }
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
                                    <div key={e._id} className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded-md">
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-slate-900 dark:text-white">{e.items}</p>
                                                {e.notes && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{e.notes}</p>}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-sm text-slate-800 dark:text-white">৳{e.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                {e.status === 'Approved' && <span className="text-green-600 dark:text-green-400 text-xs">✅</span>}
                                                {e.status === 'Pending' && <span className="text-yellow-600 dark:text-yellow-400 text-xs">⏳</span>}
                                                {e.status === 'Rejected' && <span className="text-red-600 dark:text-red-400 text-xs">❌</span>}
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(e.createdAt).toLocaleDateString()}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-6 text-center text-slate-500 dark:text-slate-400">
                                    <p className="mb-2 text-2xl">🛒</p>
                                    <p className="text-sm">No expense history found.</p>
                                </div>
                            )
                        )}
                        {/* <button onClick={() => router.push('/shopping/history')} className="text-sm font-semibold text-primary-600 hover:underline mt-2 w-full text-center p-2 dark:text-primary-400">View All →</button> */}
                    </div>
                </div>
            </div>

            {isDepositModalOpen && <AddDepositModal onClose={() => setIsDepositModalOpen(false)} onSubmit={handleDepositSubmit} />}
            {isExpenseModalOpen && <AddExpenseModal onClose={() => setIsExpenseModalOpen(false)} onSubmit={handleExpenseSubmit} />}
        </>
    );
};

export default MemberShoppingView;
