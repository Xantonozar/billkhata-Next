import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Bill from '@/models/Bill';
import Meal from '@/models/Meal';
import Deposit from '@/models/Deposit';
import Expense from '@/models/Expense';
import Menu from '@/models/Menu';
import { Role, PaymentStatus, RoomStatus } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const user = await getSession(req);
        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        if (!user.khataId) {
            // New user without khata
            return NextResponse.json({
                totalBillsAmount: 0,
                pendingApprovals: 0,
                fundBalance: 0,
                activeMembers: 0,
                totalBillsCount: 0,
                todaysMenu: { breakfast: 'Not set', lunch: 'Not set', dinner: 'Not set' },
                pendingJoinRequestsCount: 0,
                priorityActions: { expenses: [], deposits: [] },
                billsDueAmount: 0,
                billsDueCount: 0,
                nextBillDue: null,
                totalMealCount: 0,
                refundAmount: 0
            });
        }

        const userId = user._id.toString();

        const today = new Date();
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = days[today.getDay()];

        // Common Data: Menu
        // Strategy: Look for this week's menu, fall back to permanent
        // This is a simplified logic similar to what might be in getMenu
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        const dayOfWeek = todayDate.getDay(); // 0 (Sun) - 6 (Sat)
        // Adjust to Monday start if needed, but lets assume simple lookup for now or just find permanent
        // For simplicity in dashboard speed, checking permanent first or just generic latest
        const menuDoc = await Menu.findOne({ khataId: user.khataId, isPermanent: true }).lean();
        // Ideally we check specific date menu first, but for dashboard "Today's Menu", permanent is a good fallback default

        let todaysMenu = { breakfast: 'Not set', lunch: 'Not set', dinner: 'Not set' };
        if (menuDoc && menuDoc.items) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const todayItem = menuDoc.items.find((i: any) => i.day === dayName);
            if (todayItem) {
                todaysMenu = {
                    breakfast: todayItem.breakfast || 'Not set',
                    lunch: todayItem.lunch || 'Not set',
                    dinner: todayItem.dinner || 'Not set'
                };
            }
        }

        if (user.role === Role.Manager) {
            // --- MANAGER STATS ---
            const [
                bills,
                activeMembersCount,
                pendingDeposits,
                pendingExpenses,
                pendingUsers,
                approvedDeposits,
                approvedExpenses
            ] = await Promise.all([
                Bill.find({ khataId: user.khataId }).lean(),
                User.countDocuments({ khataId: user.khataId, roomStatus: RoomStatus.Approved, role: { $ne: Role.Manager } }),
                Deposit.find({ khataId: user.khataId, status: 'Pending' }).lean(),
                Expense.find({ khataId: user.khataId, status: 'Pending' }).lean(),
                User.countDocuments({ khataId: user.khataId, roomStatus: RoomStatus.Pending }),
                Deposit.find({ khataId: user.khataId, status: 'Approved' }).lean(),
                Expense.find({ khataId: user.khataId, status: 'Approved' }).lean()
            ]);

            const totalBillsAmount = bills.reduce((acc, bill) => acc + bill.totalAmount, 0);

            // Count pending bill payments (shares with 'Pending Approval' status)
            const pendingBillPayments: any[] = [];
            bills.forEach((bill: any) => {
                bill.shares?.forEach((share: any) => {
                    if (share.status === 'Pending Approval') {
                        pendingBillPayments.push({
                            billTitle: bill.title,
                            userName: share.userName,
                            amount: share.amount,
                            billId: bill._id
                        });
                    }
                });
            });

            const totalIn = approvedDeposits.reduce((acc, d) => acc + d.amount, 0);
            const totalOut = approvedExpenses.reduce((acc, e) => acc + e.amount, 0);
            const fundBalance = totalIn - totalOut;

            return NextResponse.json({
                totalBillsAmount,
                totalBillsCount: bills.length,
                pendingApprovals: pendingDeposits.length + pendingExpenses.length + pendingBillPayments.length,
                fundBalance,
                activeMembers: activeMembersCount,
                todaysMenu,
                pendingJoinRequestsCount: pendingUsers,
                priorityActions: {
                    expenses: pendingExpenses,
                    deposits: pendingDeposits,
                    billPayments: pendingBillPayments
                }
            });

        } else {
            // --- MEMBER STATS ---

            // 1. My Bills Due
            const myBills = await Bill.find({
                khataId: user.khataId,
                'shares.userId': userId
            }).lean();

            let billsDueAmount = 0;
            let billsDueCount = 0;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let nextBillDue: any = null;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            myBills.forEach((bill: any) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const share = bill.shares.find((s: any) => s.userId.toString() === userId);
                if (share && (share.status === 'Unpaid' || share.status === 'Overdue')) {
                    billsDueAmount += share.amount;
                    billsDueCount++;

                    if (!nextBillDue || new Date(bill.dueDate) < new Date(nextBillDue.dueDate)) {
                        nextBillDue = {
                            title: bill.title,
                            dueDate: bill.dueDate
                        };
                    }
                }
            });

            // 2. Meal Count (This Month)
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

            const myMeals = await Meal.find({
                khataId: user.khataId,
                userId: userId,
                date: { $gte: startOfMonth, $lte: endOfMonth }
            }).lean();

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const totalMealCount = myMeals.reduce((acc: number, m: any) => acc + (m.totalMeals || 0), 0);

            // 3. Refund Amount (Simplified: maybe balance from unspent deposits?)
            // Just placeholder logic for now or fetched from user balance if exists
            const refundAmount = 0;

            return NextResponse.json({
                todaysMenu,
                billsDueAmount,
                billsDueCount,
                nextBillDue,
                totalMealCount,
                refundAmount
            });
        }

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}
