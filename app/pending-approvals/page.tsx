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
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        if (user?.khataId && user.role === Role.Manager) {
            setLoading(true);
            try {
                const memberRequests = await api.getPendingApprovals(user.khataId);
                setPendingMemberRequests(memberRequests);

                const bills = await api.getBillsForRoom(user.khataId);
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
        try {
            const success = await api.approveMember(user.khataId, userId);
            if (success) {
                setPendingMemberRequests(prev => prev.filter(req => req.id !== userId));
                addToast({ type: 'success', title: 'Approved', message: 'Member approved successfully' });
            } else {
                addToast({ type: 'error', title: 'Error', message: 'Failed to approve member' });
            }
        } catch (error) {
            addToast({ type: 'error', title: 'Error', message: 'Failed to approve member' });
        }
    };

    const handleApproveBill = async (billId: string, userId: string) => {
        const updatedBill = await api.updateBillShareStatus(billId, userId, 'Paid');
        if (updatedBill) {
            setPendingBillPayments(prev => prev.filter(item => !(item.bill.id === billId && item.share.userId === userId)));
            addToast({ type: 'success', title: 'Approved', message: 'Payment approved successfully.' });
        } else {
            addToast({ type: 'error', title: 'Error', message: 'Failed to approve payment.' });
        }
    };

    const handleDenyBill = async (billId: string, userId: string) => {
        const updatedBill = await api.updateBillShareStatus(billId, userId, 'Unpaid');
        if (updatedBill) {
            setPendingBillPayments(prev => prev.filter(item => !(item.bill.id === billId && item.share.userId === userId)));
            addToast({ type: 'warning', title: 'Denied', message: 'Payment rejected. Status reset to Unpaid.' });
        } else {
            addToast({ type: 'error', title: 'Error', message: 'Failed to deny payment.' });
        }
    };

    if (loading) {
        return (
            <AppLayout>
                <div className="p-8 text-center">Loading pending requests...</div>
            </AppLayout>
        );
    }

    if (user?.role !== Role.Manager) {
        return (
            <AppLayout>
                <div className="p-8 text-center text-red-500">Access Denied. Managers only.</div>
            </AppLayout>
        );
    }

    const totalPending = pendingMemberRequests.length + pendingBillPayments.length;

    const tabs = [
        { id: 'bill-payments' as TabType, label: 'Bill Payments', count: pendingBillPayments.length },
        { id: 'shopping' as TabType, label: 'Shopping', count: 0 },
        { id: 'deposits' as TabType, label: 'Deposits', count: 0 },
        { id: 'meal-entries' as TabType, label: 'Meal Entries', count: 0 },
        { id: 'join-requests' as TabType, label: 'Join Requests', count: pendingMemberRequests.length },
    ];

    return (
        <>
            <AppLayout>
                <div className="space-y-6 animate-fade-in">
                    <div className="flex items-center justify-between">
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white font-sans">Pending Approvals</h1>
                        <div className="px-4 py-2 bg-warning-500/10 text-warning-600 dark:text-warning-400 rounded-lg font-semibold">
                            ⚡ {totalPending} Tasks
                        </div>
                    </div>

                    <div className="bg-slate-100 dark:bg-slate-800/50 p-1 rounded-lg flex gap-1 overflow-x-auto">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 min-w-fit px-4 py-2.5 rounded-md font-semibold text-sm transition-all ${activeTab === tab.id
                                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                            >
                                {tab.label} {tab.count > 0 && <span className="ml-1 text-xs">{tab.count}</span>}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-4">
                        {activeTab === 'bill-payments' && (
                            <>
                                {pendingBillPayments.length === 0 ? (
                                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-12 text-center">
                                        <CheckCircleIcon className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                                        <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-400">No Pending Bill Payments</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">All bill payments have been processed.</p>
                                    </div>
                                ) : (
                                    pendingBillPayments.map(({ bill, share }) => (
                                        <div key={`${bill.id}-${share.userId}`} className="bg-white dark:bg-slate-800 rounded-lg p-5 border border-slate-200 dark:border-slate-700">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start gap-3">
                                                    <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                                                        {categoryIcons[bill.category] || <OtherIcon className="w-5 h-5 text-slate-400" />}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                                            {bill.category} Bill - {share.userName}
                                                        </h3>
                                                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                                            Amount: <span className="font-bold text-slate-800 dark:text-white font-numeric">৳{share.amount.toFixed(0)}</span>
                                                        </p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                                                            Due: {new Date(bill.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </p>
                                                        <p className="text-xs text-warning-600 dark:text-warning-400 mt-1">Status: Waiting for your approval</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleDenyBill(bill.id, share.userId)}
                                                        className="px-4 py-2 bg-danger-500/20 text-danger-600 dark:text-danger-400 rounded-lg font-semibold hover:bg-danger-500/30 transition-colors text-sm"
                                                    >
                                                        Deny
                                                    </button>
                                                    <button
                                                        onClick={() => handleApproveBill(bill.id, share.userId)}
                                                        className="px-4 py-2 bg-success-500/20 text-success-600 dark:text-success-400 rounded-lg font-semibold hover:bg-success-500/30 transition-colors text-sm"
                                                    >
                                                        Approve Payment
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </>
                        )}

                        {activeTab === 'shopping' && (
                            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-12 text-center">
                                <CheckCircleIcon className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                                <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-400">No Pending Shopping Expenses</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">All shopping expenses have been processed.</p>
                            </div>
                        )}

                        {activeTab === 'deposits' && (
                            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-12 text-center">
                                <CheckCircleIcon className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                                <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-400">No Pending Deposits</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">All deposits have been processed.</p>
                            </div>
                        )}

                        {activeTab === 'meal-entries' && (
                            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-12 text-center">
                                <CheckCircleIcon className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                                <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-400">No Pending Meal Entries</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">All meal entries have been processed.</p>
                            </div>
                        )}

                        {activeTab === 'join-requests' && (
                            <>
                                {pendingMemberRequests.length === 0 ? (
                                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-12 text-center">
                                        <CheckCircleIcon className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                                        <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-400">No Pending Join Requests</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">All join requests have been processed.</p>
                                    </div>
                                ) : (
                                    pendingMemberRequests.map(req => (
                                        <div key={req.id} className="bg-white dark:bg-slate-800 rounded-lg p-5 border border-slate-200 dark:border-slate-700">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-10 h-10 bg-primary-500/20 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-lg">
                                                        {req.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-slate-800 dark:text-white">{req.name}</h3>
                                                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{req.email}</p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                                                            Requested: {new Date(req.requestedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button className="px-4 py-2 bg-danger-500/20 text-danger-600 dark:text-danger-400 rounded-lg font-semibold hover:bg-danger-500/30 transition-colors text-sm">
                                                        Deny
                                                    </button>
                                                    <button
                                                        onClick={() => handleApproveMember(req.id)}
                                                        className="px-4 py-2 bg-success-500/20 text-success-600 dark:text-success-400 rounded-lg font-semibold hover:bg-success-500/30 transition-colors text-sm"
                                                    >
                                                        Approve
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </>
                        )}
                    </div>
                </div>
            </AppLayout>
            <ToastContainer />
        </>
    );
}
