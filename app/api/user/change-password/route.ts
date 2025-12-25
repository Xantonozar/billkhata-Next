import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import connectDB from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        await connectDB();

        // Get current user session
        const sessionUser = await getSession(req);
        if (!sessionUser) {
            return NextResponse.json(
                { message: 'Not authorized' },
                { status: 401 }
            );
        }

        const { currentPassword, newPassword } = await req.json();

        if (!currentPassword || !newPassword) {
            return NextResponse.json(
                { message: 'Current password and new password are required' },
                { status: 400 }
            );
        }

        // Validate new password strength
        if (newPassword.length < 6) {
            return NextResponse.json(
                { message: 'New password must be at least 6 characters long' },
                { status: 400 }
            );
        }

        // Get user with password
        const user = await User.findById(sessionUser._id).select('+password');

        if (!user) {
            return NextResponse.json(
                { message: 'User not found' },
                { status: 404 }
            );
        }

        // Verify current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return NextResponse.json(
                { message: 'Current password is incorrect' },
                { status: 400 }
            );
        }

        // Check if new password is same as old password
        const isSamePassword = await user.comparePassword(newPassword);
        if (isSamePassword) {
            return NextResponse.json(
                { message: 'New password must be different from current password' },
                { status: 400 }
            );
        }

        // Update password
        user.password = newPassword;
        await user.save(); // This will trigger the password hashing pre-save hook

        console.log('✅ Password changed for user:', sessionUser._id);

        return NextResponse.json({
            message: 'Password changed successfully'
        });
    } catch (error: any) {
        console.error('❌ Change password error:', error);
        return NextResponse.json(
            { message: error.message || 'Server error' },
            { status: 500 }
        );
    }
}
