import { NextRequest, NextResponse } from 'next/server';
import Bill from '@/models/Bill';
import Room from '@/models/Room';
import connectDB from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const user = await getSession(req);
        if (!user) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

        const { title, category, totalAmount, dueDate, description, imageUrl, shares } = await req.json();

        if (!title || !category || !totalAmount || !dueDate || !shares) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        // Verify user has a room
        if (!user.khataId) {
            return NextResponse.json({ message: 'You must be in a room to create bills' }, { status: 400 });
        }

        // Verify room exists
        const room = await Room.findOne({ khataId: user.khataId });
        if (!room) {
            return NextResponse.json({ message: 'Room not found' }, { status: 404 });
        }

        // Verify user is the manager
        if (room.manager.toString() !== user._id.toString()) {
            return NextResponse.json({ message: 'Only the room manager can create bills' }, { status: 403 });
        }

        // Create bill
        const bill = await Bill.create({
            khataId: user.khataId,
            title,
            category,
            totalAmount,
            dueDate,
            description,
            imageUrl,
            createdBy: user._id,
            shares: shares.map((share: any) => ({
                userId: share.userId,
                userName: share.userName,
                amount: share.amount,
                status: share.status || 'Unpaid'
            }))
        });

        // Create notifications for all users involved in the bill
        try {
            const Notification = await import('@/models/Notification').then(mod => mod.default);
            const notificationsToCreate = shares.map((share: any) => ({
                userId: share.userId,
                khataId: user.khataId,
                type: 'bill',
                title: 'New Bill Added',
                message: `A new bill "${title}" of ৳${totalAmount} has been added.`,
                actionText: 'View Bills',
                link: `/bills`,
                read: false,
                relatedId: bill._id
            }));

            console.log(`DEBUG: Creating ${notificationsToCreate.length} bill notifications for users:`, notificationsToCreate.map((n: any) => n.userId));
            await Notification.insertMany(notificationsToCreate);
            console.log(`SUCCESS: Created ${notificationsToCreate.length} notifications for bill: ${title}`);
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
        return NextResponse.json({ message: 'Server error creating bill' }, { status: 500 });
    }
}
