"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { useNotifications } from '@/contexts/NotificationContext';
import AppLayout from '@/components/AppLayout';
import ToastContainer from '@/components/ToastContainer';
import { Role } from '@/types';
import {
    BriefcaseIcon, PlusIcon, PhoneIcon, PencilIcon, TrashIcon, XIcon, SpinnerIcon
} from '@/components/Icons';

interface StaffMember {
    _id: string;
    khataId: string;
    name: string;
    designation: string;
    phone: string;
    avatarUrl?: string; // Future use
}

export default function StaffPage() {
    const { user } = useAuth();
    const { addToast } = useNotifications();
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);

    // Form inputs
    const [formData, setFormData] = useState({
        name: '',
        designation: 'Maid', // Default
        phone: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const designations = ['Maid', 'Cook', 'Electrician', 'Plumber', 'Carpenter', 'Guard', 'Driver', 'Other'];

    useEffect(() => {
        const fetchStaff = async () => {
            if (!user?.khataId) {
                setLoading(false);
                return;
            };
            try {
                const data = await api.getStaff(user.khataId);
                setStaff(data);
            } catch (error) {
                console.error("Failed to load staff", error);
                addToast({ type: 'error', title: 'Error', message: 'Failed to load staff list' });
            } finally {
                setLoading(false);
            }
        };

        fetchStaff();
    }, [user?.khataId]);

    const handleOpenModal = (staffMember: StaffMember | null = null) => {
        if (staffMember) {
            setEditingStaff(staffMember);
            setFormData({
                name: staffMember.name,
                designation: staffMember.designation,
                phone: staffMember.phone
            });
        } else {
            setEditingStaff(null);
            setFormData({ name: '', designation: 'Maid', phone: '' });
        }
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setEditingStaff(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.khataId) return;

        setSubmitting(true);
        try {
            if (editingStaff) {
                const updated = await api.updateStaff(user.khataId, editingStaff._id, formData);
                if (updated) {
                    setStaff(prev => prev.map(s => s._id === updated._id ? updated : s));
                    addToast({ type: 'success', title: 'Success', message: 'Staff updated successfully' });
                    handleCloseModal();
                }
            } else {
                const newStaff = await api.addStaff(user.khataId, formData);
                if (newStaff) {
                    setStaff(prev => [newStaff, ...prev]);
                    addToast({ type: 'success', title: 'Success', message: 'Staff added successfully' });
                    handleCloseModal();
                }
            }
        } catch (error) {
            addToast({ type: 'error', title: 'Error', message: 'Operation failed' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (staffId: string) => {
        if (!confirm('Are you sure you want to delete this staff member?')) return;
        if (!user?.khataId) return;

        try {
            const success = await api.deleteStaff(user.khataId, staffId);
            if (success) {
                setStaff(prev => prev.filter(s => s._id !== staffId));
                addToast({ type: 'success', title: 'Deleted', message: 'Staff member removed' });
            }
        } catch (error) {
            addToast({ type: 'error', title: 'Error', message: 'Failed to delete staff' });
        }
    };

    const handleCall = (phone: string) => {
        const number = phone.replace(/[^0-9+]/g, '');
        window.open(`tel:${number}`);
    };

    if (loading) return <AppLayout><div className="flex justify-center p-10"><SpinnerIcon className="w-8 h-8 text-primary-500" /></div></AppLayout>;

    return (
        <AppLayout>
            <div className="space-y-6 animate-fade-in relative">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <BriefcaseIcon className="w-8 h-8 text-primary-500" />
                            Household Services
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">
                            Contacts for Maid, Cook, Electrician, etc.
                        </p>
                    </div>
                    {user?.role === Role.Manager && (
                        <button
                            onClick={() => handleOpenModal()}
                            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors shadow-sm"
                        >
                            <PlusIcon className="w-5 h-5" />
                            Add Service
                        </button>
                    )}
                </div>

                {staff.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                        <BriefcaseIcon className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No services added yet</h3>
                        <p className="text-slate-500">
                            {user?.role === Role.Manager ? "Add your maid, cook, or utility contacts here." : "Ask your manager to add service contacts."}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {staff.map((person) => (
                            <div key={person._id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-2xl">
                                            {/* Simple Avatar based on designation first letter or emoji */}
                                            {person.designation === 'Maid' ? '🧹' :
                                                person.designation === 'Cook' ? '🍳' :
                                                    person.designation === 'Electrician' ? '⚡' :
                                                        person.designation === 'Plumber' ? '🔧' : '👷'}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">{person.name}</h3>
                                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                                {person.designation}
                                            </span>
                                        </div>
                                    </div>
                                    {user?.role === Role.Manager && (
                                        <div className="flex gap-1">
                                            <button onClick={() => handleOpenModal(person)} className="p-1.5 text-slate-400 hover:text-blue-500 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20">
                                                <PencilIcon className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDelete(person._id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                                    <div className="text-base font-mono text-slate-600 dark:text-slate-300">
                                        {person.phone}
                                    </div>
                                    <button
                                        onClick={() => handleCall(person.phone)}
                                        className="px-3 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors"
                                    >
                                        <PhoneIcon className="w-4 h-4" />
                                        Call
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={handleCloseModal}>
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                                {editingStaff ? 'Edit Staff' : 'Add New Staff'}
                            </h3>
                            <button onClick={handleCloseModal} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                                <XIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-primary-500"
                                    placeholder="e.g. Rahim Miah"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Designation</label>
                                <select
                                    value={formData.designation}
                                    onChange={e => setFormData({ ...formData, designation: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-primary-500"
                                >
                                    {designations.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-primary-500"
                                    placeholder="017..."
                                    required
                                />
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold shadow-sm disabled:opacity-50 flex items-center gap-2"
                                >
                                    {submitting && <SpinnerIcon className="w-4 h-4" />}
                                    {editingStaff ? 'Update' : 'Add Staff'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </AppLayout>
    );
}
