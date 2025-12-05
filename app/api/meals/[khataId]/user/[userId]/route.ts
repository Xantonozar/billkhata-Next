import { NextRequest, NextResponse } from 'next/server';
import Meal from '@/models/Meal';
import connectDB from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ khataId: string; userId: string }> }) {
    try {
        await connectDB();
        const user = await getSession(req);
        if (!user) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

        const { khataId, userId } = await params;

        if (user.khataId !== khataId) {
            return NextResponse.json({ message: 'Access denied' }, { status: 403 });
        }

        const meals = await Meal.find({ khataId, userId }).sort({ date: -1 });
        return NextResponse.json(meals);

    } catch (error: any) {
        console.error('Error fetching user meals:', error);
        return NextResponse.json({ message: 'Server error fetching user meals' }, { status: 500 });
    }
}
