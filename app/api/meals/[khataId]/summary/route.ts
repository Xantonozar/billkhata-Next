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

        const { searchParams } = new URL(req.url);
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');

        let start: Date;
        let end: Date;

        if (startDateParam && endDateParam) {
            start = new Date(startDateParam);
            end = new Date(endDateParam);
        } else {
            const now = new Date();
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        }

        const [result] = await Meal.aggregate([
            {
                $match: {
                    khataId,
                    date: { $gte: start, $lte: end }
                }
            },
            {
                $facet: {
                    totalMealsStats: [
                        { $group: { _id: null, total: { $sum: '$totalMeals' } } }
                    ],
                    userMealsStats: [
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
                    ],
                    currentUserStats: [
                        { $match: { userId: user._id } },
                        { $group: { _id: null, total: { $sum: '$totalMeals' } } }
                    ]
                }
            }
        ]);

        const totalMeals = result.totalMealsStats[0]?.total || 0;
        const userMealsStats = result.userMealsStats;
        const currentUserMeals = result.currentUserStats[0]?.total || 0;

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
