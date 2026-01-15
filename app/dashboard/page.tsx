"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { RoomStatus, Role } from '@/types';
import type { TodaysMenu, Bill } from '@/types';
import AppLayout from '@/components/AppLayout';
import { PlusIcon, MealIcon, UsersIcon, ChartBarIcon, PencilIcon, XIcon, CheckCircleIcon, BillsIcon, BellIcon } from '@/components/Icons';
import { useNotifications } from '@/contexts/NotificationContext';
import { api } from '@/services/api';
import AuthSkeleton from '@/components/AuthSkeleton';

const initialTodaysMenu: TodaysMenu = {
    breakfast: 'Not set',
    lunch: 'Not set',
    dinner: 'Not set',
};

// Earthy & Modern Stat Card
const StatCard: React.FC<{
    title: string;
    value: string;
    subtitle: string;
    icon?: React.ReactNode;
    colorTheme: 'rose' | 'amber' | 'emerald' | 'blue';
    isLoading?: boolean
}> = ({ title, value, subtitle, icon, colorTheme, isLoading }) => {

    const themeClasses = {
        rose: "bg-[#FDF2F2] dark:bg-[#2C1A1D] border-[#FCE7E7] dark:border-[#4A2B2F] text-rose-950 dark:text-rose-100", // Clay/Soft Rose
        amber: "bg-[#FFF8E7] dark:bg-[#2B2315] border-[#FAEBD7] dark:border-[#4B3C22] text-amber-950 dark:text-amber-100", // Sand/Beige
        emerald: "bg-[#EBF7EE] dark:bg-[#132A20] border-[#D6EFE0] dark:border-[#1F4533] text-emerald-950 dark:text-emerald-100", // Earthy Sage
        blue: "bg-[#F0F7FA] dark:bg-[#1A2530] border-[#E1F0F5] dark:border-[#2A3B4D] text-slate-950 dark:text-blue-100", // River/Mist
    };

    const iconBgClasses = {
        rose: "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400",
        amber: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
        emerald: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
        blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    };

    return (
        <div className={`relative overflow-hidden p-5 sm:p-6 rounded-3xl border transition-all duration-300 hover:shadow-lg hover:scale-[1.01] group ${themeClasses[colorTheme]}`}>
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${iconBgClasses[colorTheme]} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                    <div className="w-6 h-6 sm:w-7 sm:h-7">{icon}</div>
                </div>
                <div className="opacity-0 group-hover:opacity-10 transition-opacity duration-300 transform translate-x-4 -translate-y-4 scale-150 absolute top-4 right-4 text-current">
                    {icon}
                </div>
            </div>

            <div className="relative z-10">
                <p className="text-sm font-semibold opacity-70 mb-1 tracking-wide uppercase text-current">
                    {title}
                </p>
                {isLoading ? (
                    <div className="h-10 w-3/4 rounded-lg bg-current opacity-10 animate-pulse my-1"></div>
                ) : (
                    <h3 className={`font-black tracking-tight leading-none mb-1 text-current
                        ${value.length > 12 ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-4xl'}`}>
                        {value}
                    </h3>
                )}
                <p className="text-xs sm:text-sm font-medium opacity-80 truncate text-current">{subtitle}</p>
            </div>
        </div>
    );
};

const PriorityActionCard: React.FC<{ title: string; details: string; onView?: () => void }> = ({ title, details, onView }) => (
    <div className="flex items-center justify-between p-4 bg-muted/40 hover:bg-muted/80 border border-border/50 rounded-2xl transition-colors">
        <div>
            <p className="font-bold text-foreground">{title}</p>
            <p className="text-sm text-muted-foreground">{details}</p>
        </div>
        <button onClick={onView} className="px-4 py-2 text-sm font-semibold rounded-xl bg-background border border-border shadow-sm hover:shadow-md transition-all active:scale-95 text-foreground">View</button>
    </div>
);

