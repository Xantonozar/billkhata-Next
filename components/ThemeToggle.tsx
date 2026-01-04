"use client";

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { SunIcon, MoonIcon, LeafIcon } from './Icons';


const ThemeToggle: React.FC = () => {
    const { theme, toggleTheme } = useTheme();

    const getNextThemeLabel = () => {
        if (theme === 'dark') return 'Light Mode';
        if (theme === 'light') return 'Earthy Green';
        return 'Dark Mode';
    };

    return (
        <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-center p-2 rounded-md text-foreground bg-muted hover:bg-muted/80 transition-colors"
            aria-label={`Switch to ${getNextThemeLabel()}`}
        >
            {theme === 'dark' && (
                <>
                    <SunIcon className="w-5 h-5 mr-2 text-yellow-500" />
                    <span className="text-sm font-medium">Light Mode</span>
                </>
            )}
            {theme === 'light' && (
                <>
                    <LeafIcon className="w-5 h-5 mr-2 text-lime-600" />
                    <span className="text-sm font-medium">Earthy Green</span>
                </>
            )}
            {theme === 'earthy-green' && (
                <>
                    <MoonIcon className="w-5 h-5 mr-2 text-indigo-500" />
                    <span className="text-sm font-medium">Dark Mode</span>
                </>
            )}
        </button>
    );
};

export default ThemeToggle;
