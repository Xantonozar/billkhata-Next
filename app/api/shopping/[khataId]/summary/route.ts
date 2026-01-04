import { NextRequest, NextResponse } from 'next/server';
import Deposit from '@/models/Deposit';
import Expense from '@/models/Expense';
import Meal from '@/models/Meal';
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

        // Run all aggregations in parallel
        const [
            depositStats,
            expenseStats,
            billPaymentStats,
            mealStats,
            memberDepositStats,
            memberExpenseStats,
            memberMealStats
        ] = await Promise.all([
            // 1. Total Deposits (Approved only)
            Deposit.aggregate([
                { $match: { khataId, status: 'Approved' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            // 2. Total Shopping (Approved only, excluding bill payments)
            Expense.aggregate([
                {
                    $match: {
                        khataId,
                        status: 'Approved',
                        $or: [
                            { category: 'Shopping' },
                            { category: { $exists: false } }  // Old expenses without category
                        ]
                    }
                },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            // 3. Total Bill Payments (Approved only)
            Expense.aggregate([
                { $match: { khataId, status: 'Approved', category: 'BillPayment' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            // 4. Total meals for all members
            Meal.aggregate([
                { $match: { khataId } },
                { $group: { _id: null, total: { $sum: '$totalMeals' } } }
            ]),
            // 5. Member specific deposits
            Deposit.aggregate([
                { $match: { khataId, userId: user._id, status: 'Approved' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            // 6. Member specific expenses (excluding bill payments)
            Expense.aggregate([
                {
                    $match: {
                        khataId,
                        userId: user._id,
                        status: 'Approved',
                        $or: [
                            { category: 'Shopping' },
                            { category: { $exists: false } }  // Old expenses without category
                        ]
                    }
                },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            // 7. Member's total meals
            Meal.aggregate([
                { $match: { khataId, userId: user._id } },
                { $group: { _id: null, total: { $sum: '$totalMeals' } } }
            ])
        ]);

        const totalDeposits = depositStats.length > 0 ? depositStats[0].total : 0;
        const totalShopping = expenseStats.length > 0 ? expenseStats[0].total : 0;
        const totalBillPayments = billPaymentStats.length > 0 ? billPaymentStats[0].total : 0;
        const balance = totalDeposits - totalShopping - totalBillPayments;
        const totalMeals = mealStats.length > 0 ? mealStats[0].total : 0;

        // Calculate rate - total shopping / total meals (excluding bill payments)
        const rate = totalMeals > 0 ? (totalShopping / totalMeals) : 0;

        const memberTotalDeposits = memberDepositStats.length > 0 ? memberDepositStats[0].total : 0;
        const memberTotalExpenses = memberExpenseStats.length > 0 ? memberExpenseStats[0].total : 0;
        const memberTotalMeals = memberMealStats.length > 0 ? memberMealStats[0].total : 0;

        // Member meal cost = rate * member's total meals
        const memberMealCost = rate * memberTotalMeals;

        // Refundable = Deposits - Meal Cost - Shopping Expenses (Bill Payments)
        // Note: memberTotalExpenses contains ONLY Shopping expenses (excluding bills) based on query #6
        // We need to fetch member's bill payments to subtract them too

        // 8. Member's Bill Payments
        const memberBillPaymentStats = await Expense.aggregate([
            { $match: { khataId, userId: user._id, status: 'Approved', category: 'BillPayment' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const memberTotalBillPayments = memberBillPaymentStats.length > 0 ? memberBillPaymentStats[0].total : 0;

        const memberRefundable = memberTotalDeposits - memberMealCost - memberTotalBillPayments;

        return NextResponse.json({
            fundStatus: {
                totalDeposits,
                totalShopping,
                totalBillPayments,
                balance,
                totalMeals,
                rate
            },
            memberSummary: {
                totalDeposits: memberTotalDeposits,
                totalExpenses: memberTotalExpenses, // Shopping only
                totalBillPayments: memberTotalBillPayments, // New field
                mealCost: memberMealCost,
                refundable: memberRefundable
            }
        });

    } catch (error: any) {
        console.error('Error fetching shopping summary:', error);
        return NextResponse.json({ message: 'Server error fetching summary' }, { status: 500 });
    }
}
