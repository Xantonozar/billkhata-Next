import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { api } from '@/services/api';
import { XIcon } from '@/components/Icons';

interface CreateBillModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

type SplitMethod = 'EQUAL' | 'CUSTOM';

export const CreateBillModal: React.FC<CreateBillModalProps> = ({ onClose, onSuccess }) => {
    const { user } = useAuth();
    const { addToast, refreshNotifications } = useNotifications();
    const [loading, setLoading] = useState(false);
    const [members, setMembers] = useState<any[]>([]);

    // Form State
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('Rent');
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const d = new Date();
        return `${d.toLocaleString('default', { month: 'long' })} ${d.getFullYear()}`;
    });
    const [totalAmount, setTotalAmount] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [description, setDescription] = useState('');

    // Split Logic State
    const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
    const [splitMethod, setSplitMethod] = useState<SplitMethod>('EQUAL');
    const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});

    useEffect(() => {
        if (user?.khataId) {
            api.getMembersForRoom(user.khataId).then(data => {
                setMembers(data);
                // Default select all members
                setSelectedMemberIds(data.map((m: any) => m.id));
            });
        }
    }, [user]);

    // Derived state for per-person amount
    const perPersonAmount = useMemo(() => {
        const amount = parseFloat(totalAmount);
        const count = selectedMemberIds.length;
        if (isNaN(amount) || count === 0) return 0;
        return amount / count;
    }, [totalAmount, selectedMemberIds]);

    // Initialize custom amounts with equal split when switching to custom or changing total/selection
    useEffect(() => {
        if (splitMethod === 'CUSTOM' && totalAmount && selectedMemberIds.length > 0) {
            // Only update if current custom amounts are empty or we want to reset logic
            // For better UX, let's pre-fill with equal values initially
            const amount = parseFloat(totalAmount);
            if (!isNaN(amount)) {
                const equal = (amount / selectedMemberIds.length).toFixed(2);
                const newCustoms: Record<string, string> = {};
                selectedMemberIds.forEach(id => {
                    newCustoms[id] = customAmounts[id] || equal;
                });
                setCustomAmounts(prev => ({ ...newCustoms, ...prev })); // Keep existing edits if key exists? 
                // Actually, simpler to just start fresh or persist. 
                // Let's just ensure keys exist
                setCustomAmounts(prev => {
                    const next = { ...prev };
                    selectedMemberIds.forEach(id => {
                        if (next[id] === undefined) next[id] = equal;
                    });
                    return next;
                });
            }
        }
    }, [splitMethod, selectedMemberIds, totalAmount]);

    const toggleMember = (memberId: string) => {
        setSelectedMemberIds(prev =>
            prev.includes(memberId)
                ? prev.filter(id => id !== memberId)
                : [...prev, memberId]
        );
    };

    const handleCustomAmountChange = (memberId: string, value: string) => {
        setCustomAmounts(prev => ({ ...prev, [memberId]: value }));
    };

    const remainingAmount = useMemo(() => {
        if (splitMethod !== 'CUSTOM') return 0;
        const total = parseFloat(totalAmount) || 0;
        const assigned = selectedMemberIds.reduce((sum, id) => {
            return sum + (parseFloat(customAmounts[id]) || 0);
        }, 0);
        return total - assigned;
    }, [totalAmount, customAmounts, selectedMemberIds, splitMethod]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user?.khataId || !title || !totalAmount || !dueDate) {
            addToast({ type: 'error', title: 'Error', message: 'Please fill in all required fields' });
            return;
        }

        if (selectedMemberIds.length === 0) {
            addToast({ type: 'warning', title: 'Start', message: 'Select at least one member to split the bill.' });
            return;
        }

        const amountVal = parseFloat(totalAmount);

        let shares = [];
        if (splitMethod === 'EQUAL') {
            shares = selectedMemberIds.map(id => {
                const member = members.find(m => m.id === id);
                return {
                    userId: id,
                    userName: member?.name || 'Unknown',
                    amount: perPersonAmount,
                    status: 'Unpaid'
                };
            });
        } else {
            // Validate custom amounts
            const totalAssigned = selectedMemberIds.reduce((sum, id) => sum + (parseFloat(customAmounts[id]) || 0), 0);

            // Allow small float precision difference
            if (Math.abs(totalAssigned - amountVal) > 1) {
                addToast({
                    type: 'error',
                    title: 'Mismatch',
                    message: `Total assigned (৳${totalAssigned.toFixed(2)}) must equal Bill Total (৳${amountVal.toFixed(2)})`
                });
                return;
            }

            shares = selectedMemberIds.map(id => {
                const member = members.find(m => m.id === id);
                return {
                    userId: id,
                    userName: member?.name || 'Unknown',
                    amount: parseFloat(customAmounts[id]) || 0,
                    status: 'Unpaid'
                };
            });
        }

        setLoading(true);

        const billData = {
            title,
            category,
            totalAmount: amountVal,
            dueDate,
            description,
            shares
        };

        try {
            const success = await api.createBill(billData);
            if (success) {
                addToast({ type: 'success', title: 'Success', message: 'Bill created successfully!' });
                setTimeout(() => refreshNotifications(), 500);
                onSuccess();
                onClose();
            } else {
                addToast({ type: 'error', title: 'Error', message: 'Failed to create bill' });
            }
        } catch (error) {
            addToast({ type: 'error', title: 'Error', message: 'Failed to create bill' });
        } finally {
            setLoading(false);
        }
    };

    // Generate upcoming months for dropdown
    const monthOptions = useMemo(() => {
        const months = [];
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        months.push(`${d.toLocaleString('default', { month: 'long' })} ${d.getFullYear()}`);
        d.setMonth(d.getMonth() + 1);
        months.push(`${d.toLocaleString('default', { month: 'long' })} ${d.getFullYear()}`);
        for (let i = 0; i < 3; i++) {
            d.setMonth(d.getMonth() + 1);
            months.push(`${d.toLocaleString('default', { month: 'long' })} ${d.getFullYear()}`);
        }
        return months;
    }, []);

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="flex min-h-full items-center justify-center p-4 text-center">
                <div
                    className="w-full max-w-lg transform overflow-hidden rounded-xl bg-[#EAEAEA] dark:bg-slate-800 text-left align-middle shadow-2xl transition-all"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex justify-between items-center px-6 py-4 border-b border-slate-300 dark:border-slate-700">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Add New Bill</h3>
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                            <XIcon className="w-5 h-5 text-slate-500" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                Title
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-4 py-2.5 bg-[#D9D9D9] dark:bg-slate-700 border-none rounded-lg focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white font-medium placeholder-slate-500"
                                placeholder="e.g., October Electricity"
                            />
                        </div>

                        {/* Category & Month Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Category
                                </label>
                                <div className="relative">
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-[#D9D9D9] dark:bg-slate-700 border-none rounded-lg focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white font-medium appearance-none cursor-pointer"
                                    >
                                        <option value="Rent">Rent</option>
                                        <option value="Electricity">Electricity</option>
                                        <option value="Water">Water</option>
                                        <option value="Gas">Gas</option>
                                        <option value="Wi-Fi">Wi-Fi</option>
                                        <option value="Maid">Maid</option>
                                        <option value="Others">Others</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-600">
                                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Month
                                </label>
                                <div className="relative">
                                    <select
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-[#D9D9D9] dark:bg-slate-700 border-none rounded-lg focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white font-medium appearance-none cursor-pointer"
                                    >
                                        {monthOptions.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-600">
                                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Total Amount & Due Date Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Total Amount
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={totalAmount}
                                    onChange={(e) => setTotalAmount(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-[#D9D9D9] dark:bg-slate-700 border-none rounded-lg focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white font-medium placeholder-slate-500"
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Due Date
                                </label>
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-[#D9D9D9] dark:bg-slate-700 border-none rounded-lg focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white font-medium"
                                    required
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                Description (Optional)
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-4 py-2.5 bg-[#D9D9D9] dark:bg-slate-700 border-none rounded-lg focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white font-medium placeholder-slate-500 resize-none"
                                rows={3}
                            />
                        </div>

                        <hr className="border-slate-300 dark:border-slate-600" />

                        {/* Split Bill With */}
                        <div>
                            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">Split Bill With</h4>
                            <div className="grid grid-cols-2 gap-3">
                                {members.map(member => (
                                    <label key={member.id} className="flex items-center gap-2 cursor-pointer group">
                                        <div
                                            className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${selectedMemberIds.includes(member.id) ? 'bg-red-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                toggleMember(member.id);
                                            }}
                                        >
                                            {selectedMemberIds.includes(member.id) && (
                                                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                        <span className="text-slate-600 dark:text-slate-300 font-medium select-none group-hover:text-slate-800 dark:group-hover:text-white">{member.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <hr className="border-slate-300 dark:border-slate-600" />

                        {/* Split Method */}
                        <div>
                            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">Split Method</h4>
                            <div className="flex bg-[#D9D9D9] dark:bg-slate-700 rounded-lg p-1 mb-3">
                                <button
                                    type="button"
                                    onClick={() => setSplitMethod('EQUAL')}
                                    className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-all ${splitMethod === 'EQUAL' ? 'bg-[#EAEAEA] dark:bg-slate-600 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
                                >
                                    Split Equally
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSplitMethod('CUSTOM')}
                                    className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-all ${splitMethod === 'CUSTOM' ? 'bg-[#EAEAEA] dark:bg-slate-600 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
                                >
                                    Custom Amount
                                </button>
                            </div>

                            {splitMethod === 'EQUAL' ? (
                                <p className="text-center text-slate-600 dark:text-slate-400 font-bold">
                                    ৳{perPersonAmount.toFixed(2)} per person
                                </p>
                            ) : (
                                <div className="space-y-2 animate-fade-in">
                                    <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                        <span>Member</span>
                                        <span>Share (৳)</span>
                                    </div>
                                    <div className="max-h-40 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                                        {selectedMemberIds.map(id => {
                                            const member = members.find(m => m.id === id);
                                            return (
                                                <div key={id} className="flex items-center justify-between gap-3">
                                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate">
                                                        {member?.name}
                                                    </span>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={customAmounts[id] || ''}
                                                        onChange={(e) => handleCustomAmountChange(id, e.target.value)}
                                                        className="w-28 px-3 py-1.5 bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded-lg text-right font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t border-slate-300 dark:border-slate-600 mt-2">
                                        <span className="text-xs font-bold text-slate-500">Remaining</span>
                                        <span className={`text-sm font-bold ${Math.abs(remainingAmount) < 0.1 ? 'text-green-600' : 'text-red-500'}`}>
                                            ৳{remainingAmount.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer Buttons */}
                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-2.5 bg-[#D9D9D9] dark:bg-slate-700 text-slate-700 dark:text-white font-bold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-8 py-2.5 bg-[#C1D950] text-[#3f4a1a] font-bold rounded-lg hover:bg-[#b0c746] shadow-sm transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Adding...' : 'Add Bill'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
