"use client";

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Role } from '@/types';
import { ShoppingCartIcon, ArrowLeftIcon, CameraIcon, FolderIcon, CheckCircleIcon, XIcon } from '@/components/Icons';
import { useNotifications } from '@/contexts/NotificationContext';
import { api } from '@/services/api';
import ToastContainer from '@/components/ToastContainer';

// ShoppingDuty interface to strongly type the roster data
interface ShoppingDuty {
    name: string;
    status: string;
    amount: number;
}

// Empty initial roster structure - will be populated from database
const emptyRoster: Record<string, ShoppingDuty> = {
    'Monday': { name: '', status: 'Upcoming', amount: 0 },
    'Tuesday': { name: '', status: 'Upcoming', amount: 0 },
    'Wednesday': { name: '', status: 'Upcoming', amount: 0 },
    'Thursday': { name: '', status: 'Upcoming', amount: 0 },
    'Friday': { name: '', status: 'Upcoming', amount: 0 },
    'Saturday': { name: '', status: 'Upcoming', amount: 0 },
    'Sunday': { name: '', status: 'Upcoming', amount: 0 },
};

const initialFundStatus = {
    totalDeposits: 0,
    totalShopping: 0,
    balance: 0,
    rate: 0,
};

const initialMemberSummary = {
    totalDeposits: 0,
    mealCost: 0,
    refundable: 0,
};

// --- MODALS ---
type Roster = typeof emptyRoster;

interface EditRosterModalProps {
    onClose: () => void;
    roster: Roster;
    members: { id: string; name: string }[];
    onSave: (newRoster: Roster) => void;
}

const EditRosterModal: React.FC<EditRosterModalProps> = ({ onClose, roster, members, onSave }) => {
    const [editedRoster, setEditedRoster] = useState(roster);

    const handleAssignmentChange = (day: string, newName: string) => {
        setEditedRoster(prev => {
            const currentDuty = prev[day];
            const isUnassigning = newName === '';
            const isNameChanged = currentDuty.name !== newName;

            let newStatus = currentDuty.status;
            if (isUnassigning) {
                newStatus = 'Upcoming';
            } else if (isNameChanged) {
                newStatus = 'Assigned';
            }

            return {
                ...prev,
                [day]: {
                    ...currentDuty,
                    name: newName,
                    status: newStatus,
                    amount: isNameChanged ? 0 : currentDuty.amount
                }
            };
        });
    };

    const handleSaveChanges = () => {
        onSave(editedRoster);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Edit Shopping Roster</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"><XIcon className="w-5 h-5 text-slate-500" /></button>
                </div>
                <div className="space-y-4">
                    {Object.entries(editedRoster).map(([day, duty]) => {
                        const shoppingDuty = duty as ShoppingDuty;
                        return (
                            <div key={day} className="flex items-center justify-between">
                                <label className="font-semibold text-slate-700 dark:text-slate-300">{day}:</label>
                                <select
                                    value={shoppingDuty.name}
                                    onChange={(e) => handleAssignmentChange(day, e.target.value)}
                                    className="px-3 py-2 bg-slate-100 dark:bg-slate-700 border-2 border-transparent rounded-lg focus:outline-none focus:border-primary-500 transition-colors text-slate-900 dark:text-white"
                                >
                                    <option value="">None</option>
                                    {members.map(member => <option key={member.id} value={member.name}>{member.name}</option>)}
                                </select>
                            </div>
                        );
                    })}
                </div>
                <div className="flex gap-3 mt-6 justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-800 dark:text-white">Cancel</button>
                    <button onClick={handleSaveChanges} className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700">Save Changes</button>
                </div>
            </div>
        </div>
    );
};

