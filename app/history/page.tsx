"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { useNotifications } from '@/contexts/NotificationContext';
import AppLayout from '@/components/AppLayout';
import ToastContainer from '@/components/ToastContainer';
import { Role } from '@/types';

interface MemberSummary {
    memberId: string;
    memberName: string;
    billsDue: number;
    paid: number;
    pending: number;
    unpaid: number;
    totalMeals: number;
    deposits: number;
    refundOrDue: number;
}

export default function HistoryPage() {
    const { user } = useAuth();
    const { addToast } = useNotifications();
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(new Date());
    const [selectedMember, setSelectedMember] = useState<string>('all');
    const [selectedCostType, setSelectedCostType] = useState<string>('all');

    // Data states
    const [meals, setMeals] = useState<any[]>([]);
    const [deposits, setDeposits] = useState<any[]>([]);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [bills, setBills] = useState<any[]>([]);
    const [members, setMembers] = useState<any[]>([]);
    const [previousMonthMeals, setPreviousMonthMeals] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            if (!user?.khataId) return;

            setLoading(true);
            try {
                const year = selectedMonth.getFullYear();
                const month = selectedMonth.getMonth();
                const startDate = new Date(year, month, 1);
                const endDate = new Date(year, month + 1, 0);

                const requests = [
                    api.getMeals(user.khataId, startDate.toISOString(), endDate.toISOString()),
                    api.getDeposits(user.khataId),
                    api.getExpenses(user.khataId),
                    api.getBillsForRoom(user.khataId),
                    api.getMembersForRoom(user.khataId),
                ];

                // Fetch previous month meals for comparison if user is member
                if (user.role !== Role.Manager) {
                    const prevStartDate = new Date(year, month - 1, 1);
                    const prevEndDate = new Date(year, month, 0);
                    requests.push(api.getMeals(user.khataId, prevStartDate.toISOString(), prevEndDate.toISOString()));
                } else {
                    requests.push(Promise.resolve([]));
                }

                const results = await Promise.all(requests);

                const mealsData = results[0];
                const depositsData = results[1];
                const expensesData = results[2];
                const billsData = results[3];
                const membersData = results[4];
                const prevMonthMealsData = results[5] || [];

                const filteredDeposits = depositsData.filter((d: any) => {
                    const date = new Date(d.createdAt);
                    return date.getMonth() === month && date.getFullYear() === year;
                });

                const filteredExpenses = expensesData.filter((e: any) => {
                    const date = new Date(e.createdAt);
                    return date.getMonth() === month && date.getFullYear() === year;
                });

                const filteredBills = billsData.filter((b: any) => {
                    const date = new Date(b.dueDate);
                    return date.getMonth() === month && date.getFullYear() === year;
                });

                setMeals(mealsData);
                setDeposits(filteredDeposits);
                setExpenses(filteredExpenses);
                setBills(filteredBills);
                setMembers(membersData);
                setPreviousMonthMeals(prevMonthMealsData);
            } catch (error) {
                console.error('Error fetching history data:', error);
                addToast({ type: 'error', title: 'Error', message: 'Failed to load history data' });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user?.khataId, selectedMonth, addToast, user?.role]);

    const monthlySummary = useMemo(() => {
        const totalBills = bills.reduce((sum, bill) => sum + bill.totalAmount, 0);

        let totalPaid = 0;
        let totalPending = 0;
        let totalUnpaid = 0;
        bills.forEach(bill => {
            bill.shares.forEach((share: any) => {
                if (share.status === 'Paid') {
                    totalPaid += share.amount;
                } else if (share.status === 'Pending Approval') {
                    totalPending += share.amount;
                } else {
                    totalUnpaid += share.amount;
                }
            });
        });

        const totalDeposits = deposits
            .filter(d => d.status === 'Approved')
            .reduce((sum, d) => sum + d.amount, 0);

        const totalMealCost = expenses
            .filter(e => e.status === 'Approved')
            .reduce((sum, e) => sum + e.amount, 0);

        const totalMealCount = meals.reduce((sum, meal) => sum + (meal.totalMeals || 0), 0);
        const mealRate = totalMealCount > 0 ? totalMealCost / totalMealCount : 0;
        const totalDue = totalDeposits - totalMealCost;

        const memberMealCounts: { [key: string]: { name: string; count: number } } = {};
        meals.forEach(meal => {
            const userId = meal.userId;
            const userName = meal.userName || 'Unknown';
            if (!memberMealCounts[userId]) {
                memberMealCounts[userId] = { name: userName, count: 0 };
            }
            memberMealCounts[userId].count += meal.totalMeals || 0;
        });

        const mealCountValues = Object.values(memberMealCounts);
        const minMealTaker = mealCountValues.length > 0
            ? mealCountValues.reduce((min, curr) => curr.count < min.count ? curr : min)
            : { name: 'N/A', count: 0 };
        const maxMealTaker = mealCountValues.length > 0
            ? mealCountValues.reduce((max, curr) => curr.count > max.count ? curr : max)
            : { name: 'N/A', count: 0 };
        return {
            totalBills,
            totalPaid,
            totalPending,
            totalUnpaid,
            totalDeposits,
            totalMealCost,
            totalDue,
            totalMeals: totalMealCount,
            minMealTaker: minMealTaker.name,
            maxMealTaker: maxMealTaker.name,
            mealRate: Number(mealRate.toFixed(2)) // Ensure 2 decimal places
        };
    }, [meals, deposits, bills, expenses]);

    const memberBreakdown = useMemo(() => {
        const breakdown: MemberSummary[] = [];
        const mealRate = monthlySummary.mealRate;

        members.forEach(member => {
            let memberBillsDue = 0;
            let memberPaid = 0;
            let memberPending = 0;
            let memberUnpaid = 0;

            bills.forEach(bill => {
                const share = bill.shares.find((s: any) => s.userId === member.id);
                if (share) {
                    memberBillsDue += share.amount;
                    if (share.status === 'Paid') {
                        memberPaid += share.amount;
                    } else if (share.status === 'Pending Approval') {
                        memberPending += share.amount;
                    } else {
                        memberUnpaid += share.amount;
                    }
                }
            });

            const memberMeals = meals.filter(m => {
                const mealUserId = m.userId?._id || m.userId;
                return String(mealUserId) === String(member.id);
            });
            const memberMealCount = memberMeals.reduce((sum, m) => sum + (m.totalMeals || 0), 0);
            const memberMealCost = memberMealCount * mealRate;

            const memberDeposits = deposits
                .filter(d => {
                    const depositUserId = d.userId?._id || d.userId;
                    return String(depositUserId) === String(member.id) && d.status === 'Approved';
                })
                .reduce((sum, d) => sum + d.amount, 0);

            const refundOrDue = memberDeposits - memberMealCost;

            breakdown.push({
                memberId: member.id,
                memberName: member.name,
                billsDue: memberBillsDue,
                paid: memberPaid,
                pending: memberPending,
                unpaid: memberUnpaid,
                totalMeals: memberMealCount,
                deposits: memberDeposits,
                refundOrDue
            });
        });

        return breakdown;
    }, [members, meals, deposits, bills, monthlySummary.mealRate]);

    const filteredBreakdown = useMemo(() => {
        if (selectedMember === 'all') return memberBreakdown;
        return memberBreakdown.filter(m => m.memberId === selectedMember);
    }, [memberBreakdown, selectedMember]);

    const formatCurrency = (amount: number) => `৳${amount.toFixed(2)}`;

    const getMonthYearString = () => {
        return selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    const monthOptions = useMemo(() => {
        const options = [];
        for (let i = 0; i < 12; i++) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            options.push(date);
        }
        return options;
    }, []);

    if (!user) return null;

    if (loading) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary-500"></div>
                </div>
            </AppLayout>
        );
    }

    const MemberStats = () => {
        if (!user) return null;

        // Calculate member specific stats
        const myMeals = meals.filter(m => (m.userId?._id || m.userId) === user.id);
        const myTotalMeals = myMeals.reduce((sum, m) => sum + (m.totalMeals || 0), 0);

        const myPrevMeals = previousMonthMeals.filter(m => (m.userId?._id || m.userId) === user.id);
        const myPrevTotalMeals = myPrevMeals.reduce((sum, m) => sum + (m.totalMeals || 0), 0);

        const mealDiff = myTotalMeals - myPrevTotalMeals;

        // Calculate my bills
        let myBillsDue = 0;
        let myPaid = 0;
        let myPending = 0;
        let myUnpaid = 0;

        bills.forEach(bill => {
            const share = bill.shares.find((s: any) => s.userId === user.id);
            if (share) {
                myBillsDue += share.amount;
                if (share.status === 'Paid') {
                    myPaid += share.amount;
                } else if (share.status === 'Pending Approval') {
                    myPending += share.amount;
                } else {
                    myUnpaid += share.amount;
                }
            }
        });

        const myApprovedDeposits = deposits
            .filter(d => (d.userId?._id || d.userId) === user.id && d.status === 'Approved')
            .reduce((sum, d) => sum + d.amount, 0);

        const myShoppingCost = expenses
            .filter(e => (e.userId?._id || e.userId) === user.id && e.status === 'Approved')
            .reduce((sum, e) => sum + e.amount, 0);

        const myMealCost = myTotalMeals * monthlySummary.mealRate;


        return (
            <div className="space-y-6">
                {/* Personal Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">My Total Meals</p>
                        <div className="flex items-end gap-2">
                            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{myTotalMeals}</h3>
                            <div className={`text-xs font-medium px-1.5 py-0.5 rounded ${mealDiff >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {mealDiff > 0 ? '+' : ''}{mealDiff} from last mo.
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">My Bills</p>
                        <div className="flex flex-col">
                            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{formatCurrency(myBillsDue)}</h3>
                            <div className="flex flex-wrap gap-2 text-xs mt-1">
                                <span className="text-green-600 font-medium">Paid: {formatCurrency(myPaid)}</span>
                                <span className="text-yellow-600 font-medium">Pending: {formatCurrency(myPending)}</span>
                                <span className="text-red-600 font-medium">Unpaid: {formatCurrency(myUnpaid)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Shopping Cost</p>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{formatCurrency(myShoppingCost)}</h3>
                        <p className="text-xs text-slate-400 mt-1">Approved expenses</p>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Estimated Meal Cost</p>
                        <h3 className="text-2xl font-bold text-primary-600">{formatCurrency(myMealCost)}</h3>
                        <p className="text-xs text-slate-400 mt-1">@ {formatCurrency(monthlySummary.mealRate)} / meal</p>
                    </div>
                </div>

                {/* Monthly Global Stats (Simplified for Member) */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/50">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Mess Overview ({getMonthYearString()})</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                            <p className="text-xs text-slate-500 mb-1">Current Meal Rate</p>
                            <p className="text-xl font-bold text-primary-600">{formatCurrency(monthlySummary.mealRate)}</p>
                        </div>
                        <div className="p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                            <p className="text-xs text-slate-500 mb-1">Total Mess Meals</p>
                            <p className="text-xl font-bold text-slate-800 dark:text-white">{monthlySummary.totalMeals}</p>
                        </div>
                        <div className="p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                            <p className="text-xs text-slate-500 mb-1">Total Expenses</p>
                            <p className="text-xl font-bold text-slate-800 dark:text-white">{formatCurrency(monthlySummary.totalMealCost)}</p>
                        </div>
                        <div className="p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                            <p className="text-xs text-slate-500 mb-1">Total Deposits</p>
                            <p className="text-xl font-bold text-slate-800 dark:text-white">{formatCurrency(monthlySummary.totalDeposits)}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            <AppLayout>
                <div className="space-y-8 animate-fade-in pb-12">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="p-2 sm:p-3 bg-slate-100 dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700/50">
                                <span className="text-2xl sm:text-3xl">📊</span>
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">History & Reports</h1>
                                <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">Financial overview and member insights</p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            <div className="relative group flex-1 sm:flex-none">
                                <select
                                    value={selectedMonth.toISOString()}
                                    onChange={(e) => setSelectedMonth(new Date(e.target.value))}
                                    className="w-full appearance-none pl-4 pr-10 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-lg text-sm sm:text-base"
                                >
                                    {monthOptions.map(month => (
                                        <option key={month.toISOString()} value={month.toISOString()}>
                                            {month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    ▼
                                </div>
                            </div>
                            {user.role === Role.Manager && (
                                <button className="flex-1 sm:flex-none justify-center px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-primary-500/20 flex items-center gap-2 active:scale-95 text-sm sm:text-base">
                                    <span>📥</span> Export
                                </button>
                            )}
                        </div>
                    </div>

                    {user.role === Role.Manager ? (
                        <>
                            {/* Filters */}
                            <div className="flex flex-col sm:flex-row flex-wrap gap-3 bg-slate-100 dark:bg-slate-800/50 p-2 rounded-2xl border border-slate-200 dark:border-slate-700/30 backdrop-blur-sm w-full sm:w-fit">
                                <select
                                    value={selectedMember}
                                    onChange={(e) => setSelectedMember(e.target.value)}
                                    className="px-4 py-2 bg-white dark:bg-slate-800 border-0 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer w-full sm:min-w-[150px] text-sm sm:text-base"
                                >
                                    <option value="all">All Members</option>
                                    {members.map(member => (
                                        <option key={member.id} value={member.id}>{member.name}</option>
                                    ))}
                                </select>
                                <div className="hidden sm:block w-px bg-slate-300 dark:bg-slate-700 my-1"></div>
                                <select
                                    value={selectedCostType}
                                    onChange={(e) => setSelectedCostType(e.target.value)}
                                    className="px-4 py-2 bg-white dark:bg-slate-800 border-0 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer w-full sm:min-w-[150px] text-sm sm:text-base"
                                >
                                    <option value="all">All Costs</option>
                                    <option value="bills">Bills Only</option>
                                    <option value="meals">Meals Only</option>
                                    <option value="deposits">Deposits Only</option>
                                </select>
                            </div>

                            {/* Monthly Summary Card */}
                            <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700/50 p-4 sm:p-8 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 dark:bg-primary-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary-500/10 transition-colors duration-500"></div>

                                <div className="flex items-center justify-between mb-6 sm:mb-8 relative z-10">
                                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        <span className="w-1 h-5 sm:h-6 bg-primary-500 rounded-full"></span>
                                        {getMonthYearString()} Summary
                                    </h2>
                                    <div className="px-3 py-1 bg-slate-200 dark:bg-slate-700/50 rounded-full border border-slate-300 dark:border-slate-600/50 text-[10px] sm:text-xs font-medium text-slate-600 dark:text-slate-400">
                                        Real-time Data
                                    </div>
                                </div>

                                <div className="space-y-6 sm:space-y-8 relative z-10">
                                    {/* Row 1 */}
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
                                        <div className="flex justify-between items-center p-4 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/30 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
                                            <div className="flex flex-col">
                                                <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Bills</span>
                                                <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">{formatCurrency(monthlySummary.totalBills)}</span>
                                            </div>
                                            <span className="text-2xl opacity-50">📄</span>
                                        </div>
                                        <div className="flex justify-between items-center p-4 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/30 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
                                            <div className="flex flex-col">
                                                <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Paid</span>
                                                <span className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{formatCurrency(monthlySummary.totalPaid)}</span>
                                            </div>
                                            <span className="text-2xl opacity-50">✅</span>
                                        </div>
                                        <div className="flex justify-between items-center p-4 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/30 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
                                            <div className="flex flex-col">
                                                <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Pending Approval</span>
                                                <span className="text-xl sm:text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{formatCurrency(monthlySummary.totalPending)}</span>
                                            </div>
                                            <span className="text-2xl opacity-50">⏳</span>
                                        </div>
                                        <div className="flex justify-between items-center p-4 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/30 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
                                            <div className="flex flex-col">
                                                <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Unpaid</span>
                                                <span className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{formatCurrency(monthlySummary.totalUnpaid)}</span>
                                            </div>
                                            <span className="text-2xl opacity-50">❌</span>
                                        </div>
                                    </div>

                                    {/* Row 2 */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8 border-t border-slate-200 dark:border-slate-700/50 pt-6 sm:pt-8">
                                        <div className="flex justify-between items-center group/item">
                                            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 group-hover/item:text-slate-600 dark:group-hover/item:text-slate-300 transition-colors">Total Deposits:</p>
                                            <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(monthlySummary.totalDeposits)}</p>
                                        </div>
                                        <div className="flex justify-between items-center group/item">
                                            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 group-hover/item:text-slate-600 dark:group-hover/item:text-slate-300 transition-colors">Total Meal Cost:</p>
                                            <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(monthlySummary.totalMealCost)}</p>
                                        </div>
                                        <div className="flex justify-between items-center group/item">
                                            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 group-hover/item:text-slate-600 dark:group-hover/item:text-slate-300 transition-colors">Total Due:</p>
                                            <p className={`text-lg sm:text-xl font-bold ${monthlySummary.totalDue < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                                {formatCurrency(monthlySummary.totalDue)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Row 3 */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8 border-t border-slate-200 dark:border-slate-700/50 pt-6 sm:pt-8">
                                        <div className="flex justify-between items-center group/item">
                                            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 group-hover/item:text-slate-600 dark:group-hover/item:text-slate-300 transition-colors">Total Meals:</p>
                                            <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">{monthlySummary.totalMeals}</p>
                                        </div>
                                        <div className="flex justify-between items-center group/item">
                                            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 group-hover/item:text-slate-600 dark:group-hover/item:text-slate-300 transition-colors">Meal Rate:</p>
                                            <p className="text-lg sm:text-xl font-bold text-primary-600 dark:text-primary-400">{formatCurrency(monthlySummary.mealRate)}</p>
                                        </div>
                                        <div className="flex justify-between items-center group/item">
                                            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 group-hover/item:text-slate-600 dark:group-hover/item:text-slate-300 transition-colors">Max Meal Taker:</p>
                                            <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">{monthlySummary.maxMealTaker}</p>
                                        </div>
                                    </div>

                                    {/* Row 4 */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8 border-t border-slate-200 dark:border-slate-700/50 pt-6 sm:pt-8">
                                        <div className="flex justify-between items-center group/item">
                                            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 group-hover/item:text-slate-600 dark:group-hover/item:text-slate-300 transition-colors">Min Meal Taker:</p>
                                            <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">{monthlySummary.minMealTaker}</p>
                                        </div>
                                        <div className="hidden md:block"></div>
                                        <div className="hidden md:block"></div>
                                    </div>
                                </div>
                            </div>

                            {/* Member Breakdown Results */}
                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden">
                                <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700/50 flex items-center justify-between">
                                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        <span className="w-1 h-5 sm:h-6 bg-primary-500 rounded-full"></span>
                                        Member Breakdown
                                    </h2>
                                    <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">{filteredBreakdown.length} Members</span>
                                </div>

                                {/* Mobile Card View */}
                                <div className="block lg:hidden">
                                    {filteredBreakdown.length === 0 ? (
                                        <div className="p-8 text-center text-slate-500 dark:text-slate-500">
                                            <div className="flex flex-col items-center gap-2">
                                                <span className="text-3xl opacity-50">📭</span>
                                                <p>No data available for this period</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-slate-200 dark:divide-slate-700">
                                            {filteredBreakdown.map((member) => (
                                                <div key={member.memberId} className="p-4 space-y-3">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-sm font-bold text-primary-600 dark:text-primary-400 border border-slate-300 dark:border-slate-600">
                                                            {member.memberName.charAt(0)}
                                                        </div>
                                                        <span className="font-bold text-slate-900 dark:text-white text-lg">
                                                            {member.memberName}
                                                        </span>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                                        <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                                                            <p className="text-slate-500 dark:text-slate-400 text-xs">Total Meals</p>
                                                            <p className="font-semibold text-slate-900 dark:text-white">{member.totalMeals}</p>
                                                        </div>
                                                        <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                                                            <p className="text-slate-500 dark:text-slate-400 text-xs">Bills Due</p>
                                                            <p className="font-semibold text-slate-900 dark:text-white">{formatCurrency(member.billsDue)}</p>
                                                        </div>
                                                        <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                                                            <p className="text-slate-500 dark:text-slate-400 text-xs">Paid</p>
                                                            <p className="font-bold text-green-600 dark:text-green-400">{formatCurrency(member.paid)}</p>
                                                        </div>
                                                        <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                                                            <p className="text-slate-500 dark:text-slate-400 text-xs">Pending</p>
                                                            <p className="font-bold text-yellow-600 dark:text-yellow-400">{formatCurrency(member.pending)}</p>
                                                        </div>
                                                        <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                                                            <p className="text-slate-500 dark:text-slate-400 text-xs">Deposits</p>
                                                            <p className="font-semibold text-slate-900 dark:text-white">{formatCurrency(member.deposits)}</p>
                                                        </div>
                                                    </div>

                                                    <div className={`p-3 rounded-lg flex justify-between items-center ${member.refundOrDue < 0
                                                        ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                                                        : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                                        }`}>
                                                        <span className="font-medium text-xs uppercase tracking-wide">
                                                            {member.refundOrDue < 0 ? 'Due' : 'Refund'}
                                                        </span>
                                                        <span className="font-bold text-lg">
                                                            {formatCurrency(Math.abs(member.refundOrDue))}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Desktop Table View */}
                                <div className="hidden lg:block overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-slate-50 dark:bg-slate-900/50">
                                            <tr>
                                                <th className="px-8 py-5 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Member</th>
                                                <th className="px-8 py-5 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Total Meals</th>
                                                <th className="px-8 py-5 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Bills</th>
                                                <th className="px-8 py-5 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Paid</th>
                                                <th className="px-8 py-5 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Pending</th>
                                                <th className="px-8 py-5 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Deposits</th>
                                                <th className="px-8 py-5 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Refund/Due</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
                                            {filteredBreakdown.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="px-8 py-12 text-center text-slate-500 dark:text-slate-500">
                                                        <div className="flex flex-col items-center gap-2">
                                                            <span className="text-3xl opacity-50">📭</span>
                                                            <p>No data available for this period</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredBreakdown.map((member, index) => (
                                                    <tr
                                                        key={member.memberId}
                                                        className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group"
                                                    >
                                                        <td className="px-8 py-5 whitespace-nowrap">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-primary-600 dark:text-primary-400 border border-slate-300 dark:border-slate-600">
                                                                    {member.memberName.charAt(0)}
                                                                </div>
                                                                <span className="font-semibold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                                                    {member.memberName}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-5 whitespace-nowrap text-slate-700 dark:text-slate-300 font-medium">
                                                            {member.totalMeals}
                                                        </td>
                                                        <td className="px-8 py-5 whitespace-nowrap text-slate-700 dark:text-slate-300 font-medium">
                                                            {formatCurrency(member.billsDue)}
                                                        </td>
                                                        <td className="px-8 py-5 whitespace-nowrap text-green-600 dark:text-green-400 font-bold">
                                                            {formatCurrency(member.paid)}
                                                        </td>
                                                        <td className="px-8 py-5 whitespace-nowrap text-yellow-600 dark:text-yellow-400 font-bold">
                                                            {formatCurrency(member.pending)}
                                                        </td>
                                                        <td className="px-8 py-5 whitespace-nowrap text-slate-700 dark:text-slate-300 font-medium">
                                                            {formatCurrency(member.deposits)}
                                                        </td>
                                                        <td className={`px-8 py-5 whitespace-nowrap font-bold ${member.refundOrDue < 0
                                                            ? 'text-red-600 dark:text-red-400'
                                                            : 'text-green-600 dark:text-green-400'
                                                            }`}>
                                                            {formatCurrency(member.refundOrDue)}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    ) : (
                        <MemberStats />
                    )}
                </div>
            </AppLayout>
            <ToastContainer />
        </>
    );
}
