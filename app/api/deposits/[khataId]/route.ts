import { NextRequest, NextResponse } from 'next/server';
import Deposit from '@/models/Deposit';
import connectDB from '@/lib/db';
import { getSession, requireKhataAccess } from '@/lib/auth';
import { CreateDepositSchema, PaginationSchema, validateBody, validateQuery } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ khataId: string }> }) {
    try {
        await connectDB();
        const user = await getSession(req);
        if (!user) {
            return NextResponse.json({ message: 'Not authorized' }, { status: 401 });
        }

        const { khataId } = await params;

        // Check khata access
        const accessError = requireKhataAccess(user, khataId);
        if (accessError) return accessError;

        const { searchParams } = new URL(req.url);

        // Validate pagination
        const paginationResult = validateQuery(PaginationSchema, searchParams);
        const page = paginationResult.success ? paginationResult.data.page : 1;
        const limit = paginationResult.success ? paginationResult.data.limit : 20;
        const skip = (page - 1) * limit;

        const status = searchParams.get('status');

        const query: any = { khataId };
        if (status && ['Pending', 'Approved', 'Rejected'].includes(status)) {
            query.status = status;
        }

        const deposits = await Deposit.find(query)
            .select('amount paymentMethod transactionId screenshotUrl status createdAt userId approvedBy')
            .sort({ createdAt: -1 })
            .populate('userId', 'name email')
            .populate('approvedBy', 'name')
            .skip(skip)
            .limit(limit)
            .lean();

        return NextResponse.json(deposits);

    } catch (error: any) {
        console.error('Error fetching deposits:', error);
        return NextResponse.json(
            { message: 'Server error fetching deposits' },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ khataId: string }> }) {
    try {
        await connectDB();
        const user = await getSession(req);
        if (!user) {
            return NextResponse.json({ message: 'Not authorized' }, { status: 401 });
        }

        const { khataId } = await params;

        // Check khata access
        const accessError = requireKhataAccess(user, khataId);
        if (accessError) return accessError;

        // Parse and validate body
        const body = await req.json();
        const validation = validateBody(CreateDepositSchema, body);

        if (!validation.success) {
            return NextResponse.json({ message: validation.error }, { status: 400 });
        }

        const { amount, paymentMethod, transactionId, screenshotUrl } = validation.data;

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
            const room = await Room.findOne({ khataId }).select('manager').lean();

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

                // Push real-time notification to room (manager gets instant toast)
                const { pushToRoom } = await import('@/lib/pusher');
                pushToRoom(khataId, 'new-deposit', {
                    type: 'new-deposit',
                    message: `${user.name} submitted a deposit of ৳${amount}`,
                    amount,
                    userId: user._id.toString()
                });

                console.log(`Deposit notification sent to manager for ৳${amount}`);
            }
        } catch (notificationError) {
            console.error('Error creating deposit notification:', notificationError);
        }

        return NextResponse.json(deposit, { status: 201 });

    } catch (error: any) {
        console.error('Error creating deposit:', error);
        return NextResponse.json(
            { message: 'Server error creating deposit' },
            { status: 500 }
        );
    }
}
