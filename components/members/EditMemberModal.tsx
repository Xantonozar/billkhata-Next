"use client";

import React, { useState } from 'react';
import { XIcon } from '@/components/Icons';
import { Role } from '@/types';

interface EditMemberModalProps {
    isOpen: boolean;
    member: any;
    onClose: () => void;
    onSave: (userId: string, data: any) => Promise<void>;
    currentUserId: string;
}

const EditMemberModal: React.FC<EditMemberModalProps> = ({ isOpen, member, onClose, onSave, currentUserId }) => {
    const [formData, setFormData] = useState({
        name: member?.name || '',
        email: member?.email || '',
        phone: member?.phone || '',
        whatsapp: member?.whatsapp || '',
        facebook: member?.facebook || '',
        role: member?.role || Role.Member,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    React.useEffect(() => {
        if (member) {
            setFormData({
                name: member.name || '',
                email: member.email || '',
                phone: member.phone || '',
                whatsapp: member.whatsapp || '',
                facebook: member.facebook || '',
                role: member.role || Role.Member,
            });
        }
    }, [member]);

    if (!isOpen || !member) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await onSave(member.id, formData);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to update member');
        } finally {
            setLoading(false);
        }
    };

    const isEditingSelf = member.id === currentUserId;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4" onClick={onClose}>
            <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                {/* Gradient Header */}
                <div className="sticky top-0 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 p-6 text-white relative overflow-hidden z-10">
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent"></div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-xl sm:text-2xl font-bold">Edit Member</h2>
                                <p className="text-primary-100 text-sm mt-1">Update member information</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-white/20 transition-colors"
                                aria-label="Close"
                            >
                                <XIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-300">
                            {error}
                        </div>
                    )}

                    {/* Name */}
                    <div>
                        <label className="block text-sm font-semibold text-muted-foreground mb-2">Name *</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            required
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-primary-500 transition-colors text-foreground"
                            placeholder="Enter member name"
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-semibold text-muted-foreground mb-2">Email *</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            required
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-primary-500 transition-colors text-foreground"
                            placeholder="member@example.com"
                        />
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-sm font-semibold text-muted-foreground mb-2">Phone</label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-primary-500 transition-colors text-foreground"
                            placeholder="+880 1234567890"
                        />
                    </div>

                    {/* WhatsApp */}
                    <div>
                        <label className="block text-sm font-semibold text-muted-foreground mb-2">WhatsApp</label>
                        <input
                            type="tel"
                            value={formData.whatsapp}
                            onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-primary-500 transition-colors text-foreground"
                            placeholder="+880 1234567890"
                        />
                    </div>

                    {/* Facebook */}
                    <div>
                        <label className="block text-sm font-semibold text-muted-foreground mb-2">Facebook Profile URL</label>
                        <input
                            type="url"
                            value={formData.facebook}
                            onChange={e => setFormData({ ...formData, facebook: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-primary-500 transition-colors text-foreground"
                            placeholder="https://facebook.com/username"
                        />
                    </div>

                    {/* Role */}
                    <div>
                        <label className="block text-sm font-semibold text-muted-foreground mb-2">
                            Role {isEditingSelf && <span className="text-yellow-600">(Cannot change your own role)</span>}
                        </label>
                        <select
                            value={formData.role}
                            onChange={e => setFormData({ ...formData, role: e.target.value as Role })}
                            disabled={isEditingSelf}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-primary-500 transition-colors text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <option value={Role.Member}>Member</option>
                            <option value={Role.Manager}>Manager</option>
                            <option value={Role.MasterManager}>Master Manager</option>
                        </select>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-bold rounded-xl shadow-lg shadow-primary-500/30 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                        >
                            {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditMemberModal;
