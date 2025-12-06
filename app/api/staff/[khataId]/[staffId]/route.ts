import { NextRequest, NextResponse } from 'next/server';
import Staff from '@/models/Staff';
import connectDB from '@/lib/db';
import { getSession } from '@/lib/auth';
import { Role } from '@/types';

export const dynamic = 'force-dynamic';

// Update Staff
export async function PUT(req: NextRequest, { params }: { params: Promise<{ khataId: string; staffId: string }> }) {
    try {
        await connectDB();
        const user = await getSession(req);
        if (!user) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

        const { khataId, staffId } = await params;

        // Managers only
        if (user.role !== Role.Manager || user.khataId !== khataId) {
            return NextResponse.json({ message: 'Only managers can update staff' }, { status: 403 });
        }

        const body = await req.json();

        const updatedStaff = await Staff.findByIdAndUpdate(
            staffId,
            { ...body },
            { new: true, runValidators: true }
        );

        if (!updatedStaff) {
            return NextResponse.json({ message: 'Staff member not found' }, { status: 404 });
        }

        return NextResponse.json(updatedStaff);
    } catch (error: any) {
        console.error('Update staff error:', error);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}

// Delete Staff
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ khataId: string; staffId: string }> }) {
    try {
        await connectDB();
        const user = await getSession(req);
        if (!user) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

        const { khataId, staffId } = await params;

        // Managers only
        if (user.role !== Role.Manager || user.khataId !== khataId) {
            return NextResponse.json({ message: 'Only managers can delete staff' }, { status: 403 });
        }

        const deletedStaff = await Staff.findByIdAndDelete(staffId);

        if (!deletedStaff) {
            return NextResponse.json({ message: 'Staff member not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Staff deleted successfully' });
    } catch (error: any) {
        console.error('Delete staff error:', error);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}
