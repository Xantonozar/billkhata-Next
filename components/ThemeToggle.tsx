"use client";

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { SunIcon, MoonIcon } from './Icons';

const ThemeToggle: React.FC = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-center p-2 rounded-md text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
            {theme === 'dark' ? (
                <>
                    <SunIcon className="w-5 h-5 mr-2 text-yellow-500" />
                    <span className="text-sm font-medium">Light Mode</span>
                </>
            ) : (
                <>
                    <MoonIcon className="w-5 h-5 mr-2 text-indigo-500" />
                    <span className="text-sm font-medium">Dark Mode</span>
                </>
            )}
        </button>
    );
};

export default ThemeToggle;
