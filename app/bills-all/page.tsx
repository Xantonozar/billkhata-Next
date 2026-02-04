"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import type { Bill, BillShare } from '@/types';
import { Role } from '@/types';
import {
    PlusIcon, MagnifyingGlassIcon, ElectricityIcon, HomeIcon, WaterIcon,
    GasIcon, WifiIcon, MaidIcon, OtherIcon, ExclamationTriangleIcon
} from '@/components/Icons';
import AddBillModal from '@/components/modals/AddBillModal';
import { useNotifications } from '@/contexts/NotificationContext';
import AppLayout from '@/components/AppLayout';
import ToastContainer from '@/components/ToastContainer';
import { useRouter } from 'next/navigation';
import { BillCardSkeleton } from '@/components/skeletons/BillCardSkeleton';

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
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-800 earthy-green:bg-primary-50 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700/50 earthy-green:border-primary-200">
                <div className="flex p-1 bg-slate-100 dark:bg-slate-900 earthy-green:bg-primary-100/50 rounded-xl overflow-x-auto max-w-full no-scrollbar">
                    {['All', 'Pending Payment', 'Approved', 'Overdue'].map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`relative px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 whitespace-nowrap z-10 ${statusFilter === status ? 'text-white earthy-green:text-primary-50' : 'text-slate-600 dark:text-slate-400 earthy-green:text-primary-700 hover:text-slate-900 dark:hover:text-slate-200 earthy-green:hover:text-primary-900'}`}
                        >
                            {statusFilter === status && (
                                <div className="absolute inset-0 bg-slate-900 dark:bg-slate-700 earthy-green:bg-primary-700 rounded-lg shadow-sm -z-10 animate-fade-in" style={{ transition: 'all 0.3s ease' }}></div>
                            )}
                            {status}
                        </button>
                    ))}
                </div>
                <div className="relative w-full sm:w-auto sm:min-w-[280px]">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-5 w-5 text-slate-400 earthy-green:text-primary-400 transition-colors group-focus-within:text-indigo-500 earthy-green:group-focus-within:text-primary-600" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search bills..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 earthy-green:bg-white border border-slate-200 dark:border-slate-700 earthy-green:border-primary-200 rounded-xl text-slate-900 dark:text-gray-100 earthy-green:text-primary-900 placeholder-slate-400 earthy-green:placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 earthy-green:focus:ring-primary-500/20 focus:border-indigo-500 earthy-green:focus:border-primary-500 transition-all shadow-sm focus:shadow-md"
                    />
                </div>
            </div>

            {filteredBills.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/50">
                    <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-full mb-3">
                        <MagnifyingGlassIcon className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">No bills found</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        {searchQuery ? `No bills match "${searchQuery}"` : "Try adjusting your filters"}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                    {filteredBills.map(bill => {
                        const paidCount = bill.shares.filter(s => s.status === 'Paid').length;
                        const totalCount = bill.shares.length;

                        return (
                            <div key={bill.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-3 sm:p-5 flex flex-row items-center justify-between transition-all hover:shadow-lg hover:scale-[1.02]">
                                <div className="flex-grow">
                                    <div className="flex items-center gap-2 sm:gap-3 mb-1">
                                        <div className="scale-90 sm:scale-100">{categoryIcons[bill.category] || <OtherIcon className="w-6 h-6 text-slate-500" />}</div>
                                        <h3 className="font-bold text-sm sm:text-xl font-sans text-slate-800 dark:text-white truncate">{bill.title}</h3>
                                    </div>
                                    <p className="text-lg sm:text-2xl font-bold text-primary-600 font-numeric">৳{bill.totalAmount.toFixed(0)}</p>
                                    <p className="text-[10px] sm:text-sm text-slate-500 dark:text-slate-400">Due: <span className="hidden sm:inline">{bill.dueDate}</span><span className="sm:hidden">{new Date(bill.dueDate).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}</span></p>
                                </div>

                                <div className="flex flex-col items-end gap-2 ml-2">
                                    <div className="hidden sm:block"><PaymentProgress paid={paidCount} total={totalCount} /></div>
                                    <div className="sm:hidden text-xs text-slate-500 font-numeric mb-1">{paidCount}/{totalCount} Paid</div>
                                    <button onClick={() => router.push(`/bills/${bill.id}`)} className="px-3 py-1.5 text-xs sm:text-sm bg-slate-100 dark:bg-slate-700 rounded-md font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-all active:scale-95">View</button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const MemberAllBillsView: React.FC<{
    bills: (Bill & { myShare: BillShare })[];
    setConfirmingPayment: (bill: Bill) => void;
    statusFilter: string;
}> = ({ bills, setConfirmingPayment, statusFilter }) => {
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
        bills.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/50 mt-4">
                <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-full mb-3">
                    <ExclamationTriangleIcon className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">No bills found</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                    {statusFilter === 'History' ? 'No bills in your history yet' :
                        statusFilter === 'Due Now' ? 'You are all caught up!' :
                            `No ${statusFilter.toLowerCase()} bills`}
                </p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 mt-4">
                {bills.map(bill => {
                    const dueDateInfo = getDueDateStatus(bill.dueDate);
                    const status = bill.myShare.status;

                    return (
                        <div key={bill.id} className="relative group overflow-hidden bg-white dark:bg-slate-800 earthy-green:bg-white rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 earthy-green:border-primary-100 p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br opacity-5 rounded-bl-full transition-opacity group-hover:opacity-10 
                                ${bill.category === 'Rent' ? 'from-rose-400 to-red-400' :
                                    bill.category === 'Electricity' ? 'from-amber-400 to-orange-400' :
                                        bill.category === 'Water' ? 'from-cyan-400 to-blue-400' :
                                            bill.category === 'Gas' ? 'from-orange-400 to-red-400' :
                                                bill.category === 'Wi-Fi' ? 'from-sky-400 to-indigo-400' :
                                                    bill.category === 'Maid' ? 'from-purple-400 to-violet-400' :
                                                        'from-slate-400 to-gray-400'}`}></div>

                            <div className="relative z-10 flex flex-col justify-between h-full gap-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2.5 rounded-xl shadow-sm backdrop-blur-sm 
                                            ${bill.category === 'Rent' ? 'bg-rose-50 text-rose-500' :
                                                bill.category === 'Electricity' ? 'bg-amber-50 text-amber-500' :
                                                    bill.category === 'Water' ? 'bg-cyan-50 text-cyan-500' :
                                                        bill.category === 'Gas' ? 'bg-orange-50 text-orange-500' :
                                                            bill.category === 'Wi-Fi' ? 'bg-sky-50 text-sky-500' :
                                                                bill.category === 'Maid' ? 'bg-purple-50 text-purple-500' :
                                                                    'bg-slate-50 text-slate-500'} dark:bg-slate-700 dark:text-white earthy-green:bg-primary-50 earthy-green:text-primary-600`}>
                                            {categoryIcons[bill.category]}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-base sm:text-lg font-sans text-slate-800 dark:text-gray-100 earthy-green:text-primary-900 truncate max-w-[120px] sm:max-w-xs">{bill.title}</h3>
                                            <p className={`text-[10px] sm:text-xs font-medium uppercase tracking-wide px-2 py-0.5 rounded-full w-fit mt-1 border
                                                ${dueDateInfo.isOverdue && status !== 'Paid'
                                                    ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:text-red-300 dark:border-red-900/30'
                                                    : 'bg-slate-50 text-slate-500 border-slate-100 dark:bg-slate-700/50 dark:text-slate-400 dark:border-slate-700 earthy-green:bg-primary-50 earthy-green:text-primary-600 earthy-green:border-primary-100'}`}>
                                                {dueDateInfo.text}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-end justify-between mt-1">
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 earthy-green:text-primary-500 font-medium mb-0.5">Your Share</p>
                                        <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white earthy-green:text-primary-900 font-numeric">
                                            ৳{bill.myShare.amount.toLocaleString()}
                                        </p>
                                    </div>

                                    <div className="flex flex-col items-end gap-2">
                                        {status === 'Unpaid' || status === 'Overdue' ? (
                                            <button
                                                onClick={() => setConfirmingPayment(bill)}
                                                className="px-4 py-2 text-xs sm:text-sm text-white font-bold rounded-xl bg-gradient-success shadow-lg shadow-green-200/50 dark:shadow-none hover:shadow-green-300/50 hover:scale-105 transition-all duration-300 active:scale-95"
                                            >
                                                Pay Now
                                            </button>
                                        ) : status === 'Pending Approval' ? (
                                            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg text-xs font-bold border border-amber-100 dark:border-amber-800/30">
                                                <span className="animate-pulse">⏳</span> Approval
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-bold border border-emerald-100 dark:border-emerald-800/30">
                                                ✅ Paid
                                            </span>
                                        )}

                                        <button
                                            onClick={() => router.push(`/bills/${bill.id}`)}
                                            className="text-xs font-bold text-slate-400 dark:text-slate-500 earthy-green:text-primary-400 hover:text-indigo-500 dark:hover:text-indigo-400 earthy-green:hover:text-primary-600 transition-colors flex items-center gap-1"
                                        >
                                            View Details <span>→</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        )
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
        if (!user || user.role === Role.Manager || user.role === Role.MasterManager) return [];

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





    if (!user) return null;

    return (
        <>
            <AppLayout>
                <div className="space-y-4 sm:space-y-6">
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-sans">
                            {user.role === Role.Manager || user.role === Role.MasterManager ? 'Bills' : 'My Bills'}
                        </h1>
                        {(user.role === Role.Manager || user.role === Role.MasterManager) && (
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="flex items-center gap-2 px-3 py-2 sm:px-4 text-white font-semibold rounded-lg bg-gradient-success hover:shadow-lg transition-all active:scale-[0.98]">
                                <PlusIcon className="w-5 h-5" />
                                <span className="hidden sm:inline">Add New Bill</span><span className="inline sm:hidden">Add</span>
                            </button>
                        )}
                    </div>
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                            {[1, 2, 3, 4, 5, 6].map(i => <BillCardSkeleton key={i} />)}
                        </div>
                    ) : (
                        user.role === Role.Manager || user.role === Role.MasterManager
                            ? <ManagerAllBillsView bills={bills} />
                            : (
                                <div className="space-y-4">
                                    <div className="flex p-1 bg-white dark:bg-slate-800 earthy-green:bg-primary-50 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700/50 earthy-green:border-primary-200 mb-4 overflow-x-auto no-scrollbar">
                                        <div className="flex p-1 bg-slate-100 dark:bg-slate-900 earthy-green:bg-primary-100/50 rounded-xl">
                                            {['Due Now', 'Paid', 'Pending Approval', 'History'].map(status => (
                                                <button
                                                    key={status}
                                                    onClick={() => setStatusFilter(status)}
                                                    className={`relative px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 whitespace-nowrap z-10 ${statusFilter === status ? 'text-white earthy-green:text-primary-50' : 'text-slate-600 dark:text-slate-400 earthy-green:text-primary-700 hover:text-slate-900 dark:hover:text-slate-200 earthy-green:hover:text-primary-900'}`}
                                                >
                                                    {statusFilter === status && (
                                                        <div className="absolute inset-0 bg-slate-900 dark:bg-slate-700 earthy-green:bg-primary-700 rounded-lg shadow-sm -z-10 animate-fade-in" style={{ transition: 'all 0.3s ease' }}></div>
                                                    )}
                                                    {status}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <MemberAllBillsView bills={memberFilteredBills} setConfirmingPayment={setConfirmingPayment} statusFilter={statusFilter} />
                                </div>
                            )
                    )}
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


        </>
    );
}
