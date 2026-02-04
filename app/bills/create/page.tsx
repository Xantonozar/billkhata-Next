"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { api } from '@/services/api';
import { Role } from '@/types';
import AppLayout from '@/components/AppLayout';
import ToastContainer from '@/components/ToastContainer';

export default function CreateBillPage() {
    const { user } = useAuth();
    const router = useRouter();
    const { addToast, refreshNotifications } = useNotifications();
    const [loading, setLoading] = useState(false);
    const [members, setMembers] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        title: '',
        category: 'Rent',
        totalAmount: '',
        dueDate: '',
        description: ''
    });

    useEffect(() => {
        if (user?.khataId) {
            api.getMembersForRoom(user.khataId).then(setMembers);
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.khataId || !formData.title || !formData.totalAmount || !formData.dueDate) {
            addToast({ type: 'error', title: 'Error', message: 'Please fill in all required fields' });
            return;
        }

        setLoading(true);

        // Split bill equally among all members
        const amountPerMember = parseFloat(formData.totalAmount) / members.length;
        const shares = members.map(member => ({
            userId: member.id,
            userName: member.name,
            amount: amountPerMember,
            status: 'Unpaid'
        }));

        const billData = {
            title: formData.title,
            category: formData.category,
            totalAmount: parseFloat(formData.totalAmount),
            dueDate: formData.dueDate,
            description: formData.description,
            shares
        };

        try {
            const success = await api.createBill(billData);
            if (success) {
                addToast({ type: 'success', title: 'Success', message: 'Bill created successfully!' });
                // Refresh notifications to show the new bill notification
                setTimeout(() => refreshNotifications(), 500);
                router.push('/bills');
            } else {
                addToast({ type: 'error', title: 'Error', message: 'Failed to create bill' });
            }
        } catch (error) {
            addToast({ type: 'error', title: 'Error', message: 'Failed to create bill' });
        } finally {
            setLoading(false);
        }
    };

    if (user?.role !== Role.Manager && user?.role !== Role.MasterManager) {
        return (
            <AppLayout>
                <div className="text-center p-8">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Access Denied</h2>
                    <p className="text-slate-500 dark:text-slate-400">Only managers can create bills.</p>
                </div>
            </AppLayout>
        );
    }

    return (
        <>
            <AppLayout>
                <div className="max-w-2xl mx-auto space-y-6">
                    <div className="flex items-center justify-between">
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Create New Bill</h1>
                        <button
                            onClick={() => router.back()}
                            className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        >
                            Cancel
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                Bill Title *
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="e.g., Monthly Rent"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                Category *
                            </label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="Rent">Rent</option>
                                <option value="Electricity">Electricity</option>
                                <option value="Water">Water</option>
                                <option value="Gas">Gas</option>
                                <option value="Wi-Fi">Wi-Fi</option>
                                <option value="Maid">Maid</option>
                                <option value="Others">Others</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                Total Amount (৳) *
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.totalAmount}
                                onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="0.00"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                Due Date *
                            </label>
                            <input
                                type="date"
                                value={formData.dueDate}
                                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                Description (Optional)
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                rows={3}
                                placeholder="Additional notes..."
                            />
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                <strong>Split Among:</strong> {members.length} members
                            </p>
                            {formData.totalAmount && (
                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                    <strong>Per Member:</strong> ৳{(parseFloat(formData.totalAmount) / members.length).toFixed(2)}
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating...' : 'Create Bill'}
                        </button>
                    </form>
                </div>
            </AppLayout>

        </>
    );
}
