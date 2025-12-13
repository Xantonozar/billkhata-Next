"use client";

import React, { createContext, useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@/types';
import { Role } from '@/types';
import { api } from '@/services/api';

interface AuthContextType {
    user: User | null;
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
    loading: boolean;
    login: (email: string, pass: string) => Promise<User | null>;
    signup: (name: string, email: string, pass: string, role: Role) => Promise<User | null>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const initAuth = async () => {
            // Always try to fetch current user (relying on Cookie first, then localStorage)
            try {
                const currentUser = await api.getCurrentUser();
                if (currentUser) {
                    setUser(currentUser);
                    // If we have a user but no token in localStorage (e.g. cleared by OS),
                    // we might want to let the interceptor handle it, or just rely on cookies.
                    // For now, having the user object is enough to be "Logged In".
                } else {
                    // Only clear if explicitly failed
                    const storedToken = localStorage.getItem('token');
                    if (storedToken) {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                    }
                }
            } catch (error) {
                // If 401, clear everything
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
            setLoading(false);
        };
        initAuth();
    }, []);

    const login = async (email: string, pass: string) => {
        const loggedInUser = await api.login(email, pass);
        if (loggedInUser) {
            setUser(loggedInUser);
            router.push('/dashboard');
        }
        return loggedInUser;
    };

    const signup = async (name: string, email: string, pass: string, role: Role) => {
        const newUser = await api.signup(name, email, pass, role);
        if (newUser) {
            setUser(newUser);
            router.push('/dashboard');
        }
        return newUser;
    };

    const logout = async () => {
        try {
            await api.logout();
        } catch (error) {
            console.error('Error logging out from server:', error);
        } finally {
            setUser(null);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            router.push('/login');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
                <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary-500"></div>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ user, setUser, loading, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
