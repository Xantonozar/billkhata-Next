import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import { getSession } from '@/lib/auth';
import Expense from '@/models/Expense';
import Bill from '@/models/Bill';
import Deposit from '@/models/Deposit';
import Meal from '@/models/Meal';
import { globalCache } from '@/lib/cache';

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
        const range = searchParams.get('range') || 'This Month';

        // Check cache first (3 minute cache for analytics)
        const cacheKey = `analytics:${khataId}:${range}`;
        const cachedData = globalCache.getValue(cacheKey);
        if (cachedData) {
            return NextResponse.json(cachedData);
        }

        const now = new Date();
        let startDate = new Date();

        if (range === 'This Month') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        } else if (range === 'Last 6 Months') {
            // Start from 6 months ago, first day of that month
            startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        } else {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        // --- Run all initial aggregations in parallel (5 queries) ---
        const [expenseAgg, billAgg, depositAgg, mealAgg, billCategoryAgg] = await Promise.all([
            // 1. Total Shopping Expenses (Approved only)
            Expense.aggregate([
                { $match: { khataId, status: 'Approved', createdAt: { $gte: startDate } } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            // 2. Total Bills (Based on Due Date)
            Bill.aggregate([
                { $match: { khataId, dueDate: { $gte: startDate } } },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } }
            ]),
            // 3. Total Deposits (Approved only)
            Deposit.aggregate([
                { $match: { khataId, status: 'Approved', createdAt: { $gte: startDate } } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            // 4. Meal Stats (Total Meals)
            Meal.aggregate([
                { $match: { khataId, date: { $gte: startDate } } },
                { $group: { _id: null, totalMeals: { $sum: '$totalMeals' } } }
            ]),
            // 5. Bill Categories
            Bill.aggregate([
                { $match: { khataId, dueDate: { $gte: startDate } } },
                { $group: { _id: '$category', value: { $sum: '$totalAmount' } } }
            ])
        ]);

        const totalShoppingExpenses = expenseAgg[0]?.total || 0;
        const totalBillAmount = billAgg[0]?.total || 0;
        const totalDeposits = depositAgg[0]?.total || 0;
        const totalMealsCount = mealAgg[0]?.totalMeals || 0;

        const billCategories = billCategoryAgg.map(item => ({
            label: item._id,
            value: item.value || 0
        }));

        // Add Shopping as a category
        if (totalShoppingExpenses > 0) {
            billCategories.push({
                label: 'Shopping',
                value: totalShoppingExpenses
            });
        }

        // Asset Colors for categories
        const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#14b8a6'];
        const billCategoryData = billCategories.map((item, index) => ({
            ...item,
            color: colors[index % colors.length]
        }));


        // 6. Trend Data (Last 6 Months)
        const performTrendAggregation = async () => {
            const trendData = [];

            // 1. Get all unique bill categories used in the last 6 months
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
            sixMonthsAgo.setDate(1);

            const distinctCategories = await Bill.distinct('category', {
                khataId,
                dueDate: { $gte: sixMonthsAgo }
            });

            // Color palette for dynamic categories
            const categoryColors: Record<string, string> = {};
            const availableColors = ['#f59e0b', '#ec4899', '#6366f1', '#14b8a6', '#84cc16', '#06b6d4', '#d946ef', '#f43f5e'];
            distinctCategories.forEach((cat, index) => {
                categoryColors[cat] = availableColors[index % availableColors.length];
            });

            for (let i = 5; i >= 0; i--) {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                const month = d.getMonth();
                const year = d.getFullYear();
                const label = d.toLocaleDateString('en-US', { month: 'short' });

                const startOfMonth = new Date(year, month, 1);
                const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

                // Run parallel aggregations
                const [monthShopping, monthBillsTotal, monthBillsByCategory, monthDeposits] = await Promise.all([
                    // Shopping Expenses (Only from Expense model)
                    Expense.aggregate([
                        { $match: { khataId, status: 'Approved', createdAt: { $gte: startOfMonth, $lte: endOfMonth } } },
                        { $group: { _id: null, total: { $sum: '$amount' } } }
                    ]),
                    // Total Bills
                    Bill.aggregate([
                        { $match: { khataId, dueDate: { $gte: startOfMonth, $lte: endOfMonth } } },
                        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
                    ]),
                    // Bills by Category
                    Bill.aggregate([
                        { $match: { khataId, dueDate: { $gte: startOfMonth, $lte: endOfMonth } } },
                        { $group: { _id: '$category', total: { $sum: '$totalAmount' } } }
                    ]),
                    // Deposits
                    Deposit.aggregate([
                        { $match: { khataId, status: 'Approved', createdAt: { $gte: startOfMonth, $lte: endOfMonth } } },
                        { $group: { _id: null, total: { $sum: '$amount' } } }
                    ])
                ]);

                // Construct values array
                const values = [
                    {
                        name: 'Deposits',
                        value: monthDeposits[0]?.total || 0,
                        color: '#10b981' // Green
                    },
                    {
                        name: 'Shopping',
                        value: monthShopping[0]?.total || 0,
                        color: '#ef4444' // Red
                    },
                    {
                        name: 'All Bills',
                        value: monthBillsTotal[0]?.total || 0,
                        color: '#3b82f6' // Blue
                    }
                ];

                // Add dynamic bill categories (ensure all distinct categories exist for every month)
                distinctCategories.forEach(cat => {
                    const found = monthBillsByCategory.find((c: any) => c._id === cat);
                    values.push({
                        name: cat as string,
                        value: found ? found.total : 0,
                        color: categoryColors[cat as string] || '#94a3b8'
                    });
                });

                trendData.push({ label, values });
            }
            return trendData;
        };

        const trendData = await performTrendAggregation();

        // 7. General Stats (Counts)
        const [activeMembersCount, totalBillsCount] = await Promise.all([
            // We can't query 'User' directly easily as it's not by khataId primarily in our current simple setup, 
            // but we can count unique userIds in Meals or just assume Room Members logic if implemented.
            // For now, let's fetch members count via a simpler method if possible or just use what we have.
            // Actually, let's just count unique users who have a meal entry in the last 30 days as 'Active', 
            // or better, count total users with this khataId if we can. 
            // Since we can't import User easily without potentially circular deps or if it's fine:
            mongoose.models.User.countDocuments({ khataId }),
            Bill.countDocuments({ khataId })
        ]);

        const avgMealCost = totalMealsCount > 0 ? totalShoppingExpenses / totalMealsCount : 0;
        // Fund Health = Total Deposits - Total Shopping Expenses (not including bills)
        const fundHealth = totalDeposits - totalShoppingExpenses;

        const responseData = {
            totalShoppingExpenses,
            totalBillAmount,
            totalDeposits,
            totalMealsCount,
            avgMealCost,
            fundHealth,
            billCategoryData,
            trendData,
            stats: {
                activeMembers: activeMembersCount,
                totalBills: totalBillsCount
            }
        };

        // Cache the response for 3 minutes (180 seconds)
        globalCache.set(cacheKey, responseData, 180);

        return NextResponse.json(responseData);

    } catch (error: any) {
        console.error('Analytics error:', error);
        return NextResponse.json({ message: 'Server error processing analytics' }, { status: 500 });
    }
}
