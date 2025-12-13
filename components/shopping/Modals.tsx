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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="flex min-h-full items-center justify-center p-4 text-center">
                <div className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-6 text-left align-middle shadow-xl transition-all border border-slate-100 dark:border-slate-700" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Edit Shopping Roster</h3>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"><XIcon className="w-5 h-5 text-slate-500" /></button>
                    </div>
                    <div className="space-y-4">
                        {Object.entries(editedRoster).map(([day, duty]) => {
                            const shoppingDuty = duty as ShoppingDuty;
                            return (
                                <div key={day} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                    <label className="font-semibold text-slate-700 dark:text-slate-300 w-1/3">{day}</label>
                                    <select
                                        value={shoppingDuty.name}
                                        onChange={(e) => handleAssignmentChange(day, e.target.value)}
                                        className="flex-1 ml-4 px-3 py-2 bg-slate-100 dark:bg-slate-700 border-2 border-transparent rounded-xl focus:outline-none focus:border-primary-500 transition-all text-slate-900 dark:text-white"
                                    >
                                        <option value="">None</option>
                                        {members.map(member => <option key={member.id} value={member.name}>{member.name}</option>)}
                                    </select>
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex gap-3 mt-8 justify-end">
                        <button onClick={onClose} className="px-5 py-2.5 bg-slate-100 dark:bg-slate-700 font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors">Cancel</button>
                        <button onClick={handleSaveChanges} className="px-5 py-2.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-500/20 transition-all">Save Changes</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const AddDepositModal: React.FC<{ onClose: () => void, onSubmit: () => void }> = ({ onClose, onSubmit }) => {
    const { user } = useAuth();
    const { addToast } = useNotifications();
    const [amount, setAmount] = useState('1500');
    const [method, setMethod] = useState('bKash');
    const [transactionId, setTransactionId] = useState('');
    const [screenshotUrl, setScreenshotUrl] = useState('');
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

        setIsSubmitting(true);
        try {
            await api.createDeposit(user.khataId, {
                amount: parseFloat(amount),
                paymentMethod: method,
                transactionId,
                screenshotUrl
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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="flex min-h-full items-center justify-center p-4 text-center">
                <div className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-6 text-left align-middle shadow-xl transition-all border border-slate-100 dark:border-slate-700" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Deposit to Meal Fund</h3>
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
                            {isSubmitting ? 'Processing...' : 'Submit Deposit'}
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
