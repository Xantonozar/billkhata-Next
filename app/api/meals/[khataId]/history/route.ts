import { NextRequest, NextResponse } from 'next/server';
import MealHistory from '@/models/MealHistory';
import connectDB from '@/lib/db';
import { getSession } from '@/lib/auth';
import '@/models/User'; // Ensure User model is registered for populate

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ khataId: string }> }) {
    try {
        await connectDB();
        const user = await getSession(req);
        if (!user) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

        const { khataId } = await params;
        const { searchParams } = new URL(req.url); // Use new URL(req.url) explicitly
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const userId = searchParams.get('userId');

        if (user.khataId !== khataId) {
            return NextResponse.json({ message: 'Access denied' }, { status: 403 });
        }

        const query: any = { khataId };

        // Members can only see their own history? 
        // User request says: "member can see his and manager changes on his meal"
        // So if userId param is provided, filter by targetUserId.
        // If not provided, and user is manager, show all? Or show history for currently logged in user?
        // Let's assume frontend will pass the userId of the person whose history we are viewing.

        if (userId) {
            query.targetUserId = userId;
        } else if (user.role === 'Member') {
            // If member doesn't specify (or tries to see others), force their own id
            query.targetUserId = user._id;
        }

        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        const history = await MealHistory.find(query)
            .sort({ createdAt: -1 })
            .populate('changedByUserId', 'name role')
            .populate('targetUserId', 'name')
            .limit(50)
            .lean(); // Limit to last 50 changes to avoid overload

        return NextResponse.json(history);

    } catch (error: any) {
        console.error('Error fetching meal history:', error);
        return NextResponse.json({ message: 'Server error fetching meal history' }, { status: 500 });
    }
}
