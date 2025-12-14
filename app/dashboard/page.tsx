"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { RoomStatus, Role } from '@/types';
import type { TodaysMenu, Bill } from '@/types';
import AppLayout from '@/components/AppLayout';
import { PlusIcon, MealIcon, UsersIcon, ChartBarIcon, PencilIcon, XIcon, CheckCircleIcon, BillsIcon } from '@/components/Icons';
import { useNotifications } from '@/contexts/NotificationContext';
import { api } from '@/services/api';

const initialTodaysMenu: TodaysMenu = {
    breakfast: 'Not set',
    lunch: 'Not set',
    dinner: 'Not set',
};

const StatCard: React.FC<{ title: string; value: string; subtitle: string, isLoading?: boolean }> = ({ title, value, subtitle, isLoading }) => (
    <div className="bg-white dark:bg-slate-800 p-3 sm:p-5 rounded-xl shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
        <h3 className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 truncate">{title}</h3>
        {isLoading ? (
            <div className="mt-2 h-6 sm:h-8 w-3/4 rounded bg-slate-200 dark:bg-slate-700 animate-pulse"></div>
        ) : (
            <p className="text-xl sm:text-3xl font-bold text-slate-800 dark:text-white mt-1 truncate">{value}</p>
        )}
        <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 mt-1 truncate">{subtitle}</p>
    </div>
);

const PriorityActionCard: React.FC<{ title: string; details: string; onView?: () => void }> = ({ title, details, onView }) => (
    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
        <div>
            <p className="font-semibold text-slate-800 dark:text-white">{title}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{details}</p>
        </div>
        <button onClick={onView} className="text-sm font-semibold text-primary-600 hover:underline dark:text-primary-400">View →</button>
    </div>
);

const QuickActionButton: React.FC<{ icon: React.ReactNode; label: string, onClick: () => void }> = ({ icon, label, onClick }) => (
    <button onClick={onClick} className="flex flex-col items-center justify-center p-2 sm:p-4 bg-slate-100 dark:bg-slate-700/50 rounded-xl shadow-sm space-y-1 sm:space-y-2 transition-all hover:bg-slate-200 dark:hover:bg-slate-700 hover:scale-[1.02] active:scale-[0.98]">
        <div className="scale-75 sm:scale-100 transform origin-center">{icon}</div>
        <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 text-center leading-tight">{label}</span>
    </button>
);

// We lift the state up to Manager/Member dashboard or use a Context
// For simpler refactor, we accept props or fetch inside.
// To support parallel fetching, the fetching should ideally happen in the Parent
// or we make these components resilient to loading states.

