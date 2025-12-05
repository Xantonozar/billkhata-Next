import { NextRequest, NextResponse } from 'next/server';
import Menu from '@/models/Menu';
import connectDB from '@/lib/db';
import { getSession } from '@/lib/auth';
import { getWeekStart } from '@/lib/dateUtils';

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

        const weekStart = getWeekStart();

        // Try to find menu for current week
        let menu = await Menu.findOne({
            khataId,
            weekStart,
            isPermanent: false
        });

        if (!menu) {
            // If no menu for current week, try to find permanent menu
            menu = await Menu.findOne({
                khataId,
                isPermanent: true
            });

            if (!menu) {
                return NextResponse.json([]);
            }
        }

        return NextResponse.json(menu.items);

    } catch (error: any) {
        console.error('Error fetching menu:', error);
        return NextResponse.json({ message: 'Server error fetching menu' }, { status: 500 });
    }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ khataId: string }> }) {
    try {
        await connectDB();
        const user = await getSession(req);
        if (!user) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

        if (user.role !== 'Manager') {
            return NextResponse.json({ message: 'Not authorized as Manager' }, { status: 403 });
        }

        const { khataId } = await params;
        const { items, isPermanent = false } = await req.json();

        if (user.khataId !== khataId) {
            return NextResponse.json({ message: 'Access denied' }, { status: 403 });
        }

        if (isPermanent) {
            // Update or create permanent menu
            const menu = await Menu.findOneAndUpdate(
                { khataId, isPermanent: true },
                { khataId, items, isPermanent: true, weekStart: new Date() },
                { upsert: true, new: true }
            );
            return NextResponse.json({ message: 'Permanent menu saved', items: menu.items });
        } else {
            // Update or create menu for current week
            const weekStart = getWeekStart();

            const menu = await Menu.findOneAndUpdate(
                { khataId, weekStart, isPermanent: false },
                { khataId, items, weekStart, isPermanent: false },
                { upsert: true, new: true }
            );
            return NextResponse.json({ message: 'Menu saved for this week', items: menu.items });
        }

    } catch (error: any) {
        console.error('Error saving menu:', error);
        return NextResponse.json({ message: 'Server error saving menu' }, { status: 500 });
    }
}
