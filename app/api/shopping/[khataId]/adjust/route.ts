
import { NextRequest, NextResponse } from 'next/server';
import Deposit from '@/models/Deposit';
import Notification from '@/models/Notification';
import CalculationPeriod from '@/models/CalculationPeriod';
import connectDB from '@/lib/db';
import { getSession } from '@/lib/auth';
import pusherServer, { pushToUser } from '@/lib/pusher';

export async function POST(req: NextRequest, { params }: { params: Promise<{ khataId: string }> }) {
    try {
        await connectDB();
        const session = await getSession(req);
        if (!session || (session.role !== 'Manager' && session.role !== 'MasterManager')) {
            return NextResponse.json({ message: 'Not authorized' }, { status: 403 });
        }

        const { khataId } = await params;
        if (session.khataId !== khataId) {
            return NextResponse.json({ message: 'Access denied' }, { status: 403 });
        }

        const body = await req.json();
        const { userId, type, amount, reason } = body;

        if (!userId || !type || amount === undefined) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        // Get active calculation period
        const activePeriod = await CalculationPeriod.findOne({ khataId, status: 'Active' });
        const calculationPeriodId = activePeriod ? activePeriod._id : null;

        // Calculate final amount (Positive for ADD, Negative for DEDUCT)
        const finalAmount = type === 'ADD' ? Math.abs(amount) : -Math.abs(amount);
        const actionText = type === 'ADD' ? 'added' : 'deducted';
        const notes = reason || (type === 'ADD' ? 'Fund added by manager' : 'Fund deducted by manager');

        // Create APPROVED Deposit (Adjustment)
        const result = await Deposit.create({
            khataId,
            userId,
            amount: finalAmount,
            paymentMethod: 'Manager Adjustment',
            transactionId: 'MANUAL',
            status: 'Approved',
            userName: 'Manager Adjustment',
            notes,
            calculationPeriodId,
            approvedBy: session._id,
            approvedAt: new Date()
        });

        const notificationMessage = `Manager ${actionText} ৳${Math.abs(amount)} ${type === 'ADD' ? 'to' : 'from'} your fund. Reason: ${reason || 'Adjustment'}`;

        // Create Notification
        await Notification.create({
            khataId,
            userId,
            type: 'deposit', // Always deposit type
            title: 'Fund Adjustment',
            message: notificationMessage,
            link: '/shopping',
            read: false
        });

        // Trigger real-time event to the specific user
        await pushToUser(userId, 'notification', {
            type: 'allow',
            message: notificationMessage
        });

        // Also trigger generic room update so lists refresh if needed
        await pusherServer.trigger(`room-${khataId}`, 'fund-update', {
            type: 'update'
        });

        return NextResponse.json({ success: true, result });

    } catch (error: any) {
        console.error('Fund adjustment error:', error);
        return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
    }
}
