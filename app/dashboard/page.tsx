"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { RoomStatus, Role } from '@/types';
import type { TodaysMenu, Bill } from '@/types';
import AppLayout from '@/components/AppLayout';
import ToastContainer from '@/components/ToastContainer';
import { PlusIcon, MealIcon, UsersIcon, ChartBarIcon, PencilIcon, XIcon, CheckCircleIcon, BillsIcon } from '@/components/Icons';
import { useNotifications } from '@/contexts/NotificationContext';
import { api } from '@/services/api';

const initialTodaysMenu: TodaysMenu = {
    breakfast: 'Not set',
    lunch: 'Not set',
    dinner: 'Not set',
};

const StatCard: React.FC<{ title: string; value: string; subtitle: string, isLoading?: boolean }> = ({ title, value, subtitle, isLoading }) => (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400">{title}</h3>
        {isLoading ? (
            <div className="mt-2 h-8 w-3/4 rounded bg-slate-200 dark:bg-slate-700 animate-pulse"></div>
        ) : (
            <p className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{value}</p>
        )}
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{subtitle}</p>
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
    <button onClick={onClick} className="flex flex-col items-center justify-center p-4 bg-slate-100 dark:bg-slate-700/50 rounded-xl shadow-sm space-y-2 transition-all hover:bg-slate-200 dark:hover:bg-slate-700 hover:scale-[1.02] active:scale-[0.98]">
        {icon}
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>
    </button>
);

