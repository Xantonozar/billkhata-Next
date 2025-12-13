import { NextRequest, NextResponse } from 'next/server';
import Expense from '@/models/Expense';
import connectDB from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ khataId: string; expenseId: string }> }) {
    try {
        await connectDB();
        const user = await getSession(req);
        if (!user) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

        if (user.role !== 'Manager') {
            return NextResponse.json({ message: 'Not authorized as Manager' }, { status: 403 });
        }

        const { khataId, expenseId } = await params;

        if (user.khataId !== khataId) {
            return NextResponse.json({ message: 'Access denied' }, { status: 403 });
        }

        const expense = await Expense.findOne({ _id: expenseId, khataId });

        if (!expense) {
            return NextResponse.json({ message: 'Expense not found' }, { status: 404 });
        }

        expense.status = 'Approved';
        expense.approvedBy = user._id;
        expense.approvedAt = new Date();

        await expense.save();

        // Notify member about expense approval
        try {
            const { notifyUser } = await import('@/lib/notificationService');
            await notifyUser({
                khataId,
                userId: expense.userId.toString(),
                title: 'Expense Approved',
                message: `Your expense of ৳${expense.amount} has been approved by the manager.`,
                type: 'expense-approved',
                link: `/shopping`,
                relatedId: expense._id.toString()
            });

            console.log(`Approval notification sent to user for expense ৳${expense.amount}`);
        } catch (notificationError) {
            console.error('Error creating expense approval notification:', notificationError);
        }

        return NextResponse.json(expense);

    } catch (error: any) {
        console.error('Error approving expense:', error);
        return NextResponse.json({ message: 'Server error approving expense' }, { status: 500 });
    }
}
