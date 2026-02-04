import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import CalculationPeriod from '@/models/CalculationPeriod';
import { getSession } from '@/lib/auth';

// POST: End a calculation period
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ periodId: string }> }
) {
    try {
        const { periodId } = await params;
        const user = await getSession(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        if (!user.khataId) {
            return NextResponse.json({ error: 'User not in a room' }, { status: 400 });
        }

        if (user.role !== 'Manager' && user.role !== 'MasterManager') {
            return NextResponse.json({ error: 'Only managers can end calculation periods' }, { status: 403 });
        }

        const period = await CalculationPeriod.findById(periodId);
        if (!period) {
            return NextResponse.json({ error: 'Calculation period not found' }, { status: 404 });
        }

        if (period.khataId !== user.khataId) {
            return NextResponse.json({ error: 'Unauthorized to modify this period' }, { status: 403 });
        }

        if (period.status === 'Ended') {
            return NextResponse.json({ error: 'This period has already ended' }, { status: 400 });
        }

        period.status = 'Ended';
        period.endDate = new Date();
        period.endedBy = user._id;

        await period.save();
        await period.populate(['startedBy', 'endedBy'], 'name');

        return NextResponse.json(period);
    } catch (error) {
        console.error('Error ending calculation period:', error);
        return NextResponse.json(
            { error: 'Failed to end calculation period' },
            { status: 500 }
        );
    }
}