const AddDepositModal: React.FC<{ onClose: () => void, onSubmit: () => void }> = ({ onClose, onSubmit }) => {
    const { user } = useAuth();
    const { addToast } = useNotifications();
    const [amount, setAmount] = useState('1500');
    const [method, setMethod] = useState('bKash');
    const [transactionId, setTransactionId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user?.khataId) {
            addToast({ type: 'error', title: 'Error', message: 'User not found' });
            return;
        }

        setIsSubmitting(true);
        try {
            await api.createDeposit(user.khataId, {
                amount: parseFloat(amount),
                paymentMethod: method,
                transactionId,
                screenshotUrl: '' // TODO: implement file upload
            });

            addToast({ type: 'success', title: 'Deposit Submitted', message: 'Your deposit is now pending manager approval.' });
            onSubmit();
            onClose();
        } catch (error: any) {
            addToast({ type: 'error', title: 'Error', message: error.response?.data?.message || 'Failed to submit deposit' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Deposit to Meal Fund</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"><XIcon className="w-5 h-5 text-slate-500" /></button>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Amount:</label>
                        <div className="relative mt-1">
                            <span className="absolute inset-y-0 left-3 flex items-center text-slate-500">৳</span>
                            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full pl-8 pr-4 py-2 bg-slate-100 dark:bg-slate-700 border-2 border-transparent rounded-lg focus:outline-none focus:border-primary-500 transition-colors text-slate-900 dark:text-white" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Payment Method:</label>
                        <div className="grid grid-cols-3 gap-2 mt-1">
                            {['bKash', 'Nagad', 'Rocket', 'Cash', 'Bank Transfer'].map(m => (
                                <button type="button" key={m} onClick={() => setMethod(m)} className={`px-2 py-2 text-xs font-semibold rounded-md border-2 ${method === m ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/20 text-primary-700 dark:text-primary-300' : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400'}`}>{m}</button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Transaction ID (optional):</label>
                        <input
                            type="text"
                            placeholder="TRX12345678"
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value)}
                            className="w-full mt-1 px-4 py-2 bg-slate-100 dark:bg-slate-700 border-2 border-transparent rounded-lg focus:outline-none focus:border-primary-500 transition-colors text-slate-900 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Upload Screenshot (optional):</label>
                        <div className="flex gap-2 mt-1">
                            <button type="button" className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-slate-100 dark:bg-slate-700 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300"><CameraIcon className="w-5 h-5" />Take Photo</button>
                            <button type="button" className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-slate-100 dark:bg-slate-700 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300"><FolderIcon className="w-5 h-5" />Gallery</button>
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full mt-2 py-2.5 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
                    </button>
                </form>
            </div>
        </div>
    )
}

const AddExpenseModal: React.FC<{ onClose: () => void; onSubmit: () => void }> = ({ onClose, onSubmit }) => {
    const { user } = useAuth();
    const { addToast } = useNotifications();
    const [amount, setAmount] = useState('');
    const [items, setItems] = useState('');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user?.khataId) {
            addToast({ type: 'error', title: 'Error', message: 'User not found' });
            return;
        }

        setIsSubmitting(true);
        try {
            await api.createExpense(user.khataId, {
                amount: parseFloat(amount),
                items,
                notes,
                receiptUrl: '' // TODO: implement file upload
            });

            addToast({ type: 'success', title: 'Expense Submitted', message: 'Your shopping expense is now pending manager approval.' });
            onSubmit();
            onClose();
        } catch (error: any) {
            addToast({ type: 'error', title: 'Error', message: error.response?.data?.message || 'Failed to submit expense' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Add Shopping Expense</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"><XIcon className="w-5 h-5 text-slate-500" /></button>
                </div>
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Amount:</label>
                        <div className="relative mt-1">
                            <span className="absolute inset-y-0 left-3 flex items-center text-slate-500">৳</span>
                            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full pl-8 pr-4 py-2 bg-slate-100 dark:bg-slate-700 border-2 border-transparent rounded-lg focus:outline-none focus:border-primary-500 transition-colors text-slate-900 dark:text-white" required />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Items Purchased:</label>
                        <textarea value={items} onChange={e => setItems(e.target.value)} rows={3} placeholder="e.g., Rice (5kg), Vegetables, Oil (1L)" className="w-full mt-1 px-4 py-2 bg-slate-100 dark:bg-slate-700 border-2 border-transparent rounded-lg focus:outline-none focus:border-primary-500 transition-colors text-slate-900 dark:text-white" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Notes (optional):</label>
                        <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full mt-1 px-4 py-2 bg-slate-100 dark:bg-slate-700 border-2 border-transparent rounded-lg focus:outline-none focus:border-primary-500 transition-colors text-slate-900 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Upload Receipt (optional):</label>
                        <div className="flex gap-2 mt-1">
                            <button type="button" className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-slate-100 dark:bg-slate-700 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300"><CameraIcon className="w-5 h-5" />Take Photo</button>
                            <button type="button" className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-slate-100 dark:bg-slate-700 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300"><FolderIcon className="w-5 h-5" />Gallery</button>
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full mt-2 py-2.5 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
                    </button>
                </form>
            </div>
        </div>
    );
};

// --- VIEWS ---

const ManagerShoppingView: React.FC = () => {
    const { user } = useAuth();
    const [pendingDeposits, setPendingDeposits] = useState<any[]>([]);
    const [pendingExpenses, setPendingExpenses] = useState<any[]>([]);
    const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);
    const [roster, setRoster] = useState(emptyRoster);
    const [members, setMembers] = useState<{ id: string; name: string }[]>([]);
    const [fundStatus, setFundStatus] = useState(initialFundStatus);
    const { addToast } = useNotifications();

    useEffect(() => {
        if (user?.khataId) {
            // Fetch summary
            api.getShoppingSummary(user.khataId).then(data => {
                if (data && data.fundStatus) {
                    setFundStatus(data.fundStatus);
                }
            });
            // Fetch roster
            api.getShoppingRoster(user.khataId).then(items => {
                if (items && items.length > 0) {
                    // Convert array to object keyed by day
                    const newRoster = { ...emptyRoster };
                    items.forEach((item: any) => {
                        if (newRoster[item.day]) {
                            newRoster[item.day] = {
                                name: item.userName || '',
                                status: item.status,
                                amount: item.amount
                            };
                        }
                    });
                    setRoster(newRoster);
                }
            });

            // Fetch members
            api.getShoppingMembers(user.khataId).then(m => {
                setMembers(m);
            });

            // Fetch deposits
            api.getDeposits(user.khataId).then(deposits => {
                const pending = deposits.filter((d: any) => d.status === 'Pending');
                setPendingDeposits(pending);
            });

            // Fetch expenses
            api.getExpenses(user.khataId).then(expenses => {
                const pending = expenses.filter((e: any) => e.status === 'Pending');
                setPendingExpenses(pending);
            });
        }
    }, [user?.khataId]);

    const handleDepositAction = async (id: string, action: 'approve' | 'deny') => {
        if (!user?.khataId) return;

        let success = false;
        if (action === 'approve') {
            success = await api.approveDeposit(user.khataId, id);
        } else {
            success = await api.rejectDeposit(user.khataId, id, 'Denied by manager');
        }

        if (success) {
            setPendingDeposits(prev => prev.filter(d => d._id !== id));
            addToast({
                type: action === 'approve' ? 'success' : 'error',
                title: action === 'approve' ? 'Approved' : 'Denied',
                message: `Deposit has been ${action === 'approve' ? 'approved' : 'denied'}.`
            });
        } else {
            addToast({ type: 'error', title: 'Error', message: 'Failed to update deposit status.' });
        }
    };

    const handleExpenseAction = async (id: string, action: 'approve' | 'deny') => {
        if (!user?.khataId) return;

        let success = false;
        if (action === 'approve') {
            success = await api.approveExpense(user.khataId, id);
        } else {
            success = await api.rejectExpense(user.khataId, id, 'Denied by manager');
        }

        if (success) {
            setPendingExpenses(prev => prev.filter(e => e._id !== id));
            addToast({
                type: action === 'approve' ? 'success' : 'error',
                title: action === 'approve' ? 'Approved' : 'Denied',
                message: `Expense has been ${action === 'approve' ? 'approved' : 'denied'}.`
            });
        } else {
            addToast({ type: 'error', title: 'Error', message: 'Failed to update expense status.' });
        }
    }

    const handleSaveRoster = async (newRoster: Roster) => {
        if (!user?.khataId) return;

        // Convert object back to array
        const items = Object.entries(newRoster).map(([day, duty]) => ({
            day,
            userName: (duty as ShoppingDuty).name,
            status: (duty as ShoppingDuty).status,
            amount: (duty as ShoppingDuty).amount,
            // We need userId, but we only have name in the UI state currently.
            // Ideally we should store userId in the roster state too.
            // For now, let's find the userId from the members list.
            userId: members.find(m => m.name === (duty as ShoppingDuty).name)?.id
        }));

        const success = await api.saveShoppingRoster(user.khataId, items);
        if (success) {
            setRoster(newRoster);
            addToast({ type: 'success', title: 'Roster Updated', message: 'The shopping duty roster has been saved.' });
            setIsRosterModalOpen(false);
        } else {
            addToast({ type: 'error', title: 'Error', message: 'Failed to save roster.' });
        }
    };

    return (
        <>
            <div className="space-y-6">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
                    <h3 className="font-semibold text-lg mb-3 text-slate-900 dark:text-white">This Week's Shopping Duty</h3>
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-3 space-y-2 text-sm">
                        {Object.entries(roster).map(([day, duty]) => {
                            const shoppingDuty = duty as ShoppingDuty;
                            const displayName = shoppingDuty.name || 'None';
                            return (
                                <div key={day} className="flex justify-between items-center">
                                    <span className="font-medium text-slate-600 dark:text-slate-300">{day}: {displayName}</span>
                                    <span className={`${shoppingDuty.status === 'Completed' ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                        {shoppingDuty.status === 'Completed' ? `✅ Completed - ৳${shoppingDuty.amount}` : shoppingDuty.status === 'Assigned' ? '🔄 Assigned' : ''}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                    <button onClick={() => setIsRosterModalOpen(true)} className="text-sm font-semibold text-primary-600 hover:underline mt-4 dark:text-primary-400">Edit Roster</button>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
                    <h3 className="font-semibold text-lg mb-3 text-slate-900 dark:text-white">Fund Status</h3>
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-3 grid grid-cols-2 gap-4">
                        <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md">
                            <p className="text-sm text-slate-500 dark:text-slate-400">Total Deposits</p><p className="font-bold text-lg text-slate-800 dark:text-white">৳{fundStatus.totalDeposits.toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md">
                            <p className="text-sm text-slate-500 dark:text-slate-400">Total Shopping</p><p className="font-bold text-lg text-slate-800 dark:text-white">৳{fundStatus.totalShopping.toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-green-50 dark:bg-green-500/10 rounded-md">
                            <p className="text-sm text-green-600 dark:text-green-300">Fund Balance</p><p className="font-bold text-lg text-green-600 dark:text-green-300">{fundStatus.balance >= 0 ? '+' : ''}৳{fundStatus.balance.toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md">
                            <p className="text-sm text-slate-500 dark:text-slate-400">Current Rate</p><p className="font-bold text-lg text-slate-800 dark:text-white">৳{fundStatus.rate}/qty</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
                    <h3 className="font-semibold text-lg mb-3 text-yellow-600 dark:text-yellow-400">🔔 Pending Approvals ({pendingDeposits.length + pendingExpenses.length})</h3>
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-3 space-y-4">
                        {pendingDeposits.length > 0 && <div>
                            <h4 className="font-semibold mb-2 text-slate-800 dark:text-slate-200">💰 Deposits ({pendingDeposits.length})</h4>
                            {pendingDeposits.map(d => (
                                <div key={d._id} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                    <p className="font-bold text-slate-900 dark:text-white">{d.userName} - ৳{d.amount} - {d.paymentMethod}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(d.createdAt).toLocaleDateString()} • {d.transactionId || 'No TRX ID'}</p>
                                    <div className="flex justify-end gap-2 mt-2">
                                        <button className="text-xs font-semibold text-primary-600 hover:underline dark:text-primary-400">View Screenshot</button>
                                        <button onClick={() => handleDepositAction(d._id, 'deny')} className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900">Deny</button>
                                        <button onClick={() => handleDepositAction(d._id, 'approve')} className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300 dark:hover:bg-green-900">Approve</button>
                                    </div>
                                </div>
                            ))}
                        </div>}
                        {pendingExpenses.length > 0 && <div>
                            <h4 className="font-semibold mb-2 text-slate-800 dark:text-slate-200">🛒 Shopping Expenses ({pendingExpenses.length})</h4>
                            {pendingExpenses.map(e => (
                                <div key={e._id} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                    <p className="font-bold text-slate-900 dark:text-white">{e.userName} - ৳{e.amount}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(e.createdAt).toLocaleDateString()} • {e.items}</p>
                                    <div className="flex justify-end gap-2 mt-2">
                                        <button className="text-xs font-semibold text-primary-600 hover:underline dark:text-primary-400">View Receipt</button>
                                        <button onClick={() => handleExpenseAction(e._id, 'deny')} className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900">Deny</button>
                                        <button onClick={() => handleExpenseAction(e._id, 'approve')} className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300 dark:hover:bg-green-900">Approve</button>
                                    </div>
                                </div>
                            ))}
                        </div>}
                    </div>
                </div>
            </div>
            {isRosterModalOpen && (
                <EditRosterModal
                    onClose={() => setIsRosterModalOpen(false)}
                    roster={roster}
                    members={members}
                    onSave={handleSaveRoster}
                />
            )}
        </>
    );
};

const MemberShoppingView: React.FC = () => {
    const { user } = useAuth();
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const { addToast } = useNotifications();
    const [historyTab, setHistoryTab] = useState<'deposits' | 'expenses'>('deposits');
    const [roster, setRoster] = useState(emptyRoster);
    const [myDeposits, setMyDeposits] = useState<any[]>([]);
    const [myExpenses, setMyExpenses] = useState<any[]>([]);
    const [memberSummary, setMemberSummary] = useState(initialMemberSummary);

    useEffect(() => {
        if (user?.khataId) {
            // Fetch summary
            api.getShoppingSummary(user.khataId).then(data => {
                if (data && data.memberSummary) {
                    setMemberSummary(data.memberSummary);
                }
            });
            // Fetch roster for member view
            api.getShoppingRoster(user.khataId).then(items => {
                if (items && items.length > 0) {
                    const newRoster = { ...emptyRoster };
                    items.forEach((item: any) => {
                        if (newRoster[item.day]) {
                            newRoster[item.day] = {
                                name: item.userName || '',
                                status: item.status,
                                amount: item.amount
                            };
                        }
                    });
                    setRoster(newRoster);
                }
            });

            // Fetch my deposits
            api.getDeposits(user.khataId).then(deposits => {
                // Filter for my deposits only
                const myOwn = deposits.filter((d: any) => {
                    const depositUserId = d.userId?._id || d.userId;
                    return depositUserId === user.id;
                });
                setMyDeposits(myOwn);
            });

            // Fetch my expenses
            api.getExpenses(user.khataId).then(expenses => {
                const myOwn = expenses.filter((e: any) => {
                    const expenseUserId = e.userId?._id || e.userId;
                    return expenseUserId === user.id;
                });
                setMyExpenses(myOwn);
            });
        }
    }, [user?.khataId, user?.id]);

    // Get current day
    const dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayDay = dayOrder[new Date().getDay()];
    const myName = user?.name || '';

    const myDutyToday = roster[todayDay]?.name === myName;

    const nextDutyDay = Object.entries(roster).find(([day, duty]) => {
        return (duty as ShoppingDuty).name === myName && dayOrder.indexOf(day) > dayOrder.indexOf(todayDay);
    });

    const dutyText = myDutyToday
        ? "Today is your shopping day! 🛒"
        : nextDutyDay
            ? `Your next shopping duty is on ${nextDutyDay[0]}.`
            : "You have no upcoming shopping duties this week.";

    const handleDepositSubmit = () => {
        // Refresh deposits and summary
        if (user?.khataId) {
            api.getDeposits(user.khataId).then(deposits => {
                const myOwn = deposits.filter((d: any) => (d.userId?._id || d.userId) === user.id);
                setMyDeposits(myOwn);
            });
            api.getShoppingSummary(user.khataId).then(data => {
                if (data && data.memberSummary) {
                    setMemberSummary(data.memberSummary);
                }
            });
        }
    };

    const handleExpenseSubmit = () => {
        // Refresh expenses
        if (user?.khataId) {
            api.getExpenses(user.khataId).then(expenses => {
                const myOwn = expenses.filter((e: any) => (e.userId?._id || e.userId) === user.id);
                setMyExpenses(myOwn);
            });
        }
    };

    return (
        <>
            <div className="space-y-6">
                <div className="bg-primary-50 dark:bg-primary-500/10 p-4 rounded-lg text-center">
                    <p className="font-semibold text-primary-700 dark:text-primary-300">{dutyText}</p>
                </div>

                {/* Weekly Shopping Roster */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
                    <h3 className="font-semibold text-lg mb-3 text-slate-900 dark:text-white">This Week's Shopping Duty</h3>
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-3 space-y-2 text-sm">
                        {Object.entries(roster).map(([day, duty]) => {
                            const shoppingDuty = duty as ShoppingDuty;
                            const displayName = shoppingDuty.name || 'None';
                            const isMyDuty = shoppingDuty.name === myName;
                            return (
                                <div key={day} className={`flex justify-between items-center p-2 rounded ${isMyDuty ? 'bg-primary-50 dark:bg-primary-500/10' : ''}`}>
                                    <span className={`font-medium ${isMyDuty ? 'text-primary-700 dark:text-primary-300' : 'text-slate-600 dark:text-slate-300'}`}>
                                        {day}: {displayName} {isMyDuty ? '(You)' : ''}
                                    </span>
                                    <span className={`${shoppingDuty.status === 'Completed' ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                        {shoppingDuty.status === 'Completed' ? `✅ Completed` : shoppingDuty.status === 'Assigned' ? '🔄 Assigned' : ''}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => setIsDepositModalOpen(true)} className="py-4 text-center bg-white dark:bg-slate-800 rounded-xl shadow-md font-semibold text-slate-700 dark:text-slate-200 hover:scale-105 transition-transform active:scale-95">
                        💰 Add Deposit
                    </button>
                    <button onClick={() => setIsExpenseModalOpen(true)} className="py-4 text-center bg-white dark:bg-slate-800 rounded-xl shadow-md font-semibold text-slate-700 dark:text-slate-200 hover:scale-105 transition-transform active:scale-95">
                        🛒 Add Expense
                    </button>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 grid grid-cols-2 divide-x dark:divide-slate-700 text-center">
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Deposit Balance</p>
                        <p className="text-2xl font-bold text-slate-800 dark:text-white font-numeric">৳{memberSummary.totalDeposits.toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Due / Refund</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400 font-numeric">{memberSummary.refundable >= 0 ? '+' : ''}৳{memberSummary.refundable.toLocaleString()}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md">
                    <div className="p-4 border-b dark:border-slate-700">
                        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-700 rounded-lg">
                            <button onClick={() => setHistoryTab('deposits')} className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors ${historyTab === 'deposits' ? 'bg-white dark:bg-slate-600 shadow text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                                Deposit History
                            </button>
                            <button onClick={() => setHistoryTab('expenses')} className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors ${historyTab === 'expenses' ? 'bg-white dark:bg-slate-600 shadow text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                                Expense History
                            </button>
                        </div>
                    </div>
                    <div className="p-4 space-y-2">
                        {historyTab === 'deposits' && (
                            myDeposits.length > 0 ? (
                                myDeposits.map(d => (
                                    <div key={d._id} className="flex justify-between items-center text-sm p-2 bg-slate-50 dark:bg-slate-700/50 rounded-md">
                                        <span className="text-slate-700 dark:text-slate-300">{new Date(d.createdAt).toLocaleDateString()} - {d.paymentMethod}</span>
                                        <span className="font-semibold flex items-center gap-1 text-slate-800 dark:text-white">
                                            ৳{d.amount.toLocaleString()}
                                            {d.status === 'Approved' && <CheckCircleIcon className="w-4 h-4 text-green-500" />}
                                            {d.status === 'Pending' && <span className="text-yellow-500 text-xs">⏳ Pending</span>}
                                            {d.status === 'Rejected' && <span className="text-red-500 text-xs">❌ Rejected</span>}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-slate-500 dark:text-slate-400 py-4">No deposit history found.</p>
                            )
                        )}
                        {historyTab === 'expenses' && (
                            myExpenses.length > 0 ? (
                                myExpenses.map(e => (
                                    <div key={e._id} className="flex justify-between items-center text-sm p-2 bg-slate-50 dark:bg-slate-700/50 rounded-md">
                                        <span className="text-slate-700 dark:text-slate-300">{new Date(e.createdAt).toLocaleDateString()}</span>
                                        <span className="font-semibold flex items-center gap-1 text-slate-800 dark:text-white">
                                            ৳{e.amount.toLocaleString()}
                                            {e.status === 'Approved' && <span className="text-green-600 dark:text-green-400 text-xs">✅ Approved</span>}
                                            {e.status === 'Pending' && <span className="text-yellow-600 dark:text-yellow-400 text-xs">⏳ Pending</span>}
                                            {e.status === 'Rejected' && <span className="text-red-600 dark:text-red-400 text-xs">❌ Rejected</span>}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-slate-500 dark:text-slate-400 py-4">No expense history found.</p>
                            )
                        )}
                        <button className="text-sm font-semibold text-primary-600 hover:underline mt-2 w-full text-center p-2 dark:text-primary-400">View All →</button>
                    </div>
                </div>
            </div>

            {isDepositModalOpen && <AddDepositModal onClose={() => setIsDepositModalOpen(false)} onSubmit={handleDepositSubmit} />}
            {isExpenseModalOpen && <AddExpenseModal onClose={() => setIsExpenseModalOpen(false)} onSubmit={handleExpenseSubmit} />}
        </>
    );
};

export default function ShoppingPage() {
    const { user } = useAuth();

    if (!user) return null;

    return (
        <AppLayout>
            <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <ShoppingCartIcon className="w-8 h-8 text-primary-500" />
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Shopping & Funds</h1>
                    </div>
                </div>

                {user.role === Role.Manager ? <ManagerShoppingView /> : <MemberShoppingView />}
            </div>
            <ToastContainer />
        </AppLayout>
    );
}
