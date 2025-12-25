import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import connectDB from '@/lib/db';
import { verifyOTP, isOTPExpired } from '@/lib/otp';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        await connectDB();

        const { email, otp, newPassword } = await req.json();

        if (!email || !otp || !newPassword) {
            return NextResponse.json(
                { message: 'Email, OTP, and new password are required' },
                { status: 400 }
            );
        }

        // Validate password strength
        if (newPassword.length < 6) {
            return NextResponse.json(
                { message: 'Password must be at least 6 characters long' },
                { status: 400 }
            );
        }

        // Find user with OTP fields
        const user = await User.findOne({ email }).select('+otp +otpExpires +password');

        if (!user) {
            return NextResponse.json(
                { message: 'Invalid request' },
                { status: 400 }
            );
        }

        if (!user.otp || !user.otpExpires) {
            return NextResponse.json(
                { message: 'No password reset request found. Please request a new one.' },
                { status: 400 }
            );
        }

        // Check if OTP is expired
        if (isOTPExpired(user.otpExpires)) {
            return NextResponse.json(
                { message: 'OTP has expired. Please request a new one.' },
                { status: 400 }
            );
        }

        // Verify OTP
        const isValid = await verifyOTP(otp, user.otp);

        if (!isValid) {
            return NextResponse.json(
                { message: 'Invalid OTP' },
                { status: 400 }
            );
        }

        // Update password and clear OTP
        user.password = newPassword;
        user.otp = null;
        user.otpExpires = null;
        await user.save(); // This will trigger the password hashing pre-save hook

        console.log('✅ Password reset successful for:', email);

        return NextResponse.json({
            message: 'Password reset successfully. You can now login with your new password.'
        });
    } catch (error: any) {
        console.error('❌ Reset password error:', error);
        return NextResponse.json(
            { message: error.message || 'Server error' },
            { status: 500 }
        );
    }
}
