import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import connectDB from '@/lib/db';
import { verifyOTP, isOTPExpired } from '@/lib/otp';
import { globalCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        await connectDB();

        const { email, otp } = await req.json();

        if (!email || !otp) {
            return NextResponse.json(
                { message: 'Email and OTP are required' },
                { status: 400 }
            );
        }

        // Find user with OTP fields
        const user = await User.findOne({ email }).select('+otp +otpExpires');

        if (!user) {
            return NextResponse.json(
                { message: 'User not found' },
                { status: 404 }
            );
        }

        if (user.isVerified) {
            return NextResponse.json(
                { message: 'Email is already verified' },
                { status: 400 }
            );
        }

        if (!user.otp || !user.otpExpires) {
            return NextResponse.json(
                { message: 'No OTP found. Please request a new one.' },
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

        // Update user to verified and clear OTP
        await User.findByIdAndUpdate(user._id, {
            isVerified: true,
            otp: null,
            otpExpires: null
        });

        // Invalidate user cache so fresh data is fetched
        globalCache.delete(`user:${user._id}`);

        console.log('✅ Email verified for:', email);

        return NextResponse.json({
            message: 'Email verified successfully',
            isVerified: true
        });
    } catch (error: any) {
        console.error('❌ Email verification error:', error);
        return NextResponse.json(
            { message: error.message || 'Server error' },
            { status: 500 }
        );
    }
}
