
import { NextRequest, NextResponse } from 'next/server';
import Deposit from '@/models/Deposit';
import Expense from '@/models/Expense';
import Meal from '@/models/Meal';
import User from '@/models/User';
import connectDB from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ khataId: string }> }) {
    try {
        await connectDB();
        const user = await getSession(req);
        if (!user) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

        const { khataId } = await params;

        if (user.khataId !== khataId) {
            return NextResponse.json({ message: 'Access denied' }, { status: 403 });
        }

        // Get calculation period from query params or use active period
        const { searchParams } = new URL(req.url);
        const requestedPeriodId = searchParams.get('calculationPeriodId');

        const CalculationPeriod = await import('@/models/CalculationPeriod').then(mod => mod.default);

        let targetPeriod;
        if (requestedPeriodId) {
            // Use the requested period
            targetPeriod = await CalculationPeriod.findById(requestedPeriodId);
            if (!targetPeriod || targetPeriod.khataId !== khataId) {
                return NextResponse.json({ message: 'Invalid calculation period' }, { status: 400 });
            }
        } else {
            // Fall back to active period
            targetPeriod = await CalculationPeriod.findOne({
                khataId,
                status: 'Active'
            });
        }

        // If no period found, return empty balances
        if (!targetPeriod) {
            const members = await User.find({ khataId }).select('_id name email profileImage');
            const emptyBalances = members.map(member => ({
                userId: member._id,
                name: member.name,
                email: member.email,
                profileImage: member.profileImage,
                totalDeposits: 0,
                totalMeals: 0,
                mealCost: 0,
                totalBillPayments: 0,
                balance: 0
            }));

            return NextResponse.json({
                rate: 0,
                totalShopping: 0,
                totalMeals: 0,
                balances: emptyBalances
            });
        }

        // 1. Get all members
        const members = await User.find({ khataId }).select('_id name email profileImage');

        // 2. Global Aggregations for Rate Calculation (filtered by target period)
        const [expenseStats, mealStats] = await Promise.all([
            // Total Shopping (Approved only, excluding bill payments, current period only)
            Expense.aggregate([
                {
                    $match: {
                        khataId,
                        status: 'Approved',
                        calculationPeriodId: targetPeriod._id,
                        $or: [
                            { category: 'Shopping' },
                            { category: { $exists: false } }
                        ]
                    }
                },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            // Total meals for all members (current period only)
            Meal.aggregate([
                { $match: { khataId, calculationPeriodId: targetPeriod._id } },
                { $group: { _id: null, total: { $sum: '$totalMeals' } } }
            ])
        ]);

        const totalShopping = expenseStats.length > 0 ? expenseStats[0].total : 0;
        const totalMeals = mealStats.length > 0 ? mealStats[0].total : 0;
        const rate = totalMeals > 0 ? (totalShopping / totalMeals) : 0;

        // 3. Per-Member Aggregations (filtered by target period)
        const [memberDeposits, memberMeals, memberBillPayments] = await Promise.all([
            // Deposits by user (current period only)
            Deposit.aggregate([
                { $match: { khataId, status: 'Approved', calculationPeriodId: targetPeriod._id } },
                { $group: { _id: '$userId', total: { $sum: '$amount' } } }
            ]),
            // Meals by user (current period only)
            Meal.aggregate([
                { $match: { khataId, calculationPeriodId: targetPeriod._id } },
                { $group: { _id: '$userId', total: { $sum: '$totalMeals' } } }
            ]),
            // Bill payments by user (current period only)
            Expense.aggregate([
                { $match: { khataId, status: 'Approved', category: 'BillPayment', calculationPeriodId: targetPeriod._id } },
                { $group: { _id: '$userId', total: { $sum: '$amount' } } }
            ])
        ]);

        // Helper to find total in aggregation result
        const getSum = (arr: any[], userId: string) => {
            const item = arr.find(i => i._id.toString() === userId.toString());
            return item ? item.total : 0;
        };

        // 4. Calculate Balances
        const balances = members.map(member => {
            const totalDeposits = getSum(memberDeposits, member._id);
            const myTotalMeals = getSum(memberMeals, member._id);
            const totalBillPayments = getSum(memberBillPayments, member._id);

            const mealCost = myTotalMeals * rate;
            const balance = totalDeposits - mealCost - totalBillPayments;

            return {
                userId: member._id,
                name: member.name,
                email: member.email,
                profileImage: member.profileImage,
                totalDeposits,
                totalMeals: myTotalMeals,
                mealCost,
                totalBillPayments,
                balance
            };
        });

        return NextResponse.json({
            rate,
            totalShopping,
            totalMeals,
            balances
        });

    } catch (error) {
        console.error('Get balances error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
