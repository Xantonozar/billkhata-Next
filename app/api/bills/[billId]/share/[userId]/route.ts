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
        const { status } = await req.json();

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

        // Update status
        bill.shares[shareIndex].status = status;
        await bill.save();

        // Notify manager when member marks as paid
        if (status === 'Paid' && user._id.toString() !== bill.createdBy.toString()) {
            try {
                const Room = await import('@/models/Room').then(mod => mod.default);
                const room = await Room.findOne({ khataId: bill.khataId });

                if (room) {
                    const Notification = await import('@/models/Notification').then(mod => mod.default);
                    await Notification.create({
                        userId: room.manager,
                        khataId: bill.khataId,
                        type: 'payment',
                        title: 'Payment Received',
                        message: `${user.name} has paid their share (৳${bill.shares[shareIndex].amount}) for "${bill.title}".`,
                        actionText: 'View Bill',
                        link: `/bills`,
                        read: false,
                        relatedId: bill._id
                    });
                    console.log(`Payment notification sent to manager for ${bill.title}`);
                }
            } catch (notificationError) {
                console.error('Error creating payment notification:', notificationError);
            }
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
                    status: s.status
                }))
            }
        });

    } catch (error: any) {
        console.error('Update bill status error:', error);
        return NextResponse.json({ message: 'Server error updating payment status' }, { status: 500 });
    }
}
