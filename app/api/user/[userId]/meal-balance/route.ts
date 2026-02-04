import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { getSession } from '@/lib/auth';
import Deposit from '@/models/Deposit';
import Expense from '@/models/Expense';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
    try {
        await connectDB();
        const user = await getSession(req);
        if (!user) {
            return NextResponse.json({ message: 'Not authorized' }, { status: 401 });
        }

        const { userId } = await params;

        // Users can only check their own balance, or managers can check anyone's
        // Convert both to strings for comparison
        if (user._id.toString() !== userId && user.role !== 'Manager' && user.role !== 'MasterManager') {
            return NextResponse.json({ message: 'Not authorized' }, { status: 403 });
        }

        // Calculate total approved deposits
        const mongoose = await import('mongoose');
        const userObjectId = new mongoose.Types.ObjectId(userId);

        const depositResult = await Deposit.aggregate([
            {
                $match: {
                    userId: userObjectId,
                    status: 'Approved'
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' }
                }
            }
        ]);

        const totalDeposits = depositResult.length > 0 ? depositResult[0].total : 0;

        // Calculate total approved expenses
        const expenseResult = await Expense.aggregate([
            {
                $match: {
                    userId: userObjectId,
                    status: 'Approved'
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' }
                }
            }
        ]);

        const totalExpenses = expenseResult.length > 0 ? expenseResult[0].total : 0;

        // Balance = Deposits - Expenses (can be negative)
        const balance = totalDeposits - totalExpenses;

        return NextResponse.json({
            balance,
            totalDeposits,
            totalExpenses
        });

    } catch (error: any) {
        console.error('Error calculating meal balance:', error);
        return NextResponse.json(
            { message: 'Server error calculating balance' },
            { status: 500 }
        );
    }
}
