"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import type { Bill } from '@/types';
import { Role } from '@/types';
import { WifiIcon, ArrowLeftIcon, PlusIcon } from '@/components/Icons';
import { useNotifications } from '@/contexts/NotificationContext';
import AddBillModal from '@/components/modals/AddBillModal';
import EditSharedBillModal from '@/components/modals/EditSharedBillModal';
import AppLayout from '@/components/AppLayout';
import ToastContainer from '@/components/ToastContainer';
import { useRouter } from 'next/navigation';

const CATEGORY = 'Wi-Fi';
const ICON = <WifiIcon className="w-8 h-8 text-cyan-500" />;

const statusColors: Record<string, { text: string, bg: string }> = {
    'Paid': { text: 'text-success-700 dark:text-success-400', bg: 'bg-success-500/10' },
    'Pending Approval': { text: 'text-warning-600 dark:text-warning-400', bg: 'bg-warning-500/10' },
    'Unpaid': { text: 'text-slate-800 dark:text-slate-200', bg: 'bg-slate-100 dark:bg-slate-700' },
    'Overdue': { text: 'text-danger-600 dark:text-danger-400', bg: 'bg-danger-500/10' },
};

const getPastSixMonths = () => {
    const months = [];
    const date = new Date();
    for (let i = 0; i < 6; i++) {
        const d = new Date(date);
        d.setMonth(d.getMonth() - i);
        months.push(d.toLocaleString('default', { month: 'long', year: 'numeric' }));
    }
    return months;
};

