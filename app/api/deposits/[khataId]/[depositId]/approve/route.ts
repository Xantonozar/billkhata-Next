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

        if (user.khataId !== khataId) {
            return NextResponse.json({ message: 'Access denied' }, { status: 403 });
        }

        const deposit = await Deposit.findOne({ _id: depositId, khataId });

        if (!deposit) {
            return NextResponse.json({ message: 'Deposit not found' }, { status: 404 });
        }

        deposit.status = 'Approved';
        deposit.approvedBy = user._id;
        deposit.approvedAt = new Date();

        await deposit.save();

        // Notify member about deposit approval
        try {
            const { notifyUser } = await import('@/lib/notificationService');
            await notifyUser({
                userId: deposit.userId.toString(),
                title: 'Deposit Approved',
                message: `Your deposit of ৳${deposit.amount} has been approved by the manager.`,
                type: 'deposit-approved',
                link: `/shopping`,
                relatedId: deposit._id.toString()
            });

            console.log(`Approval notification sent to user for deposit ৳${deposit.amount}`);
        } catch (notificationError) {
            console.error('Error creating deposit approval notification:', notificationError);
        }

        return NextResponse.json(deposit);

    } catch (error: any) {
        console.error('Error approving deposit:', error);
        return NextResponse.json({ message: 'Server error approving deposit' }, { status: 500 });
    }
}