const ManagerDashboard: React.FC<{ initialData?: any, loading?: boolean, user?: any }> = ({ initialData, loading, user }) => {
    const router = useRouter();
    const { addToast } = useNotifications();
    const [menu, setMenu] = useState(initialTodaysMenu);
    const [editingMeal, setEditingMeal] = useState<keyof TodaysMenu | null>(null);
    const [editText, setEditText] = useState('');

    const [todayName, setTodayName] = useState('');

    useEffect(() => {
        const today = new Date();
        setTodayName(today.toLocaleDateString('en-US', { weekday: 'long' }));
    }, []);

    useEffect(() => {
        if (initialData?.todaysMenu) {
            setMenu({
                breakfast: initialData.todaysMenu.breakfast || 'Not set',
                lunch: initialData.todaysMenu.lunch || 'Not set',
                dinner: initialData.todaysMenu.dinner || 'Not set'
            });
        }
    }, [initialData]);

    const stats = useMemo(() => ({
        totalBillsAmount: initialData?.totalBillsAmount || 0,
        pendingApprovals: initialData?.pendingApprovals || 0,
        fundBalance: initialData?.fundBalance || 0,
        activeMembers: initialData?.activeMembers || 0,
        totalBillsCount: initialData?.totalBillsCount || 0,
    }), [initialData]);

    const priorityActions = useMemo(() => {
        if (!initialData) return [];
        const actions = [];
        // Process priority actions from backend data
        if (initialData.pendingJoinRequestsCount > 0) {
            actions.push({
                title: `👤 ${initialData.pendingJoinRequestsCount} Join Request${initialData.pendingJoinRequestsCount > 1 ? 's' : ''}`,
                details: 'Click to review',
                page: '/members'
            });
        }

        if (initialData.priorityActions?.expenses?.length > 0) {
            const count = initialData.priorityActions.expenses.length;
            const total = initialData.priorityActions.expenses.reduce((sum: number, e: any) => sum + e.amount, 0);
            actions.push({
                title: `🛒 ${count} Shopping Approval${count > 1 ? 's' : ''}`,
                details: `Total: ৳${total.toFixed(2)}`,
                page: '/shopping'
            });
        }

        if (initialData.priorityActions?.deposits?.length > 0) {
            const count = initialData.priorityActions.deposits.length;
            const total = initialData.priorityActions.deposits.reduce((sum: number, d: any) => sum + d.amount, 0);
            actions.push({
                title: `💵 ${count} Deposit Approval${count > 1 ? 's' : ''}`,
                details: `Total: ৳${total.toFixed(2)}`,
                page: '/shopping'
            });
        }
        return actions;
    }, [initialData]);


    const handleEditClick = (meal: keyof TodaysMenu) => {
        setEditingMeal(meal);
        setEditText(menu[meal] === 'Not set' ? '' : menu[meal]);
    };

    const handleSave = async () => {
        if (editingMeal && user?.khataId) {
            const updatedMenu = { ...menu, [editingMeal]: editText };
            setMenu(updatedMenu);

            try {
                await api.updateMenuDay(user.khataId, todayName, {
                    [editingMeal]: editText
                });

                addToast({
                    type: 'success',
                    title: 'Menu Updated',
                    message: `${editingMeal.charAt(0).toUpperCase() + editingMeal.slice(1)} menu has been updated.`,
                });
            } catch (error) {
                addToast({ type: 'error', title: 'Error', message: 'Failed to save menu' });
            }

            setEditingMeal(null);
            setEditText('');
        }
    };

    const handleCancel = () => {
        setEditingMeal(null);
        setEditText('');
    };

    const renderMealRow = (meal: keyof TodaysMenu, label: string) => {
        if (editingMeal === meal) {
            return (
                <tr className="border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                    <td className="p-3 font-semibold text-slate-800 dark:text-slate-100">{label}</td>
                    <td className="p-3">
                        <input
                            type="text"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="w-full px-2 py-1 bg-white dark:bg-slate-600 border-2 border-primary-500 rounded-md focus:outline-none text-slate-900 dark:text-white"
                            autoFocus
                        />
                    </td>
                    <td className="p-3 text-right">
                        <div className="flex justify-end gap-2">
                            <button onClick={handleCancel} className="p-2 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600"><XIcon className="w-5 h-5" /></button>
                            <button onClick={handleSave} className="p-2 rounded-full text-green-500 hover:bg-green-100 dark:hover:bg-green-500/20"><CheckCircleIcon className="w-5 h-5" /></button>
                        </div>
                    </td>
                </tr>
            );
        }

        return (
            <tr className="border-b dark:border-slate-700">
                <td className="p-3 font-semibold text-slate-800 dark:text-slate-100">{label}</td>
                <td className="p-3 text-slate-600 dark:text-slate-300">{menu[meal]}</td>
                <td className="p-3 text-right">
                    <button onClick={() => handleEditClick(meal)} className="p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600">
                        <PencilIcon className="w-5 h-5 text-primary-500" />
                    </button>
                </td>
            </tr>
        );
    };

    const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Assalamu Alaikum, {user?.name} 👋</h1>
                <p className="text-slate-500 dark:text-slate-400 text-base">{currentDate}</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                <StatCard title="💰 Total Bills" value={`৳${stats.totalBillsAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} subtitle={`${stats.totalBillsCount} bills`} isLoading={loading} />
                <StatCard title="🔔 Approvals" value={`${stats.pendingApprovals} items`} subtitle="Pending action" isLoading={loading} />
                <StatCard title="💵 Fund" value={`+৳${stats.fundBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} subtitle="Current balance" isLoading={loading} />
                <StatCard title="👥 Members" value={`${stats.activeMembers}`} subtitle="Active users" isLoading={loading} />
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">🆕 Today's Menu ({todayName})</h3>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-max text-sm text-left">
                        <thead>
                            <tr className="border-b dark:border-slate-700">
                                <th className="p-3 w-32 text-slate-700 dark:text-slate-300">Meal</th>
                                <th className="p-3 text-slate-700 dark:text-slate-300">What Will Be Cooked</th>
                                <th className="p-3 text-right w-28 text-slate-700 dark:text-slate-300">Edit</th>
                            </tr>
                        </thead>
                        <tbody>
                            {renderMealRow('breakfast', 'Breakfast')}
                            {renderMealRow('lunch', 'Lunch')}
                            {renderMealRow('dinner', 'Dinner')}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">Priority Actions</h3>
                    <div className="space-y-4">
                        {priorityActions.length === 0 ? (
                            <p className="text-slate-500 dark:text-slate-400">No pending actions. Great job! 🎉</p>
                        ) : (
                            priorityActions.map((action, index) => (
                                <PriorityActionCard
                                    key={index}
                                    title={action.title}
                                    details={action.details}
                                    onView={() => router.push(action.page)}
                                />
                            ))
                        )}
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-md">
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white mb-3 sm:mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-4 gap-2 sm:gap-4">
                        <QuickActionButton icon={<PlusIcon className="w-8 h-8 text-primary-500" />} label="Bill" onClick={() => router.push('/bills')} />
                        <QuickActionButton icon={<MealIcon className="w-8 h-8 text-green-600" />} label="Meal" onClick={() => router.push('/meals')} />
                        <QuickActionButton icon={<UsersIcon className="w-8 h-8 text-yellow-600" />} label="User" onClick={() => router.push('/members')} />
                        <QuickActionButton icon={<ChartBarIcon className="w-8 h-8 text-indigo-500" />} label="Rpt" onClick={() => router.push('/reports')} />
                    </div>
                </div>
            </div>
        </div>
    );
};

