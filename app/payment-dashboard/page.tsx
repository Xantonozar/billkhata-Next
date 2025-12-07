"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Role } from '@/types';
import { ExportIcon } from '@/components/Icons';
import { api } from '@/services/api';
import { useNotifications } from '@/contexts/NotificationContext';
import AppLayout from '@/components/AppLayout';
import ToastContainer from '@/components/ToastContainer';

const StatCard: React.FC<{ title: string; value: string | number; subtitle: string; children?: React.ReactNode }> = ({ title, value, subtitle, children }) => (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-md">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400">{title}</h3>
        <p className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{value}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{subtitle}</p>
        {children}
    </div>
);

const PunctualityBar: React.FC<{ name: string; percent: number }> = ({ name, percent }) => {
    const getColor = () => {
        if (percent >= 90) return 'bg-green-500';
        if (percent >= 70) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    return (
        <div className="flex items-center gap-4">
            <span className="w-12 font-medium truncate text-slate-700 dark:text-slate-300" title={name}>{name}</span>
            <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-4">
                <div className={`${getColor()} h-4 rounded-full`} style={{ width: `${percent}%` }}></div>
            </div>
            <span className="w-12 text-right font-semibold text-slate-700 dark:text-slate-300">{percent}%</span>
        </div>
    );
};

export default function PaymentDashboardPage() {
    const { user } = useAuth();
    const { addToast } = useNotifications();
    const [selectedMonth, setSelectedMonth] = useState(new Date());
    const [punctualityRange, setPunctualityRange] = useState('Last 3 Months');
    const [loading, setLoading] = useState(true);

    const [bills, setBills] = useState<any[]>([]);
    const [members, setMembers] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            if (!user?.khataId) return;

            setLoading(true);
            try {
                const [billsData, membersData] = await Promise.all([
                    api.getBillsForRoom(user.khataId),
                    api.getMembersForRoom(user.khataId)
                ]);
                setBills(billsData);
                setMembers(membersData);
            } catch (error) {
                console.error('Error fetching payment data:', error);
                addToast({ type: 'error', title: 'Error', message: 'Failed to load payment data' });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user?.khataId, addToast]);

    const monthOptions = useMemo(() => {
        const options = [];
        for (let i = 0; i < 12; i++) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            options.push(date);
        }
        return options;
    }, []);

    const currentData = useMemo(() => {
        if (loading) return null;

        const year = selectedMonth.getFullYear();
        const month = selectedMonth.getMonth();

        const monthlyBills = bills.filter(b => {
            const date = new Date(b.dueDate);
            return date.getMonth() === month && date.getFullYear() === year;
        });

        const totalAmount = monthlyBills.reduce((sum, b) => sum + b.totalAmount, 0);
        const totalBills = monthlyBills.length;

        let fullyPaidCount = 0;
        monthlyBills.forEach(bill => {
            const allPaid = bill.shares.every((s: any) => s.status === 'Paid');
            if (allPaid) fullyPaidCount++;
        });

        const pendingCount = totalBills - fullyPaidCount;
        const paidPercent = totalBills > 0 ? Math.round((fullyPaidCount / totalBills) * 100) : 0;
        const pendingPercent = totalBills > 0 ? Math.round((pendingCount / totalBills) * 100) : 0;

        const memberSummaryData = members.map(member => {
            let totalDue = 0;
            let paid = 0;
            let pending = 0;
            let unpaid = 0;
            let pendingCount = 0;
            let unpaidCount = 0;

            monthlyBills.forEach(bill => {
                const share = bill.shares.find((s: any) => String(s.userId) === String(member.id));
                if (share) {
                    totalDue += share.amount;
                    if (share.status === 'Paid') {
                        paid += share.amount;
                    } else if (share.status === 'Pending Approval') {
                        pending += share.amount;
                        pendingCount++;
                    } else {
                        unpaid += share.amount;
                        unpaidCount++;
                    }
                }
            });

            let statusText = '✅ All Paid';
            if (unpaidCount > 0 && pendingCount > 0) {
                statusText = `❌ ${unpaidCount} Unpaid | ⏳ ${pendingCount} Pending`;
            } else if (unpaidCount > 0) {
                statusText = `❌ ${unpaidCount} Unpaid`;
            } else if (pendingCount > 0) {
                statusText = `⏳ ${pendingCount} Pending`;
            }

            return {
                name: member.name,
                totalDue: `৳${totalDue.toFixed(2)}`,
                paid: `৳${paid.toFixed(2)}`,
                pending: `৳${pending.toFixed(2)}`,
                unpaid: `৳${unpaid.toFixed(2)}`,
                status: statusText
            };
        });

        const billDetailsData = monthlyBills.map(bill => {
            const shares = bill.shares || [];
            const statuses = members.map(member => {
                const share = shares.find((s: any) => String(s.userId) === String(member.id));
                if (!share) return '-';
                if (share.status === 'Paid') return '✅';
                if (share.status === 'Pending Approval') return '⏳';
                return '❌';
            });

            const paidShares = shares.filter((s: any) => s.status === 'Paid').length;
            const totalShares = shares.length;
            const progress = totalShares > 0 ? Math.round((paidShares / totalShares) * 100) + '%' : '0%';

            const splitAmount = shares.length > 0 ? shares[0].amount : 0;

            return {
                bill: bill.title,
                amount: bill.totalAmount,
                split: splitAmount,
                dueDate: new Date(bill.dueDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
                statuses,
                progress
            };
        });

        return {
            overviewData: {
                totalAmount: `৳${totalAmount.toFixed(0)}`,
                totalBills,
                billsPaid: { count: fullyPaidCount, percent: `${paidPercent}%` },
                billsPending: { count: pendingCount, percent: `${pendingPercent}%` }
            },
            memberSummaryData,
            billDetailsData
        };
    }, [bills, members, selectedMonth, loading]);

    const punctualityData = useMemo(() => {
        if (loading) return [];

        const now = new Date();
        let startDate = new Date();

        if (punctualityRange === 'Last Month') startDate.setMonth(now.getMonth() - 1);
        else if (punctualityRange === 'Last 3 Months') startDate.setMonth(now.getMonth() - 3);
        else if (punctualityRange === 'Last 6 Months') startDate.setMonth(now.getMonth() - 6);
        else if (punctualityRange === 'Last 1 Year') startDate.setFullYear(now.getFullYear() - 1);

        const rangeBills = bills.filter(b => new Date(b.dueDate) >= startDate);

        return members.map(member => {
            let totalShares = 0;
            let paidShares = 0;

            rangeBills.forEach(bill => {
                const share = bill.shares.find((s: any) => String(s.userId) === String(member.id));
                if (share) {
                    totalShares++;
                    if (share.status === 'Paid') paidShares++;
                }
            });

            const percent = totalShares > 0 ? Math.round((paidShares / totalShares) * 100) : 100;
            return { name: member.name, percent };
        }).sort((a, b) => b.percent - a.percent);

    }, [bills, members, punctualityRange, loading]);

    if (user?.role !== Role.Manager) {
        return (
            <AppLayout>
                <div className="text-center p-8">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Access Denied</h2>
                    <p className="text-slate-500 dark:text-slate-400">This page is only available for managers.</p>
                </div>
            </AppLayout>
        );
    }

    if (loading || !currentData) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary-500"></div>
                </div>
            </AppLayout>
        );
    }

    return (
        <>
            <AppLayout>
                <div className="space-y-8 animate-fade-in">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Payment Dashboard</h1>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                            <select
                                value={selectedMonth.toISOString()}
                                onChange={e => setSelectedMonth(new Date(e.target.value))}
                                className="px-4 py-2 text-sm font-semibold bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-slate-900 dark:text-white w-full sm:w-auto"
                            >
                                {monthOptions.map(month => (
                                    <option key={month.toISOString()} value={month.toISOString()}>
                                        {month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                    </option>
                                ))}
                            </select>
                            <button className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold bg-primary-600 text-white rounded-md shadow-sm hover:bg-primary-700 w-full sm:w-auto">
                                <ExportIcon className="w-4 h-4" />
                                Export
                            </button>
                        </div>
                    </div>

                    {/* Overview Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard title="💰 Total Bills Amount" value={currentData.overviewData.totalAmount} subtitle="This Month" />
                        <StatCard title="📋 Total Bills" value={currentData.overviewData.totalBills} subtitle="Categories" />
                        <StatCard title="✅ Bills Fully Paid" value={currentData.overviewData.billsPaid.count} subtitle={`${currentData.overviewData.billsPaid.percent} Collected`} />
                        <StatCard title="⏳ Bills Pending" value={currentData.overviewData.billsPending.count} subtitle={`${currentData.overviewData.billsPending.percent} Outstanding`} />
                    </div>

                    {/* Member-wise Bill Status */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden">
                        <h3 className="p-5 text-lg font-semibold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-700">Member-wise Bill Status</h3>

                        {/* Mobile Card View */}
                        <div className="block lg:hidden divide-y divide-slate-100 dark:divide-slate-700">
                            {currentData.memberSummaryData.map((member: any) => (
                                <div key={member.name} className="p-4 space-y-2">
                                    <div className="flex justify-between items-center">
                                        <p className="font-medium text-slate-900 dark:text-white text-lg">{member.name}</p>
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{member.status}</span>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2 text-sm">
                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded">
                                            <p className="text-xs text-slate-500">Total Due</p>
                                            <p className="font-bold text-slate-700 dark:text-slate-300">{member.totalDue}</p>
                                        </div>
                                        <div className="bg-green-50 dark:bg-green-900/10 p-2 rounded">
                                            <p className="text-xs text-green-600 dark:text-green-400">Paid</p>
                                            <p className="font-bold text-green-700 dark:text-green-400">{member.paid}</p>
                                        </div>
                                        <div className="bg-yellow-50 dark:bg-yellow-900/10 p-2 rounded">
                                            <p className="text-xs text-yellow-600 dark:text-yellow-400">Pending</p>
                                            <p className="font-bold text-yellow-700 dark:text-yellow-400">{member.pending}</p>
                                        </div>
                                        <div className="bg-red-50 dark:bg-red-900/10 p-2 rounded">
                                            <p className="text-xs text-red-600 dark:text-red-400">Unpaid</p>
                                            <p className="font-bold text-red-700 dark:text-red-400">{member.unpaid}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden lg:block overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 dark:bg-slate-700/50 text-xs text-slate-600 dark:text-slate-300 uppercase">
                                    <tr>
                                        <th className="px-6 py-3">Member</th>
                                        <th className="px-6 py-3 text-right">Total Due</th>
                                        <th className="px-6 py-3 text-right">Paid</th>
                                        <th className="px-6 py-3 text-right">Pending</th>
                                        <th className="px-6 py-3 text-right">Unpaid</th>
                                        <th className="px-6 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {currentData.memberSummaryData.map((member: any) => (
                                        <tr key={member.name} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{member.name}</td>
                                            <td className="px-6 py-4 text-right text-slate-700 dark:text-slate-300">{member.totalDue}</td>
                                            <td className="px-6 py-4 text-right text-green-600 dark:text-green-400 font-semibold">{member.paid}</td>
                                            <td className="px-6 py-4 text-right text-yellow-600 dark:text-yellow-400 font-semibold">{member.pending}</td>
                                            <td className="px-6 py-4 text-right text-red-600 dark:text-red-400 font-semibold">{member.unpaid}</td>
                                            <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">{member.status}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Bill Details */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden">
                        <h3 className="p-5 text-lg font-semibold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-700">Bill Details</h3>
                        <p className="px-5 py-3 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/30">Legend: ✅ Paid | ⏳ Pending Approval | ❌ Unpaid</p>

                        {/* Mobile Card View */}
                        <div className="block lg:hidden divide-y divide-slate-100 dark:divide-slate-700">
                            {currentData.billDetailsData.length === 0 ? (
                                <p className="px-5 py-4 text-center text-slate-500">No bills found</p>
                            ) : (
                                currentData.billDetailsData.map((bill: any) => (
                                    <div key={bill.bill} className="p-4 space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-bold text-slate-900 dark:text-white">{bill.bill}</h4>
                                                <p className="text-xs text-slate-500">Due: {bill.dueDate}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-slate-700 dark:text-slate-300">৳{bill.amount.toLocaleString()}</p>
                                                <p className="text-xs text-slate-500">Split: ৳{bill.split.toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            {bill.statuses.map((status: string, index: number) => (
                                                <div key={index} className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-2 rounded">
                                                    <span className="text-slate-600 dark:text-slate-400 truncate max-w-[80px]">{members[index]?.name.split(' ')[0]}</span>
                                                    <span>{status}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-700/50">
                                            <span className="text-xs font-medium text-slate-500">Progress</span>
                                            <span className="text-sm font-bold text-primary-600 dark:text-primary-400">{bill.progress}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden lg:block overflow-x-auto">
                            <table className="w-full text-sm text-center">
                                <thead className="bg-slate-50 dark:bg-slate-700/50 text-xs text-slate-600 dark:text-slate-300 uppercase">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Bill</th>
                                        <th className="px-4 py-3">Amount</th>
                                        <th className="px-4 py-3">Split</th>
                                        <th className="px-4 py-3">Due Date</th>
                                        {members.map(m => (
                                            <th key={m.id} className="px-4 py-3">{m.name.split(' ')[0]}</th>
                                        ))}
                                        <th className="px-4 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {currentData.billDetailsData.length === 0 ? (
                                        <tr>
                                            <td colSpan={5 + members.length} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">No bills found for this month</td>
                                        </tr>
                                    ) : (
                                        currentData.billDetailsData.map((bill: any) => (
                                            <tr key={bill.bill} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                                <td className="px-4 py-3 text-left font-medium text-slate-900 dark:text-white">{bill.bill}</td>
                                                <td className="px-4 py-3 text-slate-700 dark:text-slate-300">৳{bill.amount.toLocaleString()}</td>
                                                <td className="px-4 py-3 text-slate-700 dark:text-slate-300">৳{bill.split.toLocaleString()}</td>
                                                <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{bill.dueDate}</td>
                                                {bill.statuses.map((status: string, index: number) => (
                                                    <td key={index} className="px-4 py-3">{status}</td>
                                                ))}
                                                <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">{bill.progress}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Payment Punctuality */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-5">
                        <div className="flex flex-wrap gap-4 justify-between items-center">
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Payment Punctuality</h3>
                            <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-700 p-1 rounded-md">
                                {['Last Month', 'Last 3 Months', 'Last 6 Months', 'Last 1 Year'].map(range => (
                                    <button key={range} onClick={() => setPunctualityRange(range)} className={`px-2 py-1 text-xs font-semibold rounded ${punctualityRange === range ? 'bg-white dark:bg-slate-600 shadow text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-300'}`}>
                                        {range}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="mt-4 space-y-3 text-sm">
                            {punctualityData.map(p => <PunctualityBar key={p.name} name={p.name} percent={p.percent} />)}
                        </div>
                        <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">Green: &gt;90% | Yellow: 70-90% | Red: &lt;70%</p>
                    </div>
                </div>
            </AppLayout>
            <ToastContainer />
        </>
    );
}
