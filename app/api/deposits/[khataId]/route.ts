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
        const calculationPeriodId = searchParams.get('calculationPeriodId');

        const query: any = { khataId };
        if (status && ['Pending', 'Approved', 'Rejected'].includes(status)) {
            query.status = status;
        }

        if (calculationPeriodId) {
            query.calculationPeriodId = calculationPeriodId;
        }

        const deposits = await Deposit.find(query)
            .select('amount paymentMethod transactionId screenshotUrl status createdAt userId approvedBy calculationPeriodId')
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

        const { amount, paymentMethod, transactionId, screenshotUrl, userId } = validation.data;

        let targetUserId = user._id;
        let targetUserName = user.name;

        // If userId is provided, check if user is manager
        if (userId && userId !== user._id.toString()) {
            const { isManager } = await import('@/lib/auth');
            if (!isManager(user)) {
                return NextResponse.json({ message: 'Only managers can add deposits for other members' }, { status: 403 });
            }

            // Fetch target user details
            const User = await import('@/models/User').then(mod => mod.default);
            const targetUser = await User.findById(userId).select('name').lean();
            if (!targetUser) {
                return NextResponse.json({ message: 'Target user not found' }, { status: 404 });
            }
            targetUserId = userId;
            targetUserName = targetUser.name;
        }

        // Find active calculation period
        const CalculationPeriod = await import('@/models/CalculationPeriod').then(mod => mod.default);
        const activePeriod = await CalculationPeriod.findOne({
            khataId,
            status: 'Active'
        });

        // Ensure there is an active period before allowing deposits (optional, but good practice)
        // If we want to allow deposits without an active period for legacy reasons, we can skip this check 
        // or handle it gracefully. For now, let's just associate if it exists.

        const deposit = await Deposit.create({
            khataId,
            userId: targetUserId,
            userName: targetUserName,
            amount,
            paymentMethod,
            transactionId: transactionId || '',
            screenshotUrl: screenshotUrl || '',
            status: userId && userId !== user._id.toString() ? 'Approved' : 'Pending', // Auto-approve if manager adds for others? Or keep pending?
            // If a manager adds it, it's effectively "approved" or "verified" usually. 
            // But let's check what the user wants. "then deposit will add to that member account" implies it should result in balance update.
            // Typically deposits need approval to affect balance. If manager adds it, it should probably be Approved immediately.
            // Let's set it to Approved if manager adds it for someone else.
            // Actually, even if manager adds it for THEMSELVES, it might need approval from another manager if multiple managers exist?
            // But usually manager actions are trusted. 
            // However, the existing code for Expenses (AddManagerShoppingModal) sets status: 'Approved' (line 497 in Modals.tsx).
            // So if manager adds it for someone else, it makes sense to be Approved.
            approvedBy: userId && userId !== user._id.toString() ? user._id : undefined,
            approvedAt: userId && userId !== user._id.toString() ? new Date() : undefined,
            calculationPeriodId: activePeriod ? activePeriod._id : undefined
        });

        // Notify manager about new deposit (only if it's pending)
        if (deposit.status === 'Pending') {
            try {
                const Room = await import('@/models/Room').then(mod => mod.default);
                const room = await Room.findOne({ khataId }).select('manager').lean();

                if (room) {
                    const { notifyUser } = await import('@/lib/notificationService');
                    await notifyUser({
                        khataId,
                        userId: room.manager.toString(),
                        title: 'New Deposit Pending',
                        message: `${targetUserName} submitted a deposit of ৳${amount} for approval.`,
                        type: 'new-deposit',
                        link: `/shopping`,
                        relatedId: deposit._id.toString()
                    });

                    console.log(`Deposit notification sent to manager for ৳${amount}`);
                }
            } catch (notificationError) {
                console.error('Error creating deposit notification:', notificationError);
            }
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