const ManagerDashboard: React.FC = () => {
    const router = useRouter();
    const { user } = useAuth();
    const { addToast, notifications } = useNotifications();
    const [menu, setMenu] = useState(initialTodaysMenu);
    const [editingMeal, setEditingMeal] = useState<keyof TodaysMenu | null>(null);
    const [editText, setEditText] = useState('');

    const [stats, setStats] = useState({
        totalBillsAmount: 0,
        pendingApprovals: 0,
        fundBalance: 0,
        activeMembers: 0,
        totalBillsCount: 0,
    });
    const [priorityActions, setPriorityActions] = useState<any[]>([]);
    const [loadingStats, setLoadingStats] = useState(true);
    const [todayName, setTodayName] = useState('');

    useEffect(() => {
        const today = new Date();
        setTodayName(today.toLocaleDateString('en-US', { weekday: 'long' }));

        if (user?.khataId) {
            setLoadingStats(true);
            Promise.all([
                api.getBillsForRoom(user.khataId),
                api.getPendingApprovals(user.khataId),
                api.getFundStatus(user.khataId),
                api.getMembersForRoom(user.khataId),
                api.getExpenses(user.khataId),
                api.getDeposits(user.khataId),
                api.getMenu(user.khataId)
            ]).then(([bills, joinRequests, fundStatus, members, expenses, deposits, menuItems]) => {
                const now = new Date();
                const currentMonth = now.getMonth();
                const currentYear = now.getFullYear();

                const currentMonthBills = bills.filter(bill => {
                    const dueDate = new Date(bill.dueDate);
                    return dueDate.getMonth() === currentMonth && dueDate.getFullYear() === currentYear;
                });

                const totalAmount = currentMonthBills.reduce((sum, bill) => sum + bill.totalAmount, 0);

                const pendingExpenses = expenses.filter(e => e.status === 'Pending');
                const pendingDeposits = deposits.filter(d => d.status === 'Pending');

                const totalPendingCount = joinRequests.length + pendingExpenses.length + pendingDeposits.length;

                setStats({
                    totalBillsAmount: totalAmount,
                    pendingApprovals: totalPendingCount,
                    fundBalance: fundStatus.balance,
                    activeMembers: members.length,
                    totalBillsCount: currentMonthBills.length
                });

                const actions = [];
                if (joinRequests.length > 0) {
                    actions.push({
                        title: `👤 ${joinRequests.length} Join Request${joinRequests.length > 1 ? 's' : ''}`,
                        details: joinRequests.map((r: any) => r.name).join(', '),
                        page: '/members'
                    });
                }
                if (pendingExpenses.length > 0) {
                    actions.push({
                        title: `🛒 ${pendingExpenses.length} Shopping Approval${pendingExpenses.length > 1 ? 's' : ''}`,
                        details: `Total: ৳${pendingExpenses.reduce((sum: number, e: any) => sum + e.amount, 0)}`,
                        page: '/shopping'
                    });
                }
                if (pendingDeposits.length > 0) {
                    actions.push({
                        title: `💵 ${pendingDeposits.length} Deposit Approval${pendingDeposits.length > 1 ? 's' : ''}`,
                        details: `Total: ৳${pendingDeposits.reduce((sum: number, d: any) => sum + d.amount, 0)}`,
                        page: '/shopping'
                    });
                }
                setPriorityActions(actions);

                const todayStr = today.toLocaleDateString('en-US', { weekday: 'long' });
                const todayMenu = menuItems.find((item: any) => item.day === todayStr);
                if (todayMenu) {
                    setMenu({
                        breakfast: todayMenu.breakfast || 'Not set',
                        lunch: todayMenu.lunch || 'Not set',
                        dinner: todayMenu.dinner || 'Not set'
                    });
                }

                setLoadingStats(false);
            }).catch(err => {
                console.error("Error loading dashboard data", err);
                setLoadingStats(false);
            });
        }
    }, [user]);

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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="💰 Total Bills" value={`৳${stats.totalBillsAmount.toLocaleString()}`} subtitle={`${stats.totalBillsCount} bills this month`} isLoading={loadingStats} />
                <StatCard title="🔔 Pending Approvals" value={`${stats.pendingApprovals} items`} subtitle="Need your action" isLoading={loadingStats} />
                <StatCard title="💵 Meal Fund Balance" value={`+৳${stats.fundBalance.toLocaleString()}`} subtitle="Healthy balance" isLoading={loadingStats} />
                <StatCard title="👥 Active Members" value={`${stats.activeMembers} members`} subtitle="in your room" isLoading={loadingStats} />
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

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <QuickActionButton icon={<PlusIcon className="w-8 h-8 text-primary-500" />} label="Add Bill" onClick={() => router.push('/bills')} />
                        <QuickActionButton icon={<MealIcon className="w-8 h-8 text-green-600" />} label="Finalize Meals" onClick={() => router.push('/meals')} />
                        <QuickActionButton icon={<UsersIcon className="w-8 h-8 text-yellow-600" />} label="Members" onClick={() => router.push('/members')} />
                        <QuickActionButton icon={<ChartBarIcon className="w-8 h-8 text-indigo-500" />} label="Reports" onClick={() => router.push('/reports')} />
                    </div>
                </div>
            </div>
        </div>
    );
};