export default function RentBillsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [bills, setBills] = useState<Bill[]>([]);
    const [loading, setLoading] = useState(true);
    const [confirmingPayment, setConfirmingPayment] = useState<Bill | null>(null);
    const [editingBill, setEditingBill] = useState<Bill | null>(null);
    const { addToast } = useNotifications();
    const [availableMonths] = useState<string[]>(getPastSixMonths());
    const [selectedMonth, setSelectedMonth] = useState<string>(availableMonths[0]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    useEffect(() => {
        if (user?.khataId) {
            setLoading(true);
            api.getBillsForRoom(user.khataId).then(data => {
                const categoryBills = data
                    .filter(b => b.category === CATEGORY)
                    .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
                setBills(categoryBills);
                setLoading(false);
            });
        }
    }, [user, CATEGORY]);

    const handleMarkAsPaid = async () => {
        if (!confirmingPayment || !user) return;
        const updatedBill = await api.updateBillShareStatus(confirmingPayment.id, user.id, 'Pending Approval');
        if (updatedBill) {
            setBills(prevBills => prevBills.map(b => b.id === updatedBill.id ? updatedBill : b));
            addToast({ type: 'success', title: 'Payment Submitted', message: 'Your payment is now pending approval.' });
        }
        setConfirmingPayment(null);
    };

    const handleApprovePayment = async (billId: string, userId: string) => {
        const updatedBill = await api.updateBillShareStatus(billId, userId, 'Paid');
        if (updatedBill) {
            setBills(prev => prev.map(b => b.id === updatedBill.id ? updatedBill : b));
            addToast({ type: 'success', title: 'Approved', message: 'Payment approved successfully.' });
        }
    };

    const handleDenyPayment = async (billId: string, userId: string) => {
        const updatedBill = await api.updateBillShareStatus(billId, userId, 'Unpaid');
        if (updatedBill) {
            setBills(prev => prev.map(b => b.id === updatedBill.id ? updatedBill : b));
            addToast({ type: 'warning', title: 'Denied', message: 'Payment rejected.' });
        }
    };

    const handleBillUpdate = (updatedBill: Bill) => {
        setBills(prevBills => prevBills.map(b => b.id === updatedBill.id ? updatedBill : b));
        addToast({ type: 'success', title: 'Bill Updated', message: `Bill updated successfully.` });
        setEditingBill(null);
    };

    const handleBillAdded = (newBill: Bill) => {
        setBills(prev => [newBill, ...prev].sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()));
        addToast({ type: 'success', title: 'Bill Added', message: `New ${CATEGORY} bill created.` });
        setIsAddModalOpen(false);
    };

    const handleDelete = (bill: Bill) => {
        if (window.confirm(`Delete ${bill.title}?`)) {
            setBills(prev => prev.filter(b => b.id !== bill.id));
            addToast({ type: 'error', title: 'Deleted', message: 'Bill deleted.' });
        }
    };

    const selectedMonthBill = useMemo(() => {
        if (!selectedMonth) return null;
        const [monthStr, yearStr] = selectedMonth.split(' ');
        const year = parseInt(yearStr, 10);
        const monthIndex = new Date(Date.parse(monthStr + " 1, 2012")).getMonth();
        return bills.find(bill => {
            const billDate = new Date(bill.dueDate);
            return billDate.getFullYear() === year && billDate.getMonth() === monthIndex;
        });
    }, [bills, selectedMonth]);

    if (loading) {
        return (
            <AppLayout>
                <div className="text-center p-8">Loading {CATEGORY} bills...</div>
            </AppLayout>
        );
    }

    if (!user) return null;

    const renderManagerView = (bill: Bill) => (
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 space-y-4">
                <h2 className="text-xl font-bold font-sans text-slate-800 dark:text-white">{selectedMonth} Bill</h2>
                <div className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
                    <p><strong>Total:</strong> <span className="font-numeric text-base">৳{bill.totalAmount.toFixed(2)}</span></p>
                    <p><strong>Due:</strong> {bill.dueDate}</p>
                    {bill.description && <p><strong>Notes:</strong> {bill.description}</p>}
                </div>
                <div>
                    <h3 className="font-bold font-sans text-slate-800 dark:text-white mb-2">Split Among {bill.shares.length} Members:</h3>
                    <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg space-y-2">
                        {bill.shares.map(s => (
                            <div key={s.userId} className="flex justify-between items-center text-sm">
                                <div>
                                    <p className="font-medium text-slate-800 dark:text-slate-200">{s.userName} - <span className="font-numeric">৳{s.amount.toFixed(2)}</span></p>
                                    <span className={`text-xs font-semibold ${statusColors[s.status].text}`}>{s.status}</span>
                                </div>
                                <div className="flex gap-2">
                                    {s.status === 'Pending Approval' && (
                                        <>
                                            <button onClick={() => handleDenyPayment(bill.id, s.userId)} className="px-2 py-1 text-xs font-semibold bg-danger-500/10 text-danger-600 rounded-md hover:bg-danger-500/20">Deny</button>
                                            <button onClick={() => handleApprovePayment(bill.id, s.userId)} className="px-2 py-1 text-xs font-semibold bg-success-500/10 text-success-600 rounded-md hover:bg-success-500/20">Approve</button>
                                        </>
                                    )}
                                    {s.status === 'Paid' && <span className="text-success-600">✅</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex gap-2 justify-end">
                    <button onClick={() => setEditingBill(bill)} className="px-3 py-1.5 text-sm font-semibold border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700">Edit</button>
                    <button onClick={() => handleDelete(bill)} className="px-3 py-1.5 text-sm font-semibold text-danger-600 bg-danger-500/10 rounded-md hover:bg-danger-500/20">Delete</button>
                </div>
            </div>
        </div>
    );

    const renderMemberView = (bill: Bill) => {
        const myShare = bill.shares.find(s => s.userId === user.id);
        if (!myShare) return <p>Your details not available.</p>;

        return (
            <div className="space-y-6">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 space-y-4">
                    <h2 className="text-xl font-bold font-sans text-slate-800 dark:text-white">{selectedMonth}</h2>
                    <div className="text-sm text-slate-600 dark:text-slate-300">
                        <p>Total: <span className="font-semibold text-slate-800 dark:text-white font-numeric">৳{bill.totalAmount.toFixed(2)}</span></p>
                        <p className="text-lg mt-1">Your Share: <span className="font-bold text-xl text-primary-600 font-numeric">৳{myShare.amount.toFixed(2)}</span></p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Due: {bill.dueDate}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Status: <span className={`font-semibold ${statusColors[myShare.status].text}`}>{myShare.status}</span></p>
                    </div>
                    <div className="flex gap-3">
                        {(myShare.status === 'Unpaid' || myShare.status === 'Overdue') && (
                            <button onClick={() => setConfirmingPayment(bill)} className="px-4 py-2 text-sm font-semibold bg-gradient-success text-white rounded-md hover:shadow-lg">Pay Now</button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            <AppLayout>
                <div className="space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <button onClick={() => router.push('/bills/overview')} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"><ArrowLeftIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" /></button>
                            {ICON}
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white font-sans">{CATEGORY} Bills</h1>
                        </div>
                        {user.role === Role.Manager && (
                            <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-gradient-success text-white font-semibold rounded-md hover:shadow-lg"><PlusIcon className="w-5 h-5" />Add Bill</button>
                        )}
                    </div>

                    <div className="flex justify-end">
                        <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="px-4 py-2 text-sm font-semibold bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md">
                            {availableMonths.map(month => <option key={month} value={month}>{month}</option>)}
                        </select>
                    </div>

                    {!selectedMonthBill ? (
                        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                            <h3 className="text-lg font-medium font-sans text-slate-900 dark:text-white">No {CATEGORY} bill for {selectedMonth}.</h3>
                            {user.role === Role.Manager && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Click "Add Bill" to create one.</p>}
                        </div>
                    ) : (
                        user.role === Role.Manager ? renderManagerView(selectedMonthBill) : renderMemberView(selectedMonthBill)
                    )}
                </div>
            </AppLayout>

            {editingBill && <EditSharedBillModal billToEdit={editingBill} onClose={() => setEditingBill(null)} onBillUpdated={handleBillUpdate} />}
            {isAddModalOpen && <AddBillModal onClose={() => setIsAddModalOpen(false)} onBillAdded={handleBillAdded} preselectedCategory={CATEGORY} availableMonths={availableMonths} selectedMonth={selectedMonth} />}
            {confirmingPayment && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-sm animate-scale-in">
                        <h3 className="text-lg font-bold font-sans text-slate-900 dark:text-white">Confirm Payment</h3>
                        <div className="mt-4 mb-6 text-sm text-slate-600 dark:text-slate-300">
                            <p>Bill: <span className="font-semibold">{confirmingPayment.title}</span></p>
                            <p>Amount: <span className="font-semibold font-numeric">৳{confirmingPayment.shares.find(s => s.userId === user?.id)?.amount.toFixed(2)}</span></p>
                            <p className="mt-4 p-2 bg-warning-500/10 text-warning-600 dark:text-warning-400 rounded-md">⚠️ Sent to manager for approval.</p>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setConfirmingPayment(null)} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold rounded-md hover:bg-slate-300 dark:hover:bg-slate-500">Cancel</button>
                            <button onClick={handleMarkAsPaid} className="px-4 py-2 bg-gradient-success text-white rounded-md font-semibold hover:shadow-lg">Confirm</button>
                        </div>
                    </div>
                </div>
            )}
            <ToastContainer />
        </>
    );
}
