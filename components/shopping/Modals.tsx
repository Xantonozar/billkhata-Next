import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { api } from '@/services/api';
import { XIcon, CameraIcon, FolderIcon } from '@/components/Icons';

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
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleUpload} />
                        <div className="flex gap-2 mt-1">
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-slate-100 dark:bg-slate-700 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 border-2 border-dashed border-slate-300 dark:border-slate-600">
                                {isUploading ? 'Uploading...' : (screenshotUrl ? 'Change Screenshot' : 'Upload Screenshot')}
                            </button>
                        </div>
                        {screenshotUrl && <p className="text-xs text-green-600 mt-1">Screenshot attached</p>}
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
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleUpload} />
                        <div className="flex gap-2 mt-1">
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-slate-100 dark:bg-slate-700 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 border-2 border-dashed border-slate-300 dark:border-slate-600">
                                {isUploading ? 'Uploading...' : (receiptUrl ? 'Change Receipt' : 'Upload Receipt')}
                            </button>
                        </div>
                        {receiptUrl && <p className="text-xs text-green-600 mt-1">Receipt attached</p>}
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
