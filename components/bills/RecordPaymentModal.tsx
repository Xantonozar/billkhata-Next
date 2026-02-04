import React, { useState } from 'react';
import { api } from '@/services/api';
import { useNotifications } from '@/contexts/NotificationContext';
import { XIcon } from '@/components/Icons';

interface RecordPaymentModalProps {
    bill: {
        id: string;
        title: string;
        totalAmount: number;
    };
    share: {
        userId: string;
        amount: number;
        status: string;
        userName: string;
    };
    onClose: () => void;
    onSuccess: () => void;
    khataId: string;
}

const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({ bill, share, onClose, onSuccess, khataId }) => {
    const { addToast } = useNotifications();
    const [loading, setLoading] = useState(false);
    const [paidFromFund, setPaidFromFund] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.markBillPaid(khataId, bill.id, share.userId, paidFromFund);
            addToast({ type: 'success', title: 'Payment Recorded', message: `Marked ${share.userName}'s share as paid.` });
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Record payment error:', error);
            addToast({ type: 'error', title: 'Error', message: error.response?.data?.message || 'Failed to record payment' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
            <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-border flex justify-between items-center bg-muted/30">
                    <h3 className="text-xl font-bold text-foreground">Record Bill Payment</h3>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-muted rounded-full">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-4">
                        <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                            <p className="text-sm text-muted-foreground mb-1">Bill</p>
                            <p className="font-semibold text-lg text-foreground">{bill.title}</p>
                            <div className="mt-2 flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Total Bill: ৳{bill.totalAmount}</span>
                            </div>
                        </div>

                        <div className="flex justify-between items-center p-4 bg-muted/50 rounded-xl">
                            <div>
                                <p className="text-sm text-muted-foreground">Member</p>
                                <p className="font-semibold text-foreground">{share.userName}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-muted-foreground">Amount Due</p>
                                <p className="font-bold text-xl text-primary font-numeric">৳{share.amount}</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3 p-4 border border-input rounded-xl hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => setPaidFromFund(!paidFromFund)}>
                            <input
                                type="checkbox"
                                id="paidFromFund"
                                checked={paidFromFund}
                                onChange={(e) => setPaidFromFund(e.target.checked)}
                                className="w-5 h-5 rounded border-input text-primary focus:ring-primary/20"
                            />
                            <div className="flex-1">
                                <label htmlFor="paidFromFund" className="font-medium text-foreground cursor-pointer block">Paid from Meal Fund?</label>
                                <p className="text-xs text-muted-foreground mt-0.5">If checked, this amount will be deducted from their meal fund balance.</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 bg-muted text-muted-foreground font-semibold rounded-xl hover:bg-muted/80 transition-colors"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-[0.98] flex justify-center items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Processing...</span>
                                </>
                            ) : (
                                <span>Confirm Payment</span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RecordPaymentModal;
