import { NextRequest, NextResponse } from 'next/server';
import Bill from '@/models/Bill';
import Notification from '@/models/Notification';
import connectDB from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ billId: string }> }) {
    try {
        await connectDB();
        const user = await getSession(req);
        if (!user) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

        if (user.role !== 'Manager') {
            return NextResponse.json({ message: 'Not authorized as Manager' }, { status: 403 });
        }

        const { billId } = await params;

        const bill = await Bill.findById(billId);

        if (!bill) {
            return NextResponse.json({ message: 'Bill not found' }, { status: 404 });
        }

        // Verify user is manager of this room
        if (user.khataId !== bill.khataId) {
            return NextResponse.json({ message: 'Not authorized to send reminders for this bill' }, { status: 403 });
        }

        // Find unpaid shares
        const unpaidShares = bill.shares.filter((share: any) =>
            share.status === 'Unpaid' || share.status === 'Overdue'
        );

        if (unpaidShares.length === 0) {
            return NextResponse.json({ message: 'No unpaid shares to remind', count: 0 });
        }

        // Create notifications for each unpaid member
        const notifications = await Promise.all(
            unpaidShares.map((share: any) =>
                Notification.create({
                    userId: share.userId,
                    khataId: bill.khataId, // Added khataId as it is required in model
                    type: 'bill', // Changed from payment_reminder to match enum
                    title: 'Payment Reminder',
                    message: `Reminder: You have an unpaid ${bill.category} bill "${bill.title}" of ৳${share.amount.toFixed(2)}. Due date: ${new Date(bill.dueDate).toLocaleDateString()}`,
                    read: false
                })
            )
        );

        return NextResponse.json({
            message: 'Payment reminders sent successfully',
            count: notifications.length
        });

    } catch (error: any) {
        console.error('Send reminder error:', error);
        return NextResponse.json({ message: 'Server error sending reminders' }, { status: 500 });
    }
}
