import { NextRequest, NextResponse } from 'next/server';
import ShoppingDuty from '@/models/ShoppingDuty';
import connectDB from '@/lib/db';
import { getSession } from '@/lib/auth';
import { getWeekStart } from '@/lib/dateUtils';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ khataId: string }> }) {
    try {
        await connectDB();
        const user = await getSession(req);
        if (!user) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

        const { khataId } = await params;

        if (user.khataId !== khataId) {
            return NextResponse.json({ message: 'Access denied' }, { status: 403 });
        }

        const weekStart = getWeekStart();

        const shoppingDuty = await ShoppingDuty.findOne({
            khataId,
            weekStart
        });

        if (!shoppingDuty) {
            return NextResponse.json({ items: [] });
        }

        return NextResponse.json({ items: shoppingDuty.items });

    } catch (error: any) {
        console.error('Error fetching roster:', error);
        return NextResponse.json({ message: 'Server error fetching shopping roster' }, { status: 500 });
    }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ khataId: string }> }) {
    try {
        await connectDB();
        const user = await getSession(req);
        if (!user) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

        if (user.role !== 'Manager') {
            return NextResponse.json({ message: 'Not authorized as Manager' }, { status: 403 });
        }

        const { khataId } = await params;
        const { items } = await req.json();

        if (user.khataId !== khataId) {
            return NextResponse.json({ message: 'Access denied' }, { status: 403 });
        }

        const weekStart = getWeekStart();

        const shoppingDuty = await ShoppingDuty.findOneAndUpdate(
            { khataId, weekStart },
            { khataId, items, weekStart },
            { upsert: true, new: true }
        );

        return NextResponse.json({ message: 'Shopping roster saved', items: shoppingDuty.items });

    } catch (error: any) {
        console.error('Error saving roster:', error);
        return NextResponse.json({ message: 'Server error saving shopping roster' }, { status: 500 });
    }
}
