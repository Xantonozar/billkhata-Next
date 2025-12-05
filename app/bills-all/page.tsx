"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import type { Bill, BillShare } from '@/types';
import { Role } from '@/types';
import {
    PlusIcon, MagnifyingGlassIcon, ElectricityIcon, HomeIcon, WaterIcon,
    GasIcon, WifiIcon, MaidIcon, OtherIcon
} from '@/components/Icons';
import AddBillModal from '@/components/modals/AddBillModal';
import { useNotifications } from '@/contexts/NotificationContext';
import AppLayout from '@/components/AppLayout';
import ToastContainer from '@/components/ToastContainer';
import { useRouter } from 'next/navigation';

const categoryIcons: Record<string, React.ReactElement> = {
    'Rent': <HomeIcon className="w-6 h-6 text-danger-500" />,
    'Electricity': <ElectricityIcon className="w-6 h-6 text-yellow-500" />,
    'Water': <WaterIcon className="w-6 h-6 text-blue-500" />,
    'Gas': <GasIcon className="w-6 h-6 text-orange-500" />,
    'Wi-Fi': <WifiIcon className="w-6 h-6 text-cyan-500" />,
    'Maid': <MaidIcon className="w-6 h-6 text-purple-500" />,
    'Others': <OtherIcon className="w-6 h-6 text-slate-500" />,
};

