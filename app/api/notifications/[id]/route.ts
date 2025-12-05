import { NextRequest, NextResponse } from 'next/server';
import Notification from '@/models/Notification';
import connectDB from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDB();
        const user = await getSession(req);
        if (!user) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

        const { id } = await params;

        const notification = await Notification.findOneAndUpdate(
            { _id: id, userId: user._id },
            { read: true },
            { new: true }
        );

        if (!notification) {
            return NextResponse.json({ message: 'Notification not found' }, { status: 404 });
        }

        return NextResponse.json(notification);

    } catch (error: any) {
        console.error('Error marking notification as read:', error);
        return NextResponse.json({ message: 'Server error marking notification as read' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDB();
        const user = await getSession(req);
        if (!user) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

        const { id } = await params;

        const notification = await Notification.findOneAndDelete({
            _id: id,
            userId: user._id
        });

        if (!notification) {
            return NextResponse.json({ message: 'Notification not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Notification deleted' });

    } catch (error: any) {
        console.error('Error deleting notification:', error);
        return NextResponse.json({ message: 'Server error deleting notification' }, { status: 500 });
    }
}
