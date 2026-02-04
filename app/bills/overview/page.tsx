"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import type { Bill, PaymentStatus } from '@/types';
import { Role } from '@/types';
import { HomeIcon, ElectricityIcon, WaterIcon, GasIcon, WifiIcon, MaidIcon, OtherIcon } from '@/components/Icons';
import AppLayout from '@/components/AppLayout';
import { BillsOverviewSkeleton } from '@/components/skeletons/BillCardSkeleton';

// Vivid color mappings for payment status
const statusColors: Record<PaymentStatus, string> = {
    'Paid': 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30 earthy-green:bg-[#d1e0a8]/40 earthy-green:text-[#4b5842] earthy-green:border-[#b7ce63]/50',
    'Pending Approval': 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30 earthy-green:bg-[#f2daff]/20 earthy-green:text-[#6d8b2a] earthy-green:border-[#c7d59f]',
    'Unpaid': 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30 earthy-green:bg-[#f4f6f3] earthy-green:text-[#8826b9]/80 earthy-green:border-[#daddd8]',
    'Overdue': 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30 earthy-green:bg-red-50 earthy-green:text-red-800 earthy-green:border-red-200',
};

const categoryConfig: Record<string, { icon: React.ReactElement<{ className?: string }>, gradient: string, shadow: string, text: string, accent: string }> = {
    'Rent': {
        icon: <HomeIcon className="w-6 h-6" />,
        gradient: "from-fuchsia-50 to-pink-50 dark:from-fuchsia-950/30 dark:to-pink-900/20 earthy-green:from-[#f4f6f3] earthy-green:to-[#daddd8]",
        shadow: "shadow-pink-100 dark:shadow-pink-900/20 earthy-green:shadow-[#daddd8]",
        text: "text-pink-600 dark:text-pink-400 earthy-green:text-[#4b5842]",
        accent: "bg-pink-500 dark:bg-pink-400 earthy-green:bg-[#a3c24d]"
    },
    'Electricity': {
        icon: <ElectricityIcon className="w-6 h-6" />,
        gradient: "from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-900/20 earthy-green:from-[#fcfdf9] earthy-green:to-[#f4f6f3]",
        shadow: "shadow-amber-100 dark:shadow-amber-900/20 earthy-green:shadow-[#c7d59f]",
        text: "text-amber-600 dark:text-amber-400 earthy-green:text-[#6d8b2a]",
        accent: "bg-amber-500 dark:bg-amber-400 earthy-green:bg-[#b7ce63]"
    },
    'Water': {
        icon: <WaterIcon className="w-6 h-6" />,
        gradient: "from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-900/20 earthy-green:from-[#eff6ff] earthy-green:to-[#dbeafe]",
        shadow: "shadow-blue-100 dark:shadow-blue-900/20 earthy-green:shadow-blue-100",
        text: "text-blue-600 dark:text-blue-400 earthy-green:text-[#3a4433]",
        accent: "bg-blue-500 dark:bg-blue-400 earthy-green:bg-[#8fb339]"
    },
    'Gas': {
        icon: <GasIcon className="w-6 h-6" />,
        gradient: "from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-900/20 earthy-green:from-[#fff7ed] earthy-green:to-[#ffedd5]",
        shadow: "shadow-orange-100 dark:shadow-orange-900/20 earthy-green:shadow-orange-100",
        text: "text-orange-600 dark:text-orange-400 earthy-green:text-[#8826b9]",
        accent: "bg-orange-500 dark:bg-orange-400 earthy-green:bg-[#d17eff]"
    },
    'Wi-Fi': {
        icon: <WifiIcon className="w-6 h-6" />,
        gradient: "from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-900/20 earthy-green:from-[#f0fdf4] earthy-green:to-[#dcfce7]",
        shadow: "shadow-purple-100 dark:shadow-purple-900/20 earthy-green:shadow-green-100",
        text: "text-violet-600 dark:text-violet-400 earthy-green:text-[#4b5842]",
        accent: "bg-violet-500 dark:bg-violet-400 earthy-green:bg-[#6d8b2a]"
    },
    'Maid': {
        icon: <MaidIcon className="w-6 h-6" />,
        gradient: "from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-900/20 earthy-green:from-[#f5f3ff] earthy-green:to-[#ede9fe]",
        shadow: "shadow-emerald-100 dark:shadow-emerald-900/20 earthy-green:shadow-purple-100",
        text: "text-teal-600 dark:text-teal-400 earthy-green:text-[#3a4433]",
        accent: "bg-teal-500 dark:bg-teal-400 earthy-green:bg-[#a3c24d]"
    },
    'Others': {
        icon: <OtherIcon className="w-6 h-6" />,
        gradient: "from-slate-50 to-gray-50 dark:from-slate-800/50 dark:to-gray-800/50 earthy-green:from-[#fafaf9] earthy-green:to-[#f5f5f4]",
        shadow: "shadow-slate-100 dark:shadow-slate-900/20 earthy-green:shadow-[#daddd8]",
        text: "text-slate-600 dark:text-slate-400 earthy-green:text-[#4b5842]",
        accent: "bg-slate-500 dark:bg-slate-400 earthy-green:bg-[#8826b9]"
    },
};

export default function BillsOverviewPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [bills, setBills] = useState<Bill[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedDate, setSelectedDate] = useState(new Date());

    useEffect(() => {
        if (user?.khataId) {
            setLoading(true);
            const month = selectedDate.getMonth() + 1;
            const year = selectedDate.getFullYear();

            api.getBillsForRoom(user.khataId, month, year).then(data => {
                setBills(data);
                setLoading(false);
            }).catch(() => setLoading(false));
        }
    }, [user, selectedDate]);

    // Generate last 12 months for dropdown
    const availableMonths = useMemo(() => {
        const months = [];
        for (let i = 0; i < 12; i++) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            months.push(d);
        }
        return months;
    }, []);

    const monthSummary = useMemo(() => {
        // Bills are already filtered by backend for the selected month
        const currentMonthBills = bills;

        if (user?.role === Role.Manager || user?.role === Role.MasterManager) {
            const totalAmount = currentMonthBills.reduce((acc, bill) => acc + bill.totalAmount, 0);
            const paidAmount = currentMonthBills.reduce((acc, bill) => {
                const billPaid = bill.shares.filter(s => s.status === 'Paid').reduce((sum, s) => sum + s.amount, 0);
                return acc + billPaid;
            }, 0);
            const dueAmount = totalAmount - paidAmount;
            return { total: totalAmount, paid: paidAmount, due: dueAmount, label: 'Room Summary' };
        } else {
            const myShares = currentMonthBills.flatMap(b => b.shares.filter(s => s.userId === user?.id));
            const totalShare = myShares.reduce((acc, share) => acc + share.amount, 0);
            const paidShare = myShares.filter(s => s.status === 'Paid').reduce((acc, share) => acc + share.amount, 0);
            const dueShare = totalShare - paidShare;
            return { total: totalShare, paid: paidShare, due: dueShare, label: 'My Summary' };
        }
    }, [bills, user]);

    const billsByCategory = useMemo(() => {
        return bills.reduce<Record<string, Bill[]>>((acc, bill) => {
            (acc[bill.category] = acc[bill.category] || []).push(bill);
            return acc;
        }, {});
    }, [bills]);

    if (loading) {
        return (
            <AppLayout>
                <BillsOverviewSkeleton />
            </AppLayout>
        );
    }

    if (!user) return null;

    return (
        <AppLayout>
            <div className="space-y-6 pb-20 animate-fade-in">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-slate-200 dark:to-slate-400 earthy-green:from-[#4b5842] earthy-green:to-[#6d8b2a] bg-clip-text text-transparent">
                            Bills Overview
                        </h1>
                        <div className="mt-2">
                            <select
                                value={selectedDate.toISOString()}
                                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                                className="text-sm font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                            >
                                {availableMonths.map((date) => (
                                    <option key={date.toISOString()} value={date.toISOString()}>
                                        {date.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    {(user.role === Role.Manager || user.role === Role.MasterManager) && (
                        <button
                            onClick={() => router.push('/bills/create')}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 dark:from-indigo-600 dark:to-purple-600 dark:hover:from-indigo-500 dark:hover:to-purple-500 earthy-green:from-[#a3c24d] earthy-green:to-[#8fb339] earthy-green:hover:from-[#8fb339] earthy-green:hover:to-[#6d8b2a] text-white font-semibold rounded-2xl shadow-lg shadow-violet-200 dark:shadow-none earthy-green:shadow-[#b7ce63]/50 transition-all active:scale-95"
                        >
                            <span className="text-xl">+</span> New Bill
                        </button>
                    )}
                </div>

                {/* Main Summary Card - Adaptive Design */}
                {/* Main Summary Card - Adaptive Design */}
                {/* Main Summary Card - Adaptive Design */}
                <div className="relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 earthy-green:from-primary-50 earthy-green:via-primary-100 earthy-green:to-primary-200 shadow-xl shadow-purple-200 dark:shadow-black/50 earthy-green:shadow-primary-200/50 text-white earthy-green:text-primary-900 transition-all duration-300">
                    <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/20 dark:bg-indigo-500/10 earthy-green:bg-white/40 rounded-full blur-2xl"></div>
                    <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 bg-indigo-500/30 dark:bg-purple-500/10 earthy-green:bg-primary-300/20 rounded-full blur-2xl"></div>

                    <div className="relative z-10">
                        <h2 className="text-base sm:text-lg font-medium text-purple-100 dark:text-slate-300 earthy-green:text-primary-800 mb-4 sm:mb-6 flex items-center gap-2">
                            <span className="p-1.5 bg-white/20 dark:bg-slate-700/50 earthy-green:bg-primary-900/10 rounded-lg backdrop-blur-sm">📊</span>
                            {monthSummary.label}
                        </h2>

                        <div className="grid grid-cols-3 gap-2 sm:gap-4">
                            <div className="text-center p-2 sm:p-3 rounded-2xl bg-white/10 dark:bg-slate-800/50 earthy-green:bg-white/50 backdrop-blur-md border border-white/10 dark:border-slate-700 earthy-green:border-primary-200">
                                <p className="text-[10px] sm:text-xs font-medium text-purple-100 dark:text-slate-400 earthy-green:text-primary-700 mb-0.5 sm:mb-1 uppercase tracking-wider">Total</p>
                                <p className="text-lg sm:text-2xl font-bold font-numeric">
                                    <span className="text-xs sm:text-sm opacity-70">৳</span>{monthSummary.total.toLocaleString()}
                                </p>
                            </div>
                            <div className="text-center p-2 sm:p-3 rounded-2xl bg-emerald-500/20 dark:bg-emerald-500/10 earthy-green:bg-emerald-100/50 backdrop-blur-md border border-emerald-400/20 dark:border-emerald-500/10 earthy-green:border-emerald-200/50">
                                <p className="text-[10px] sm:text-xs font-medium text-emerald-100 dark:text-emerald-400 earthy-green:text-emerald-800 mb-0.5 sm:mb-1 uppercase tracking-wider">Paid</p>
                                <p className="text-lg sm:text-2xl font-bold font-numeric text-emerald-50 dark:text-emerald-400 earthy-green:text-emerald-900">
                                    <span className="text-xs sm:text-sm opacity-70">৳</span>{monthSummary.paid.toLocaleString()}
                                </p>
                            </div>
                            <div className="text-center p-2 sm:p-3 rounded-2xl bg-rose-500/20 dark:bg-rose-500/10 earthy-green:bg-rose-100/50 backdrop-blur-md border border-rose-400/20 dark:border-rose-500/10 earthy-green:border-rose-200/50">
                                <p className="text-[10px] sm:text-xs font-medium text-rose-100 dark:text-rose-400 earthy-green:text-rose-800 mb-0.5 sm:mb-1 uppercase tracking-wider">Due</p>
                                <p className="text-lg sm:text-2xl font-bold font-numeric text-rose-50 dark:text-rose-400 earthy-green:text-rose-900">
                                    <span className="text-xs sm:text-sm opacity-70">৳</span>{monthSummary.due.toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Categories Grid */}
                <div>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 earthy-green:text-[#3a4433] mb-4 px-1">Expense Categories</h3>

                    {bills.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white dark:bg-slate-800 earthy-green:bg-[#f4f6f3]/60 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 earthy-green:border-[#daddd8]">
                            <div className="bg-slate-50 dark:bg-slate-700 earthy-green:bg-[#daddd8] p-4 rounded-full mb-4">
                                <HomeIcon className="w-8 h-8 text-slate-400 dark:text-slate-500 earthy-green:text-[#6d8b2a]" />
                            </div>
                            <h3 className="text-lg font-medium text-slate-900 dark:text-white earthy-green:text-[#3a4433]">No bills found</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 earthy-green:text-[#6d8b2a] max-w-xs mx-auto mt-1">
                                Bills created by your manager will appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Object.entries(billsByCategory).map(([category, categoryBills]) => {
                                const config = categoryConfig[category] || categoryConfig['Others'];
                                const totalAmount = categoryBills.reduce((sum, bill) => sum + bill.totalAmount, 0);
                                const yourShare = categoryBills.flatMap(b => b.shares).filter(s => s.userId === user.id).reduce((sum, s) => sum + s.amount, 0);
                                const latestBill = [...categoryBills].sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())[0];
                                const myShareDetails = latestBill?.shares.find(s => s.userId === user.id);

                                return (
                                    <div
                                        key={category}
                                        onClick={() => router.push(`/bills-${category.toLowerCase().replace(' ', '-')}`)}
                                        className={`group relative overflow-hidden bg-white dark:bg-slate-800 earthy-green:bg-[#fcfdfc] hover:bg-gradient-to-br ${config.gradient} rounded-3xl p-5 border border-slate-100 dark:border-slate-700 earthy-green:border-[#daddd8]/50 hover:border-transparent transition-all duration-300 shadow-sm hover:shadow-lg hover:` + config.shadow + ` cursor-pointer`}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className={`p-3 rounded-2xl ${config.gradient} ${config.text} group-hover:bg-white dark:group-hover:bg-slate-800 earthy-green:group-hover:bg-white`}>
                                                {React.cloneElement(config.icon, { className: "w-6 h-6" })}
                                            </div>
                                            {myShareDetails && (
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusColors[myShareDetails.status]}`}>
                                                    {myShareDetails.status}
                                                </span>
                                            )}
                                        </div>

                                        <h3 className={`text-lg font-bold ${config.text} mb-3 group-hover:text-slate-800 dark:group-hover:text-slate-200 earthy-green:group-hover:text-[#3a4433] transition-colors`}>
                                            {category}
                                        </h3>

                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/50 earthy-green:bg-[#f4f6f3] group-hover:bg-white/60 dark:group-hover:bg-slate-700/80 earthy-green:group-hover:bg-white/80 transition-colors">
                                                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 earthy-green:text-[#6d8b2a]">Total Bill</span>
                                                <span className="font-bold text-slate-700 dark:text-slate-300 earthy-green:text-[#3a4433] font-numeric">
                                                    ৳{totalAmount.toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center p-2.5 rounded-xl bg-white dark:bg-slate-700/20 earthy-green:bg-white border-2 border-slate-50 dark:border-slate-700/50 earthy-green:border-[#daddd8]/50 group-hover:border-white/20 dark:group-hover:border-slate-600/50 transition-colors">
                                                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 earthy-green:text-[#6d8b2a]">My Share</span>
                                                <span className={`font-bold ${config.text} font-numeric`}>
                                                    ৳{yourShare.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Decorative accent */}
                                        <div className={`absolute bottom-0 right-0 w-16 h-16 ${config.accent} opacity-5 group-hover:opacity-10 dark:opacity-10 dark:group-hover:opacity-20 rounded-full blur-xl transform translate-x-4 translate-y-4 transition-opacity`}></div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
