
import { NextRequest, NextResponse } from 'next/server';
import Deposit from '@/models/Deposit';
import Expense from '@/models/Expense';
import Notification from '@/models/Notification';
import connectDB from '@/lib/db';
import { getSession } from '@/lib/auth';
import pusherServer, { pushToUser } from '@/lib/pusher';

export async function POST(req: NextRequest, { params }: { params: Promise<{ khataId: string }> }) {
    try {
        await connectDB();
        const session = await getSession(req);
        if (!session || session.role !== 'Manager') {
            return NextResponse.json({ message: 'Not authorized' }, { status: 403 });
        }

        const { khataId } = await params;
        if (session.khataId !== khataId) {
            return NextResponse.json({ message: 'Access denied' }, { status: 403 });
        }

        const body = await req.json();
        const { userId, type, amount, reason } = body;

        if (!userId || !type || !amount) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        let result;
        let notificationMessage = '';

        if (type === 'ADD') {
            // Create APPROVED Deposit
            result = await Deposit.create({
                khataId,
                userId,
                amount,
                paymentMethod: 'Manager Adjustment',
                transactionId: 'MANUAL',
                status: 'Approved',
                userName: 'Manager Adjustment', // Ideally fetch user name but for now this is placeholder
                notes: reason || 'Fund added by manager'
            });
            notificationMessage = `Manager added ৳${amount} to your fund. Reason: ${reason || 'Adjustment'}`;

        } else if (type === 'DEDUCT') {
            // Create APPROVED Expense
            result = await Expense.create({
                khataId,
                userId, // Attributed to the user
                amount,
                items: reason || 'Fund Deduction',
                category: 'Adjustment', // New category
                status: 'Approved',
                userName: 'Manager Adjustment',
                notes: 'Fund deducted by manager'
            });
            notificationMessage = `Manager deducted ৳${amount} from your fund. Reason: ${reason || 'Adjustment'}`;
        } else {
            return NextResponse.json({ message: 'Invalid type' }, { status: 400 });
        }

        // Create Notification
        await Notification.create({
            khataId,
            userId,
            type: type === 'ADD' ? 'deposit_approved' : 'expense_approved', // Reusing existing types or could be 'info'
            title: 'Fund Adjustment',
            message: notificationMessage,
            link: '/shopping',
            read: false
        });

        // Trigger real-time event to the specific user
        await pushToUser(userId, 'notification', {
            type: 'allow', // generic type
            message: notificationMessage
        });

        // Also trigger generic room update so lists refresh if needed
        await pusherServer.trigger(`room-${khataId}`, 'fund-update', {
            type: 'update'
        });

        return NextResponse.json({ success: true, result });

    } catch (error) {
        console.error('Fund adjustment error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
