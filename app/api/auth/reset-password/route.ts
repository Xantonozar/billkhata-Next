import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import connectDB from '@/lib/db';
import { isOTPExpired } from '@/lib/otp';
import { MIN_PASSWORD_LENGTH } from '@/lib/passwordConfig';
import crypto from 'crypto';

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
        if (newPassword.length < MIN_PASSWORD_LENGTH) {
            return NextResponse.json(
                { message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long` },
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
        const isValid = await user.compareOTP(otp);

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

        // Log using non-identifiable user ID (preferred) or hashed email as fallback
        const logIdentifier = user._id?.toString() || (() => {
            const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
            if (secret) {
                return crypto.createHmac('sha256', secret).update(email).digest('hex').substring(0, 16);
            }
            return 'unknown';
        })();
        console.log('✅ Password reset successful for user:', logIdentifier);

        return NextResponse.json({
            message: 'Password reset successfully. You can now login with your new password.'
        });
    } catch (error: any) {
        // Log full error details server-side (including stack trace)
        console.error('❌ Reset password error:', {
            message: error.message,
            stack: error.stack,
            error
        });
        
        // Return generic error message to client
        // Only include detailed error in development for debugging
        const isDevelopment = process.env.NODE_ENV !== 'production';
        const clientMessage = isDevelopment 
            ? (error.message || 'Internal server error')
            : 'Internal server error';
        
        return NextResponse.json(
            { message: clientMessage },
            { status: 500 }
        );
    }
}
