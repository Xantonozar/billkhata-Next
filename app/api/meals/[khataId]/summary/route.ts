import { NextRequest, NextResponse } from 'next/server';
import Meal from '@/models/Meal';
import connectDB from '@/lib/db';
import { getSession } from '@/lib/auth';

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

        const totalMealsStats = await Meal.aggregate([
            { $match: { khataId } },
            { $group: { _id: null, total: { $sum: '$totalMeals' } } }
        ]);
        const totalMeals = totalMealsStats.length > 0 ? totalMealsStats[0].total : 0;

        const userMealsStats = await Meal.aggregate([
            { $match: { khataId } },
            {
                $group: {
                    _id: '$userId',
                    userName: { $first: '$userName' },
                    totalMeals: { $sum: '$totalMeals' },
                    breakfast: { $sum: { $cond: ['$breakfast', 1, 0] } },
                    lunch: { $sum: { $cond: ['$lunch', 1, 0] } },
                    dinner: { $sum: { $cond: ['$dinner', 1, 0] } }
                }
            },
            { $sort: { userName: 1 } }
        ]);

        const currentUserStats = await Meal.aggregate([
            { $match: { khataId, userId: user._id } },
            { $group: { _id: null, total: { $sum: '$totalMeals' } } }
        ]);
        const currentUserMeals = currentUserStats.length > 0 ? currentUserStats[0].total : 0;

        return NextResponse.json({
            totalMeals,
            currentUserMeals,
            userMeals: userMealsStats
        });

    } catch (error: any) {
        console.error('Error fetching meal summary:', error);
        return NextResponse.json({ message: 'Server error fetching meal summary' }, { status: 500 });
    }
}
