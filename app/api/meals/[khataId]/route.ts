import { NextRequest, NextResponse } from 'next/server';
import Meal from '@/models/Meal';
import MealFinalization from '@/models/MealFinalization';
import '@/models/User'; // Ensure User model is registered for populate
import connectDB from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ khataId: string }> }) {
    try {
        await connectDB();
        const user = await getSession(req);
        if (!user) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

        const { khataId } = await params;
        const { searchParams } = new URL(req.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        const status = searchParams.get('status');
        const calculationPeriodId = searchParams.get('calculationPeriodId');

        if (user.khataId !== khataId) {
            return NextResponse.json({ message: 'Access denied' }, { status: 403 });
        }

        const query: any = { khataId };

        if (status) {
            query.status = status;
        }

        if (calculationPeriodId) {
            query.calculationPeriodId = calculationPeriodId;
        }

        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        const meals = await Meal.find(query).sort({ date: -1 }).populate('userId', 'name').lean(); // Populate user data
        return NextResponse.json(meals);

    } catch (error: any) {
        console.error('Error fetching meals:', error);
        return NextResponse.json({ message: 'Server error fetching meals' }, { status: 500 });
    }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ khataId: string }> }) {
    try {
        await connectDB();
        const user = await getSession(req);
        if (!user) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

        const { khataId } = await params;
        const { date, breakfast, lunch, dinner, userId, userName } = await req.json();

        console.log('Received meal update:', { date, breakfast, lunch, dinner, userId, userName });

        if (user.khataId !== khataId) {
            return NextResponse.json({ message: 'Access denied' }, { status: 403 });
        }

        if (!date) {
            return NextResponse.json({ message: 'Date is required' }, { status: 400 });
        }

        const mealDate = new Date(date);
        mealDate.setUTCHours(0, 0, 0, 0);

        const finalization = await MealFinalization.findOne({
            khataId,
            date: mealDate
        });

        // Find active calculation period for association
        const CalculationPeriod = await import('@/models/CalculationPeriod').then(mod => mod.default);
        const activePeriod = await CalculationPeriod.findOne({
            khataId,
            status: 'Active'
        });

        // Only allow meal updates if a period is active? 
        // Or if the specific date falls within an active period?
        // For simplicity, we associate new updates with the current active period if it exists.
        // Ideally, we'd check if the date falls within the period, but let's stick to association for now.

        let targetUserId = user._id;
        let targetUserName = user.name;

        if (userId && userId !== user._id.toString()) {
            if (user.role !== 'Manager') {
                return NextResponse.json({ message: 'Only managers can update other members\' meals' }, { status: 403 });
            }
            targetUserId = userId;
            if (userName) targetUserName = userName;
        } else {
            if (finalization && user.role !== 'Manager') {
                return NextResponse.json({
                    message: 'This date has been finalized by the manager. You cannot update your meals.',
                    isFinalized: true
                }, { status: 403 });
            }
        }

        const b = typeof breakfast === 'number' ? breakfast : 0;
        const l = typeof lunch === 'number' ? lunch : 0;
        const d = typeof dinner === 'number' ? dinner : 0;
        const totalMeals = b + l + d;

        // Use findOneAndUpdate with upsert to handle race conditions
        const meal = await Meal.findOneAndUpdate(
            {
                khataId,
                userId: targetUserId,
                date: mealDate
            },
            {
                $set: {
                    userName: targetUserName, // Ensure name is up to date
                    breakfast: b,
                    lunch: l,
                    dinner: d,
                    totalMeals: totalMeals,
                    // All meal updates are auto-approved/live, but logged in history
                    status: 'Approved',
                    calculationPeriodId: activePeriod ? activePeriod._id : undefined
                }
            },
            {
                new: true,
                upsert: true,
                setDefaultsOnInsert: true,
                runValidators: true
            }
        );

        // Create History Log
        try {
            const MealHistory = await import('@/models/MealHistory').then(mod => mod.default);
            await MealHistory.create({
                khataId,
                targetUserId: targetUserId,
                changedByUserId: user._id,
                date: mealDate,
                breakfast: b,
                lunch: l,
                dinner: d
            });
        } catch (historyError) {
            console.error('Error logging meal history:', historyError);
        }


        // NEW: Real-time Notifications for Meal Update
        try {
            const { pushToRoom, pushToUser } = await import('@/lib/pusher');

            if (user.role === 'Manager' && targetUserId.toString() !== user._id.toString()) {
                // Manager updated a member's meal -> Notify Member
                await pushToUser(targetUserId.toString(), 'meal-updated', {
                    type: 'meal-updated',
                    message: `Manager updated your meal for ${mealDate.toLocaleDateString()}`
                });
            } else {
                // Member updated their own meal -> Notify Manager
                // We use 'meal-updated' on room channel but filtered for Manager in frontend
                // OR we can just use pushToRoom and let manager filter it
                // Actually, let's keep it simple: pushToRoom 'meal-updated' (Manager listens to this)
                await pushToRoom(khataId, 'meal-updated', {
                    type: 'meal-updated',
                    message: `${user.name} updated their meal for ${mealDate.toLocaleDateString()}`
                });
            }
        } catch (pusherErr) {
            console.error('Pusher error:', pusherErr);
        }

        return NextResponse.json(meal, { status: 201 });

    } catch (error: any) {
        console.error('Error saving meal:', error);
        return NextResponse.json({ message: 'Server error saving meal' }, { status: 500 });
    }
}
