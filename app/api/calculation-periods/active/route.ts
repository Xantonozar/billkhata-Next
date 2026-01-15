import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import CalculationPeriod from '@/models/CalculationPeriod';
import { getSession } from '@/lib/auth';

// GET: Get active calculation period for the current user's room
export async function GET(req: NextRequest) {
    try {
        const user = await getSession(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        if (!user.khataId) {
            return NextResponse.json({ error: 'User not in a room' }, { status: 400 });
        }

        const activePeriod = await CalculationPeriod.findOne({
            khataId: user.khataId,
            status: 'Active'
        })
            .populate('startedBy', 'name')
            .sort({ startDate: -1 });

        if (!activePeriod) {
            return NextResponse.json({ activePeriod: null });
        }

        return NextResponse.json({ activePeriod });
    } catch (error) {
        console.error('Error fetching active calculation period:', error);
        return NextResponse.json(
            { error: 'Failed to fetch active calculation period' },
            { status: 500 }
        );
    }
}
