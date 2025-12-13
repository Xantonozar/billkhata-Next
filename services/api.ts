import axios from 'axios';
import type { User, Bill, PaymentStatus, MealHistory } from '../types';
import { Role } from '../types';

// Create axios instance
const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
    headers: {
        'Content-Type': 'application/json',
    }
});

// Add token to requests
axiosInstance.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Handle token expiration
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (typeof window !== 'undefined') {
            const isAuthEndpoint = error.config?.url?.includes('/auth/login') ||
                error.config?.url?.includes('/auth/signup');

            if (error.response?.status === 401 && !isAuthEndpoint) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

const api = {
    // Authentication
    login: async (email: string, pass: string): Promise<User | null> => {
        try {
            const response = await axiosInstance.post('/auth/login', { email, password: pass });
            const { token, user } = response.data;

            if (typeof window !== 'undefined') {
                localStorage.setItem('token', token);
            }

            return user;
        } catch (error: any) {
            const message = error.response?.data?.message ||
                (error.response?.data?.errors ? error.response.data.errors.map((e: any) => e.msg).join(', ') : 'Login failed');
            console.error('Login error:', message);
            throw new Error(message);
        }
    },

    logout: async (): Promise<void> => {
        try {
            await axiosInstance.post('/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        }
    },

    signup: async (name: string, email: string, pass: string, role: Role): Promise<User | null> => {
        try {
            const response = await axiosInstance.post('/auth/signup', {
                name,
                email,
                password: pass,
                role
            });
            const { token, user } = response.data;

            if (typeof window !== 'undefined') {
                localStorage.setItem('token', token);
            }

            return user;
        } catch (error: any) {
            const message = error.response?.data?.message ||
                (error.response?.data?.errors ? error.response.data.errors.map((e: any) => e.msg).join(', ') : 'Signup failed');
            console.error('Signup error:', message);
            throw new Error(message);
        }
    },

    getCurrentUser: async (): Promise<User | null> => {
        try {
            const response = await axiosInstance.get('/auth/me');
            return response.data;
        } catch (error) {
            return null;
        }
    },

    updateProfile: async (data: Partial<User>): Promise<User | null> => {
        try {
            const response = await axiosInstance.put('/auth/me', data);
            return response.data;
        } catch (error: any) {
            console.error('Update profile error:', error.response?.data?.message || error.message);
            throw new Error(error.response?.data?.message || 'Failed to update profile');
        }
    },

    // Dashboard
    getDashboardStats: async (): Promise<any> => {
        try {
            const response = await axiosInstance.get('/dashboard/stats');
            return response.data;
        } catch (error) {
            console.error('Get dashboard stats error:', error);
            throw error;
        }
    },

    // Room management
    createRoom: async (name: string, khataId: string): Promise<boolean> => {
        try {
            await axiosInstance.post('/rooms/create', { name, khataId });
            return true;
        } catch (error: any) {
            console.error('Create room error:', error.response?.data?.message || error.message);
            return false;
        }
    },

    joinRoom: async (khataId: string): Promise<boolean> => {
        try {
            await axiosInstance.post('/rooms/join', { khataId });
            return true;
        } catch (error: any) {
            console.error('Join room error:', error.response?.data?.message || error.message);
            return false;
        }
    },

    getMembersForRoom: async (roomId: string): Promise<User[]> => {
        try {
            const response = await axiosInstance.get(`/rooms/${roomId}/members`);
            return response.data;
        } catch (error) {
            console.error('Get members error:', error);
            return [];
        }
    },

    getPendingApprovals: async (roomId: string): Promise<any[]> => {
        try {
            const response = await axiosInstance.get(`/rooms/${roomId}/pending`);
            return response.data;
        } catch (error) {
            console.error('Get pending approvals error:', error);
            return [];
        }
    },

    approveMember: async (roomId: string, userId: string): Promise<boolean> => {
        try {
            await axiosInstance.put(`/rooms/${roomId}/approve/${userId}`);
            return true;
        } catch (error) {
            console.error('Approve member error:', error);
            return false;
        }
    },

    getRoomDetails: async (roomId: string): Promise<any> => {
        try {
            const response = await axiosInstance.get(`/rooms/${roomId}/details`);
            return response.data;
        } catch (error) {
            console.error('Get room details error:', error);
            return null;
        }
    },

    leaveRoom: async (roomId: string): Promise<boolean> => {
        try {
            await axiosInstance.delete(`/rooms/${roomId}/leave`);
            return true;
        } catch (error: any) {
            console.error('Leave room error:', error.response?.data?.message || error.message);
            throw new Error(error.response?.data?.message || 'Failed to leave room');
        }
    },

    deleteRoom: async (roomId: string): Promise<boolean> => {
        try {
            await axiosInstance.delete(`/rooms/${roomId}/delete`);
            return true;
        } catch (error: any) {
            console.error('Delete room error:', error.response?.data?.message || error.message);
            throw new Error(error.response?.data?.message || 'Failed to delete room');
        }
    },



    // Bills
    getBillsForRoom: async (roomId: string): Promise<Bill[]> => {
        try {
            const response = await axiosInstance.get(`/bills/room/${roomId}`);
            return response.data;
        } catch (error) {
            console.error('Get bills error:', error);
            return [];
        }
    },

    createBill: async (billData: any): Promise<boolean> => {
        try {
            await axiosInstance.post('/bills', billData);
            return true;
        } catch (error: any) {
            console.error('Create bill error:', error.response?.data?.message || error.message);
            return false;
        }
    },

    updateBillShareStatus: async (billId: string, userId: string, newStatus: PaymentStatus): Promise<Bill | null> => {
        try {
            const response = await axiosInstance.put(`/bills/${billId}/share/${userId}`, {
                status: newStatus
            });

            // Return the updated bill directly from the response
            return response.data.bill || null;
        } catch (error) {
            console.error('Update bill share status error:', error);
            return null;
        }
    },

    deleteBill: async (billId: string): Promise<boolean> => {
        try {
            await axiosInstance.delete(`/bills/${billId}`);
            return true;
        } catch (error: any) {
            console.error('Delete bill error:', error.response?.data?.message || error.message);
            throw new Error(error.response?.data?.message || 'Failed to delete bill');
        }
    },

    updateBill: async (billId: string, billData: Partial<Bill>): Promise<Bill> => {
        try {
            const response = await axiosInstance.put(`/bills/${billId}`, billData);
            return response.data.bill;
        } catch (error: any) {
            console.error('Update bill error:', error.response?.data?.message || error.message);
            throw new Error(error.response?.data?.message || 'Failed to update bill');
        }
    },

    sendBillReminder: async (billId: string): Promise<number> => {
        try {
            const response = await axiosInstance.post(`/bills/${billId}/remind`);
            return response.data.count;
        } catch (error: any) {
            console.error('Send bill reminder error:', error.response?.data?.message || error.message);
            throw new Error(error.response?.data?.message || 'Failed to send reminders');
        }
    },

    getBillStats: async (roomId: string): Promise<any> => {
        try {
            const response = await axiosInstance.get(`/bills/room/${roomId}/stats`);
            return response.data;
        } catch (error) {
            console.error('Get bill stats error:', error);
            return {
                totalUnpaid: 0,
                totalPaid: 0,
                totalOverdue: 0,
                pendingApprovals: 0
            };
        }
    },

    getPendingApprovalsCount: async (roomId: string): Promise<number> => {
        try {
            const response = await axiosInstance.get(`/rooms/${roomId}/pending`);
            return response.data.length || 0;
        } catch (error) {
            return 0;
        }
    },

    getPendingCounts: async (roomId: string): Promise<number> => {
        try {
            const response = await axiosInstance.get(`/rooms/${roomId}/pending-counts`);
            return response.data.total || 0;
        } catch (error) {
            return 0;
        }
    },

    getFundStatus: async (_roomId: string): Promise<{ balance: number }> => {
        // Mock data for now - can be implemented later
        return { balance: 3540 };
    },

    // Menu
    getMenu: async (khataId: string): Promise<any[]> => {
        try {
            const response = await axiosInstance.get(`/menu/${khataId}`);
            return response.data;
        } catch (error) {
            console.error('Get menu error:', error);
            return [];
        }
    },

    saveMenu: async (khataId: string, items: any[], isPermanent: boolean = false): Promise<boolean> => {
        try {
            await axiosInstance.post(`/menu/${khataId}`, { items, isPermanent });
            return true;
        } catch (error: any) {
            console.error('Save menu error:', error.response?.data?.message || error.message);
            return false;
        }
    },

    updateMenuDay: async (khataId: string, day: string, mealData: { breakfast?: string; lunch?: string; dinner?: string }): Promise<boolean> => {
        try {
            await axiosInstance.put(`/menu/${khataId}/day/${day}`, mealData);
            return true;
        } catch (error: any) {
            console.error('Update menu day error:', error.response?.data?.message || error.message);
            return false;
        }
    },

    // Shopping
    getShoppingMembers: async (khataId: string): Promise<{ id: string; name: string }[]> => {
        try {
            const response = await axiosInstance.get(`/shopping/${khataId}/members`);
            return response.data;
        } catch (error) {
            console.error('Get shopping members error:', error);
            return [];
        }
    },

    getShoppingRoster: async (khataId: string): Promise<any[]> => {
        try {
            const response = await axiosInstance.get(`/shopping/${khataId}/roster`);
            return response.data.items || [];
        } catch (error) {
            console.error('Get shopping roster error:', error);
            return [];
        }
    },

    saveShoppingRoster: async (khataId: string, items: any[]): Promise<boolean> => {
        try {
            await axiosInstance.post(`/shopping/${khataId}/roster`, { items });
            return true;
        } catch (error: any) {
            console.error('Save shopping roster error:', error.response?.data?.message || error.message);
            return false;
        }
    },

    getShoppingSummary: async (khataId: string): Promise<any> => {
        try {
            const response = await axiosInstance.get(`/shopping/${khataId}/summary`);
            return response.data;
        } catch (error) {
            console.error('Get shopping summary error:', error);
            return null;
        }
    },

    // Meals
    getMeals: async (khataId: string, startDate?: string, endDate?: string): Promise<any[]> => {
        try {
            const params: any = {};
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;
            const response = await axiosInstance.get(`/meals/${khataId}`, { params });
            return response.data;
        } catch (error) {
            console.error('Get meals error:', error);
            return [];
        }
    },

    getUserMeals: async (khataId: string, userId: string): Promise<any[]> => {
        try {
            const response = await axiosInstance.get(`/meals/${khataId}/user/${userId}`);
            return response.data;
        } catch (error) {
            console.error('Get user meals error:', error);
            return [];
        }
    },

    submitMeal: async (khataId: string, mealData: {
        date: string;
        breakfast?: number;
        lunch?: number;
        dinner?: number;
        userId?: string;
        userName?: string;
    }): Promise<any> => {
        try {
            const response = await axiosInstance.post(`/meals/${khataId}`, mealData);
            return response.data;
        } catch (error: any) {
            console.error('Submit meal error:', error.response?.data?.message || error.message);
            throw error;
        }
    },

    getMealSummary: async (khataId: string): Promise<any> => {
        try {
            const response = await axiosInstance.get(`/meals/${khataId}/summary`);
            return response.data;
        } catch (error) {
            console.error('Get meal summary error:', error);
            return null;
        }
    },

    finalizeMeals: async (khataId: string, date: string): Promise<boolean> => {
        try {
            await axiosInstance.post(`/meals/${khataId}/finalize`, { date });
            return true;
        } catch (error: any) {
            console.error('Finalize meals error:', error.response?.data?.message || error.message);
            return false;
        }
    },

    getFinalizationStatus: async (khataId: string, date: string): Promise<{ isFinalized: boolean; finalization?: any }> => {
        try {
            const response = await axiosInstance.get(`/meals/${khataId}/finalization/${date}`);
            return response.data;
        } catch (error) {
            console.error('Get finalization status error:', error);
            return { isFinalized: false };
        }
    },

    // Deposits
    getDeposits: async (khataId: string, params: { status?: string, page?: number, limit?: number } = {}): Promise<any[]> => {
        try {
            const response = await axiosInstance.get(`/deposits/${khataId}`, { params });
            return response.data;
        } catch (error) {
            console.error('Get deposits error:', error);
            return [];
        }
    },

    createDeposit: async (khataId: string, depositData: {
        amount: number;
        paymentMethod: string;
        transactionId?: string;
        screenshotUrl?: string;
    }): Promise<any> => {
        try {
            const response = await axiosInstance.post(`/deposits/${khataId}`, depositData);
            return response.data;
        } catch (error: any) {
            console.error('Create deposit error:', error.response?.data?.message || error.message);
            throw error;
        }
    },

    approveDeposit: async (khataId: string, depositId: string): Promise<boolean> => {
        try {
            await axiosInstance.put(`/deposits/${khataId}/${depositId}/approve`);
            return true;
        } catch (error) {
            console.error('Approve deposit error:', error);
            return false;
        }
    },

    rejectDeposit: async (khataId: string, depositId: string, reason?: string): Promise<boolean> => {
        try {
            await axiosInstance.put(`/deposits/${khataId}/${depositId}/reject`, { reason });
            return true;
        } catch (error) {
            console.error('Reject deposit error:', error);
            return false;
        }
    },

    // Expenses
    getExpenses: async (khataId: string, params: { status?: string, page?: number, limit?: number } = {}): Promise<any[]> => {
        try {
            const response = await axiosInstance.get(`/expenses/${khataId}`, { params });
            return response.data;
        } catch (error) {
            console.error('Get expenses error:', error);
            return [];
        }
    },

    createExpense: async (khataId: string, expenseData: {
        amount: number;
        items: string;
        notes?: string;
        receiptUrl?: string;
    }): Promise<any> => {
        try {
            const response = await axiosInstance.post(`/expenses/${khataId}`, expenseData);
            return response.data;
        } catch (error: any) {
            console.error('Create expense error:', error.response?.data?.message || error.message);
            throw error;
        }
    },

    approveExpense: async (khataId: string, expenseId: string): Promise<boolean> => {
        try {
            await axiosInstance.put(`/expenses/${khataId}/${expenseId}/approve`);
            return true;
        } catch (error) {
            console.error('Approve expense error:', error);
            return false;
        }
    },

    rejectExpense: async (khataId: string, expenseId: string, reason?: string): Promise<boolean> => {
        try {
            await axiosInstance.put(`/expenses/${khataId}/${expenseId}/reject`, { reason });
            return true;
        } catch (error) {
            console.error('Reject expense error:', error);
            return false;
        }
    },

    // Notifications
    getNotifications: async (unreadOnly = false): Promise<any[]> => {
        try {
            const response = await axiosInstance.get(`/notifications?unreadOnly=${unreadOnly}`);
            return response.data;
        } catch (error) {
            console.error('Get notifications error:', error);
            return [];
        }
    },

    getUnreadCount: async (): Promise<number> => {
        try {
            const response = await axiosInstance.get('/notifications/unread-count');
            return response.data.count;
        } catch (error) {
            return 0;
        }
    },

    markNotificationRead: async (id: string | number): Promise<any> => {
        try {
            const response = await axiosInstance.post(`/notifications/${id}/read`);
            return response.data;
        } catch (error) {
            console.error('Mark read error:', error);
            return null;
        }
    },

    markAllNotificationsRead: async (): Promise<boolean> => {
        try {
            await axiosInstance.post('/notifications/mark-all-read');
            return true;
        } catch (error) {
            console.error('Mark all read error:', error);
            return false;
        }
    },

    deleteNotification: async (id: string | number): Promise<boolean> => {
        try {
            await axiosInstance.delete(`/notifications/${id}`);
            return true;
        } catch (error) {
            console.error('Delete notification error:', error);
            return false;
        }
    },

    // Analytics
    getAnalytics: async (khataId: string, range: string): Promise<any> => {
        try {
            const response = await axiosInstance.get(`/analytics/${khataId}?range=${range}`);
            return response.data;
        } catch (error) {
            console.error('Get analytics error:', error);
            return null;
        }
    },

    // Staff
    getStaff: async (khataId: string): Promise<any[]> => {
        try {
            const response = await axiosInstance.get(`/staff/${khataId}`);
            return response.data;
        } catch (error) {
            console.error('Get staff error:', error);
            return [];
        }
    },

    addStaff: async (khataId: string, staffData: { name: string; designation: string; phone: string }): Promise<any> => {
        try {
            const response = await axiosInstance.post(`/staff/${khataId}`, staffData);
            return response.data;
        } catch (error: any) {
            console.error('Add staff error:', error.response?.data?.message || error.message);
            throw error;
        }
    },

    updateStaff: async (khataId: string, staffId: string, staffData: any): Promise<any> => {
        try {
            const response = await axiosInstance.put(`/staff/${khataId}/${staffId}`, staffData);
            return response.data;
        } catch (error) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const err = error as any;
            console.error('Update staff error:', err.response?.data?.message || err.message);
            throw error;
        }
    },

    deleteStaff: async (khataId: string, staffId: string): Promise<boolean> => {
        try {
            await axiosInstance.delete(`/staff/${khataId}/${staffId}`);
            return true;
        } catch (error) {
            console.error('Delete staff error:', error);
            return false;
        }
    },

    // Meal History
    getMealHistory: async (khataId: string, userId?: string, startDate?: string, endDate?: string): Promise<MealHistory[]> => {
        try {
            const params: Record<string, string> = {};
            if (userId) params.userId = userId;
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;

            const response = await axiosInstance.get(`/meals/${khataId}/history`, { params });
            return response.data;
        } catch (error) {
            console.error('Get meal history error:', error);
            return [];
        }
    },



    // Upload
    uploadImage: async (file: File): Promise<string | null> => {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await axiosInstance.post('/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            return response.data.url;
        } catch (error) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const err = error as any;
            console.error('Upload image error:', err.response?.data?.message || err.message);
            return null;
        }
    }
};

export { api };
