import { NextRequest, NextResponse } from 'next/server';
import MealFinalization from '@/models/MealFinalization';
import connectDB from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ khataId: string }> }) {
    try {
        await connectDB();
        const user = await getSession(req);
        if (!user) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

        if (user.role !== 'Manager') {
            return NextResponse.json({ message: 'Not authorized as Manager' }, { status: 403 });
        }

        const { khataId } = await params;
        const { date } = await req.json();

        if (user.khataId !== khataId) {
            return NextResponse.json({ message: 'Access denied' }, { status: 403 });
        }

        if (!date) {
            return NextResponse.json({ message: 'Date is required' }, { status: 400 });
        }

        const finalizeDate = new Date(date);
        finalizeDate.setHours(0, 0, 0, 0);

        let finalization = await MealFinalization.findOne({
            khataId,
            date: finalizeDate
        });

        if (finalization) {
            return NextResponse.json({ message: 'Already finalized', finalization });
        }

        finalization = await MealFinalization.create({
            khataId,
            date: finalizeDate,
            finalizedBy: user._id,
            finalizedByName: user.name
        });

        return NextResponse.json(finalization, { status: 201 });

    } catch (error: any) {
        console.error('Error finalizing meals:', error);
        return NextResponse.json({ message: 'Server error finalizing meals' }, { status: 500 });
    }
}
