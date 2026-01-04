"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { Role, Bill } from '@/types';
import { useNotifications } from '@/contexts/NotificationContext';
import {
    CheckCircleIcon, HomeIcon, ElectricityIcon, WaterIcon, GasIcon,
    WifiIcon, MaidIcon, OtherIcon, CalendarIcon, UserCircleIcon
} from '@/components/Icons';
import AppLayout from '@/components/AppLayout';
import { RequestCard, ApprovalsTabs } from '@/components/pending-approvals';
import { AnimatePresence, motion } from 'framer-motion';

const categoryIcons: Record<string, React.ReactElement> = {
    'Rent': <HomeIcon className="w-5 h-5 text-danger-500" />,
    'Electricity': <ElectricityIcon className="w-5 h-5 text-yellow-500" />,
    'Water': <WaterIcon className="w-5 h-5 text-blue-500" />,
    'Gas': <GasIcon className="w-5 h-5 text-orange-500" />,
    'Wi-Fi': <WifiIcon className="w-5 h-5 text-cyan-500" />,
    'Maid': <MaidIcon className="w-5 h-5 text-purple-500" />,
    'Others': <OtherIcon className="w-5 h-5 text-muted-foreground" />,
};

type TabType = 'bill-payments' | 'shopping' | 'deposits' | 'join-requests';

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

        const removedItem = pendingMemberRequests.find(req => req.id === userId);
        setPendingMemberRequests(prev => prev.filter(req => req.id !== userId));
        addToast({ type: 'success', title: 'Approved', message: 'Member approved successfully' });

        try {
            const success = await api.approveMember(user.khataId, userId);
            if (!success && removedItem) {
                setPendingMemberRequests(prev => [...prev, removedItem]);
                addToast({ type: 'error', title: 'Error', message: 'Failed to approve member. Please try again.' });
            }
        } catch (error) {
            if (removedItem) setPendingMemberRequests(prev => [...prev, removedItem]);
            addToast({ type: 'error', title: 'Error', message: 'Failed to approve member. Please try again.' });
        }
    };

    const handleDenyMember = async (userId: string) => {
        addToast({ 
            type: 'info', 
            title: 'Feature Not Available', 
            message: 'Denying member requests is not currently supported. You can approve requests or contact support for assistance.' 
        });
    };

    const handleApproveBill = async (billId: string, userId: string) => { // Wrapper for card compatibility
        await handleApproveBillLogic(billId, userId);
    }
    const handleApproveBillLogic = async (billId: string, userId: string) => {
        const removedItem = pendingBillPayments.find(item => item.bill.id === billId && item.share.userId === userId);
        setPendingBillPayments(prev => prev.filter(item => !(item.bill.id === billId && item.share.userId === userId)));
        addToast({ type: 'success', title: 'Approved', message: 'Payment approved successfully.' });

        const updatedBill = await api.updateBillShareStatus(billId, userId, 'Paid');
        if (!updatedBill && removedItem) {
            setPendingBillPayments(prev => [...prev, removedItem]);
            addToast({ type: 'error', title: 'Error', message: 'Failed to approve payment. Please try again.' });
        }
    };

    const handleDenyBill = async (billId: string, userId: string) => { // Wrapper
        await handleDenyBillLogic(billId, userId);
    }

    const handleDenyBillLogic = async (billId: string, userId: string) => {
        const removedItem = pendingBillPayments.find(item => item.bill.id === billId && item.share.userId === userId);
        setPendingBillPayments(prev => prev.filter(item => !(item.bill.id === billId && item.share.userId === userId)));
        addToast({ type: 'warning', title: 'Denied', message: 'Payment rejected. Status reset to Unpaid.' });

        const updatedBill = await api.updateBillShareStatus(billId, userId, 'Unpaid');
        if (!updatedBill && removedItem) {
            setPendingBillPayments(prev => [...prev, removedItem]);
            addToast({ type: 'error', title: 'Error', message: 'Failed to deny payment. Please try again.' });
        }
    };

    const handleApproveExpense = async (expenseId: string) => {
        if (!user?.khataId) return;
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
            if (removedItem) setPendingExpenses(prev => [...prev, removedItem]);
            addToast({ type: 'error', title: 'Error', message: 'Failed to approve expense. Please try again.' });
        }
    };

    const handleRejectExpense = async (expenseId: string) => {
        if (!user?.khataId) return;
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
            if (removedItem) setPendingExpenses(prev => [...prev, removedItem]);
            addToast({ type: 'error', title: 'Error', message: 'Failed to reject expense. Please try again.' });
        }
    };

    const handleApproveDeposit = async (depositId: string) => {
        if (!user?.khataId) return;
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
            if (removedItem) setPendingDeposits(prev => [...prev, removedItem]);
            addToast({ type: 'error', title: 'Error', message: 'Failed to approve deposit. Please try again.' });
        }
    };

    const handleRejectDeposit = async (depositId: string) => {
        if (!user?.khataId) return;
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
            if (removedItem) setPendingDeposits(prev => [...prev, removedItem]);
            addToast({ type: 'error', title: 'Error', message: 'Failed to reject deposit. Please try again.' });
        }
    };

    if (user?.role !== Role.Manager) {
        return (
            <AppLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 animate-fade-in">
                    <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                        <div className="w-8 h-8 text-destructive">🚫</div>
                    </div>
                    <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
                    <p className="text-muted-foreground mt-2">This page is restricted to managers only.</p>
                </div>
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

    const EmptyState = ({ message }: { message: string }) => (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 bg-card/50 rounded-3xl border border-dashed border-border text-center"
        >
            <div className="p-5 bg-muted rounded-full mb-4 shadow-sm">
                <CheckCircleIcon className="w-12 h-12 text-muted-foreground/50" />
            </div>
            <h3 className="text-xl font-bold text-foreground">All Caught Up!</h3>
            <p className="text-muted-foreground mt-2 max-w-xs mx-auto">{message}</p>
        </motion.div>
    );

    return (
        <>
            <AppLayout>
                <div className="space-y-8 animate-fade-in max-w-5xl mx-auto pb-24 px-4 sm:px-6">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-6">
                        <div className="space-y-2">
                            <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                                Pending <span className="text-primary">Approvals</span>
                            </h1>
                            <p className="text-muted-foreground text-base max-w-lg">
                                Review and manage pending requests from your room members.
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            {loading && (
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-background border border-border rounded-full text-xs font-medium shadow-sm animate-pulse">
                                    <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                                    Syncing...
                                </div>
                            )}
                            <div className="flex items-center gap-2 px-5 py-2.5 bg-card text-foreground rounded-full font-bold text-sm border border-border/50 shadow-sm hover:shadow-md transition-all">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
                                </span>
                                {totalPending} Pending
                            </div>
                        </div>
                    </div>

                    {/* Tabs Section */}
                    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-xl py-4 -mx-4 px-4 sm:mx-0 sm:px-0 transition-all border-b border-border/5 mb-6">
                        <ApprovalsTabs
                            tabs={tabs}
                            activeTab={activeTab}
                            onChange={(id) => setActiveTab(id as TabType)}
                        />
                    </div>

                    {/* Content Section */}
                    <div className="min-h-[50vh]">
                        <AnimatePresence mode="wait">
                            {activeTab === 'bill-payments' && (
                                <motion.div
                                    key="bill-payments"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.2 }}
                                    className="grid grid-cols-1 lg:grid-cols-2 gap-4"
                                >
                                    {pendingBillPayments.length === 0 ? (
                                        <div className="col-span-full">
                                            <EmptyState message="No pending bill payments to review." />
                                        </div>
                                    ) : (
                                        pendingBillPayments.map(({ bill, share }) => (
                                            <RequestCard
                                                key={`${bill.id}-${share.userId}`}
                                                id={bill.id} // We handle the combination inside the wrapper
                                                type="bill"
                                                title={bill.category}
                                                subtitle={bill.dueDate ? `Due ${new Date(bill.dueDate).toLocaleDateString()}` : undefined}
                                                amount={share.amount}
                                                date={bill.dueDate || null}
                                                requester={{
                                                    name: share.userName,
                                                    role: 'Member'
                                                }}
                                                icon={categoryIcons[bill.category]}
                                                onApprove={() => handleApproveBill(bill.id, share.userId)}
                                                onDeny={() => handleDenyBill(bill.id, share.userId)}
                                            />
                                        ))
                                    )}
                                </motion.div>
                            )}

                            {activeTab === 'shopping' && (
                                <motion.div
                                    key="shopping"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.2 }}
                                    className="grid grid-cols-1 lg:grid-cols-2 gap-4"
                                >
                                    {pendingExpenses.length === 0 ? (
                                        <div className="col-span-full">
                                            <EmptyState message="No pending shopping expenses." />
                                        </div>
                                    ) : (
                                        pendingExpenses.map(expense => (
                                            <RequestCard
                                                key={expense._id}
                                                id={expense._id}
                                                type="shopping"
                                                title="Shopping Expense"
                                                subtitle={Array.isArray(expense.items) ? expense.items.join(', ') : expense.items}
                                                amount={expense.amount}
                                                date={expense.createdAt}
                                                requester={{
                                                    name: expense.userId?.name || 'Unknown',
                                                    avatarUrl: expense.userId?.avatarUrl
                                                }}
                                                icon={<div className="text-2xl">🛒</div>}
                                                metadata={[
                                                    ...(expense.notes ? [{ label: 'Notes', value: expense.notes, icon: <span className="text-xs">📝</span> }] : []),
                                                    ...(expense.receiptUrl ? [{
                                                        label: 'Receipt',
                                                        value: <button onClick={(e: React.MouseEvent) => { e.stopPropagation(); setReceiptModalUrl(expense.receiptUrl); }} className="text-primary hover:underline font-medium text-xs">View Receipt</button>,
                                                        icon: <span className="text-xs">📎</span>
                                                    }] : [])
                                                ]}
                                                onApprove={handleApproveExpense}
                                                onDeny={handleRejectExpense}
                                            />
                                        ))
                                    )}
                                </motion.div>
                            )}

                            {activeTab === 'deposits' && (
                                <motion.div
                                    key="deposits"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.2 }}
                                    className="grid grid-cols-1 lg:grid-cols-2 gap-4"
                                >
                                    {pendingDeposits.length === 0 ? (
                                        <div className="col-span-full">
                                            <EmptyState message="No pending deposits." />
                                        </div>
                                    ) : (
                                        pendingDeposits.map(deposit => (
                                            <RequestCard
                                                key={deposit._id}
                                                id={deposit._id}
                                                type="deposit"
                                                title="Deposit"
                                                subtitle={deposit.notes || 'No notes'}
                                                amount={deposit.amount}
                                                date={deposit.createdAt}
                                                requester={{
                                                    name: deposit.userId?.name || 'Unknown',
                                                    avatarUrl: deposit.userId?.avatarUrl
                                                }}
                                                icon={<div className="text-2xl">💰</div>}
                                                metadata={[
                                                    ...(deposit.screenshotUrl ? [{
                                                        label: 'Screenshot',
                                                        value: <button onClick={(e: React.MouseEvent) => { e.stopPropagation(); setReceiptModalUrl(deposit.screenshotUrl); }} className="text-primary hover:underline font-medium text-xs">View Proof</button>,
                                                        icon: <span className="text-xs">📎</span>
                                                    }] : [])
                                                ]}
                                                onApprove={handleApproveDeposit}
                                                onDeny={handleRejectDeposit}
                                            />
                                        ))
                                    )}
                                </motion.div>
                            )}


                            {activeTab === 'join-requests' && (
                                <motion.div
                                    key="join-requests"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.2 }}
                                    className="grid grid-cols-1 lg:grid-cols-2 gap-4"
                                >
                                    {pendingMemberRequests.length === 0 ? (
                                        <div className="col-span-full">
                                            <EmptyState message="No new member join requests." />
                                        </div>
                                    ) : (
                                        pendingMemberRequests.map(req => (
                                            <RequestCard
                                                key={req.id}
                                                id={req.id}
                                                type="join-request"
                                                title={req.name}
                                                subtitle={req.email}
                                                date={req.requestedAt}
                                                requester={{
                                                    name: req.name,
                                                    role: 'New Member'
                                                }}
                                                icon={
                                                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                                        {req.name.charAt(0)}
                                                    </div>
                                                }
                                                onApprove={handleApproveMember}
                                                onDeny={handleDenyMember}
                                            />
                                        ))
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </AppLayout>

            {/* Receipt Modal */}
            <AnimatePresence>
                {receiptModalUrl && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setReceiptModalUrl(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-card rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-border"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30">
                                <h3 className="font-bold text-lg">Receipt/Proof</h3>
                                <button onClick={() => setReceiptModalUrl(null)} className="p-2 hover:bg-muted rounded-full transition-colors">✕</button>
                            </div>
                            <div className="p-4 overflow-auto max-h-[calc(90vh-60px)]">
                                <img src={receiptModalUrl} alt="Receipt" className="w-full h-auto rounded-lg" />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
