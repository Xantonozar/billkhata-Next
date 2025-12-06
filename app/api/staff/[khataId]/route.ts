import { NextRequest, NextResponse } from 'next/server';
import Staff from '@/models/Staff';
import connectDB from '@/lib/db';
import { getSession } from '@/lib/auth';
import { Role } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ khataId: string }> }) {
    try {
        await connectDB();
        const user = await getSession(req);
        if (!user) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

        const { khataId } = await params;

        // Verify user belongs to this khata
        if (user.khataId !== khataId) {
            return NextResponse.json({ message: 'Not authorized for this room' }, { status: 403 });
        }

        const staff = await Staff.find({ khataId }).sort({ createdAt: -1 });

        return NextResponse.json(staff);
    } catch (error: any) {
        console.error('Get staff error:', error);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ khataId: string }> }) {
    try {
        await connectDB();
        const user = await getSession(req);
        if (!user) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

        const { khataId } = await params;

        // Managers only
        if (user.role !== Role.Manager || user.khataId !== khataId) {
            return NextResponse.json({ message: 'Only managers can add staff' }, { status: 403 });
        }

        const body = await req.json();
        const { name, designation, phone } = body;

        if (!name || !designation || !phone) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        const newStaff = await Staff.create({
            khataId,
            name,
            designation,
            phone
        });

        return NextResponse.json(newStaff, { status: 201 });
    } catch (error: any) {
        console.error('Create staff error:', error);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}
