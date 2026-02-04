import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { api } from '@/services/api';
import { XIcon, CameraIcon, FolderIcon, CheckCircleIcon } from '@/components/Icons';

export interface ShoppingDuty {
    name: string;
    status: string;
    amount: number;
}

export type Roster = Record<string, ShoppingDuty>;

export interface EditRosterModalProps {
    onClose: () => void;
    roster: Roster;
    members: { id: string; name: string }[];
    onSave: (newRoster: Roster) => void;
}

export const EditRosterModal: React.FC<EditRosterModalProps> = ({ onClose, roster, members, onSave }) => {
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
            <div className="w-full max-h-[90vh] max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl flex flex-col transform transition-all duration-300 scale-100 hover:shadow-primary-500/10 border border-slate-100 dark:border-slate-700" onClick={e => e.stopPropagation()}>
                <div className="flex-shrink-0 px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 rounded-t-2xl">
                    <div>
                        <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Edit Shopping Roster</h3>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1">Assign members to shopping days</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
                        <XIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-600">
                    <div className="space-y-3 sm:space-y-4">
                        {Object.entries(editedRoster).map(([day, duty]) => {
                            const shoppingDuty = duty as ShoppingDuty;
                            const isAssigned = !!shoppingDuty.name;

                            return (
                                <div key={day} className={`group flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-xl border transition-all duration-200 
                                    ${isAssigned
                                        ? 'bg-white dark:bg-slate-800 border-primary-200 dark:border-primary-800/30 shadow-sm'
                                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'}`}>

                                    <div className="flex items-center gap-3 w-full sm:w-1/3 mb-2 sm:mb-0">
                                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold uppercase tracking-wider shadow-sm transition-colors
                                            ${isAssigned
                                                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'
                                                : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                                            {day.substring(0, 3)}
                                        </div>
                                        <span className={`font-bold text-sm sm:text-base ${isAssigned ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                                            {day}
                                        </span>
                                    </div>

                                    <div className="flex-1 w-full sm:ml-4 relative">
                                        <select
                                            value={shoppingDuty.name}
                                            onChange={(e) => handleAssignmentChange(day, e.target.value)}
                                            className={`w-full appearance-none px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all font-medium cursor-pointer
                                                ${isAssigned
                                                    ? 'bg-white dark:bg-slate-800 border-primary-300 dark:border-primary-700 text-primary-900 dark:text-primary-100 focus:border-primary-500'
                                                    : 'bg-slate-100 dark:bg-slate-700/50 border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                                        >
                                            <option value="">No Duty Assigned</option>
                                            {members.map(member => <option key={member.id} value={member.name}>👤 {member.name}</option>)}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                                            <svg className="h-4 w-4 sm:h-5 sm:w-5 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="flex-shrink-0 px-4 sm:px-6 py-4 sm:py-5 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3 bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-b-2xl">
                    <button onClick={onClose} className="px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-all active:scale-[0.98]">
                        Cancel
                    </button>
                    <button onClick={handleSaveChanges} className="px-5 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-primary-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-primary-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all">
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export const AddDepositModal: React.FC<{
    onClose: () => void;
    onSubmit: () => void;
    members?: { userId: string; name: string }[];
}> = ({ onClose, onSubmit, members }) => {
    const { user } = useAuth();
    const { addToast } = useNotifications();
    const [selectedUserId, setSelectedUserId] = useState(user?.id || '');
    const [amount, setAmount] = useState('1500');
    const [method, setMethod] = useState('bKash');
    const [transactionId, setTransactionId] = useState('');
    const [screenshotUrl, setScreenshotUrl] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // If members are provided (manager mode), default to empty selection or keep user's own id if they are in the list
    // But usually we want "Select Member".
    // If user is manager and wants to deposit for themselves, they can select themselves.
    // However, if members prop is NOT provided (member mode), selectedUserId should be user.id.

    const isManagerMode = members && members.length > 0;

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setIsUploading(true);
            try {
                const url = await api.uploadImage(file);
                if (url) {
                    setScreenshotUrl(url);
                    addToast({ type: 'success', title: 'Uploaded', message: 'Screenshot uploaded successfully' });
                } else {
                    addToast({ type: 'error', title: 'Error', message: 'Failed to upload screenshot' });
                }
            } catch (error) {
                addToast({ type: 'error', title: 'Error', message: 'Upload failed' });
            } finally {
                setIsUploading(false);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user?.khataId) {
            addToast({ type: 'error', title: 'Error', message: 'User not found' });
            return;
        }

        if (isManagerMode && !selectedUserId) {
            addToast({ type: 'error', title: 'Error', message: 'Please select a member' });
            return;
        }

        setIsSubmitting(true);
        try {
            await api.createDeposit(user.khataId, {
                amount: parseFloat(amount),
                paymentMethod: method,
                transactionId,
                screenshotUrl,
                userId: isManagerMode ? selectedUserId : undefined
            });

            addToast({ type: 'success', title: 'Deposit Submitted', message: isManagerMode ? 'Deposit added and approved.' : 'Your deposit is now pending manager approval.' });
            onSubmit();
            onClose();
        } catch (error: any) {
            addToast({ type: 'error', title: 'Error', message: error.response?.data?.message || 'Failed to submit deposit' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="flex min-h-full items-center justify-center p-4 text-center">
                <div className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-6 text-left align-middle shadow-xl transition-all border border-slate-100 dark:border-slate-700" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                            {isManagerMode ? 'Add Member Deposit' : 'Deposit to Meal Fund'}
                        </h3>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"><XIcon className="w-5 h-5 text-slate-500" /></button>
                    </div>

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        {isManagerMode && (
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Depositor</label>
                                <select
                                    value={selectedUserId}
                                    onChange={(e) => setSelectedUserId(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700/50 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:border-primary-500 focus:bg-white dark:focus:bg-slate-700 transition-all text-slate-900 dark:text-white font-medium"
                                    required
                                >
                                    <option value="">Select Member</option>
                                    {members?.map(m => (
                                        <option key={m.userId} value={m.userId}>{m.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Amount</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-3 flex items-center text-slate-500 font-bold">৳</span>
                                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full pl-8 pr-4 py-3 bg-slate-50 dark:bg-slate-700/50 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:border-primary-500 focus:bg-white dark:focus:bg-slate-700 transition-all text-slate-900 dark:text-white font-semibold text-lg" required />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Payment Method</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['bKash', 'Nagad', 'Rocket', 'Cash', 'Bank Transfer'].map(m => (
                                    <button type="button" key={m} onClick={() => setMethod(m)} className={`px-2 py-2.5 text-xs font-bold rounded-xl border-2 transition-all ${method === m ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/20 text-primary-700 dark:text-primary-300' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-500 text-slate-600 dark:text-slate-400'}`}>{m}</button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Transaction ID <span className="text-slate-400 font-normal">(Optional)</span></label>
                            <input
                                type="text"
                                placeholder="e.g. TRX12345678"
                                value={transactionId}
                                onChange={(e) => setTransactionId(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700/50 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:border-primary-500 focus:bg-white dark:focus:bg-slate-700 transition-all text-slate-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Screenshot <span className="text-slate-400 font-normal">(Optional)</span></label>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleUpload} />
                            <div className="flex gap-2">
                                <button type="button" onClick={() => fileInputRef.current?.click()} className={`w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-xl border-2 border-dashed transition-all ${screenshotUrl ? 'bg-green-50 border-green-300 text-green-700 dark:bg-green-900/10 dark:border-green-700 dark:text-green-400' : 'bg-slate-50 border-slate-300 text-slate-600 hover:bg-slate-100 dark:bg-slate-700/30 dark:border-slate-600 dark:text-slate-400'}`}>
                                    {isUploading ? <span className="animate-pulse">Uploading...</span> : (screenshotUrl ? <><CheckCircleIcon className="w-5 h-5" /> Screenshot Attached</> : <><CameraIcon className="w-5 h-5" /> Upload Screenshot</>)}
                                </button>
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-bold rounded-xl shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 mt-2"
                        >
                            {isSubmitting ? 'Processing...' : (isManagerMode ? 'Add Deposit' : 'Submit Deposit')}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}

export const AddExpenseModal: React.FC<{ onClose: () => void; onSubmit: () => void }> = ({ onClose, onSubmit }) => {
    const { user } = useAuth();
    const { addToast } = useNotifications();
    const [amount, setAmount] = useState('');
    const [items, setItems] = useState('');
    const [notes, setNotes] = useState('');
    const [receiptUrl, setReceiptUrl] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setIsUploading(true);
            try {
                const url = await api.uploadImage(file);
                if (url) {
                    setReceiptUrl(url);
                    addToast({ type: 'success', title: 'Uploaded', message: 'Receipt uploaded successfully' });
                } else {
                    addToast({ type: 'error', title: 'Error', message: 'Failed to upload receipt' });
                }
            } catch (error) {
                addToast({ type: 'error', title: 'Error', message: 'Upload failed' });
            } finally {
                setIsUploading(false);
            }
        }
    };

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
                receiptUrl
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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="flex min-h-full items-center justify-center p-4 text-center">
                <div className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-6 text-left align-middle shadow-xl transition-all border border-slate-100 dark:border-slate-700" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Add Shopping Expense</h3>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"><XIcon className="w-5 h-5 text-slate-500" /></button>
                    </div>
                    <form className="space-y-5" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Amount</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-3 flex items-center text-slate-500 font-bold">৳</span>
                                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full pl-8 pr-4 py-3 bg-slate-50 dark:bg-slate-700/50 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:border-primary-500 focus:bg-white dark:focus:bg-slate-700 transition-all text-slate-900 dark:text-white font-semibold text-lg" required />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Items Purchased</label>
                            <textarea value={items} onChange={e => setItems(e.target.value)} rows={3} placeholder="e.g., Rice (5kg), Vegetables, Oil (1L)" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700/50 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:border-primary-500 focus:bg-white dark:focus:bg-slate-700 transition-all text-slate-900 dark:text-white" required />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Notes <span className="text-slate-400 font-normal">(Optional)</span></label>
                            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700/50 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:border-primary-500 focus:bg-white dark:focus:bg-slate-700 transition-all text-slate-900 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Receipt <span className="text-slate-400 font-normal">(Optional)</span></label>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleUpload} />
                            <div className="flex gap-2">
                                <button type="button" onClick={() => fileInputRef.current?.click()} className={`w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-xl border-2 border-dashed transition-all ${receiptUrl ? 'bg-green-50 border-green-300 text-green-700 dark:bg-green-900/10 dark:border-green-700 dark:text-green-400' : 'bg-slate-50 border-slate-300 text-slate-600 hover:bg-slate-100 dark:bg-slate-700/30 dark:border-slate-600 dark:text-slate-400'}`}>
                                    {isUploading ? <span className="animate-pulse">Uploading...</span> : (receiptUrl ? <><CheckCircleIcon className="w-5 h-5" /> Receipt Attached</> : <><CameraIcon className="w-5 h-5" /> Upload Receipt</>)}
                                </button>
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-bold rounded-xl shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 mt-2"
                        >
                            {isSubmitting ? 'Processing...' : 'Submit Expense'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};


export const FundAdjustmentModal: React.FC<{
    targetUser: { id: string; name: string };
    onClose: () => void;
    onSuccess: () => void;
}> = ({ targetUser, onClose, onSuccess }) => {
    const { user } = useAuth();
    const { addToast } = useNotifications();
    const [type, setType] = useState<'ADD' | 'DEDUCT'>('ADD');
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.khataId) return;

        setIsSubmitting(true);
        try {
            const success = await api.adjustMemberFund(user.khataId, {
                userId: targetUser.id,
                type,
                amount: parseFloat(amount),
                reason
            });

            if (success) {
                addToast({ type: 'success', title: 'Fund Adjusted', message: `Successfully ${type === 'ADD' ? 'added' : 'deducted'} funds.` });
                onSuccess();
                onClose();
            } else {
                addToast({ type: 'error', title: 'Error', message: 'Failed to adjust fund.' });
            }
        } catch (error) {
            addToast({ type: 'error', title: 'Error', message: 'An error occurred.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="flex min-h-screen items-center justify-center p-4">
                <div
                    className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-6 text-left shadow-2xl transition-all border border-slate-100 dark:border-slate-700"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Adjust Fund: {targetUser.name}</h3>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"><XIcon className="w-5 h-5 text-slate-500" /></button>
                    </div>

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        <div className="flex p-1 bg-slate-100 dark:bg-slate-700 rounded-xl">
                            <button
                                type="button"
                                onClick={() => setType('ADD')}
                                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${type === 'ADD' ? 'bg-white dark:bg-slate-600 text-green-600 dark:text-green-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}`}
                            >
                                + Add Fund
                            </button>
                            <button
                                type="button"
                                onClick={() => setType('DEDUCT')}
                                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${type === 'DEDUCT' ? 'bg-white dark:bg-slate-600 text-red-600 dark:text-red-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}`}
                            >
                                - Deduct Fund
                            </button>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Amount</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-3 flex items-center text-slate-500 font-bold">৳</span>
                                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full pl-8 pr-4 py-3 bg-slate-50 dark:bg-slate-700/50 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:border-primary-500 focus:bg-white dark:focus:bg-slate-700 transition-all text-slate-900 dark:text-white font-semibold text-lg" required />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Reason / Note</label>
                            <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Previous balance adjustment" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700/50 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:border-primary-500 focus:bg-white dark:focus:bg-slate-700 transition-all text-slate-900 dark:text-white" required />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`w-full py-3.5 text-white font-bold rounded-xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 mt-2 ${type === 'ADD' ? 'bg-green-600 hover:bg-green-700 shadow-green-500/20' : 'bg-red-600 hover:bg-red-700 shadow-red-500/20'}`}
                        >
                            {isSubmitting ? 'Processing...' : type === 'ADD' ? 'Add Fund' : 'Deduct Fund'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};


export const AddManagerShoppingModal: React.FC<{
    onClose: () => void;
    onSubmit: () => void;
    members: { userId: string; name: string }[];
}> = ({ onClose, onSubmit, members }) => {
    const { user } = useAuth();
    const { addToast } = useNotifications();
    const [selectedUserId, setSelectedUserId] = useState(user?.id || '');
    const [amount, setAmount] = useState('');
    const [items, setItems] = useState('');
    const [notes, setNotes] = useState('');
    const [receiptUrl, setReceiptUrl] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setIsUploading(true);
            try {
                const url = await api.uploadImage(file);
                if (url) {
                    setReceiptUrl(url);
                    addToast({ type: 'success', title: 'Uploaded', message: 'Receipt uploaded successfully' });
                } else {
                    addToast({ type: 'error', title: 'Error', message: 'Failed to upload receipt' });
                }
            } catch (error) {
                addToast({ type: 'error', title: 'Error', message: 'Upload failed' });
            } finally {
                setIsUploading(false);
            }
        }
    };

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
                notes: notes ? `Added by Manager: ${notes}` : 'Added by Manager',
                receiptUrl,
                userId: selectedUserId,
                status: 'Approved'
            });

            addToast({ type: 'success', title: 'Shopping Record Added', message: 'Expense saved and approved successfully.' });
            onSubmit();
            onClose();
        } catch (error: any) {
            addToast({ type: 'error', title: 'Error', message: error.response?.data?.message || 'Failed to save expense' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="flex min-h-full items-center justify-center p-4 text-center">
                <div className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-6 text-left align-middle shadow-xl transition-all border border-slate-100 dark:border-slate-700" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Add Manager Shopping Record</h3>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"><XIcon className="w-5 h-5 text-slate-500" /></button>
                    </div>
                    <form className="space-y-5" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Who did the shopping?</label>
                            <select
                                value={selectedUserId}
                                onChange={(e) => setSelectedUserId(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700/50 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:border-primary-500 focus:bg-white dark:focus:bg-slate-700 transition-all text-slate-900 dark:text-white font-medium"
                                required
                            >
                                <option value="">Select Member</option>
                                {members.map(m => (
                                    <option key={m.userId} value={m.userId}>{m.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Amount</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-3 flex items-center text-slate-500 font-bold">৳</span>
                                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full pl-8 pr-4 py-3 bg-slate-50 dark:bg-slate-700/50 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:border-primary-500 focus:bg-white dark:focus:bg-slate-700 transition-all text-slate-900 dark:text-white font-semibold text-lg" required />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Items Purchased</label>
                            <textarea value={items} onChange={e => setItems(e.target.value)} rows={3} placeholder="e.g., Rice (5kg), Vegetables, Oil (1L)" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700/50 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:border-primary-500 focus:bg-white dark:focus:bg-slate-700 transition-all text-slate-900 dark:text-white" required />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Notes <span className="text-slate-400 font-normal">(Optional)</span></label>
                            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700/50 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:border-primary-500 focus:bg-white dark:focus:bg-slate-700 transition-all text-slate-900 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Receipt <span className="text-slate-400 font-normal">(Optional)</span></label>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleUpload} />
                            <div className="flex gap-2">
                                <button type="button" onClick={() => fileInputRef.current?.click()} className={`w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-xl border-2 border-dashed transition-all ${receiptUrl ? 'bg-green-50 border-green-300 text-green-700 dark:bg-green-900/10 dark:border-green-700 dark:text-green-400' : 'bg-slate-50 border-slate-300 text-slate-600 hover:bg-slate-100 dark:bg-slate-700/30 dark:border-slate-600 dark:text-slate-400'}`}>
                                    {isUploading ? <span className="animate-pulse">Uploading...</span> : (receiptUrl ? <><CheckCircleIcon className="w-5 h-5" /> Receipt Attached</> : <><CameraIcon className="w-5 h-5" /> Upload Receipt</>)}
                                </button>
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-bold rounded-xl shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 mt-2"
                        >
                            {isSubmitting ? 'Processing...' : 'Save & Approve Record'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
