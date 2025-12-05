"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Bill, BillShare } from '@/types';
import { XIcon, UserCircleIcon } from '../Icons';

interface EditSharedBillModalProps {
    billToEdit: Bill;
    onClose: () => void;
    onBillUpdated: (updatedBill: Bill) => void;
}

const EditSharedBillModal: React.FC<EditSharedBillModalProps> = ({ billToEdit, onClose, onBillUpdated }) => {
    const [title, setTitle] = useState(billToEdit.title);
    const [totalAmount, setTotalAmount] = useState(billToEdit.totalAmount);
    const [dueDate, setDueDate] = useState(billToEdit.dueDate);
    const [description, setDescription] = useState(billToEdit.description || '');
    const [splitType, setSplitType] = useState<'equally' | 'custom'>('equally');
    const [customAmounts, setCustomAmounts] = useState<Record<string, number>>({});

    useEffect(() => {
        const shares = billToEdit.shares;
        if (shares.length > 0) {
            const firstAmount = shares[0].amount;
            const allEqual = shares.every(s => Math.abs(s.amount - firstAmount) < 0.01);

            if (allEqual && shares.length > 1) {
                setSplitType('equally');
            } else {
                setSplitType('custom');
                const customAmts = shares.reduce((acc, share) => {
                    acc[share.userId] = share.amount;
                    return acc;
                }, {} as Record<string, number>);
                setCustomAmounts(customAmts);
            }
        }
    }, [billToEdit]);

    const handleCustomAmountChange = (memberId: string, value: string) => {
        const amount = parseFloat(value) || 0;
        setCustomAmounts(prev => ({ ...prev, [memberId]: amount }));
    };

    const newSplitAmountEqually = useMemo(() => {
        if (totalAmount <= 0 || billToEdit.shares.length === 0) return 0;
        return totalAmount / billToEdit.shares.length;
    }, [totalAmount, billToEdit.shares.length]);

    const customTotal = useMemo(() => {
        return billToEdit.shares.reduce((sum, share) => sum + (customAmounts[share.userId] || 0), 0);
    }, [customAmounts, billToEdit.shares]);

    const isCustomTotalValid = Math.abs(customTotal - totalAmount) < 0.01;

    const handleSave = () => {
        if (splitType === 'custom' && !isCustomTotalValid) {
            alert('Custom split amounts must add up to the total bill amount.');
            return;
        }

        const updatedShares: BillShare[] = billToEdit.shares.map(s => {
            const amount = splitType === 'equally'
                ? newSplitAmountEqually
                : customAmounts[s.userId] || 0;

            return {
                ...s,
                amount: parseFloat(amount.toFixed(2)),
            };
        });

        const updatedBill: Bill = {
            ...billToEdit,
            title,
            totalAmount,
            dueDate,
            description,
            shares: updatedShares,
        };
        onBillUpdated(updatedBill);
        onClose();
    };

    const renderMemberSplits = () => {
        if (billToEdit.shares.length === 0) {
            return <p className="text-sm text-slate-500 text-center">No members assigned to this bill.</p>;
        }

        if (splitType === 'equally') {
            return (
                <div className="space-y-2">
                    {billToEdit.shares.map(share => (
                        <div key={share.userId} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-700/50 rounded-md">
                            <div className="flex items-center gap-2">
                                <UserCircleIcon className="w-6 h-6 text-slate-400" />
                                <span>{share.userName}</span>
                            </div>
                            <span className="font-semibold font-numeric">৳{newSplitAmountEqually.toFixed(2)}</span>
                        </div>
                    ))}
                </div>
            );
        }

        return (
            <div className="space-y-2">
                {billToEdit.shares.map(share => (
                    <div key={share.userId} className="flex items-center justify-between gap-2">
                        <span className="text-sm">{share.userName}</span>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">৳</span>
                            <input
                                type="number"
                                step="0.01"
                                value={customAmounts[share.userId] || ''}
                                onChange={(e) => handleCustomAmountChange(share.userId, e.target.value)}
                                className="w-28 pl-7 pr-2 py-1 text-right bg-slate-100 dark:bg-slate-700 border-2 border-transparent rounded-md focus:outline-none focus:border-primary-500"
                            />
                        </div>
                    </div>
                ))}
                <div className={`mt-2 pt-2 border-t dark:border-slate-600 flex justify-between font-semibold ${isCustomTotalValid ? 'text-success-600' : 'text-danger-600'}`}>
                    <span>Total Custom:</span>
                    <span>৳{customTotal.toFixed(2)}</span>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg animate-scale-in" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold font-sans text-slate-900 dark:text-white">Edit {billToEdit.category} Bill</h2>
                    <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"><XIcon className="w-5 h-5" /></button>
                </div>

                <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="font-semibold text-slate-700 dark:text-slate-300">Title</label>
                            <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full mt-1 px-3 py-2 bg-slate-100 dark:bg-slate-700 border-2 border-transparent rounded-lg focus:outline-none focus:border-primary-500" required />
                        </div>
                        <div>
                            <label className="font-semibold text-slate-700 dark:text-slate-300">Due Date</label>
                            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full mt-1 px-3 py-2 bg-slate-100 dark:bg-slate-700 border-2 border-transparent rounded-lg focus:outline-none focus:border-primary-500" required />
                        </div>
                    </div>
                    <div>
                        <label className="font-semibold text-slate-700 dark:text-slate-300">Total Amount</label>
                        <input type="number" step="0.01" value={totalAmount} onChange={e => setTotalAmount(parseFloat(e.target.value) || 0)} className="w-full mt-1 px-3 py-2 bg-slate-100 dark:bg-slate-700 border-2 border-transparent rounded-lg focus:outline-none focus:border-primary-500" required />
                    </div>
                    <div>
                        <label className="font-semibold text-slate-700 dark:text-slate-300">Description (Optional)</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full mt-1 px-3 py-2 bg-slate-100 dark:bg-slate-700 border-2 border-transparent rounded-lg focus:outline-none focus:border-primary-500" />
                    </div>
                    <div className="border-t pt-4 dark:border-slate-600">
                        <h3 className="font-bold text-slate-800 dark:text-white">Split Method</h3>
                        <div className="mt-2 flex gap-2 p-1 bg-slate-100 dark:bg-slate-700 rounded-lg">
                            <button type="button" onClick={() => setSplitType('equally')} className={`flex-1 py-1.5 text-sm font-semibold rounded-md ${splitType === 'equally' ? 'bg-white dark:bg-slate-600 shadow' : ''}`}>Split Equally</button>
                            <button type="button" onClick={() => setSplitType('custom')} className={`flex-1 py-1.5 text-sm font-semibold rounded-md ${splitType === 'custom' ? 'bg-white dark:bg-slate-600 shadow' : ''}`}>Custom Amount</button>
                        </div>
                        <div className="mt-4">
                            {renderMemberSplits()}
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-slate-50 dark:bg-slate-700/50 rounded-b-xl flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500">Cancel</button>
                    <button type="button" onClick={handleSave} className="px-4 py-2 bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-600">Save Changes</button>
                </div>
            </div>
        </div>
    );
};

export default EditSharedBillModal;
