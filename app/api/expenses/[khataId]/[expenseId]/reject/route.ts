import { NextRequest, NextResponse } from 'next/server';
import Expense from '@/models/Expense';
import connectDB from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ khataId: string; expenseId: string }> }) {
    try {
        await connectDB();
        const user = await getSession(req);
        if (!user) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

        if (user.role !== 'Manager' && user.role !== 'MasterManager') {
            return NextResponse.json({ message: 'Not authorized as Manager' }, { status: 403 });
        }

        const { khataId, expenseId } = await params;
        const { reason } = await req.json();

        if (user.khataId !== khataId) {
            return NextResponse.json({ message: 'Access denied' }, { status: 403 });
        }

        const expense = await Expense.findOne({ _id: expenseId, khataId });

        if (!expense) {
            return NextResponse.json({ message: 'Expense not found' }, { status: 404 });
        }

        expense.status = 'Rejected';
        expense.rejectionReason = reason || '';
        expense.approvedBy = user._id;
        expense.approvedAt = new Date();

        await expense.save();

        // Notify member about expense rejection
        try {
            const { notifyUser } = await import('@/lib/notificationService');
            await notifyUser({
                khataId,
                userId: expense.userId.toString(),
                title: 'Expense Rejected',
                message: `Your expense of ৳${expense.amount} was rejected.${reason ? ` Reason: ${reason}` : ''}`,
                type: 'expense-rejected',
                link: `/shopping`,
                relatedId: expense._id.toString()
            });

            console.log(`Rejection notification sent to user for expense ৳${expense.amount}`);
        } catch (notificationError) {
            console.error('Error creating expense rejection notification:', notificationError);
        }

        return NextResponse.json(expense);

    } catch (error: any) {
        console.error('Error rejecting expense:', error);
        return NextResponse.json({ message: 'Server error rejecting expense' }, { status: 500 });
    }
}
