import { NextRequest, NextResponse } from 'next/server';
import { getSession, requireVerified } from '@/lib/auth';
import { getWeekStart } from '@/lib/dateUtils';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Bill from '@/models/Bill';
import Meal from '@/models/Meal';
import Deposit from '@/models/Deposit';
import Expense from '@/models/Expense';
import Menu from '@/models/Menu';
import { Role, PaymentStatus, RoomStatus } from '@/types';

import CalculationPeriod from '@/models/CalculationPeriod';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const user = await getSession(req);
        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        // Require email verification for protected resources
        // const verificationError = requireVerified(user);
        // if (verificationError) {
        //     return verificationError;
        // }

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
        const weekStart = getWeekStart();

        let menuDoc = await Menu.findOne({
            khataId: user.khataId,
            weekStart,
            isPermanent: false
        }).lean();

        if (!menuDoc) {
            menuDoc = await Menu.findOne({
                khataId: user.khataId,
                isPermanent: true
            }).lean();
        }

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

        // Get Active Calculation Period
        const activePeriod = await CalculationPeriod.findOne({
            khataId: user.khataId,
            status: 'Active'
        });

        // Base query for period-dependent data
        const periodQuery = activePeriod
            ? { khataId: user.khataId, calculationPeriodId: activePeriod._id }
            : { khataId: user.khataId };


        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

        // Filter for Bills (Strictly Current Month, independent of Calculation Period)
        const currentMonthBillQuery = {
            khataId: user.khataId,
            dueDate: {
                $gte: startOfMonth,
                $lte: endOfMonth
            }
        };

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
                Bill.find(currentMonthBillQuery).lean(),
                User.countDocuments({ khataId: user.khataId, roomStatus: RoomStatus.Approved, role: { $ne: Role.Manager } }),
                Deposit.find({ ...periodQuery, status: 'Pending' }).lean(),
                Expense.find({ ...periodQuery, status: 'Pending' }).lean(),
                User.countDocuments({ khataId: user.khataId, roomStatus: RoomStatus.Pending }),
                Deposit.find({ ...periodQuery, status: 'Approved' }).lean(),
                Expense.find({ ...periodQuery, status: 'Approved' }).lean()
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
            // We apply period query to bills as well, assuming "Current Calculation" view
            const myBills = await Bill.find({
                ...currentMonthBillQuery,
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

            // 2. Meal Count
            let myMealsQuery: any = { khataId: user.khataId, userId: userId };

            if (activePeriod) {
                // Use calculation period filtering
                myMealsQuery.calculationPeriodId = activePeriod._id;
            } else {
                // Fallback to "This Month" logic if no calculation period is active
                const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                myMealsQuery.date = { $gte: startOfMonth, $lte: endOfMonth };
            }

            const myMeals = await Meal.find(myMealsQuery).lean();

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const totalMealCount = myMeals.reduce((acc: number, m: any) => acc + (m.totalMeals || 0), 0);

            // 3. Refund Amount - Calculate from deposits and expenses in current period
            const [myDeposits, myExpenses] = await Promise.all([
                Deposit.find({
                    ...periodQuery,
                    userId: userId,
                    status: 'Approved'
                }).lean(),
                Expense.find({
                    ...periodQuery,
                    userId: userId,
                    status: 'Approved'
                }).lean()
            ]);

            const totalDeposits = myDeposits.reduce((acc: number, d: any) => acc + d.amount, 0);
            const totalExpenses = myExpenses.reduce((acc: number, e: any) => acc + e.amount, 0);
            const refundAmount = totalDeposits - totalExpenses;

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
