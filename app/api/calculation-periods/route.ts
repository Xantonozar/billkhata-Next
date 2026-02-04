import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import CalculationPeriod from '@/models/CalculationPeriod';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET: Get all calculation periods for the current user's room
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

        const periods = await CalculationPeriod.find({
            khataId: user.khataId
        })
            .populate('startedBy', 'name')
            .populate('endedBy', 'name')
            .sort({ startDate: -1 });

        return NextResponse.json(periods);
    } catch (error) {
        console.error('Error fetching calculation periods:', error);
        return NextResponse.json(
            { error: 'Failed to fetch calculation periods' },
            { status: 500 }
        );
    }
}

// POST: Create a new calculation period (start calculation)
export async function POST(req: NextRequest) {
    try {
        const user = await getSession(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        if (!user.khataId) {
            return NextResponse.json({ error: 'User not in a room' }, { status: 400 });
        }

        if (user.role !== 'Manager' && user.role !== 'MasterManager') {
            return NextResponse.json({ error: 'Only managers can start calculation periods' }, { status: 403 });
        }

        const body = await req.json();
        const { name } = body;

        if (!name) {
            return NextResponse.json({ error: 'Period name is required' }, { status: 400 });
        }

        // Check if there's already an active period
        const existingActivePeriod = await CalculationPeriod.findOne({
            khataId: user.khataId,
            status: 'Active'
        });

        if (existingActivePeriod) {
            return NextResponse.json(
                { error: 'An active calculation period already exists. Please end it before starting a new one.' },
                { status: 400 }
            );
        }

        // Create new calculation period

        const newPeriod = new CalculationPeriod({
            khataId: user.khataId,
            name,
            startDate: new Date(),
            status: 'Active',
            startedBy: user._id
        });

        await newPeriod.save();

        // Auto-assign any unallocated data (Deposits, Expenses, Meals) to this new period
        // This ensures items added before the period started are not lost
        const Deposit = await import('@/models/Deposit').then(mod => mod.default);
        const Expense = await import('@/models/Expense').then(mod => mod.default);
        const Meal = await import('@/models/Meal').then(mod => mod.default);

        await Promise.all([
            Deposit.updateMany(
                { khataId: user.khataId, calculationPeriodId: null },
                { $set: { calculationPeriodId: newPeriod._id } }
            ),
            Expense.updateMany(
                { khataId: user.khataId, calculationPeriodId: null },
                { $set: { calculationPeriodId: newPeriod._id } }
            ),
            Meal.updateMany(
                { khataId: user.khataId, calculationPeriodId: null },
                { $set: { calculationPeriodId: newPeriod._id } }
            )
        ]);

        await newPeriod.populate('startedBy', 'name');

        return NextResponse.json(newPeriod, { status: 201 });
    } catch (error: any) {
        console.error('Error creating calculation period:', error);

        // Handle unique constraint violation (duplicate active period)
        if (error.code === 11000) {
            return NextResponse.json(
                { error: 'An active calculation period already exists for this room' },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to create calculation period' },
            { status: 500 }
        );
    }
}
