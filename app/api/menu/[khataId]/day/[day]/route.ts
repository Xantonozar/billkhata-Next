import { NextRequest, NextResponse } from 'next/server';
import Menu from '@/models/Menu';
import connectDB from '@/lib/db';
import { getSession } from '@/lib/auth';
import { getWeekStart } from '@/lib/dateUtils';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ khataId: string; day: string }> }) {
    try {
        await connectDB();
        const user = await getSession(req);
        if (!user) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

        if (user.role !== 'Manager' && user.role !== 'MasterManager') {
            return NextResponse.json({ message: 'Not authorized as Manager' }, { status: 403 });
        }

        const { khataId, day } = await params;
        const { breakfast, lunch, dinner } = await req.json();

        if (user.khataId !== khataId) {
            return NextResponse.json({ message: 'Access denied' }, { status: 403 });
        }

        const weekStart = getWeekStart();

        // Find or create menu for current week
        let menu = await Menu.findOne({
            khataId,
            weekStart,
            isPermanent: false
        });

        if (!menu) {
            // Create new menu with all days
            const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            const items = daysOfWeek.map(d => ({
                day: d,
                breakfast: d === day ? (breakfast || '') : '',
                lunch: d === day ? (lunch || '') : '',
                dinner: d === day ? (dinner || '') : ''
            }));

            menu = await Menu.create({
                khataId,
                weekStart,
                items,
                isPermanent: false
            });
        } else {
            // Update existing menu
            const dayIndex = menu.items.findIndex((item: any) => item.day === day);
            if (dayIndex !== -1) {
                if (breakfast !== undefined) menu.items[dayIndex].breakfast = breakfast;
                if (lunch !== undefined) menu.items[dayIndex].lunch = lunch;
                if (dinner !== undefined) menu.items[dayIndex].dinner = dinner;
            } else {
                menu.items.push({ day, breakfast: breakfast || '', lunch: lunch || '', dinner: dinner || '' });
            }
            await menu.save();
        }

        return NextResponse.json({ message: 'Menu updated', items: menu.items });

    } catch (error: any) {
        console.error('Update menu error:', error);
        return NextResponse.json({ message: 'Server error updating menu' }, { status: 500 });
    }
}