const QuickActionButton: React.FC<{ icon: React.ReactNode; label: string, onClick: () => void; colorTheme: 'emerald' | 'amber' | 'rose' | 'blue' | 'purple' }> = ({ icon, label, onClick, colorTheme }) => {

    const themeClasses = {
        emerald: "hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300",
        amber: "hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-700 dark:text-amber-300",
        rose: "hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-700 dark:text-rose-300",
        blue: "hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-700 dark:text-blue-300",
        purple: "hover:bg-purple-50 dark:hover:bg-purple-900/20 text-purple-700 dark:text-purple-300",
    };

    return (
        <button onClick={onClick} className={`flex flex-col items-center justify-center p-4 rounded-2xl border border-border/40 bg-card shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 active:scale-95 group ${themeClasses[colorTheme]}`}>
            <div className="p-3 bg-muted/50 rounded-full mb-3 group-hover:scale-110 transition-transform duration-300">
                <div className="w-6 h-6">{icon}</div>
            </div>
            <span className="text-xs sm:text-sm font-bold tracking-wide text-muted-foreground group-hover:text-foreground transition-colors">{label}</span>
        </button>
    );
}

const MealCard: React.FC<{
    meal: 'breakfast' | 'lunch' | 'dinner';
    value: string;
    isEditing: boolean;
    editText: string;
    onEditClick: (meal: 'breakfast' | 'lunch' | 'dinner') => void;
    onSave: () => void;
    onCancel: () => void;
    setEditText: (text: string) => void;
}> = ({ meal, value, isEditing, editText, onEditClick, onSave, onCancel, setEditText }) => {

    const icon = meal === 'breakfast' ? '🍳' : meal === 'lunch' ? '🍚' : '🍛';
    const label = meal.charAt(0).toUpperCase() + meal.slice(1);

    // Earthy sub-themes for meals
    const themeClass = meal === 'breakfast'
        ? "bg-orange-50/60 dark:bg-[#2A1C15] border-orange-100 dark:border-orange-900/30"
        : meal === 'lunch'
            ? "bg-amber-50/60 dark:bg-[#282215] border-amber-100 dark:border-amber-900/30"
            : "bg-indigo-50/60 dark:bg-[#1A1C30] border-indigo-100 dark:border-indigo-900/30";

    return (
        <div className={`relative group rounded-2xl p-5 border transition-all hover:shadow-md ${themeClass}`}>
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-xl">{icon}</span>
                    <span className="text-sm font-bold opacity-70 uppercase tracking-widest">{label}</span>
                </div>
                {!isEditing && (
                    <button
                        onClick={() => onEditClick(meal)}
                        className="opacity-0 group-hover:opacity-100 transition-all p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-90"
                    >
                        <PencilIcon className="w-4 h-4 opacity-60" />
                    </button>
                )}
            </div>

            {isEditing ? (
                <div className="flex gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-background/80 border-2 border-primary/20 rounded-xl focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all text-foreground"
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') onSave();
                            if (e.key === 'Escape') onCancel();
                        }}
                    />
                    <button onClick={onSave} className="p-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm active:scale-95 transition-all"><CheckCircleIcon className="w-5 h-5" /></button>
                    <button onClick={onCancel} className="p-2 rounded-xl bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 active:scale-95 transition-all"><XIcon className="w-5 h-5" /></button>
                </div>
            ) : (
                <p className="text-lg sm:text-lg font-medium text-foreground/90 leading-relaxed min-h-[1.75rem]">
                    {value || 'Not set'}
                </p>
            )}
        </div>
    );
};

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
        if (initialData.pendingJoinRequestsCount > 0) {
            actions.push({
                title: `${initialData.pendingJoinRequestsCount} Join Request${initialData.pendingJoinRequestsCount > 1 ? 's' : ''}`,
                details: 'New member waiting for approval',
                page: '/members'
            });
        }

        if (initialData.priorityActions?.expenses?.length > 0) {
            const count = initialData.priorityActions.expenses.length;
            const total = initialData.priorityActions.expenses.reduce((sum: number, e: any) => sum + e.amount, 0);
            actions.push({
                title: `${count} Shopping Approval${count > 1 ? 's' : ''}`,
                details: `Total: ৳${total.toFixed(2)}`,
                page: '/shopping'
            });
        }

        if (initialData.priorityActions?.deposits?.length > 0) {
            const count = initialData.priorityActions.deposits.length;
            const total = initialData.priorityActions.deposits.reduce((sum: number, d: any) => sum + d.amount, 0);
            actions.push({
                title: `${count} Deposit Approval${count > 1 ? 's' : ''}`,
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

    const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight">Assalamu Alaikum, {user?.name?.split(' ')[0]} 👋</h1>
                    <p className="text-muted-foreground font-medium mt-1">{currentDate}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Bills"
                    value={`৳${stats.totalBillsAmount.toLocaleString()}`}
                    subtitle={`${stats.totalBillsCount} total bills`}
                    icon={<BillsIcon />}
                    colorTheme="amber"
                    isLoading={loading}
                />
                <StatCard
                    title="Approvals"
                    value={`${stats.pendingApprovals}`}
                    subtitle="Pending actions"
                    icon={<BellIcon />}
                    colorTheme="rose"
                    isLoading={loading}
                />
                <StatCard
                    title="Fund"
                    value={`+৳${stats.fundBalance.toLocaleString()}`}
                    subtitle="Current balance"
                    icon={<ChartBarIcon />}
                    colorTheme="emerald"
                    isLoading={loading}
                />
                <StatCard
                    title="Members"
                    value={`${stats.activeMembers}`}
                    subtitle="Active users"
                    icon={<UsersIcon />}
                    colorTheme="blue"
                    isLoading={loading}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Column */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Menu Section */}
                    <div className="bg-card/50 backdrop-blur-sm rounded-3xl p-1">
                        <div className="flex items-center gap-3 px-4 py-3 mb-2">
                            <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-xl text-teal-700 dark:text-teal-300">
                                <MealIcon className="w-5 h-5" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground">Today's Menu</h3>
                            <span className="text-xs font-semibold px-2 py-1 bg-muted rounded-lg text-muted-foreground">{todayName}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {(['breakfast', 'lunch', 'dinner'] as const).map(meal => (
                                <MealCard
                                    key={meal}
                                    meal={meal}
                                    value={menu[meal]}
                                    isEditing={editingMeal === meal}
                                    editText={editText}
                                    setEditText={setEditText}
                                    onEditClick={handleEditClick}
                                    onSave={handleSave}
                                    onCancel={handleCancel}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div>
                        <h3 className="text-lg font-bold text-foreground mb-4 px-2">Quick Actions</h3>
                        <div className="grid grid-cols-4 gap-3 md:gap-4">
                            <QuickActionButton
                                icon={<PlusIcon />}
                                label="Bill"
                                onClick={() => router.push('/bills')}
                                colorTheme="emerald"
                            />
                            <QuickActionButton
                                icon={<MealIcon />}
                                label="Meal"
                                onClick={() => router.push('/meals')}
                                colorTheme="amber"
                            />
                            <QuickActionButton
                                icon={<UsersIcon />}
                                label="User"
                                onClick={() => router.push('/members')}
                                colorTheme="blue"
                            />
                            <QuickActionButton
                                icon={<ChartBarIcon />}
                                label="Report"
                                onClick={() => router.push('/reports')}
                                colorTheme="purple"
                            />
                        </div>
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-6">
                    <div className="bg-card rounded-3xl p-6 shadow-sm border border-border/50">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-foreground">Priority Actions</h3>
                            {priorityActions.length > 0 && (
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
                                    {priorityActions.length}
                                </span>
                            )}
                        </div>
                        <div className="space-y-3">
                            {priorityActions.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="inline-block p-4 rounded-full bg-muted mb-3">
                                        <CheckCircleIcon className="w-8 h-8 text-muted-foreground/50" />
                                    </div>
                                    <p className="text-muted-foreground font-medium">All caught up! 🎉</p>
                                </div>
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
                </div>
            </div>
        </div>
    );
};

const MemberDashboard: React.FC<{ initialData?: any, loading?: boolean, user?: any }> = ({ initialData, loading, user }) => {
    const router = useRouter();
    const { notifications } = useNotifications();
    const [showAllActivity, setShowAllActivity] = useState(false);

    const [todayName, setTodayName] = useState('');

    useEffect(() => {
        const today = new Date();
        setTodayName(today.toLocaleDateString('en-US', { weekday: 'long' }));
    }, []);

    const menu = useMemo(() => ({
        breakfast: initialData?.todaysMenu?.breakfast || 'Not set',
        lunch: initialData?.todaysMenu?.lunch || 'Not set',
        dinner: initialData?.todaysMenu?.dinner || 'Not set'
    }), [initialData]);

    const billsDueAmount = useMemo(() => initialData?.billsDueAmount || 0, [initialData]);
    const billsDueCount = useMemo(() => initialData?.billsDueCount || 0, [initialData]);
    const totalMealCount = useMemo(() => initialData?.totalMealCount || 0, [initialData]);
    const refundAmount = useMemo(() => initialData?.refundAmount || 0, [initialData]);
    const nextBillDue: Bill | null = useMemo(() => initialData?.nextBillDue || null, [initialData]);

    const nextBillDueText = nextBillDue
        ? `${nextBillDue.title} - ${new Date(nextBillDue.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
        : "No upcoming bills";

    const daysLeft = nextBillDue
        ? Math.ceil((new Date(nextBillDue.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : 0;

    const daysLeftText = nextBillDue
        ? `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`
        : 'Relax, all clear!';

    const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight">Assalamu Alaikum, {user?.name?.split(' ')[0]} 👋</h1>
                    <p className="text-muted-foreground font-medium mt-1">{currentDate}</p>
                </div>
                <div className="hidden sm:block">
                    <button onClick={() => router.push('/notifications')} className="relative p-2 rounded-full hover:bg-muted transition-colors">
                        <BellIcon className="w-6 h-6 text-foreground" />
                        {notifications.filter(n => !n.read).length > 0 && (
                            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-background"></span>
                        )}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Bills Due"
                    value={`৳${billsDueAmount.toFixed(0)}`}
                    subtitle={`${billsDueCount} pending`}
                    icon={<BillsIcon />}
                    colorTheme="rose"
                    isLoading={loading}
                />
                <StatCard
                    title="Meals"
                    value={`${totalMealCount.toFixed(1)}`}
                    subtitle="This month"
                    icon={<MealIcon />}
                    colorTheme="amber"
                    isLoading={loading}
                />
                <StatCard
                    title="Refund"
                    value={`${refundAmount >= 0 ? '+' : ''}৳${refundAmount.toFixed(0)}`}
                    subtitle="Available"
                    icon={<ChartBarIcon />}
                    colorTheme="emerald"
                    isLoading={loading}
                />
                <StatCard
                    title="Next Bill"
                    value={nextBillDue ? daysLeftText : 'None'}
                    subtitle={nextBillDue ? nextBillDueText : 'No upcoming bills'}
                    icon={<BellIcon />}
                    colorTheme="blue"
                    isLoading={loading}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Menu Section */}
                    <div className="bg-card/50 backdrop-blur-sm rounded-3xl p-1">
                        <div className="flex items-center gap-3 px-4 py-3 mb-2">
                            <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-xl text-teal-700 dark:text-teal-300">
                                <MealIcon className="w-5 h-5" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground">Today's Menu</h3>
                            <span className="text-xs font-semibold px-2 py-1 bg-muted rounded-lg text-muted-foreground">{todayName}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <MealCard
                                meal="breakfast"
                                value={menu.breakfast}
                                isEditing={false}
                                editText=""
                                onEditClick={() => { }}
                                onSave={() => { }}
                                onCancel={() => { }}
                                setEditText={() => { }}
                            />
                            <MealCard
                                meal="lunch"
                                value={menu.lunch}
                                isEditing={false}
                                editText=""
                                onEditClick={() => { }}
                                onSave={() => { }}
                                onCancel={() => { }}
                                setEditText={() => { }}
                            />
                            <MealCard
                                meal="dinner"
                                value={menu.dinner}
                                isEditing={false}
                                editText=""
                                onEditClick={() => { }}
                                onSave={() => { }}
                                onCancel={() => { }}
                                setEditText={() => { }}
                            />
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div>
                        <h3 className="text-lg font-bold text-foreground mb-4 px-2">Quick Actions</h3>
                        <div className="grid grid-cols-4 gap-3 md:gap-4">
                            <QuickActionButton
                                icon={<MealIcon />}
                                label="Meal"
                                onClick={() => router.push('/meals')}
                                colorTheme="amber"
                            />
                            <QuickActionButton
                                icon={<BillsIcon />}
                                label="Pay"
                                onClick={() => router.push('/bills')}
                                colorTheme="rose"
                            />
                            <QuickActionButton
                                icon={<PlusIcon />}
                                label="Add"
                                onClick={() => router.push('/shopping')}
                                colorTheme="emerald"
                            />
                            <QuickActionButton
                                icon={<ChartBarIcon />}
                                label="Hist"
                                onClick={() => router.push('/history')}
                                colorTheme="blue"
                            />
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <div className="bg-card rounded-3xl p-6 shadow-sm border border-border/50">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-foreground">Recent Activity</h3>
                            {notifications.length > 5 && (
                                <button
                                    onClick={() => setShowAllActivity(!showAllActivity)}
                                    className="text-sm font-semibold text-primary hover:underline transition-all"
                                >
                                    {showAllActivity ? 'Show Less' : 'View All'}
                                </button>
                            )}
                        </div>
                        <div className="space-y-0 relative">
                            {/* Timeline Line */}
                            <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-border/50"></div>

                            {notifications.length === 0 ? (
                                <p className="text-muted-foreground py-4 text-center text-sm">No recent activity.</p>
                            ) : (
                                notifications.slice(0, showAllActivity ? undefined : 5).map((notification) => (
                                    <div key={notification.id} className="relative pl-8 py-3 group cursor-pointer hover:bg-muted/30 rounded-lg -ml-2 px-2 transition-colors animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <div className={`absolute left-0.5 top-4 w-4 h-4 rounded-full border-2 border-background ${notification.read ? 'bg-muted-foreground/30' : 'bg-primary'} z-10`}></div>
                                        <div>
                                            <p className={`text-sm ${notification.read ? 'text-foreground/80' : 'text-foreground font-semibold'}`}>{notification.title}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{notification.message}</p>
                                            <p className="text-[10px] text-muted-foreground/60 mt-1 uppercase tracking-wider">{notification.timestamp}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default function DashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);
    const [statsLoading, setStatsLoading] = useState(true);

    useEffect(() => {
        api.getDashboardStats()
            .then(data => {
                setStats(data);
                setStatsLoading(false);
            })
            .catch(err => {
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

    if (authLoading) {
        return <AuthSkeleton />;
    }

    if (!user) {
        return null;
    }

    return (
        <AppLayout>
            {user.role === Role.Manager ?
                <ManagerDashboard initialData={stats} loading={statsLoading} user={user} /> :
                <MemberDashboard initialData={stats} loading={statsLoading} user={user} />
            }
        </AppLayout>
    );
}
