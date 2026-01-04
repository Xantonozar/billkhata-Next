
"use client";

import React, { useId } from 'react';
import { motion } from 'framer-motion';

export interface TabItem {
    id: string;
    label: string;
    count?: number;
}

interface ApprovalsTabsProps {
    tabs: TabItem[];
    activeTab: string;
    onChange: (id: string) => void;
    id?: string;
}

export const ApprovalsTabs: React.FC<ApprovalsTabsProps> = ({ tabs, activeTab, onChange, id }) => {
    const generatedId = useId();
    const uniqueId = id || generatedId;
    const layoutId = `active-pill-${uniqueId}`;
    return (
        <div className="flex space-x-1 bg-muted/50 p-1.5 rounded-2xl border border-border/50 backdrop-blur-sm shadow-inner overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => onChange(tab.id)}
                        className={`
                            relative flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary
                            ${isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}
                        `}
                        style={{
                            WebkitTapHighlightColor: "transparent",
                        }}
                    >
                        {isActive && (
                            <motion.div
                                layoutId={layoutId}
                                className="absolute inset-0 bg-background shadow-sm border border-border/60 rounded-xl"
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                        )}
                        <span className="relative z-10 whitespace-nowrap">{tab.label}</span>
                        {tab.count !== undefined && tab.count > 0 && (
                            <span className={`relative z-10 px-1.5 py-0.5 text-[10px] font-bold rounded-full transition-colors ${isActive
                                    ? 'bg-primary/10 text-primary'
                                    : 'bg-muted-foreground/10 text-muted-foreground'
                                }`}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
};
