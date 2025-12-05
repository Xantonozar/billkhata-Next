import { NextRequest, NextResponse } from 'next/server';
import Expense from '@/models/Expense';
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

        const expenses = await Expense.find({ khataId })
            .sort({ createdAt: -1 })
            .populate('userId', 'name email')
            .populate('approvedBy', 'name');

        return NextResponse.json(expenses);

    } catch (error: any) {
        console.error('Error fetching expenses:', error);
        return NextResponse.json({ message: 'Server error fetching expenses' }, { status: 500 });
    }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ khataId: string }> }) {
    try {
        await connectDB();
        const user = await getSession(req);
        if (!user) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

        const { khataId } = await params;
        const { amount, items, notes, receiptUrl } = await req.json();

        if (user.khataId !== khataId) {
            return NextResponse.json({ message: 'Access denied' }, { status: 403 });
        }

        const expense = await Expense.create({
            khataId,
            userId: user._id,
            userName: user.name,
            amount,
            items,
            notes: notes || '',
            receiptUrl: receiptUrl || '',
            status: 'Pending'
        });

        // Notify manager about new expense
        try {
            const Room = await import('@/models/Room').then(mod => mod.default);
            const room = await Room.findOne({ khataId });

            if (room) {
                const Notification = await import('@/models/Notification').then(mod => mod.default);
                await Notification.create({
                    userId: room.manager,
                    khataId,
                    type: 'expense',
                    title: 'New Expense Pending',
                    message: `${user.name} submitted an expense of ৳${amount} for approval.`,
                    actionText: 'Review Expense',
                    link: `/shopping`,
                    read: false,
                    relatedId: expense._id
                });
                console.log(`Expense notification sent to manager for ৳${amount}`);
            }
        } catch (notificationError) {
            console.error('Error creating expense notification:', notificationError);
        }

        return NextResponse.json(expense, { status: 201 });

    } catch (error: any) {
        console.error('Error creating expense:', error);
        return NextResponse.json({ message: 'Server error creating expense' }, { status: 500 });
    }
}
