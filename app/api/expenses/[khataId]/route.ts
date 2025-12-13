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

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = (page - 1) * limit;

        const status = searchParams.get('status');

        const query: any = { khataId };
        if (status) {
            query.status = status;
        }

        const expenses = await Expense.find(query)
            .select('amount items notes receiptUrl status createdAt userId approvedBy')
            .sort({ createdAt: -1 })
            .populate('userId', 'name email')
            .populate('approvedBy', 'name')
            .skip(skip)
            .limit(limit)
            .lean();

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
            const room = await Room.findOne({ khataId }).select('manager').lean();

            if (room) {
                const { notifyUser } = await import('@/lib/notificationService');
                await notifyUser({
                    userId: room.manager.toString(),
                    title: 'New Expense Pending',
                    message: `${user.name} submitted an expense of ৳${amount} for approval.`,
                    type: 'new-expense',
                    link: `/shopping`,
                    relatedId: expense._id.toString()
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
