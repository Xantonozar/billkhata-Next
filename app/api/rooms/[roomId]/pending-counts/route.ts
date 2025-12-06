import { NextRequest, NextResponse } from 'next/server';
import Room from '@/models/Room';
import Expense from '@/models/Expense';
import Deposit from '@/models/Deposit';
import Bill from '@/models/Bill';
import Meal from '@/models/Meal';
import connectDB from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
    try {
        await connectDB();
        const user = await getSession(req);
        if (!user) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

        const { roomId } = await params;

        // Parallelize the queries for speed
        const [room, pendingExpenses, pendingDeposits, bills] = await Promise.all([
            Room.findOne({ khataId: roomId }).select('members manager'),
            Expense.countDocuments({ khataId: roomId, status: 'Pending' }),
            Deposit.countDocuments({ khataId: roomId, status: 'Pending' }),
            Bill.find({ khataId: roomId, 'shares.status': 'Pending Approval' }).select('shares')
        ]);

        if (!room) {
            // If room doesn't exist, just return 0
            return NextResponse.json({ total: 0 });
        }

        // Count pending bill payments (shares with Pending Approval status)
        let pendingBillPayments = 0;
        bills.forEach((bill: any) => {
            bill.shares.forEach((share: any) => {
                if (share.status === 'Pending Approval') {
                    pendingBillPayments++;
                }
            });
        });

        const pendingMembers = room.members.filter((m: any) => m.status === 'Pending').length;

        const total = pendingMembers + pendingExpenses + pendingDeposits + pendingBillPayments;

        return NextResponse.json({
            total,
            breakdown: {
                members: pendingMembers,
                expenses: pendingExpenses,
                deposits: pendingDeposits,
                billPayments: pendingBillPayments
            }
        });

    } catch (error: any) {
        console.error('Get pending counts error:', error);
        return NextResponse.json({ total: 0 }, { status: 500 });
    }
}
