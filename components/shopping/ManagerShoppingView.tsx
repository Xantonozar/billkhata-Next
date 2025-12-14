import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { api } from '@/services/api';
import { ShoppingDuty, Roster, EditRosterModal } from './Modals';

const emptyRoster: Roster = {
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
                    const newRoster: Roster = { ...emptyRoster };
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
            // Fix: Specifically fetch 'Pending' deposits
            api.getDeposits(user.khataId, { status: 'Pending' }).then(deposits => {
                setPendingDeposits(deposits);
            });

            // Fetch expenses
            // Fix: Specifically fetch 'Pending' expenses
            api.getExpenses(user.khataId, { status: 'Pending' }).then(expenses => {
                setPendingExpenses(expenses);
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
            userName: duty.name,
            status: duty.status,
            amount: duty.amount,
            // We need userId, but we only have name in the UI state currently.
            // Ideally we should store userId in the roster state too.
            // For now, let's find the userId from the members list.
            userId: members.find(m => m.name === duty.name)?.id
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
                            const displayName = duty.name || 'None';
                            return (
                                <div key={day} className="flex justify-between items-center">
                                    <span className="font-medium text-slate-600 dark:text-slate-300">{day}: {displayName}</span>
                                    <span className={`${duty.status === 'Completed' ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                        {duty.status === 'Completed' ? `✅ Completed - ৳${duty.amount}` : duty.status === 'Assigned' ? '🔄 Assigned' : ''}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                    <button onClick={() => setIsRosterModalOpen(true)} className="text-sm font-semibold text-primary-600 hover:underline mt-4 dark:text-primary-400">Edit Roster</button>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
                    <h3 className="font-semibold text-lg mb-3 text-slate-900 dark:text-white">Fund Status</h3>
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md flex justify-between sm:block">
                            <p className="text-sm text-slate-500 dark:text-slate-400">Total Deposits</p><p className="font-bold text-lg text-slate-800 dark:text-white">৳{fundStatus.totalDeposits.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md flex justify-between sm:block">
                            <p className="text-sm text-slate-500 dark:text-slate-400">Total Shopping</p><p className="font-bold text-lg text-slate-800 dark:text-white">৳{fundStatus.totalShopping.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                        <div className="p-3 bg-green-50 dark:bg-green-500/10 rounded-md flex justify-between sm:block">
                            <p className="text-sm text-green-600 dark:text-green-300">Fund Balance</p><p className="font-bold text-lg text-green-600 dark:text-green-300">{fundStatus.balance >= 0 ? '+' : ''}৳{fundStatus.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md flex justify-between sm:block">
                            <p className="text-sm text-slate-500 dark:text-slate-400">Current Rate</p><p className="font-bold text-lg text-slate-800 dark:text-white">৳{fundStatus.rate.toFixed(2)}/qty</p>
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
                                    <p className="font-bold text-slate-900 dark:text-white">{d.userName} - ৳{d.amount.toFixed(2)} - {d.paymentMethod}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(d.createdAt).toLocaleDateString()} • {d.transactionId || 'No TRX ID'}</p>
                                    <div className="flex flex-wrap justify-end gap-2 mt-2">
                                        <button className="text-xs font-semibold text-primary-600 hover:underline dark:text-primary-400 mr-auto sm:mr-0">View Screenshot</button>
                                        <button onClick={() => handleDepositAction(d._id, 'deny')} className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900">Deny</button>
                                        <button onClick={() => handleDepositAction(d._id, 'approve')} className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300 dark:hover:bg-green-900">Approve</button>
                                    </div>
                                </div>
                            ))}
                        </div>}
                        {pendingExpenses.length > 0 && <div>
                            <h4 className="font-semibold mb-2 text-slate-800 dark:text-slate-200">🛒 Shopping Expenses ({pendingExpenses.length})</h4>
                            {pendingExpenses.map(e => (
                                <div key={e._id} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                    <p className="font-bold text-slate-900 dark:text-white">{e.userName} - ৳{e.amount.toFixed(2)}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(e.createdAt).toLocaleDateString()} • {e.items}</p>
                                    <div className="flex flex-wrap justify-end gap-2 mt-2">
                                        <button className="text-xs font-semibold text-primary-600 hover:underline dark:text-primary-400 mr-auto sm:mr-0">View Receipt</button>
                                        <button onClick={() => handleExpenseAction(e._id, 'deny')} className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900">Deny</button>
                                        <button onClick={() => handleExpenseAction(e._id, 'approve')} className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300 dark:hover:bg-green-900">Approve</button>
                                    </div>
                                </div>
                            ))}
                        </div>}
                        {pendingDeposits.length === 0 && pendingExpenses.length === 0 && (
                            <p className="text-center text-slate-500 dark:text-slate-400">No pending approvals.</p>
                        )}
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

export default ManagerShoppingView;
