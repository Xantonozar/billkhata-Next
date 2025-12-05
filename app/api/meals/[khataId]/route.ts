import { NextRequest, NextResponse } from 'next/server';
import Meal from '@/models/Meal';
import MealFinalization from '@/models/MealFinalization';
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

        if (user.khataId !== khataId) {
            return NextResponse.json({ message: 'Access denied' }, { status: 403 });
        }

        const query: any = { khataId };
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        const meals = await Meal.find(query).sort({ date: -1 });
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

        if (user.khataId !== khataId) {
            return NextResponse.json({ message: 'Access denied' }, { status: 403 });
        }

        if (!date) {
            return NextResponse.json({ message: 'Date is required' }, { status: 400 });
        }

        const mealDate = new Date(date);
        mealDate.setHours(0, 0, 0, 0);

        const finalization = await MealFinalization.findOne({
            khataId,
            date: mealDate
        });

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

        let meal = await Meal.findOne({
            khataId,
            userId: targetUserId,
            date: mealDate
        });

        if (meal) {
            meal.breakfast = breakfast !== undefined ? breakfast : meal.breakfast;
            meal.lunch = lunch !== undefined ? lunch : meal.lunch;
            meal.dinner = dinner !== undefined ? dinner : meal.dinner;
            await meal.save();
        } else {
            meal = await Meal.create({
                khataId,
                userId: targetUserId,
                userName: targetUserName,
                date: mealDate,
                breakfast: breakfast || 0,
                lunch: lunch || 0,
                dinner: dinner || 0
            });
        }

        return NextResponse.json(meal, { status: 201 });

    } catch (error: any) {
        console.error('Error saving meal:', error);
        return NextResponse.json({ message: 'Server error saving meal' }, { status: 500 });
    }
}
