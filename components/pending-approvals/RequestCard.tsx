
"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircleIcon, XCircleIcon, UserCircleIcon, CalendarIcon } from '@/components/Icons';
import { formatCurrency } from '@/utils/currency';

export interface RequestCardProps {
    id: string;
    type: 'bill' | 'shopping' | 'deposit' | 'join-request';
    title: string;
    subtitle?: string; // e.g., "Electricity Bill" or "Shopping at Reliance"
    amount?: number;
    date?: string | null; // ISO date string or formatted date
    requester: {
        name: string;
        avatarUrl?: string | null;
        role?: string;
    };
    metadata?: {
        label: string;
        value: string | React.ReactNode;
        icon?: React.ReactNode;
        color?: string; // semantic color class e.g., "text-blue-500"
    }[];
    onApprove: (id: string) => void;
    onDeny: (id: string) => void;
    isProcessing?: boolean;
    icon?: React.ReactNode;
}

export const RequestCard: React.FC<RequestCardProps> = ({
    id,
    type,
    title,
    subtitle,
    amount,
    date,
    requester,
    metadata = [],
    onApprove,
    onDeny,
    isProcessing = false,
    icon
}) => {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="group relative bg-card hover:bg-card/80 border border-border/50 hover:border-primary/20 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300"
        >
            <div className="flex flex-col sm:flex-row gap-5">
                {/* Icon / Avatar Section */}
                <div className="flex sm:flex-col items-start justify-between sm:justify-start gap-4">
                    <div className={`p-3 rounded-xl bg-muted group-hover:bg-primary/10 transition-colors duration-300`}>
                        {icon || <UserCircleIcon className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />}
                    </div>
                </div>

                {/* Content Section */}
                <div className="flex-1 min-w-0 space-y-3">
                    <div className="flex justify-between items-start gap-4">
                        <div>
                            <h3 className="text-lg font-bold text-foreground leading-tight">{title}</h3>
                            {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
                        </div>
                        {amount !== undefined && (
                            <div className="text-right">
                                <div className="text-lg font-bold text-primary tracking-tight">
                                    {formatCurrency(amount)}
                                </div>
                                <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                    Amount
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <span className="flex-shrink-0">
                                {requester.avatarUrl ? (
                                    <img src={requester.avatarUrl} alt={requester.name} className="w-5 h-5 rounded-full object-cover ring-1 ring-border" />
                                ) : (
                                    <UserCircleIcon className="w-5 h-5" />
                                )}
                            </span>
                            <span className="font-medium text-foreground">{requester.name}</span>
                        </div>

                        <div className="flex items-center gap-2 text-muted-foreground">
                            <CalendarIcon className="w-4 h-4" />
                            {date && !isNaN(new Date(date).getTime()) ? (
                                <span>
                                    {new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                            ) : (
                                <span className="text-muted-foreground/50">—</span>
                            )}                        </div>

                        {metadata.map((meta, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-muted-foreground">
                                {meta.icon}
                                <span className="text-xs uppercase tracking-wider mr-1">{meta.label}:</span>
                                <span className={`font-medium ${meta.color || 'text-foreground'}`}>{meta.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Actions Footer */}
            <div className="mt-5 pt-4 border-t border-border/50 flex gap-3">
                <button
                    onClick={() => onDeny(id)}
                    disabled={isProcessing}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-destructive bg-destructive/5 hover:bg-destructive/10 border border-transparent hover:border-destructive/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <XCircleIcon className="w-5 h-5" />
                    Deny
                </button>
                <button
                    onClick={() => onApprove(id)}
                    disabled={isProcessing}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <CheckCircleIcon className="w-5 h-5" />
                    Approve
                </button>
            </div>
        </motion.div>
    );
};
