"use client";

import React, { createContext, useState, useEffect, useContext } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setThemeState] = useState<Theme>('dark');
    const [mounted, setMounted] = useState(false);

    // On mount, read saved theme from localStorage (ignore system preference)
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as Theme | null;
        if (savedTheme === 'light' || savedTheme === 'dark') {
            setThemeState(savedTheme);
        } else {
            // Default to dark if no preference saved
            setThemeState('dark');
        }
        setMounted(true);
    }, []);

    // Apply theme class to document whenever theme changes
    useEffect(() => {
        if (!mounted) return;

        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme, mounted]);

    const toggleTheme = () => {
        setThemeState(prev => prev === 'dark' ? 'light' : 'dark');
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
