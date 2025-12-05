import { NextRequest, NextResponse } from 'next/server';
import MealFinalization from '@/models/MealFinalization';
import connectDB from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ khataId: string; date: string }> }) {
    try {
        await connectDB();
        const user = await getSession(req);
        if (!user) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

        const { khataId, date } = await params;

        if (user.khataId !== khataId) {
            return NextResponse.json({ message: 'Access denied' }, { status: 403 });
        }

        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);

        const finalization = await MealFinalization.findOne({
            khataId,
            date: checkDate
        });

        if (finalization) {
            return NextResponse.json({ isFinalized: true, finalization });
        } else {
            return NextResponse.json({ isFinalized: false });
        }

    } catch (error: any) {
        console.error('Error checking finalization:', error);
        return NextResponse.json({ message: 'Server error checking finalization' }, { status: 500 });
    }
}
