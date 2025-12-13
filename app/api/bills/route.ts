import { NextRequest, NextResponse } from 'next/server';
import Bill from '@/models/Bill';
import Room from '@/models/Room';
import connectDB from '@/lib/db';
import { getSession } from '@/lib/auth';
import { CreateBillSchema, validateBody } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const user = await getSession(req);
        if (!user) {
            return NextResponse.json({ message: 'Not authorized' }, { status: 401 });
        }

        // Parse and validate body
        const body = await req.json();
        const validation = validateBody(CreateBillSchema, body);

        if (!validation.success) {
            return NextResponse.json({ message: validation.error }, { status: 400 });
        }

        const { title, category, totalAmount, dueDate, description, imageUrl, shares } = validation.data;

        // Verify user has a room
        if (!user.khataId) {
            return NextResponse.json(
                { message: 'You must be in a room to create bills' },
                { status: 400 }
            );
        }

        // Verify room exists
        const room = await Room.findOne({ khataId: user.khataId }).select('manager').lean();
        if (!room) {
            return NextResponse.json({ message: 'Room not found' }, { status: 404 });
        }

        // Verify user is the manager
        if (room.manager.toString() !== user._id.toString()) {
            return NextResponse.json(
                { message: 'Only the room manager can create bills' },
                { status: 403 }
            );
        }

        // Create bill
        const bill = await Bill.create({
            khataId: user.khataId,
            title,
            category,
            totalAmount,
            dueDate,
            description: description || '',
            imageUrl: imageUrl || null,
            createdBy: user._id,
            shares: shares.map((share) => ({
                userId: share.userId,
                userName: share.userName,
                amount: share.amount,
                status: share.status || 'Unpaid'
            }))
        });

        // Create notifications for all users involved in the bill
        try {
            const { notifyUsers } = await import('@/lib/notificationService');

            // Filter out the creator from receiving their own notification
            const recipientIds = shares
                .map(s => s.userId)
                .filter(id => id.toString() !== user._id.toString());

            if (recipientIds.length > 0) {
                await notifyUsers(recipientIds, {
                    title: 'New Bill Added',
                    message: `A new bill "${title}" of ৳${totalAmount} has been added.`,
                    type: 'new-bill',
                    link: `/bills/${bill._id}`,
                    relatedId: bill._id.toString()
                });
                console.log(`SUCCESS: Sent notifications to ${recipientIds.length} users`);
            }
        } catch (notificationError) {
            console.error('Error creating notifications:', notificationError);
            // Don't fail the bill creation if notifications fail
        }

        return NextResponse.json({
            message: 'Bill created successfully',
            bill: {
                id: bill._id,
                khataId: bill.khataId,
                title: bill.title,
                category: bill.category,
                totalAmount: bill.totalAmount,
                dueDate: bill.dueDate.toISOString().split('T')[0],
                shares: bill.shares
            }
        }, { status: 201 });

    } catch (error: any) {
        console.error('Create bill error:', error);
        return NextResponse.json(
            { message: 'Server error creating bill' },
            { status: 500 }
        );
    }
}
