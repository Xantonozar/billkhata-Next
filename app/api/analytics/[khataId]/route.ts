import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import { getSession } from '@/lib/auth';
import Expense from '@/models/Expense';
import Bill from '@/models/Bill';
import Deposit from '@/models/Deposit';
import Meal from '@/models/Meal';

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

        const now = new Date();
        let startDate = new Date(); // Default to beginning of time if not specified, but logic below sets it

        if (range === 'This Month') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        } else if (range === 'Last 30 Days') {
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        } else {
            // Default to this month if unknown
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        // --- Aggregations ---

        // 1. Total Shopping Expenses (Approved only)
        const expenseAgg = await Expense.aggregate([
            {
                $match: {
                    khataId,
                    status: 'Approved',
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' }
                }
            }
        ]);
        const totalShoppingExpenses = expenseAgg[0]?.total || 0;

        // 2. Total Bills (Based on Due Date)
        const billAgg = await Bill.aggregate([
            {
                $match: {
                    khataId,
                    dueDate: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$totalAmount' }
                }
            }
        ]);
        const totalBillAmount = billAgg[0]?.total || 0;

        // 3. Total Deposits (Approved only)
        const depositAgg = await Deposit.aggregate([
            {
                $match: {
                    khataId,
                    status: 'Approved',
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' }
                }
            }
        ]);
        const totalDeposits = depositAgg[0]?.total || 0;

        // 4. Meal Stats (Total Meals)
        const mealAgg = await Meal.aggregate([
            {
                $match: {
                    khataId,
                    date: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: null,
                    totalMeals: { $sum: '$totalMeals' }
                }
            }
        ]);
        const totalMealsCount = mealAgg[0]?.totalMeals || 0;


        // 5. Bill Categories
        const billCategoryAgg = await Bill.aggregate([
            {
                $match: {
                    khataId,
                    dueDate: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: '$category',
                    value: { $sum: '$totalAmount' }
                }
            }
        ]);
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


        // 6. Trend Data (Last 6 Months) - Fixed range, ignored 'range' param
        const performTrendAggregation = async () => {
            const trendData = [];
            for (let i = 5; i >= 0; i--) {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                const month = d.getMonth();
                const year = d.getFullYear();
                const label = d.toLocaleDateString('en-US', { month: 'short' });

                const startOfMonth = new Date(year, month, 1);
                const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

                // We run 3 parallel aggregations per month - efficient enough for 6 months
                const [monthExpenses, monthBills, monthDeposits] = await Promise.all([
                    Expense.aggregate([
                        { $match: { khataId, status: 'Approved', createdAt: { $gte: startOfMonth, $lte: endOfMonth } } },
                        { $group: { _id: null, total: { $sum: '$amount' } } }
                    ]),
                    Bill.aggregate([
                        { $match: { khataId, dueDate: { $gte: startOfMonth, $lte: endOfMonth } } },
                        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
                    ]),
                    Deposit.aggregate([
                        { $match: { khataId, status: 'Approved', createdAt: { $gte: startOfMonth, $lte: endOfMonth } } },
                        { $group: { _id: null, total: { $sum: '$amount' } } }
                    ])
                ]);

                trendData.push({
                    label,
                    values: [
                        { name: 'Deposits', value: monthDeposits[0]?.total || 0, color: '#10b981' },
                        { name: 'Expenses', value: (monthExpenses[0]?.total || 0) + (monthBills[0]?.total || 0), color: '#ef4444' }
                    ]
                });
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
        const totalOutflow = totalBillAmount + totalShoppingExpenses;
        const fundHealth = totalDeposits - totalOutflow;

        return NextResponse.json({
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
        });

    } catch (error: any) {
        console.error('Analytics error:', error);
        return NextResponse.json({ message: 'Server error processing analytics' }, { status: 500 });
    }
}
