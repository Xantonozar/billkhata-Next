"use client";

import React, { createContext, useState, useEffect, useContext } from 'react';

type Theme = 'light' | 'dark' | 'earthy-green';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Initialize state with 'dark' to match the default preference, then sync in effect
    const [theme, setThemeState] = useState<Theme>('dark');
    const [mounted, setMounted] = useState(false);

    // On mount, read saved theme from localStorage
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as Theme | null;
        if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'earthy-green') {
            setThemeState(savedTheme);
        } else {
            // Default to dark if no preference saved, or whatever you choose
            setThemeState('dark');        }
        setMounted(true);
    }, []);

    // Apply theme class to document whenever theme changes
    useEffect(() => {
        if (!mounted) return;

        const root = window.document.documentElement;
        // Clean up all theme classes first
        root.classList.remove('dark', 'earthy-green');

        if (theme === 'dark') {
            root.classList.add('dark');
        } else if (theme === 'earthy-green') {
            root.classList.add('earthy-green');
        }
        // 'light' has no class, uses default variables (which are purple/light)

        localStorage.setItem('theme', theme);
    }, [theme, mounted]);

    const toggleTheme = () => {
        setThemeState(prev => {
            if (prev === 'dark') return 'light';
            if (prev === 'light') return 'earthy-green';
            return 'dark'; // Cycle: dark -> light -> earthy-green -> dark
        });
    };

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
