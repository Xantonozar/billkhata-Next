"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { Role, Bill } from '@/types';
import { useNotifications } from '@/contexts/NotificationContext';
import { CheckCircleIcon, HomeIcon, ElectricityIcon, WaterIcon, GasIcon, WifiIcon, MaidIcon, OtherIcon } from '@/components/Icons';
import AppLayout from '@/components/AppLayout';
import ToastContainer from '@/components/ToastContainer';

const categoryIcons: Record<string, React.ReactElement> = {
    'Rent': <HomeIcon className="w-5 h-5 text-danger-500" />,
    'Electricity': <ElectricityIcon className="w-5 h-5 text-yellow-500" />,
    'Water': <WaterIcon className="w-5 h-5 text-blue-500" />,
    'Gas': <GasIcon className="w-5 h-5 text-orange-500" />,
    'Wi-Fi': <WifiIcon className="w-5 h-5 text-cyan-500" />,
    'Maid': <MaidIcon className="w-5 h-5 text-purple-500" />,
    'Others': <OtherIcon className="w-5 h-5 text-slate-500" />,
};

type TabType = 'bill-payments' | 'shopping' | 'deposits' | 'meal-entries' | 'join-requests';

export default function PendingApprovalsPage() {
    const { user } = useAuth();
    const { addToast } = useNotifications();
    const [activeTab, setActiveTab] = useState<TabType>('bill-payments');
    const [pendingMemberRequests, setPendingMemberRequests] = useState<any[]>([]);
    const [pendingBillPayments, setPendingBillPayments] = useState<{ bill: Bill, share: any }[]>([]);
    const [pendingExpenses, setPendingExpenses] = useState<any[]>([]);
    const [pendingDeposits, setPendingDeposits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [receiptModalUrl, setReceiptModalUrl] = useState<string | null>(null);

    const fetchData = async () => {
        if (user?.khataId && user.role === Role.Manager) {
            setLoading(true);
            try {
                // Fetch all data in parallel for faster loading
                const [memberRequests, bills, expenses, deposits] = await Promise.all([
                    api.getPendingApprovals(user.khataId),
                    api.getBillsForRoom(user.khataId),
                    api.getExpenses(user.khataId, { status: 'Pending' }),
                    api.getDeposits(user.khataId, { status: 'Pending' })
                ]);

                setPendingMemberRequests(memberRequests);
                setPendingExpenses(expenses);
                setPendingDeposits(deposits);

                // Process bills to find pending payments
                const pendingPayments: { bill: Bill, share: any }[] = [];
                bills.forEach(bill => {
                    bill.shares.forEach(share => {
                        if (share.status === 'Pending Approval') {
                            pendingPayments.push({ bill, share });
                        }
                    });
                });
                setPendingBillPayments(pendingPayments);

            } catch (error) {
                console.error('Error fetching pending approvals:', error);
                addToast({ type: 'error', title: 'Error', message: 'Failed to load pending approvals.' });
            } finally {
                setLoading(false);
            }
        } else {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const handleApproveMember = async (userId: string) => {
        if (!user?.khataId) return;

        // Optimistic UI - remove immediately
        const removedItem = pendingMemberRequests.find(req => req.id === userId);
        setPendingMemberRequests(prev => prev.filter(req => req.id !== userId));
        addToast({ type: 'success', title: 'Approved', message: 'Member approved successfully' });

        try {
            const success = await api.approveMember(user.khataId, userId);
            if (!success && removedItem) {
                // Restore on failure
                setPendingMemberRequests(prev => [...prev, removedItem]);
                addToast({ type: 'error', title: 'Error', message: 'Failed to approve member. Please try again.' });
            }
        } catch (error) {
            if (removedItem) {
                setPendingMemberRequests(prev => [...prev, removedItem]);
            }
            addToast({ type: 'error', title: 'Error', message: 'Failed to approve member. Please try again.' });
        }
    };

    const handleApproveBill = async (billId: string, userId: string) => {
        // Optimistic UI - remove immediately
        const removedItem = pendingBillPayments.find(item => item.bill.id === billId && item.share.userId === userId);
        setPendingBillPayments(prev => prev.filter(item => !(item.bill.id === billId && item.share.userId === userId)));
        addToast({ type: 'success', title: 'Approved', message: 'Payment approved successfully.' });

        const updatedBill = await api.updateBillShareStatus(billId, userId, 'Paid');
        if (!updatedBill && removedItem) {
            // Restore on failure
            setPendingBillPayments(prev => [...prev, removedItem]);
            addToast({ type: 'error', title: 'Error', message: 'Failed to approve payment. Please try again.' });
        }
    };

    const handleDenyBill = async (billId: string, userId: string) => {
        // Optimistic UI - remove immediately
        const removedItem = pendingBillPayments.find(item => item.bill.id === billId && item.share.userId === userId);
        setPendingBillPayments(prev => prev.filter(item => !(item.bill.id === billId && item.share.userId === userId)));
        addToast({ type: 'warning', title: 'Denied', message: 'Payment rejected. Status reset to Unpaid.' });

        const updatedBill = await api.updateBillShareStatus(billId, userId, 'Unpaid');
        if (!updatedBill && removedItem) {
            // Restore on failure
            setPendingBillPayments(prev => [...prev, removedItem]);
            addToast({ type: 'error', title: 'Error', message: 'Failed to deny payment. Please try again.' });
        }
    };

    const handleApproveExpense = async (expenseId: string) => {
        if (!user?.khataId) return;

        // Optimistic UI - remove immediately
        const removedItem = pendingExpenses.find(exp => exp._id === expenseId);
        setPendingExpenses(prev => prev.filter(exp => exp._id !== expenseId));
        addToast({ type: 'success', title: 'Approved', message: 'Shopping expense approved' });

        try {
            const success = await api.approveExpense(user.khataId, expenseId);
            if (!success && removedItem) {
                setPendingExpenses(prev => [...prev, removedItem]);
                addToast({ type: 'error', title: 'Error', message: 'Failed to approve expense. Please try again.' });
            }
        } catch (error) {
            if (removedItem) {
                setPendingExpenses(prev => [...prev, removedItem]);
            }
            addToast({ type: 'error', title: 'Error', message: 'Failed to approve expense. Please try again.' });
        }
    };

    const handleRejectExpense = async (expenseId: string) => {
        if (!user?.khataId) return;

        // Optimistic UI - remove immediately
        const removedItem = pendingExpenses.find(exp => exp._id === expenseId);
        setPendingExpenses(prev => prev.filter(exp => exp._id !== expenseId));
        addToast({ type: 'warning', title: 'Rejected', message: 'Shopping expense rejected' });

        try {
            const success = await api.rejectExpense(user.khataId, expenseId);
            if (!success && removedItem) {
                setPendingExpenses(prev => [...prev, removedItem]);
                addToast({ type: 'error', title: 'Error', message: 'Failed to reject expense. Please try again.' });
            }
        } catch (error) {
            if (removedItem) {
                setPendingExpenses(prev => [...prev, removedItem]);
            }
            addToast({ type: 'error', title: 'Error', message: 'Failed to reject expense. Please try again.' });
        }
    };

    const handleApproveDeposit = async (depositId: string) => {
        if (!user?.khataId) return;

        // Optimistic UI - remove immediately
        const removedItem = pendingDeposits.find(dep => dep._id === depositId);
        setPendingDeposits(prev => prev.filter(dep => dep._id !== depositId));
        addToast({ type: 'success', title: 'Approved', message: 'Deposit approved' });

        try {
            const success = await api.approveDeposit(user.khataId, depositId);
            if (!success && removedItem) {
                setPendingDeposits(prev => [...prev, removedItem]);
                addToast({ type: 'error', title: 'Error', message: 'Failed to approve deposit. Please try again.' });
            }
        } catch (error) {
            if (removedItem) {
                setPendingDeposits(prev => [...prev, removedItem]);
            }
            addToast({ type: 'error', title: 'Error', message: 'Failed to approve deposit. Please try again.' });
        }
    };

    const handleRejectDeposit = async (depositId: string) => {
        if (!user?.khataId) return;

        // Optimistic UI - remove immediately
        const removedItem = pendingDeposits.find(dep => dep._id === depositId);
        setPendingDeposits(prev => prev.filter(dep => dep._id !== depositId));
        addToast({ type: 'warning', title: 'Rejected', message: 'Deposit rejected' });

        try {
            const success = await api.rejectDeposit(user.khataId, depositId);
            if (!success && removedItem) {
                setPendingDeposits(prev => [...prev, removedItem]);
                addToast({ type: 'error', title: 'Error', message: 'Failed to reject deposit. Please try again.' });
            }
        } catch (error) {
            if (removedItem) {
                setPendingDeposits(prev => [...prev, removedItem]);
            }
            addToast({ type: 'error', title: 'Error', message: 'Failed to reject deposit. Please try again.' });
        }
    };

    if (user?.role !== Role.Manager) {
        return (
            <AppLayout>
                <div className="p-8 text-center text-red-500">Access Denied. Managers only.</div>
            </AppLayout>
        );
    }

    const totalPending = pendingMemberRequests.length + pendingBillPayments.length + pendingExpenses.length + pendingDeposits.length;

    const tabs = [
        { id: 'bill-payments' as TabType, label: 'Bill Payments', count: pendingBillPayments.length },
        { id: 'shopping' as TabType, label: 'Shopping', count: pendingExpenses.length },
        { id: 'deposits' as TabType, label: 'Deposits', count: pendingDeposits.length },
        { id: 'join-requests' as TabType, label: 'Join Requests', count: pendingMemberRequests.length },
    ];

    return (
        <>
            <AppLayout>
                <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-20">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-sans tracking-tight">Pending Approvals</h1>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage and review pending requests</p>
                        </div>
                        <div className="flex items-center gap-3">
                            {loading && (
                                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium">
                                    <div className="w-4 h-4 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                                    Loading...
                                </div>
                            )}
                            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-warning-500/10 to-orange-500/10 text-orange-600 dark:text-orange-400 rounded-full font-semibold text-sm border border-orange-200 dark:border-orange-500/20 self-start sm:self-auto shadow-sm">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                                </span>
                                {totalPending} Pending Tasks
                            </div>
                        </div>
                    </div>

                    <div className="sticky top-0 z-10 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-sm p-1 -mx-4 px-4 sm:mx-0 sm:px-0 transition-all">
                        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide snap-x">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-none snap-start px-4 py-2.5 rounded-full font-semibold text-sm transition-all duration-200 border ${activeTab === tab.id
                                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-md transform scale-105'
                                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                                        }`}
                                >
                                    {tab.label}
                                    {tab.count > 0 && (
                                        <span className={`ml-2 px-1.5 py-0.5 text-xs rounded-full ${activeTab === tab.id
                                            ? 'bg-white/20 text-white dark:text-slate-900'
                                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                                            }`}>
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4 min-h-[50vh]">
                        {activeTab === 'bill-payments' && (
                            <>
                                {pendingBillPayments.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                                        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-full mb-4">
                                            <CheckCircleIcon className="w-12 h-12 text-slate-300 dark:text-slate-600" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">All Caught Up!</h3>
                                        <p className="text-slate-500 dark:text-slate-500 mt-2">No bill payments pending approval.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-4">
                                        {pendingBillPayments.map(({ bill, share }) => (
                                            <div key={`${bill.id}-${share.userId}`} className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                                    <div className="flex items-start gap-4 w-full sm:w-auto">
                                                        <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-xl flex-shrink-0">
                                                            {categoryIcons[bill.category] || <OtherIcon className="w-6 h-6 text-slate-400" />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                                                                    {bill.category}
                                                                </h3>
                                                                <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md">
                                                                    {share.userName}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-3 mt-1 text-sm text-slate-500 dark:text-slate-400">
                                                                <span className="font-bold text-slate-900 dark:text-white font-numeric text-xl">৳{share.amount.toFixed(0)}</span>
                                                                <span>•</span>
                                                                <span>Due {new Date(bill.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-700">
                                                        <button
                                                            onClick={() => handleDenyBill(bill.id, share.userId)}
                                                            className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-semibold text-sm border border-danger-200 dark:border-danger-900/50 text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors"
                                                        >
                                                            Deny
                                                        </button>
                                                        <button
                                                            onClick={() => handleApproveBill(bill.id, share.userId)}
                                                            className="flex-1 sm:flex-none px-6 py-2.5 bg-slate-900 dark:bg-primary-600 text-white rounded-xl font-semibold text-sm hover:bg-slate-800 dark:hover:bg-primary-500 shadow-sm transition-all active:scale-95"
                                                        >
                                                            Approve
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}

                        {activeTab === 'shopping' && (
                            <>
                                {pendingExpenses.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                                        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-full mb-4">
                                            <CheckCircleIcon className="w-12 h-12 text-slate-300 dark:text-slate-600" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">All Caught Up!</h3>
                                        <p className="text-slate-500 dark:text-slate-500 mt-2">No shopping expenses pending approval.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {pendingExpenses.map(expense => (
                                            <div key={expense._id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm hover:shadow-md transition-all">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="text-lg">🛒</span>
                                                            <h3 className="font-bold text-slate-900 dark:text-white">Shopping Expense</h3>
                                                            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">Pending</span>
                                                        </div>
                                                        <p className="text-sm text-slate-500 dark:text-slate-400">By: {expense.userId?.name || 'Unknown'}</p>
                                                        <p className="text-sm text-slate-500 dark:text-slate-400">Amount: <span className="font-bold text-slate-900 dark:text-white">৳{expense.amount}</span></p>
                                                        {expense.items && (
                                                            <p className="text-xs text-slate-400 mt-1">Items: {Array.isArray(expense.items) ? expense.items.join(', ') : expense.items}</p>
                                                        )}
                                                        {expense.notes && <p className="text-xs text-slate-400 italic mt-1">"{expense.notes}"</p>}
                                                        <p className="text-xs text-slate-400 mt-1">{new Date(expense.createdAt).toLocaleDateString()}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {expense.receiptUrl && (
                                                            <button
                                                                onClick={() => setReceiptModalUrl(expense.receiptUrl)}
                                                                className="px-3 py-2 text-sm font-semibold rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 transition-colors"
                                                            >
                                                                View Receipt
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleRejectExpense(expense._id)}
                                                            className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 transition-colors"
                                                        >
                                                            Reject
                                                        </button>
                                                        <button
                                                            onClick={() => handleApproveExpense(expense._id)}
                                                            className="px-4 py-2 text-sm font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 shadow-sm transition-colors"
                                                        >
                                                            Approve
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}

                        {activeTab === 'deposits' && (
                            <>
                                {pendingDeposits.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                                        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-full mb-4">
                                            <CheckCircleIcon className="w-12 h-12 text-slate-300 dark:text-slate-600" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">All Caught Up!</h3>
                                        <p className="text-slate-500 dark:text-slate-500 mt-2">No deposits pending approval.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {pendingDeposits.map(deposit => (
                                            <div key={deposit._id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm hover:shadow-md transition-all">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="text-lg">💰</span>
                                                            <h3 className="font-bold text-slate-900 dark:text-white">Deposit</h3>
                                                            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">Pending</span>
                                                        </div>
                                                        <p className="text-sm text-slate-500 dark:text-slate-400">By: {deposit.userId?.name || 'Unknown'}</p>
                                                        <p className="text-sm text-slate-500 dark:text-slate-400">Amount: <span className="font-bold text-green-600 dark:text-green-400">৳{deposit.amount}</span></p>
                                                        {deposit.notes && <p className="text-xs text-slate-400 italic mt-1">"{deposit.notes}"</p>}
                                                        <p className="text-xs text-slate-400 mt-1">{new Date(deposit.createdAt).toLocaleDateString()}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {deposit.screenshotUrl && (
                                                            <button
                                                                onClick={() => setReceiptModalUrl(deposit.screenshotUrl)}
                                                                className="px-3 py-2 text-sm font-semibold rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 transition-colors"
                                                            >
                                                                View Receipt
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleRejectDeposit(deposit._id)}
                                                            className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 transition-colors"
                                                        >
                                                            Reject
                                                        </button>
                                                        <button
                                                            onClick={() => handleApproveDeposit(deposit._id)}
                                                            className="px-4 py-2 text-sm font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 shadow-sm transition-colors"
                                                        >
                                                            Approve
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}



                        {activeTab === 'join-requests' && (
                            <>
                                {pendingMemberRequests.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                                        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-full mb-4">
                                            <CheckCircleIcon className="w-12 h-12 text-slate-300 dark:text-slate-600" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">No New Requests</h3>
                                        <p className="text-slate-500 dark:text-slate-500 mt-2">You have processed all join requests.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-4">
                                        {pendingMemberRequests.map(req => (
                                            <div key={req.id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                                    <div className="flex items-start gap-4 w-full sm:w-auto">
                                                        <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/50 dark:to-primary-800/50 rounded-xl flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-xl flex-shrink-0 shadow-inner">
                                                            {req.name.charAt(0)}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="font-bold text-slate-900 dark:text-white text-lg">{req.name}</h3>
                                                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 break-all font-mono opacity-80">{req.email}</p>
                                                            <div className="flex items-center gap-2 mt-2">
                                                                <span className="text-xs font-medium px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full">
                                                                    Requested {new Date(req.requestedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-700">
                                                        <button
                                                            className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-semibold text-sm border border-danger-200 dark:border-danger-900/50 text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors"
                                                        >
                                                            Deny
                                                        </button>
                                                        <button
                                                            onClick={() => handleApproveMember(req.id)}
                                                            className="flex-1 sm:flex-none px-6 py-2.5 bg-slate-900 dark:bg-primary-600 text-white rounded-xl font-semibold text-sm hover:bg-slate-800 dark:hover:bg-primary-500 shadow-sm transition-all active:scale-95"
                                                        >
                                                            Approve
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </AppLayout>
            {/* Receipt Modal */}
            {receiptModalUrl && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setReceiptModalUrl(null)}>
                    <div className="bg-white dark:bg-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-800">
                            <h3 className="font-bold text-lg">Receipt</h3>
                            <button onClick={() => setReceiptModalUrl(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">✕</button>
                        </div>
                        <div className="p-4">
                            <img src={receiptModalUrl} alt="Receipt" className="w-full h-auto rounded-lg" />
                        </div>
                    </div>
                </div>
            )}
            <ToastContainer />
        </>
    );
}