const ManagerAllBillsView: React.FC<{ bills: Bill[] }> = ({ bills }) => {
    const router = useRouter();
    const [statusFilter, setStatusFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredBills = useMemo(() => {
        return bills.filter(bill => {
            const searchMatch = bill.title.toLowerCase().includes(searchQuery.toLowerCase());

            if (!searchMatch) return false;

            if (statusFilter === 'All') return true;

            const isOverdue = new Date(bill.dueDate) < new Date() && bill.shares.some(s => s.status !== 'Paid');
            if (statusFilter === 'Overdue') return isOverdue;

            const isFullyPaid = bill.shares.every(s => s.status === 'Paid');
            if (statusFilter === 'Approved') return isFullyPaid;

            if (statusFilter === 'Pending Payment') return !isFullyPaid && !isOverdue;

            return true;
        });
    }, [bills, statusFilter, searchQuery]);

    const PaymentProgress: React.FC<{ paid: number, total: number }> = ({ paid, total }) => (
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
                {Array.from({ length: total }).map((_, i) => (
                    <div key={i} className={`w-3 h-3 rounded-full ${i < paid ? 'bg-success-500' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                ))}
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-numeric">{paid}/{total} Paid</span>
        </div>
    );

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-4 items-center">
                <div className="flex-shrink-0 grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                    {['All', 'Pending Payment', 'Approved', 'Overdue'].map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${statusFilter === status ? 'bg-white dark:bg-slate-700 text-primary-600 shadow' : 'text-slate-600 dark:text-slate-300 hover:bg-white/50'}`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
                <div className="relative flex-grow min-w-[200px]">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search bills..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg"
                    />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBills.map(bill => {
                    const paidCount = bill.shares.filter(s => s.status === 'Paid').length;
                    const totalCount = bill.shares.length;

                    return (
                        <div key={bill.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-5 flex flex-col justify-between transition-all hover:shadow-lg hover:scale-[1.02]">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    {categoryIcons[bill.category] || <OtherIcon className="w-6 h-6 text-slate-500" />}
                                    <h3 className="font-bold text-xl font-sans text-slate-800 dark:text-white">{bill.title}</h3>
                                </div>
                                <p className="text-2xl font-bold text-primary-600 font-numeric">৳{bill.totalAmount.toFixed(2)}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Due: {bill.dueDate}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Split: <span className="font-numeric">৳{(bill.totalAmount / totalCount).toFixed(2)}</span> per person</p>
                            </div>
                            <div className="mt-4 space-y-3">
                                <PaymentProgress paid={paidCount} total={totalCount} />
                                <div className="flex gap-2">
                                    <button onClick={() => router.push(`/bills/${bill.id}`)} className="px-3 py-1 text-sm bg-slate-100 dark:bg-slate-700 rounded-md font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-all active:scale-95">View Details</button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const MemberAllBillsView: React.FC<{
    bills: (Bill & { myShare: BillShare })[];
    setConfirmingPayment: (bill: Bill) => void;
}> = ({ bills, setConfirmingPayment }) => {
    const router = useRouter();

    const getDueDateStatus = (dueDate: string): { text: string; isOverdue: boolean } => {
        const today = new Date();
        const due = new Date(dueDate);
        today.setHours(0, 0, 0, 0);
        due.setHours(0, 0, 0, 0);

        const diffTime = due.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return { text: `Overdue by ${Math.abs(diffDays)} day(s)`, isOverdue: true };
        }
        if (diffDays === 0) {
            return { text: 'Due today', isOverdue: false };
        }
        return { text: `${diffDays} day(s) left`, isOverdue: false };
    };

    return (
        <div className="space-y-4">
            {bills.map(bill => {
                const dueDateInfo = getDueDateStatus(bill.dueDate);
                const status = bill.myShare.status;

                return (
                    <div key={bill.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-5 space-y-3 transition-all hover:shadow-lg">
                        <div className="flex items-center gap-3">
                            {categoryIcons[bill.category]}
                            <h3 className="font-bold text-lg font-sans text-slate-800 dark:text-white">{bill.title}</h3>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300">
                            Your Share: <span className="font-bold text-lg text-slate-800 dark:text-white font-numeric">৳{bill.myShare.amount.toFixed(2)}</span>
                        </p>
                        <p className={`text-sm ${dueDateInfo.isOverdue && status !== 'Paid' ? 'text-danger-600 font-semibold' : 'text-slate-500 dark:text-slate-400'}`}>
                            Due Date: {new Date(bill.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                            {status !== 'Paid' && ` (${dueDateInfo.text})`}
                        </p>

                        <div className="flex justify-between items-center border-t border-slate-200 dark:border-slate-700 pt-3">
                            <div>
                                {status === 'Unpaid' || status === 'Overdue' ? (
                                    <button
                                        onClick={() => setConfirmingPayment(bill)}
                                        className="px-4 py-2 text-white font-semibold rounded-md bg-gradient-success hover:shadow-lg transition-all active:scale-[0.98]"
                                    >
                                        Pay Now
                                    </button>
                                ) : status === 'Pending Approval' ? (
                                    <div>
                                        <p className="text-sm text-warning-600 dark:text-warning-400">Status: <span className="font-semibold">⏳ Waiting for Approval</span></p>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-sm text-success-600 dark:text-success-400">Paid ✅</p>
                                    </div>
                                )}
                            </div>
                            <button onClick={() => router.push(`/bills/${bill.id}`)} className="text-sm font-semibold text-primary-600 hover:underline">
                                View Details →
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default function AllBillsPage() {
    const { user } = useAuth();
    const [bills, setBills] = useState<Bill[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('Due Now');
    const [confirmingPayment, setConfirmingPayment] = useState<Bill | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const { addToast } = useNotifications();

    useEffect(() => {
        if (user?.khataId) {
            setLoading(true);
            api.getBillsForRoom(user.khataId).then(data => {
                setBills(data.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()));
                setLoading(false);
            });
        }
    }, [user]);

    const handleMarkAsPaid = async () => {
        if (!confirmingPayment || !user) return;
        const updatedBill = await api.updateBillShareStatus(confirmingPayment.id, user.id, 'Pending Approval');
        if (updatedBill) {
            setBills(prevBills => prevBills.map(b => b.id === updatedBill.id ? updatedBill : b));
            addToast({ type: 'success', title: 'Payment Submitted', message: 'Your payment is now pending manager approval.' });
        }
        setConfirmingPayment(null);
    };

    const handleBillAdded = (newBill: Bill) => {
        setBills(prev => [newBill, ...prev].sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()));
        addToast({
            type: 'success',
            title: 'Bill Added',
            message: `The "${newBill.title}" bill has been successfully created.`,
        });
        setIsAddModalOpen(false);
    };

    const memberFilteredBills = useMemo(() => {
        if (!user || user.role === Role.Manager) return [];

        const myBills = bills.map(bill => {
            const myShare = bill.shares.find(s => s.userId === user.id);
            return myShare ? { ...bill, myShare } : null;
        }).filter((b): b is Bill & { myShare: BillShare } => b !== null);

        return myBills.filter(bill => {
            const status = bill.myShare.status;
            if (statusFilter === 'History') return true;
            if (statusFilter === 'Due Now') return status === 'Unpaid' || status === 'Overdue';
            return status === statusFilter;
        });
    }, [bills, user, statusFilter]);


    if (loading) {
        return (
            <AppLayout>
                <div className="text-center p-8">Loading all bills...</div>
            </AppLayout>
        );
    }

    if (!user) return null;

    return (
        <>
            <AppLayout>
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white font-sans">
                            {user.role === Role.Manager ? 'Bills' : 'My Bills'}
                        </h1>
                        {user.role === Role.Manager && (
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 text-white font-semibold rounded-lg bg-gradient-success hover:shadow-lg transition-all active:scale-[0.98]">
                                <PlusIcon className="w-5 h-5" />
                                Add New Bill
                            </button>
                        )}
                    </div>
                    {user.role === Role.Manager
                        ? <ManagerAllBillsView bills={bills} />
                        : (
                            <div className="space-y-4">
                                <div className="flex-shrink-0 grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                                    {['Due Now', 'Paid', 'Pending Approval', 'History'].map(status => (
                                        <button
                                            key={status}
                                            onClick={() => setStatusFilter(status)}
                                            className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${statusFilter === status ? 'bg-white dark:bg-slate-700 text-primary-600 shadow' : 'text-slate-600 dark:text-slate-300 hover:bg-white/50'}`}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                                <MemberAllBillsView bills={memberFilteredBills} setConfirmingPayment={setConfirmingPayment} />
                            </div>
                        )
                    }
                </div>
            </AppLayout>

            {isAddModalOpen && (
                <AddBillModal
                    onClose={() => setIsAddModalOpen(false)}
                    onBillAdded={handleBillAdded}
                />
            )}

            {confirmingPayment && user.role === Role.Member && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-sm m-4 animate-scale-in">
                        <h3 className="text-lg font-bold font-sans text-slate-900 dark:text-white">Confirm Payment</h3>
                        <div className="my-4 text-sm text-slate-600 dark:text-slate-300 space-y-2">
                            <p><strong>Bill:</strong> {confirmingPayment.title}</p>
                            <p><strong>Amount to Pay:</strong> <span className="font-numeric">৳{confirmingPayment.shares.find(s => s.userId === user?.id)?.amount.toFixed(2)}</span></p>
                            <p className="mt-4 p-3 bg-warning-500/10 text-warning-600 dark:text-warning-400 rounded-md text-center">
                                ⚠️ This will be sent to the manager for approval.
                            </p>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setConfirmingPayment(null)}
                                className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold rounded-md hover:bg-slate-300 dark:hover:bg-slate-500 transition-all active:scale-95"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleMarkAsPaid}
                                className="px-4 py-2 bg-gradient-success text-white rounded-md font-semibold hover:shadow-lg transition-all active:scale-95"
                            >
                                Confirm Payment
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ToastContainer />
        </>
    );
}
