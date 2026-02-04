import { NextRequest, NextResponse } from 'next/server';
import Bill from '@/models/Bill';
import connectDB from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ billId: string }> }) {
    try {
        await connectDB();
        const user = await getSession(req);
        if (!user) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

        if (user.role !== 'Manager' && user.role !== 'MasterManager') {
            return NextResponse.json({ message: 'Not authorized as Manager' }, { status: 403 });
        }

        const { billId } = await params;

        const bill = await Bill.findById(billId);

        if (!bill) {
            return NextResponse.json({ message: 'Bill not found' }, { status: 404 });
        }

        // Verify user is manager of this room
        if (user.khataId !== bill.khataId) {
            return NextResponse.json({ message: 'Not authorized to delete this bill' }, { status: 403 });
        }

        await Bill.findByIdAndDelete(billId);

        return NextResponse.json({ message: 'Bill deleted successfully' });

    } catch (error: any) {
        console.error('Delete bill error:', error);
        return NextResponse.json({ message: 'Server error deleting bill' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ billId: string }> }) {
    try {
        await connectDB();
        const user = await getSession(req);
        if (!user) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

        if (user.role !== 'Manager' && user.role !== 'MasterManager') {
            return NextResponse.json({ message: 'Not authorized as Manager' }, { status: 403 });
        }

        const { billId } = await params;
        const { title, category, totalAmount, dueDate, description, imageUrl, shares } = await req.json();

        const bill = await Bill.findById(billId);

        if (!bill) {
            return NextResponse.json({ message: 'Bill not found' }, { status: 404 });
        }

        // Verify user is manager of this room
        if (user.khataId !== bill.khataId) {
            return NextResponse.json({ message: 'Not authorized to update this bill' }, { status: 403 });
        }

        // Update fields
        if (title !== undefined) bill.title = title;
        if (category !== undefined) bill.category = category;
        if (totalAmount !== undefined) bill.totalAmount = totalAmount;
        if (dueDate !== undefined) bill.dueDate = dueDate;
        if (description !== undefined) bill.description = description;
        if (imageUrl !== undefined) bill.imageUrl = imageUrl;
        if (shares !== undefined) {
            bill.shares = shares.map((share: any) => ({
                userId: share.userId,
                userName: share.userName,
                amount: share.amount,
                status: share.status || 'Unpaid'
            }));
        }

        await bill.save();

        return NextResponse.json({
            message: 'Bill updated successfully',
            bill: {
                id: bill._id,
                khataId: bill.khataId,
                title: bill.title,
                category: bill.category,
                totalAmount: bill.totalAmount,
                dueDate: bill.dueDate.toISOString().split('T')[0],
                description: bill.description,
                imageUrl: bill.imageUrl,
                shares: bill.shares.map((share: any) => ({
                    userId: share.userId.toString(),
                    userName: share.userName,
                    amount: share.amount,
                    status: share.status
                }))
            }
        });

    } catch (error: any) {
        console.error('Update bill error:', error);
        return NextResponse.json({ message: 'Server error updating bill' }, { status: 500 });
    }
}
