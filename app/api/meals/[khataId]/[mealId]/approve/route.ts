import { NextRequest, NextResponse } from 'next/server';
import Meal from '@/models/Meal';
import connectDB from '@/lib/db';
import { getSession } from '@/lib/auth';
import { Role } from '@/types';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ khataId: string, mealId: string }> }) {
    try {
        await connectDB();
        const user = await getSession(req);
        if (!user) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

        const { khataId, mealId } = await params;

        if (user.khataId !== khataId || user.role !== Role.Manager) {
            return NextResponse.json({ message: 'Access denied' }, { status: 403 });
        }

        const meal = await Meal.findOne({ _id: mealId, khataId });

        if (!meal) {
            return NextResponse.json({ message: 'Meal entry not found' }, { status: 404 });
        }

        if (meal.status === 'Approved') {
            return NextResponse.json({ message: 'Meal entry already approved' });
        }

        meal.status = 'Approved';
        await meal.save();

        // Notify user
        try {
            const Notification = await import('@/models/Notification').then(mod => mod.default);
            await Notification.create({
                userId: meal.userId,
                khataId: khataId,
                type: 'approval',
                title: 'Meal Approved',
                message: `Your meal entry for ${new Date(meal.date).toLocaleDateString()} has been approved.`,
                read: false
            });
        } catch (error) {
            console.error('Error creating notification:', error);
        }

        return NextResponse.json(meal);

    } catch (error: any) {
        console.error('Error approving meal:', error);
        return NextResponse.json({ message: 'Server error approving meal' }, { status: 500 });
    }
}
