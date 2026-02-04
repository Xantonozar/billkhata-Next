"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { Bill, Role } from '@/types';
import AppLayout from '@/components/AppLayout';
import { HomeIcon, ElectricityIcon, WaterIcon, GasIcon, WifiIcon, MaidIcon, OtherIcon, BanknotesIcon } from '@/components/Icons';
import RecordPaymentModal from '@/components/bills/RecordPaymentModal';
import { BillsOverviewSkeleton } from '@/components/skeletons/BillCardSkeleton';

// Vivid color mappings for payment status
const categoryConfig: Record<string, { icon: React.ReactElement<{ className?: string }>, color: string, bg: string }> = {
    'Rent': { icon: <HomeIcon />, color: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-100 dark:bg-pink-900/20' },
    'Electricity': { icon: <ElectricityIcon />, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/20' },
    'Water': { icon: <WaterIcon />, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/20' },
    'Gas': { icon: <GasIcon />, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/20' },
    'Wi-Fi': { icon: <WifiIcon />, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-100 dark:bg-violet-900/20' },
    'Maid': { icon: <MaidIcon />, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-100 dark:bg-teal-900/20' },
    'Others': { icon: <OtherIcon />, color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-900/20' },
};

export default function ManageBillsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [bills, setBills] = useState<Bill[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [activeCategory, setActiveCategory] = useState<string>('Rent');

    const [selectedShare, setSelectedShare] = useState<{ bill: any, share: any } | null>(null);

    const categories = ['Rent', 'Electricity', 'Water', 'Gas', 'Wi-Fi', 'Maid', 'Others'];

    const fetchData = React.useCallback(async () => {
        if (user?.khataId) {
            setLoading(true);
            const month = selectedDate.getMonth() + 1;
            const year = selectedDate.getFullYear();

            try {
                const data = await api.getBillsForRoom(user.khataId, month, year);
                setBills(data);
            } catch (error) {
                console.error("Failed to fetch bills", error);
            } finally {
                setLoading(false);
            }
        }
    }, [user?.khataId, selectedDate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Redirect if not MasterManager
    useEffect(() => {
        if (user && user.role !== Role.MasterManager) {
            router.push('/bills');
        }
    }, [user, router]);

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

    const filteredBills = useMemo(() => {
        return bills.filter(bill =>
            bill.category === activeCategory ||
            (activeCategory === 'Others' && !categories.slice(0, 6).includes(bill.category))
        );
    }, [bills, activeCategory, categories]);

    // Get all unpaid shares for the filtered bills
    const unpaidShares = useMemo(() => {
        const shares: { bill: Bill, share: any }[] = [];
        filteredBills.forEach(bill => {
            bill.shares.forEach(share => {
                if (share.status !== 'Paid') {
                    shares.push({ bill, share });
                }
            });
        });
        return shares;
    }, [filteredBills]);

    if (!user || user.role !== Role.MasterManager) return null;

    if (loading && bills.length === 0) {
        return (
            <AppLayout>
                <BillsOverviewSkeleton />
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="space-y-6 pb-20 animate-fade-in">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <BanknotesIcon className="w-8 h-8 text-primary" />
                            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                                Manage Bills
                            </h1>
                        </div>
                        <p className="text-muted-foreground mt-1 text-sm bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 inline-block px-2 py-0.5 rounded border border-yellow-200 dark:border-yellow-800">
                            Master Manager Control Panel
                        </p>
                    </div>
                    <div>
                        <select
                            value={selectedDate.toISOString()}
                            onChange={(e) => setSelectedDate(new Date(e.target.value))}
                            className="text-sm font-semibold bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm"
                        >
                            {availableMonths.map((date) => (
                                <option key={date.toISOString()} value={date.toISOString()}>
                                    {date.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Categories Tabs */}
                <div className="flex overflow-x-auto pb-2 gap-2 custom-scrollbar">
                    {categories.map(category => {
                        const config = categoryConfig[category] || categoryConfig['Others'];
                        const isActive = activeCategory === category;
                        return (
                            <button
                                key={category}
                                onClick={() => setActiveCategory(category)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all whitespace-nowrap ${isActive
                                    ? `bg-primary/10 border-primary text-primary font-bold shadow-sm`
                                    : 'bg-card border-border hover:bg-muted text-muted-foreground font-medium'
                                    }`}
                            >
                                <span className={`w-5 h-5 ${isActive ? 'text-primary' : config.color}`}>{config.icon}</span>
                                {category}
                            </button>
                        );
                    })}
                </div>

                {/* Unpaid Bills List */}
                <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                    <div className="p-4 bg-muted/30 border-b border-border flex justify-between items-center">
                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                            <span>📋</span> Pending Payments for {activeCategory}
                        </h3>
                        <span className="text-xs font-medium px-2 py-1 bg-background rounded-md text-muted-foreground border border-border">
                            {unpaidShares.length} Pending
                        </span>
                    </div>

                    {unpaidShares.length === 0 ? (
                        <div className="p-12 text-center flex flex-col items-center justify-center">
                            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
                                <span className="text-3xl">✅</span>
                            </div>
                            <h3 className="text-lg font-bold text-foreground">All Paid!</h3>
                            <p className="text-muted-foreground mt-1 max-w-xs">
                                No pending payments found for {activeCategory} in this month.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {unpaidShares.map(({ bill, share }) => (
                                <div key={`${bill.id}-${share.userId}`} className="p-4 hover:bg-muted/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-xl ${categoryConfig[bill.category]?.bg || 'bg-slate-100'} hidden sm:block`}>
                                            {React.cloneElement(categoryConfig[bill.category]?.icon || <OtherIcon />, { className: `w-6 h-6 ${categoryConfig[bill.category]?.color}` })}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-foreground">{share.userName}</h4>
                                            <p className="text-sm text-muted-foreground">{bill.title}</p>
                                            <div className="flex gap-2 mt-1">
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800 font-medium">
                                                    Unpaid
                                                </span>
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                                                    Due: {new Date(bill.dueDate).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                                        <div className="text-right">
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Amount Due</p>
                                            <p className="text-xl font-bold text-primary font-numeric">৳{share.amount.toLocaleString()}</p>
                                        </div>
                                        <button
                                            onClick={() => setSelectedShare({ bill, share })}
                                            className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-sm active:scale-95 whitespace-nowrap"
                                        >
                                            Record Payment
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {selectedShare && (
                <RecordPaymentModal
                    bill={selectedShare.bill}
                    share={selectedShare.share}
                    onClose={() => setSelectedShare(null)}
                    onSuccess={fetchData}
                    khataId={user.khataId!}
                />
            )}
        </AppLayout>
    );
}
