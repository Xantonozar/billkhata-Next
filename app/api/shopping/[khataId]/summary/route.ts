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

        // Calculate Total Deposits (Approved only)
        const depositStats = await Deposit.aggregate([
            { $match: { khataId, status: 'Approved' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const totalDeposits = depositStats.length > 0 ? depositStats[0].total : 0;

        // Calculate Total Shopping (Approved only)
        const expenseStats = await Expense.aggregate([
            { $match: { khataId, status: 'Approved' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const totalShopping = expenseStats.length > 0 ? expenseStats[0].total : 0;

        const balance = totalDeposits - totalShopping;

        // Get total meals for all members
        const mealStats = await Meal.aggregate([
            { $match: { khataId } },
            { $group: { _id: null, total: { $sum: '$totalMeals' } } }
        ]);
        const totalMeals = mealStats.length > 0 ? mealStats[0].total : 0;

        // Calculate rate - total shopping / total meals
        const rate = totalMeals > 0 ? (totalShopping / totalMeals) : 0;

        // Member specific stats
        const memberDepositStats = await Deposit.aggregate([
            { $match: { khataId, userId: user._id, status: 'Approved' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const memberTotalDeposits = memberDepositStats.length > 0 ? memberDepositStats[0].total : 0;

        // Get member's total meals
        const memberMealStats = await Meal.aggregate([
            { $match: { khataId, userId: user._id } },
            { $group: { _id: null, total: { $sum: '$totalMeals' } } }
        ]);
        const memberTotalMeals = memberMealStats.length > 0 ? memberMealStats[0].total : 0;

        // Member meal cost = rate * member's total meals
        const memberMealCost = rate * memberTotalMeals;
        const memberRefundable = memberTotalDeposits - memberMealCost;

        return NextResponse.json({
            fundStatus: {
                totalDeposits,
                totalShopping,
                balance,
                rate
            },
            memberSummary: {
                totalDeposits: memberTotalDeposits,
                mealCost: memberMealCost,
                refundable: memberRefundable
            }
        });

    } catch (error: any) {
        console.error('Error fetching shopping summary:', error);
        return NextResponse.json({ message: 'Server error fetching summary' }, { status: 500 });
    }
}
