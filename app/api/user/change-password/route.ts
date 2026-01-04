import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import connectDB from '@/lib/db';
import { getSession } from '@/lib/auth';
import { MIN_PASSWORD_LENGTH } from '@/lib/passwordConfig';
import crypto from 'crypto';

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
        if (newPassword.length < MIN_PASSWORD_LENGTH) {
            return NextResponse.json(
                { message: `New password must be at least ${MIN_PASSWORD_LENGTH} characters long` },
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
        // Log using hashed user identifier to protect PII
        const userIdString = sessionUser._id?.toString() || 'unknown';
        const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
        if (!secret) {
            console.warn('⚠️ Missing JWT_SECRET or NEXTAUTH_SECRET - logging user ID without hashing');
            console.log('✅ Password changed successfully for user:', userIdString);
            return NextResponse.json({
                message: 'Password changed successfully'
            });
        }
        const hashedUserId = crypto.createHmac('sha256', secret)
            .update(userIdString)
            .digest('hex')
            .substring(0, 16);
        console.log('✅ Password changed successfully for user:', hashedUserId);
        return NextResponse.json({
            message: 'Password changed successfully'
        });
    } catch (error: any) {
        console.error('❌ Change password error:', error);
        if (error.stack) {
            console.error('Error stack:', error.stack);
        }
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
