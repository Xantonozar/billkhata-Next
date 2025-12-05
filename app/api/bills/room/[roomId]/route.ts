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
            return NextResponse.json({ message: 'Not authorized to view this room\'s bills' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = (page - 1) * limit;

        const bills = await Bill.find({ khataId: roomId })
            .select('title category totalAmount dueDate description imageUrl createdBy shares')
            .populate('createdBy', 'name')
            .sort({ dueDate: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        // Convert to frontend format
        const formattedBills = bills.map((bill: any) => ({
            id: bill._id,
            khataId: bill.khataId,
            title: bill.title,
            category: bill.category,
            totalAmount: bill.totalAmount,
            dueDate: bill.dueDate.toISOString().split('T')[0],
            description: bill.description,
            imageUrl: bill.imageUrl,
            createdBy: bill.createdBy._id,
            shares: bill.shares.map((share: any) => ({
                userId: share.userId.toString(),
                userName: share.userName,
                amount: share.amount,
                status: share.status
            }))
        }));

        return NextResponse.json(formattedBills);

    } catch (error: any) {
        console.error('Get bills error:', error);
        return NextResponse.json({ message: 'Server error fetching bills' }, { status: 500 });
    }
}
