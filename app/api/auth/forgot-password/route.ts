import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import connectDB from '@/lib/db';
import { generateOTP, hashOTP, getOTPExpiry } from '@/lib/otp';
import { sendPasswordResetEmail } from '@/lib/brevo';

export const dynamic = 'force-dynamic';

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; firstRequest: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 3;

function checkRateLimit(email: string): boolean {
    const now = Date.now();
    const record = rateLimitMap.get(email);

    if (!record) {
        rateLimitMap.set(email, { count: 1, firstRequest: now });
        return true;
    }

    if (now - record.firstRequest > RATE_LIMIT_WINDOW) {
        rateLimitMap.set(email, { count: 1, firstRequest: now });
        return true;
    }

    if (record.count >= MAX_REQUESTS) {
        return false;
    }

    record.count++;
    return true;
}

export async function POST(req: NextRequest) {
    try {
        await connectDB();

        const { email } = await req.json();

        if (!email) {
            return NextResponse.json(
                { message: 'Email is required' },
                { status: 400 }
            );
        }

        // Rate limiting
        if (!checkRateLimit(email)) {
            return NextResponse.json(
                { message: 'Too many requests. Please wait a minute before trying again.' },
                { status: 429 }
            );
        }

        // Find user (don't reveal if user exists or not for security)
        const user = await User.findOne({ email });

        if (!user) {
            // Return success even if user doesn't exist (security best practice)
            return NextResponse.json({
                message: 'If an account exists with this email, you will receive a password reset code.'
            });
        }

        // Generate OTP
        const otp = generateOTP();
        const hashedOtp = await hashOTP(otp);
        const otpExpires = getOTPExpiry();

        // Update user with reset OTP
        await User.findByIdAndUpdate(user._id, {
            otp: hashedOtp,
            otpExpires
        });

        // Send password reset email
        await sendPasswordResetEmail(email, otp);

        console.log('📧 Password reset OTP for', email, ':', otp); // Remove in production

        return NextResponse.json({
            message: 'If an account exists with this email, you will receive a password reset code.'
        });
    } catch (error: any) {
        console.error('❌ Forgot password error:', error);
        return NextResponse.json(
            { message: error.message || 'Server error' },
            { status: 500 }
        );
    }
}
