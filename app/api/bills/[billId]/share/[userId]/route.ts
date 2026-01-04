import { NextRequest, NextResponse } from 'next/server';
import Bill from '@/models/Bill';
import connectDB from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ billId: string; userId: string }> }) {
    try {
        await connectDB();
        const user = await getSession(req);
        if (!user) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

        const { billId, userId } = await params;
        const { status, paidFromMealFund } = await req.json();

        if (!['Unpaid', 'Pending Approval', 'Paid', 'Overdue'].includes(status)) {
            return NextResponse.json({ message: 'Invalid status' }, { status: 400 });
        }

        const bill = await Bill.findById(billId);

        if (!bill) {
            return NextResponse.json({ message: 'Bill not found' }, { status: 404 });
        }

        // Verify user belongs to this room
        if (user.khataId !== bill.khataId) {
            return NextResponse.json({ message: 'Not authorized' }, { status: 403 });
        }

        // Find the share
        const shareIndex = bill.shares.findIndex(
            (s: any) => s.userId.toString() === userId
        );

        if (shareIndex === -1) {
            return NextResponse.json({ message: 'Share not found' }, { status: 404 });
        }

        // Update status and paidFromMealFund
        bill.shares[shareIndex].status = status;
        if (paidFromMealFund !== undefined) {
            bill.shares[shareIndex].paidFromMealFund = paidFromMealFund;
        }

        // If paying from meal fund, create an auto-approved expense
        if (paidFromMealFund && (status === 'Pending Approval' || status === 'Paid')) {
            try {
                const Expense = await import('@/models/Expense').then(mod => mod.default);
                await Expense.create({
                    khataId: bill.khataId,
                    userId: userId,
                    userName: bill.shares[shareIndex].userName,
                    amount: bill.shares[shareIndex].amount,
                    items: `Bill Payment: ${bill.title}`,
                    notes: `Auto-deducted from meal fund for ${bill.category} bill`,
                    category: 'BillPayment',
                    status: 'Approved',
                    approvedBy: userId,
                    approvedAt: new Date()
                });
            } catch (expenseError) {
                console.error('Error creating expense for meal fund payment:', expenseError);
                // Continue anyway - we don't want to fail the bill update
            }
        }

        await bill.save();

        // Notification Logic
        try {
            const Room = await import('@/models/Room').then(mod => mod.default);
            const Notification = await import('@/models/Notification').then(mod => mod.default);
            const { pushToRoom, pushToUser } = await import('@/lib/pusher');

            const room = await Room.findOne({ khataId: bill.khataId });

            if (room) {
                // Case 1: Member marks as "Pending Approval" -> Notify Manager
                if (status === 'Pending Approval') {
                    // Create db notification
                    await Notification.create({
                        userId: room.manager,
                        khataId: bill.khataId,
                        type: 'payment',
                        title: 'Payment Pending Approval',
                        message: `${user.name} has marked their share of ৳${bill.shares[shareIndex].amount} for "${bill.title}" as paid.`,
                        actionText: 'Review Bill',
                        link: `/bills`,
                        read: false,
                        relatedId: bill._id
                    });

                    // Push to manager
                    pushToRoom(bill.khataId, 'new-bill-payment', {
                        type: 'new-bill-payment',
                        message: `${user.name} marked "${bill.title}" as paid`,
                        amount: bill.shares[shareIndex].amount,
                        billTitle: bill.title,
                        userId: user._id.toString()
                    });
                }

                // Case 2: Manager marks as "Paid" -> Notify Member (Approved)
                else if (status === 'Paid' && user._id.toString() === room.manager.toString()) {
                    // Create db notification
                    await Notification.create({
                        userId: userId, // The member
                        khataId: bill.khataId,
                        type: 'payment',
                        title: 'Payment Approved',
                        message: `Your payment of ৳${bill.shares[shareIndex].amount} for "${bill.title}" has been approved.`,
                        actionText: 'View Bills',
                        link: `/bills`,
                        read: false,
                        relatedId: bill._id
                    });

                    // Push to member
                    pushToUser(userId, 'bill-approved', {
                        type: 'bill-approved',
                        message: `Payment for "${bill.title}" approved!`,
                        amount: bill.shares[shareIndex].amount
                    });
                }

                // Case 3: Manager marks as "Unpaid" -> Notify Member (Rejected)
                else if (status === 'Unpaid' && user._id.toString() === room.manager.toString()) {
                    // Create db notification
                    await Notification.create({
                        userId: userId, // The member
                        khataId: bill.khataId,
                        type: 'payment',
                        title: 'Payment Rejected',
                        message: `Your payment for "${bill.title}" was marked as unpaid (rejected).`,
                        actionText: 'View Bills',
                        link: `/bills`,
                        read: false,
                        relatedId: bill._id
                    });

                    // Push to member
                    pushToUser(userId, 'bill-rejected', {
                        type: 'bill-rejected',
                        message: `Payment for "${bill.title}" rejected`,
                        billTitle: bill.title
                    });
                }
            }
        } catch (notificationError) {
            console.error('Error handling notification:', notificationError);
        }

        return NextResponse.json({
            message: 'Payment status updated successfully',
            bill: {
                id: bill._id.toString(),
                khataId: bill.khataId,
                title: bill.title,
                category: bill.category,
                totalAmount: bill.totalAmount,
                dueDate: new Date(bill.dueDate).toISOString().split('T')[0],
                description: bill.description || '',
                imageUrl: bill.imageUrl || '',
                createdBy: bill.createdBy.toString(),
                shares: bill.shares.map((s: any) => ({
                    userId: s.userId.toString(),
                    userName: s.userName,
                    amount: s.amount,
                    status: s.status,
                    paidFromMealFund: s.paidFromMealFund || false
                }))
            }
        });

    } catch (error: any) {
        console.error('Update bill status error:', error);
        return NextResponse.json({ message: 'Server error updating payment status' }, { status: 500 });
    }
}
