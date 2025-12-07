import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { getSession } from '@/lib/auth';
import Bill from '@/models/Bill';
import Deposit from '@/models/Deposit';
import Expense from '@/models/Expense';
import Room from '@/models/Room';
import User from '@/models/User';
import Menu from '@/models/Menu';
import { globalCache } from '@/lib/cache';
import { getWeekStart } from '@/lib/dateUtils';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const user = await getSession(req);
        if (!user) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

        if (!user.khataId) {
            return NextResponse.json({ message: 'User not in a room' }, { status: 400 });
        }

        const statsCacheKey = `dashboard:${user._id}:${user.khataId}`;
        const cachedStats = globalCache.get(statsCacheKey);

        // For now, let's keep it real-time or very short cache to ensure responsiveness to actions
        // if (cachedStats) return NextResponse.json(cachedStats);

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        const todayStr = now.toLocaleDateString('en-US', { weekday: 'long' });

        // Helper function to get today's menu from weekly/permanent menu
        const getTodaysMenu = async () => {
            const weekStart = getWeekStart();

            // Try to find temporary menu for current week first
            let menu = await Menu.findOne({
                khataId: user.khataId,
                weekStart,
                isPermanent: false
            }).lean();

            // Fallback to permanent menu if no temporary menu exists
            if (!menu) {
                menu = await Menu.findOne({
                    khataId: user.khataId,
                    isPermanent: true
                }).lean();
            }

            // Extract today's menu from items array
            if (menu?.items) {
                const todayMenu = menu.items.find((item: any) => item.day === todayStr);
                return todayMenu || null;
            }
            return null;
        };

        const menuPromise = getTodaysMenu();

        let responseData: any = {};

        // Check for 'Manager' (PascalCase as defined in types/index.ts)
        if (user.role === 'Manager' || user.role === 'manager') {
            const [
                currentMonthBills,
                pendingJoinRequestsCount,
                pendingExpenses,
                pendingDeposits,
                room,
                activeMembersCount,
                todaysMenu,
                fundStats
            ] = await Promise.all([
                Bill.aggregate([
                    { $match: { khataId: user.khataId, dueDate: { $gte: startOfMonth, $lte: endOfMonth } } },
                    { $group: { _id: null, totalAmount: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
                ]),
                Room.findOne({ khataId: user.khataId }).select('pendingMembers').lean().then((r: any) => r?.pendingMembers?.length || 0),
                Expense.find({ khataId: user.khataId, status: 'Pending' }).select('amount name').lean(),
                Deposit.find({ khataId: user.khataId, status: 'Pending' }).select('amount name').lean(),
                Room.findOne({ khataId: user.khataId }).select('members').lean(),
                User.countDocuments({ khataId: user.khataId, roomStatus: 'joined' }),
                menuPromise,
                // Fund Balance: Approved Deposits - Approved Expenses
                // This is checking total fund balance of the room
                Promise.all([
                    Deposit.aggregate([
                        { $match: { khataId: user.khataId, status: 'Approved' } },
                        { $group: { _id: null, total: { $sum: '$amount' } } }
                    ]),
                    Expense.aggregate([
                        { $match: { khataId: user.khataId, status: 'Approved' } },
                        { $group: { _id: null, total: { $sum: '$amount' } } }
                    ])
                ]).then(([dep, exp]) => (dep[0]?.total || 0) - (exp[0]?.total || 0))
            ]);

            responseData = {
                type: 'manager',
                totalBillsAmount: currentMonthBills[0]?.totalAmount || 0,
                totalBillsCount: currentMonthBills[0]?.count || 0,
                pendingApprovals: pendingJoinRequestsCount + pendingExpenses.length + pendingDeposits.length,
                pendingJoinRequestsCount,
                activeMembers: activeMembersCount,
                fundBalance: fundStats,
                todaysMenu: todaysMenu || { breakfast: 'Not set', lunch: 'Not set', dinner: 'Not set' },
                priorityActions: {
                    expenses: pendingExpenses,
                    deposits: pendingDeposits,
                    // Note: Join requests details would need User lookup, but count is sufficient for "Actions" badge usually.
                    // If detailed names needed, we'd need another query or populate.
                    // For speed, let's assume the dashboard main card just needs counts or we fetch simple details.
                }
            };

        } else {
            // Member Dashboard Stats
            const [
                myBills,
                mealStats,
                financials,
                todaysMenu
            ] = await Promise.all([
                // Bills Due for this user
                Bill.find({
                    khataId: user.khataId,
                    'shares.userId': user._id,
                    'shares.status': { $in: ['Unpaid', 'Overdue'] }
                }).select('title dueDate shares.$').lean(),

                // Meal Summary for User
                import('@/models/Meal').then(mod => mod.default.aggregate([
                    { $match: { khataId: user.khataId, userId: user._id } },
                    { $group: { _id: null, total: { $sum: '$totalMeals' } } }
                ])),

                // Financials (Refund/Cost)
                // This logic mirrors the frontend calculation: Total Deposits - (My Meal Count * Meal Rate)
                // Meal Rate = Total Approved Expenses / Total Room Meals
                Promise.all([
                    Deposit.aggregate([
                        { $match: { khataId: user.khataId, userId: user._id, status: 'Approved' } },
                        { $group: { _id: null, total: { $sum: '$amount' } } }
                    ]),
                    Expense.aggregate([
                        { $match: { khataId: user.khataId, status: 'Approved' } },
                        { $group: { _id: null, total: { $sum: '$amount' } } }
                    ]),
                    import('@/models/Meal').then(mod => mod.default.aggregate([
                        { $match: { khataId: user.khataId } },
                        { $group: { _id: null, total: { $sum: '$totalMeals' } } }
                    ]))
                ]),
                menuPromise
            ]);

            const myDeposits = financials[0][0]?.total || 0;
            const totalStartExpenses = financials[1][0]?.total || 0;
            const totalRoomMeals = financials[2][0]?.total || 0;

            const mealRate = totalRoomMeals > 0 ? totalStartExpenses / totalRoomMeals : 0;
            const myMeals = mealStats[0]?.total || 0;
            const myMealCost = myMeals * mealRate;
            const refundAmount = myDeposits - myMealCost;

            // Process bills
            const now = new Date();
            const upcomingBills = myBills
                .map((b: any) => ({
                    title: b.title,
                    dueDate: b.dueDate,
                    amount: b.shares[0].amount // Since we projected relevant share
                }))
                .filter((b: any) => new Date(b.dueDate) >= now)
                .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

            responseData = {
                type: 'member',
                billsDueAmount: myBills.reduce((acc: number, b: any) => acc + b.shares[0].amount, 0),
                billsDueCount: myBills.length,
                totalMealCount: myMeals,
                refundAmount,
                nextBillDue: upcomingBills[0] || null,
                todaysMenu: todaysMenu || { breakfast: 'Not set', lunch: 'Not set', dinner: 'Not set' }
            };
        }

        return NextResponse.json(responseData);

    } catch (error: any) {
        console.error('Dashboard stats error:', error);
        return NextResponse.json({ message: 'Server error fetching stats' }, { status: 500 });
    }
}