const MemberDashboard: React.FC = () => {
    const router = useRouter();
    const { user } = useAuth();
    const { notifications } = useNotifications();
    const [menu, setMenu] = useState(initialTodaysMenu);
    const [bills, setBills] = useState<Bill[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalMealCount, setTotalMealCount] = useState(0);
    const [refundAmount, setRefundAmount] = useState(0);
    const [todayName, setTodayName] = useState('');

    useEffect(() => {
        const today = new Date();
        setTodayName(today.toLocaleDateString('en-US', { weekday: 'long' }));

        if (user?.khataId) {
            setLoading(true);

            Promise.all([
                api.getBillsForRoom(user.khataId),
                api.getMealSummary(user.khataId),
                api.getDeposits(user.khataId),
                api.getExpenses(user.khataId),
                api.getMenu(user.khataId),
                api.getMeals(user.khataId)
            ]).then(([billsData, mealSummary, deposits, expenses, menuItems, allMeals]) => {
                setBills(billsData);

                if (mealSummary && user.id) {
                    setTotalMealCount(mealSummary.currentUserMeals || 0);
                }

                const approvedDeposits = deposits.filter((d: any) => d.userId === user.id && d.status === 'Approved');
                const totalDeposits = approvedDeposits.reduce((sum: number, d: any) => sum + d.amount, 0);

                const approvedExpenses = expenses.filter((e: any) => e.status === 'Approved');
                const totalShopping = approvedExpenses.reduce((sum: number, e: any) => sum + e.amount, 0);

                const totalMeals = allMeals.reduce((sum: number, m: any) => sum + (m.totalMeals || 0), 0);
                const mealRate = totalMeals > 0 ? totalShopping / totalMeals : 0;

                const myMeals = mealSummary?.currentUserMeals || 0;
                const myMealCost = myMeals * mealRate;

                setRefundAmount(totalDeposits - myMealCost);

                const todayStr = today.toLocaleDateString('en-US', { weekday: 'long' });
                const todayMenu = menuItems.find((item: any) => item.day === todayStr);
                if (todayMenu) {
                    setMenu({
                        breakfast: todayMenu.breakfast || 'Not set',
                        lunch: todayMenu.lunch || 'Not set',
                        dinner: todayMenu.dinner || 'Not set'
                    });
                }

                // No need to build activities array - using notifications instead

            }).finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [user]);

    const { billsDueAmount, billsDueCount, nextBillDue } = useMemo(() => {
        if (!user) return { billsDueAmount: 0, billsDueCount: 0, nextBillDue: null };

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const currentMonthBills = bills.filter(bill => {
            const dueDate = new Date(bill.dueDate);
            return dueDate.getMonth() === currentMonth && dueDate.getFullYear() === currentYear;
        });

        const myBillShares = currentMonthBills.flatMap(bill => {
            const shares = bill.shares || [];
            return shares
                .filter(share => share.userId === user.id && (share.status === 'Unpaid' || share.status === 'Overdue'))
                .map(share => ({ ...bill, myShare: share }));
        });

        const billsDueAmount = myBillShares.reduce((total, bill) => total + bill.myShare.amount, 0);
        const billsDueCount = myBillShares.length;

        const upcomingBills = myBillShares
            .filter(bill => new Date(bill.dueDate) >= now)
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

        const nextBillDue = upcomingBills.length > 0 ? upcomingBills[0] : null;

        return { billsDueAmount, billsDueCount, nextBillDue };
    }, [bills, user]);

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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <StatCard title="💰 Bills Due" value={`৳${billsDueAmount.toFixed(2)}`} subtitle={`${billsDueCount} bills pending`} />
                <StatCard title="🍽️ Your Meals" value={`${totalMealCount} quantities`} subtitle="This month" />
                <StatCard
                    title="💵 Refund Available"
                    value={`${refundAmount >= 0 ? '+' : ''}৳${refundAmount.toFixed(0)}`}
                    subtitle="After meal cost"
                />
                <StatCard title="📅 Next Bill Due" value={nextBillDueText} subtitle={daysLeftText} />
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <QuickActionButton icon={<MealIcon className="w-8 h-8 text-primary-500" />} label="Log Meal" onClick={() => router.push('/meals')} />
                    <QuickActionButton icon={<BillsIcon className="w-8 h-8 text-green-600" />} label="Pay Bill" onClick={() => router.push('/bills')} />
                    <QuickActionButton icon={<PlusIcon className="w-8 h-8 text-yellow-600" />} label="Deposit" onClick={() => router.push('/shopping')} />
                    <QuickActionButton icon={<ChartBarIcon className="w-8 h-8 text-indigo-500" />} label="History" onClick={() => router.push('/history')} />
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
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
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
    }, [user, loading, router]);

    if (loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-light-cyan-50 dark:bg-slate-900">
                <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary-500"></div>
            </div>
        );
    }

    return (
        <>
            <AppLayout>
                {user.role === Role.Manager ? <ManagerDashboard /> : <MemberDashboard />}
            </AppLayout>
            <ToastContainer />
        </>
    );
}
