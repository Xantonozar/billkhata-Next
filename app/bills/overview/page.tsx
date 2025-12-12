"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import type { Bill, PaymentStatus } from '@/types';
import { Role } from '@/types';
import { HomeIcon, ElectricityIcon, WaterIcon, GasIcon, WifiIcon, MaidIcon, OtherIcon } from '@/components/Icons';
import AppLayout from '@/components/AppLayout';
import ToastContainer from '@/components/ToastContainer';

const statusColors: Record<PaymentStatus, string> = {
    'Paid': 'bg-success-500/10 text-success-700 dark:text-success-400',
    'Pending Approval': 'bg-warning-500/10 text-warning-600 dark:text-warning-400',
    'Unpaid': 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200',
    'Overdue': 'bg-danger-500/10 text-danger-600 dark:text-danger-400',
};

const categoryIcons: Record<string, React.ReactElement> = {
    'Rent': <HomeIcon className="w-6 h-6 text-danger-500" />,
    'Electricity': <ElectricityIcon className="w-6 h-6 text-yellow-500" />,
    'Water': <WaterIcon className="w-6 h-6 text-blue-500" />,
    'Gas': <GasIcon className="w-6 h-6 text-orange-500" />,
    'Wi-Fi': <WifiIcon className="w-6 h-6 text-cyan-500" />,
    'Maid': <MaidIcon className="w-6 h-6 text-purple-500" />,
    'Others': <OtherIcon className="w-6 h-6 text-slate-500" />,
};

export default function BillsOverviewPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [bills, setBills] = useState<Bill[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.khataId) {
            setLoading(true);
            api.getBillsForRoom(user.khataId).then(data => {
                setBills(data);
                setLoading(false);
            }).catch(() => setLoading(false));
        }
    }, [user]);

    const monthSummary = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const currentMonthBills = bills.filter(bill => {
            const billDate = new Date(bill.dueDate);
            return billDate.getMonth() === currentMonth && billDate.getFullYear() === currentYear;
        });

        if (user?.role === Role.Manager) {
            const totalAmount = currentMonthBills.reduce((acc, bill) => acc + bill.totalAmount, 0);
            const paidAmount = currentMonthBills.reduce((acc, bill) => {
                const billPaid = bill.shares.filter(s => s.status === 'Paid').reduce((sum, s) => sum + s.amount, 0);
                return acc + billPaid;
            }, 0);
            const dueAmount = totalAmount - paidAmount;
            return { total: totalAmount, paid: paidAmount, due: dueAmount, label: 'Room Summary (This Month)' };
        } else {
            const myShares = currentMonthBills.flatMap(b => b.shares.filter(s => s.userId === user?.id));
            const totalShare = myShares.reduce((acc, share) => acc + share.amount, 0);
            const paidShare = myShares.filter(s => s.status === 'Paid').reduce((acc, share) => acc + share.amount, 0);
            const dueShare = totalShare - paidShare;
            return { total: totalShare, paid: paidShare, due: dueShare, label: 'My Summary (This Month)' };
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
                <div className="text-center p-8">Loading...</div>
            </AppLayout>
        );
    }

    if (!user) return null;

    return (
        <>
            <AppLayout>
                <div className="space-y-4 sm:space-y-6 animate-fade-in">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-sans">Bills Overview</h1>
                        {user.role === Role.Manager && (
                            <button
                                onClick={() => router.push('/bills/create')}
                                className="flex items-center gap-2 px-3 py-2 sm:px-4 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors"
                            >
                                <span className="text-xl">+</span> <span className="hidden sm:inline">Create Bill</span><span className="inline sm:hidden">Bill</span>
                            </button>
                        )}
                    </div>

                    {/* This Month Summary Card */}
                    <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-md">
                        <h2 className="text-lg sm:text-xl font-bold font-sans text-slate-800 dark:text-white mb-3 sm:mb-4">{monthSummary.label}</h2>
                        <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center divide-x divide-slate-100 dark:divide-slate-700 sm:divide-x-0">
                            <div>
                                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-1">Total</p>
                                <p className="text-lg sm:text-2xl font-bold text-slate-800 dark:text-white font-numeric truncate">৳{monthSummary.total.toFixed(0)}</p>
                            </div>
                            <div>
                                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-1">Paid</p>
                                <p className="text-lg sm:text-2xl font-bold text-success-600 dark:text-success-400 font-numeric truncate">৳{monthSummary.paid.toFixed(0)}</p>
                            </div>
                            <div>
                                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-1">Due</p>
                                <p className="text-lg sm:text-2xl font-bold text-danger-600 dark:text-danger-400 font-numeric truncate">৳{monthSummary.due.toFixed(0)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Bill Category Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                        {Object.entries(billsByCategory).map(([category, categoryBills]: [string, Bill[]]) => {
                            const totalAmount = categoryBills.reduce((sum, bill) => sum + bill.totalAmount, 0);
                            const yourShare = categoryBills.flatMap(b => b.shares).filter(s => s.userId === user.id).reduce((sum, s) => sum + s.amount, 0);
                            const latestBill = [...categoryBills].sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())[0];
                            const myShareDetails = latestBill?.shares.find(s => s.userId === user.id);

                            return (
                                <div key={category} className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-3 sm:p-5 flex flex-row items-center justify-between transition-all hover:shadow-lg hover:scale-[1.02]">
                                    <div className="flex-grow">
                                        <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-3">
                                            <div className="scale-90 sm:scale-100">{categoryIcons[category] || <OtherIcon className="w-6 h-6 text-slate-500" />}</div>
                                            <h3 className="text-sm sm:text-xl font-bold font-sans text-slate-900 dark:text-white truncate">{category}</h3>
                                        </div>
                                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Total: <span className="font-semibold font-numeric">৳{totalAmount.toFixed(0)}</span></p>
                                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Share: <span className="font-semibold font-numeric">৳{yourShare.toFixed(0)}</span></p>
                                    </div>

                                    <div className="flex flex-col items-end gap-2 ml-2">
                                        {myShareDetails && (
                                            <div className="text-[10px] sm:text-xs">
                                                <span className={`px-2 py-0.5 rounded-full ${statusColors[myShareDetails.status]}`}>
                                                    {myShareDetails.status === 'Paid' ? (
                                                        <span className="flex items-center gap-1">✅ Paid</span>
                                                    ) : (
                                                        myShareDetails.status
                                                    )}
                                                </span>
                                            </div>
                                        )}
                                        <button
                                            onClick={() => router.push(`/bills-${category.toLowerCase().replace(' ', '-')}`)}
                                            className="px-3 py-1.5 text-xs sm:text-sm bg-slate-100 dark:bg-slate-700 rounded-md font-semibold font-sans text-primary-600 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all active:scale-95"
                                        >
                                            View
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </AppLayout>

        </>
    );
}
