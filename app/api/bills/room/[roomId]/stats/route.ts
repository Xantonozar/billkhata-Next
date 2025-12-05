import { NextRequest, NextResponse } from 'next/server';
import Bill from '@/models/Bill';
import connectDB from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
    try {
        await connectDB();
        const user = await getSession(req);
        if (!user) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

        const { roomId } = await params;

        // Verify user belongs to this room
        if (user.khataId !== roomId) {
            return NextResponse.json({ message: 'Not authorized' }, { status: 403 });
        }

        const bills = await Bill.find({ khataId: roomId });

        // Calculate stats
        let totalUnpaid = 0;
        let totalPaid = 0;
        let totalOverdue = 0;
        let pendingApprovals = 0;

        bills.forEach((bill: any) => {
            bill.shares.forEach((share: any) => {
                if (share.userId.toString() === user._id.toString()) {
                    switch (share.status) {
                        case 'Unpaid':
                            totalUnpaid += share.amount;
                            break;
                        case 'Paid':
                            totalPaid += share.amount;
                            break;
                        case 'Overdue':
                            totalOverdue += share.amount;
                            break;
                        case 'Pending Approval':
                            pendingApprovals += 1;
                            break;
                    }
                }
            });
        });

        return NextResponse.json({
            totalUnpaid,
            totalPaid,
            totalOverdue,
            pendingApprovals
        });

    } catch (error: any) {
        console.error('Get stats error:', error);
        return NextResponse.json({ message: 'Server error fetching statistics' }, { status: 500 });
    }
}
