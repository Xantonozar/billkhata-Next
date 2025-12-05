"use client";

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { SunIcon, MoonIcon } from './Icons';

const ThemeToggle: React.FC = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-center p-2 rounded-md text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-slate-800 transition-colors"
            aria-label="Toggle theme"
        >
            {theme === 'dark' ? (
                <>
                    <SunIcon className="w-5 h-5 mr-2 text-yellow-400" />
                    <span className="text-sm font-medium">Light Mode</span>
                </>
            ) : (
                <>
                    <MoonIcon className="w-5 h-5 mr-2 text-slate-700" />
                    <span className="text-sm font-medium">Dark Mode</span>
                </>
            )}
        </button>
    );
};

export default ThemeToggle;
