import { NextRequest, NextResponse } from 'next/server';
import Deposit from '@/models/Deposit';
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

        const deposits = await Deposit.find({ khataId })
            .sort({ createdAt: -1 })
            .populate('userId', 'name email')
            .populate('approvedBy', 'name');

        return NextResponse.json(deposits);

    } catch (error: any) {
        console.error('Error fetching deposits:', error);
        return NextResponse.json({ message: 'Server error fetching deposits' }, { status: 500 });
    }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ khataId: string }> }) {
    try {
        await connectDB();
        const user = await getSession(req);
        if (!user) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

        const { khataId } = await params;
        const { amount, paymentMethod, transactionId, screenshotUrl } = await req.json();

        if (user.khataId !== khataId) {
            return NextResponse.json({ message: 'Access denied' }, { status: 403 });
        }

        const deposit = await Deposit.create({
            khataId,
            userId: user._id,
            userName: user.name,
            amount,
            paymentMethod,
            transactionId: transactionId || '',
            screenshotUrl: screenshotUrl || '',
            status: 'Pending'
        });

        // Notify manager about new deposit
        try {
            const Room = await import('@/models/Room').then(mod => mod.default);
            const room = await Room.findOne({ khataId });

            if (room) {
                const Notification = await import('@/models/Notification').then(mod => mod.default);
                await Notification.create({
                    userId: room.manager,
                    khataId,
                    type: 'deposit',
                    title: 'New Deposit Pending',
                    message: `${user.name} submitted a deposit of ৳${amount} for approval.`,
                    actionText: 'Review Deposit',
                    link: `/shopping`,
                    read: false,
                    relatedId: deposit._id
                });
                console.log(`Deposit notification sent to manager for ৳${amount}`);
            }
        } catch (notificationError) {
            console.error('Error creating deposit notification:', notificationError);
        }

        return NextResponse.json(deposit, { status: 201 });

    } catch (error: any) {
        console.error('Error creating deposit:', error);
        return NextResponse.json({ message: 'Server error creating deposit' }, { status: 500 });
    }
}