const MemberDashboard: React.FC<{ initialData?: any, loading?: boolean, user?: any }> = ({ initialData, loading, user }) => {
    const router = useRouter();
    const { notifications } = useNotifications();

    // We rely on initialData being passed down from parent
    const [menu, setMenu] = useState(initialTodaysMenu);
    const [todayName, setTodayName] = useState('');

    useEffect(() => {
        const today = new Date();
        setTodayName(today.toLocaleDateString('en-US', { weekday: 'long' }));
    }, []);

    useEffect(() => {
        if (initialData?.todaysMenu) {
            setMenu({
                breakfast: initialData.todaysMenu.breakfast || 'Not set',
                lunch: initialData.todaysMenu.lunch || 'Not set',
                dinner: initialData.todaysMenu.dinner || 'Not set'
            });
        }
    }, [initialData]);

    const billsDueAmount = initialData?.billsDueAmount || 0;
    const billsDueCount = initialData?.billsDueCount || 0;
    const nextBillDue = initialData?.nextBillDue;
    const totalMealCount = initialData?.totalMealCount || 0;
    const refundAmount = initialData?.refundAmount || 0;

    const nextBillDueText = nextBillDue
        ? `${nextBillDue.title} - ${new Date(nextBillDue.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
        : "No upcoming bills";

    const daysLeft = nextBillDue
        ? Math.ceil((new Date(nextBillDue.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : 0;

    const daysLeftText = nextBillDue
        ? `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`
        : 'All clear!';

    const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Assalamu Alaikum, {user?.name} 👋</h1>
                <p className="text-slate-500 dark:text-slate-400 text-base">{currentDate}</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 sm:gap-6">
                <StatCard title="💰 Bills Due" value={`৳${billsDueAmount.toFixed(2)}`} subtitle={`${billsDueCount} pending`} isLoading={loading} />
                <StatCard title="🍽️ Meals" value={`${totalMealCount.toFixed(2)}`} subtitle="This month" isLoading={loading} />
                <StatCard
                    title="💵 Refund"
                    value={`${refundAmount >= 0 ? '+' : ''}৳${refundAmount.toFixed(2)}`}
                    subtitle="Available"
                    isLoading={loading}
                />
                <StatCard title="📅 Next Bill" value={nextBillDueText} subtitle={daysLeftText} isLoading={loading} />
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">🆕 Today's Menu ({todayName})</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <tbody>
                            <tr className="border-b dark:border-slate-700">
                                <td className="p-3 font-semibold text-slate-800 dark:text-slate-100 w-32">Breakfast</td>
                                <td className="p-3 text-slate-600 dark:text-slate-300">{menu.breakfast}</td>
                            </tr>
                            <tr className="border-b dark:border-slate-700">
                                <td className="p-3 font-semibold text-slate-800 dark:text-slate-100">Lunch</td>
                                <td className="p-3 text-slate-600 dark:text-slate-300">{menu.lunch}</td>
                            </tr>
                            <tr>
                                <td className="p-3 font-semibold text-slate-800 dark:text-slate-100">Dinner</td>
                                <td className="p-3 text-slate-600 dark:text-slate-300">{menu.dinner}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Quick Actions</h3>
                <div className="grid grid-cols-4 gap-2 sm:gap-4">
                    <QuickActionButton icon={<MealIcon className="w-8 h-8 text-primary-500" />} label="Meal" onClick={() => router.push('/meals')} />
                    <QuickActionButton icon={<BillsIcon className="w-8 h-8 text-green-600" />} label="Pay" onClick={() => router.push('/bills')} />
                    <QuickActionButton icon={<PlusIcon className="w-8 h-8 text-yellow-600" />} label="Add" onClick={() => router.push('/shopping')} />
                    <QuickActionButton icon={<ChartBarIcon className="w-8 h-8 text-indigo-500" />} label="Hist" onClick={() => router.push('/history')} />
                </div>
            </div>

            <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Recent Activity</h3>
                <div className="space-y-3">
                    {notifications.length === 0 ? (
                        <p className="text-slate-500 dark:text-slate-400">No recent activity.</p>
                    ) : (
                        notifications.slice(0, 8).map((notification) => (
                            <div key={notification.id} className="p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                                <div className="flex justify-between items-start gap-3">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-slate-800 dark:text-white">{notification.title}</p>
                                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{notification.message}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">{notification.timestamp}</p>
                                    </div>
                                    {!notification.read && (
                                        <span className="inline-block w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-1" />
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
                {notifications.length > 0 && (
                    <button onClick={() => router.push('/history')} className="mt-4 text-sm font-semibold text-primary-600 hover:underline dark:text-primary-400">View All →</button>
                )}
            </div>
        </div>
    );
};

export default function DashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);
    const [statsLoading, setStatsLoading] = useState(true);

    // Parallel Data Fetching Strategy:
    // 1. Fetch Stats IMMEDIATELY on mount (don't wait for useAuth to finish)
    // 2. AuthContext checks user validation in parallel
    useEffect(() => {
        // We optimistically try to fetch stats assuming token is present
        api.getDashboardStats()
            .then(data => {
                setStats(data);
                setStatsLoading(false);
            })
            .catch(err => {
                // If it fails (e.g. 401), we just ignore it here
                // Key takeaway: The authLoading check below handles the redirection
                setStatsLoading(false);
            });
    }, []);

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push('/login');
            } else if (user.roomStatus === RoomStatus.NoRoom) {
                if (user.role === Role.Manager) {
                    router.push('/create-room');
                } else {
                    router.push('/join-room');
                }
            } else if (user.roomStatus === RoomStatus.Pending) {
                router.push('/pending-approval');
            }
        }
    }, [user, authLoading, router]);

    // Show loading only if Auth is loading AND we haven't determined user status
    // If we have stats but user is still "loading" (auth check), we might theoretically show dashboard?
    // No, we need 'user' object for names and roles. 
    // BUT 'stats' loading happens in parallel.

    if (authLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-light-cyan-50 dark:bg-slate-900">
                <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary-500"></div>
            </div>
        );
    }

    return (
        <>
            <AppLayout>
                {user.role === Role.Manager ?
                    <ManagerDashboard initialData={stats} loading={statsLoading} user={user} /> :
                    <MemberDashboard initialData={stats} loading={statsLoading} user={user} />
                }
            </AppLayout>

        </>
    );
}
