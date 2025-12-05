import { NextRequest, NextResponse } from 'next/server';
import Deposit from '@/models/Deposit';
import connectDB from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ khataId: string; depositId: string }> }) {
    try {
        await connectDB();
        const user = await getSession(req);
        if (!user) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

        if (user.role !== 'Manager') {
            return NextResponse.json({ message: 'Not authorized as Manager' }, { status: 403 });
        }

        const { khataId, depositId } = await params;
        const { reason } = await req.json();

        if (user.khataId !== khataId) {
            return NextResponse.json({ message: 'Access denied' }, { status: 403 });
        }

        const deposit = await Deposit.findOne({ _id: depositId, khataId });

        if (!deposit) {
            return NextResponse.json({ message: 'Deposit not found' }, { status: 404 });
        }

        deposit.status = 'Rejected';
        deposit.rejectionReason = reason || '';
        deposit.approvedBy = user._id;
        deposit.approvedAt = new Date();

        await deposit.save();

        // Notify member about deposit rejection
        try {
            const Notification = await import('@/models/Notification').then(mod => mod.default);
            await Notification.create({
                userId: deposit.userId,
                khataId,
                type: 'deposit',
                title: 'Deposit Rejected',
                message: `Your deposit of ৳${deposit.amount} was rejected.${reason ? ` Reason: ${reason}` : ''}`,
                actionText: 'View Deposits',
                link: `/shopping`,
                read: false,
                relatedId: deposit._id
            });
            console.log(`Rejection notification sent to user for deposit ৳${deposit.amount}`);
        } catch (notificationError) {
            console.error('Error creating deposit rejection notification:', notificationError);
        }

        return NextResponse.json(deposit);

    } catch (error: any) {
        console.error('Error rejecting deposit:', error);
        return NextResponse.json({ message: 'Server error rejecting deposit' }, { status: 500 });
    }
}
