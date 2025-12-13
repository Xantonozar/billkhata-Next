"use client";

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { SunIcon, MoonIcon } from './Icons';

const ThemeToggle: React.FC = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            disabled
            className="w-full flex items-center justify-center p-2 rounded-md text-slate-400 bg-slate-100 dark:bg-slate-800 cursor-not-allowed opacity-70"
            aria-label="Theme locked to dark mode"
        >
            <MoonIcon className="w-5 h-5 mr-2 text-slate-500" />
            <span className="text-sm font-medium">Dark Mode (Locked)</span>
        </button>
    );
};

export default ThemeToggle;
