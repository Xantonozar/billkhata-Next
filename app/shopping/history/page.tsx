"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { CheckCircleIcon, ArrowLeftIcon } from '@/components/Icons';
import AppLayout from '@/components/AppLayout';
import { useRouter } from 'next/navigation';

export default function ShoppingHistoryPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'deposits' | 'expenses'>('deposits');
    const [deposits, setDeposits] = useState<any[]>([]);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.khataId) {
            setLoading(true);
            Promise.all([
                api.getDeposits(user.khataId),
                api.getExpenses(user.khataId)
            ]).then(([depositsData, expensesData]) => {
                // Filter for my items
                const myDeposits = depositsData.filter((d: any) => (d.userId?._id || d.userId) === user.id);
                const myExpenses = expensesData.filter((e: any) => (e.userId?._id || e.userId) === user.id);

                // Sort by date desc
                myDeposits.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                myExpenses.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

                setDeposits(myDeposits);
                setExpenses(myExpenses);
            }).finally(() => {
                setLoading(false);
            });
        }
    }, [user?.khataId, user?.id]);

    if (!user) return null;

    return (
        <AppLayout>
            <div className="space-y-6 animate-fade-in pb-12">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                        <ArrowLeftIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Transaction History</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Your deposits and shopping expenses</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-700 rounded-xl">
                            <button
                                onClick={() => setActiveTab('deposits')}
                                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'deposits' ? 'bg-white dark:bg-slate-600 shadow-md text-primary-600 dark:text-white scale-[1.02]' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                            >
                                💰 Deposit History ({deposits.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('expenses')}
                                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'expenses' ? 'bg-white dark:bg-slate-600 shadow-md text-primary-600 dark:text-white scale-[1.02]' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                            >
                                🛒 Expense History ({expenses.length})
                            </button>
                        </div>
                    </div>

                    <div className="p-4 sm:p-6 min-h-[400px]">
                        {loading ? (
                            <div className="flex justify-center py-12">
                                <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-primary-500"></div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {activeTab === 'deposits' && (
                                    deposits.length > 0 ? (
                                        deposits.map(d => (
                                            <div key={d._id} className="group p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-100 dark:border-slate-700/50 hover:border-primary-200 dark:hover:border-primary-500/30 transition-all">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <p className="font-bold text-slate-800 dark:text-white text-lg">৳{d.amount.toLocaleString()}</p>
                                                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{d.paymentMethod}</p>
                                                    </div>
                                                    <div className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${d.status === 'Approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                            d.status === 'Rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                                'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                        }`}>
                                                        {d.status === 'Approved' && <CheckCircleIcon className="w-3.5 h-3.5" />}
                                                        {d.status === 'Approved' ? 'Approved' : d.status === 'Rejected' ? 'Rejected' : 'Pending'}
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-end text-sm text-slate-500 dark:text-slate-400 mt-2">
                                                    <span>{new Date(d.createdAt).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                                    {d.transactionId && <span className="font-mono text-xs bg-slate-200 dark:bg-slate-600 px-1.5 py-0.5 rounded">{d.transactionId}</span>}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                            <span className="text-4xl mb-2 opacity-30">💰</span>
                                            <p>No deposit history found</p>
                                        </div>
                                    )
                                )}

                                {activeTab === 'expenses' && (
                                    expenses.length > 0 ? (
                                        expenses.map(e => (
                                            <div key={e._id} className="group p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-100 dark:border-slate-700/50 hover:border-primary-200 dark:hover:border-primary-500/30 transition-all">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex-1">
                                                        <p className="font-bold text-slate-800 dark:text-white text-lg">৳{e.amount.toLocaleString()}</p>
                                                        <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mt-1">{e.items}</p>
                                                    </div>
                                                    <div className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shrink-0 ml-3 ${e.status === 'Approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                            e.status === 'Rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                                'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                        }`}>
                                                        {e.status === 'Approved' ? 'Approved' : e.status === 'Rejected' ? 'Rejected' : 'Pending'}
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-end text-sm text-slate-500 dark:text-slate-400 mt-3 border-t border-slate-100 dark:border-slate-700/50 pt-3">
                                                    <span>{new Date(e.createdAt).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                                    {e.notes && <span className="italic text-xs max-w-[50%] truncate">{e.notes}</span>}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                            <span className="text-4xl mb-2 opacity-30">🛒</span>
                                            <p>No expense history found</p>
                                        </div>
                                    )
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
