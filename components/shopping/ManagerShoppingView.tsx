import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { api } from '@/services/api';
import { FundAdjustmentModal, AddManagerShoppingModal, AddDepositModal } from './Modals';
import { Plus, Banknote } from 'lucide-react';

interface ManagerShoppingViewProps {
    selectedPeriodId: string | null;
    isActivePeriod: boolean;
}

const initialFundStatus = {
    totalDeposits: 0,
    totalShopping: 0,
    totalBillPayments: 0,
    balance: 0,
    totalMeals: 0,
    rate: 0,
};

const ManagerShoppingView: React.FC<ManagerShoppingViewProps> = ({ selectedPeriodId, isActivePeriod }) => {
    const { user } = useAuth();
    const { addToast } = useNotifications();
    const [activeTab, setActiveTab] = useState<'overview' | 'manage' | 'history'>('overview');

    // Data States
    const [fundStatus, setFundStatus] = useState(initialFundStatus);
    const [pendingDeposits, setPendingDeposits] = useState<any[]>([]);
    const [pendingExpenses, setPendingExpenses] = useState<any[]>([]);
    const [memberBalances, setMemberBalances] = useState<any[]>([]);
    const [historyDeposits, setHistoryDeposits] = useState<any[]>([]);
    const [historyExpenses, setHistoryExpenses] = useState<any[]>([]);
    const [historyType, setHistoryType] = useState<'deposits' | 'expenses'>('deposits');
    const [loading, setLoading] = useState(false);
    const [showAddExpense, setShowAddExpense] = useState(false);
    const [showAddDeposit, setShowAddDeposit] = useState(false);

    // Modal States
    const [adjustUser, setAdjustUser] = useState<{ id: string; name: string } | null>(null);

    const fetchData = useCallback(async () => {
        if (!user?.khataId) return;

        setLoading(true);
        try {
            // 1. Overview & Pending Data
            const [summaryData, depositsData, expensesData, balancesData] = await Promise.all([
                api.getShoppingSummary(user.khataId, selectedPeriodId || undefined),
                api.getDeposits(user.khataId, { status: 'Pending', calculationPeriodId: selectedPeriodId || undefined }),
                api.getExpenses(user.khataId, { status: 'Pending', calculationPeriodId: selectedPeriodId || undefined }),
                api.getMemberBalances(user.khataId, selectedPeriodId || undefined)
            ]);

            if (summaryData?.fundStatus) setFundStatus(summaryData.fundStatus);
            setPendingDeposits(depositsData || []);
            // Corrected: response.data from api.ts is the array itself
            setPendingExpenses(expensesData || []);
            if (balancesData?.balances) setMemberBalances(balancesData.balances);

            // 3. History
            const [histDeposits, histExpenses] = await Promise.all([
                api.getDeposits(user.khataId, { status: 'Approved', limit: 50, calculationPeriodId: selectedPeriodId || undefined }),
                api.getExpenses(user.khataId, { status: 'Approved', limit: 50, calculationPeriodId: selectedPeriodId || undefined })
            ]);

            setHistoryDeposits(histDeposits || []);
            setHistoryExpenses(histExpenses || []);

        } catch (error) {
            console.error('Error fetching manager data:', error);
            addToast({ type: 'error', title: 'Error', message: 'Failed to load data' });
        } finally {
            setLoading(false);
        }

    }, [user?.khataId, selectedPeriodId, addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDepositAction = async (id: string, action: 'approve' | 'deny') => {
        if (!user?.khataId) return;
        if (!isActivePeriod) {
            addToast({ type: 'error', title: 'Operation Failed', message: 'Cannot modify data from a historical period' });
            return;
        }

        const success = action === 'approve'
            ? await api.approveDeposit(user.khataId, id)
            : await api.rejectDeposit(user.khataId, id, 'Denied by manager');

        if (success) {
            addToast({ type: 'success', title: 'Success', message: `Deposit ${action}d.` });
            fetchData(); // Refresh everything
        } else {
            addToast({ type: 'error', title: 'Error', message: 'Action failed.' });
        }
    };

    const handleExpenseAction = async (id: string, action: 'approve' | 'deny') => {
        if (!user?.khataId) return;
        if (!isActivePeriod) {
            addToast({ type: 'error', title: 'Operation Failed', message: 'Cannot modify data from a historical period' });
            return;
        }

        const success = action === 'approve'
            ? await api.approveExpense(user.khataId, id)
            : await api.rejectExpense(user.khataId, id, 'Denied by manager');

        if (success) {
            addToast({ type: 'success', title: 'Success', message: `Expense ${action}d.` });
            fetchData();
        } else {
            addToast({ type: 'error', title: 'Error', message: 'Action failed.' });
        }
    };

    return (
        <>
            <div className="space-y-6">
                {/* Tabs */}
                <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden">
                    {['overview', 'manage', 'history'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all capitalize ${activeTab === tab ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            {tab === 'manage' ? 'Fund Manage' : tab}
                        </button>
                    ))}
                </div>

                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* Fund Status Cards */}
                        <div className="bg-card rounded-xl shadow-md p-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                                <h3 className="font-semibold text-lg text-card-foreground">Fund Status</h3>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setShowAddExpense(true)}
                                        className={`flex items-center justify-center px-4 py-2 rounded-md font-medium transition-colors ${!isActivePeriod ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700 text-white shadow-lg hover:shadow-xl'}`}
                                        disabled={!isActivePeriod}
                                    >
                                        <Plus className="w-5 h-5 mr-2" />
                                        Add Expense
                                    </button>
                                    <button
                                        onClick={() => setShowAddDeposit(true)}
                                        className={`flex items-center justify-center px-4 py-2 rounded-md font-medium border transition-colors ${!isActivePeriod ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'border-primary-200 text-primary-700 hover:bg-primary-50 hover:text-primary-800'}`}
                                        disabled={!isActivePeriod}
                                    >
                                        <Banknote className="w-5 h-5 mr-2" />
                                        Add Deposit
                                    </button>
                                </div>
                            </div>

                            <div className="border-t border-border pt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                                <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md flex justify-between sm:block">
                                    <p className="text-sm text-muted-foreground">Total Deposits</p><p className="font-bold text-lg text-card-foreground">৳{fundStatus.totalDeposits.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                </div>
                                <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md flex justify-between sm:block">
                                    <p className="text-sm text-muted-foreground">Total Shopping</p><p className="font-bold text-lg text-card-foreground">৳{fundStatus.totalShopping.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                </div>
                                <div className="p-3 bg-orange-50 dark:bg-orange-500/10 rounded-md flex justify-between sm:block">
                                    <p className="text-sm text-orange-600 dark:text-orange-300">Other Bills</p><p className="font-bold text-lg text-orange-600 dark:text-orange-300">৳{fundStatus.totalBillPayments.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                </div>
                                <div className="p-3 bg-green-50 dark:bg-green-500/10 rounded-md flex justify-between sm:block">
                                    <p className="text-sm text-green-600 dark:text-green-300">Fund Balance</p><p className="font-bold text-lg text-green-600 dark:text-green-300">{fundStatus.balance >= 0 ? '+' : ''}৳{fundStatus.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                </div>
                                <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md flex justify-between sm:block">
                                    <p className="text-sm text-muted-foreground">Current Rate</p><p className="font-bold text-lg text-card-foreground">৳{fundStatus.rate.toFixed(2)}</p>
                                </div>
                                <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-md flex justify-between sm:block">
                                    <p className="text-sm text-blue-600 dark:text-blue-300">Total Meals</p><p className="font-bold text-lg text-blue-600 dark:text-blue-300">{fundStatus.totalMeals.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                                </div>
                            </div>
                        </div>

                        {/* Pending Approvals */}
                        <div className="bg-card rounded-xl shadow-md p-6">
                            <h3 className="font-semibold text-lg mb-3 text-yellow-600 dark:text-yellow-400">🔔 Pending Approvals ({pendingDeposits.length + pendingExpenses.length})</h3>
                            <div className="border-t border-border pt-3 space-y-4">
                                {pendingDeposits.length > 0 && <div>
                                    <h4 className="font-semibold mb-2 text-card-foreground">💰 Deposits ({pendingDeposits.length})</h4>
                                    {pendingDeposits.map(d => (
                                        <div key={d._id} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg mb-2">
                                            <p className="font-bold text-card-foreground">{d.userName} - ৳{d.amount.toFixed(2)} <span className="text-xs font-normal text-slate-500">via {d.paymentMethod}</span></p>
                                            <div className="flex justify-end gap-2 mt-2">
                                                <button onClick={() => handleDepositAction(d._id, 'deny')} className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200">Deny</button>
                                                <button onClick={() => handleDepositAction(d._id, 'approve')} className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200">Approve</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>}
                                {pendingExpenses.length > 0 && <div>
                                    <h4 className="font-semibold mb-2 text-slate-800 dark:text-slate-200">🛒 Shopping ({pendingExpenses.length})</h4>
                                    {pendingExpenses.map(e => (
                                        <div key={e._id} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg mb-2">
                                            <p className="font-bold text-slate-900 dark:text-white">{e.userName} - ৳{e.amount.toFixed(2)}</p>
                                            <p className="text-xs text-slate-500">{e.items}</p>
                                            <div className="flex justify-end gap-2 mt-2">
                                                <button onClick={() => handleExpenseAction(e._id, 'deny')} className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200">Deny</button>
                                                <button onClick={() => handleExpenseAction(e._id, 'approve')} className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200">Approve</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>}
                                {pendingDeposits.length === 0 && pendingExpenses.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-8 text-center text-slate-500 dark:text-slate-400">
                                        <div className="bg-slate-100 dark:bg-slate-700/50 p-4 rounded-full mb-3"><span className="text-2xl">✅</span></div>
                                        <p className="font-medium text-slate-900 dark:text-white">All Caught Up!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* MANAGE TAB */}
                {activeTab === 'manage' && (
                    <div className="bg-card rounded-xl shadow-md p-6">
                        <h3 className="font-semibold text-lg mb-3 text-card-foreground">Member Balances & Fund Management</h3>
                        <div className="border-t border-border pt-4 overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                                        <th className="py-2 px-2">Member</th>
                                        <th className="py-2 px-2 text-right">Deposits</th>
                                        <th className="py-2 px-2 text-right">Meals</th>
                                        <th className="py-2 px-2 text-right">Meal Cost</th>
                                        <th className="py-2 px-2 text-right">Bills</th>
                                        <th className="py-2 px-2 text-right">Balance</th>
                                        <th className="py-2 px-2 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {memberBalances.filter(m => m.userId !== user?.id).map((m) => (
                                        <tr key={m.userId} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                            <td className="py-3 px-2 font-medium text-slate-900 dark:text-white">{m.name}</td>
                                            <td className="py-3 px-2 text-right text-slate-600 dark:text-slate-400">৳{m.totalDeposits.toFixed(2)}</td>
                                            <td className="py-3 px-2 text-right text-blue-600 dark:text-blue-400 font-medium">{m.totalMeals.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                                            <td className="py-3 px-2 text-right text-slate-600 dark:text-slate-400">৳{m.mealCost.toFixed(2)}</td>
                                            <td className="py-3 px-2 text-right text-orange-600 dark:text-orange-400">৳{m.totalBillPayments.toFixed(2)}</td>
                                            <td className={`py-3 px-2 text-right font-bold ${m.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                                                {m.balance >= 0 ? '+' : ''}৳{m.balance.toFixed(2)}
                                            </td>
                                            <td className="py-3 px-2 text-center">
                                                <button
                                                    onClick={() => setAdjustUser({ id: m.userId, name: m.name })}
                                                    className="px-3 py-1 bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300 rounded-md text-xs font-semibold hover:bg-primary-200 transition-colors"
                                                >
                                                    Edit Fund
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {memberBalances.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-slate-500">No members found.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* HISTORY TAB */}
                {activeTab === 'history' && (
                    <div className="bg-card rounded-xl shadow-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-lg text-card-foreground">History</h3>
                            <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                                <button onClick={() => setHistoryType('deposits')} className={`px-3 py-1 text-xs font-semibold rounded-md ${historyType === 'deposits' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500'}`}>Deposits</button>
                                <button onClick={() => setHistoryType('expenses')} className={`px-3 py-1 text-xs font-semibold rounded-md ${historyType === 'expenses' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500'}`}>Expenses</button>
                            </div>
                        </div>

                        <div className="border-t border-border pt-4 overflow-x-auto">
                            {historyType === 'deposits' ? (
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="text-xs text-slate-500 border-b border-slate-200">
                                            <th className="py-2">Date</th>
                                            <th className="py-2">Member</th>
                                            <th className="py-2">Method</th>
                                            <th className="py-2 text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {historyDeposits.map(d => (
                                            <tr key={d._id} className="border-b border-slate-100 dark:border-slate-800">
                                                <td className="py-3 text-slate-600">{new Date(d.createdAt).toLocaleDateString()}</td>
                                                <td className="py-3 font-medium">{d.userName}</td>
                                                <td className="py-3 text-slate-500 text-xs">{d.paymentMethod}</td>
                                                <td className={`py-3 text-right font-bold ${d.amount >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                    {d.amount > 0 ? '+' : ''}৳{d.amount.toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="text-xs text-slate-500 border-b border-slate-200">
                                            <th className="py-2">Date</th>
                                            <th className="py-2">Member</th>
                                            <th className="py-2">Items/Category</th>
                                            <th className="py-2 text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {historyExpenses.map(e => (
                                            <tr key={e._id} className="border-b border-slate-100 dark:border-slate-800">
                                                <td className="py-3 text-slate-600">{new Date(e.createdAt).toLocaleDateString()}</td>
                                                <td className="py-3 font-medium">{e.userName}</td>
                                                <td className="py-3 text-slate-500 text-xs">{e.category === 'Adjustment' ? 'Fund Deduction' : e.items}</td>
                                                <td className="py-3 text-right font-bold text-orange-600">-৳{e.amount.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {adjustUser && createPortal(
                <FundAdjustmentModal
                    targetUser={adjustUser}
                    onClose={() => setAdjustUser(null)}
                    onSuccess={fetchData}
                />,
                document.body
            )}


            {
                showAddExpense && createPortal(
                    <AddManagerShoppingModal
                        onClose={() => setShowAddExpense(false)}
                        onSubmit={fetchData}
                        members={memberBalances.map(m => ({ userId: m.userId, name: m.name }))}
                    />,
                    document.body
                )
            }

            {
                showAddDeposit && createPortal(
                    <AddDepositModal
                        onClose={() => setShowAddDeposit(false)}
                        onSubmit={fetchData}
                        members={memberBalances.map(m => ({ userId: m.userId, name: m.name }))}
                    />,
                    document.body
                )
            }
        </>
    );
};

export default ManagerShoppingView;
