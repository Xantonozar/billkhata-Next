import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import connectDB from '@/lib/db';
import { generateOTP, getOTPExpiry } from '@/lib/otp';
import { sendVerificationEmail } from '@/lib/brevo';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Simple in-memory rate limiting (for production, use Redis)
// NOTE: For production or serverless deployments, this should be replaced with a centralized
// TTL-backed store (Redis) to ensure correctness across instances and prevent memory leaks.
const rateLimitMap = new Map<string, { count: number; firstRequest: number; expiresAt: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 3; // Max 3 OTP requests per minute
const CLEANUP_INTERVAL = 5 * 60 * 1000; // Clean up every 5 minutes

// Periodic cleanup to remove stale entries
function cleanupStaleEntries() {
    const now = Date.now();
    for (const [email, record] of rateLimitMap.entries()) {
        if (now >= record.expiresAt) {
            rateLimitMap.delete(email);
        }
    }
}

// Start periodic cleanup
if (typeof setInterval !== 'undefined') {
    setInterval(cleanupStaleEntries, CLEANUP_INTERVAL);
}

function checkRateLimit(email: string): boolean {
    const now = Date.now();
    const record = rateLimitMap.get(email);

    // Delete expired entry if found
    if (record && now >= record.expiresAt) {
        rateLimitMap.delete(email);
    }

    // Create new entry if none exists or was just deleted
    if (!record || now >= record.expiresAt) {
        rateLimitMap.set(email, {
            count: 1,
            firstRequest: now,
            expiresAt: now + RATE_LIMIT_WINDOW
        });
        return true;
    }

    // Check if rate limit exceeded
    if (record.count >= MAX_REQUESTS) {
        return false;
    }

    // Increment count
    record.count++;
    return true;
}

export async function POST(req: NextRequest) {
    try {
        await connectDB();

        // Try to get email from authenticated session first
        const sessionUser = await getSession(req);
        const body = await req.json();
        
        // Use email from session if available, otherwise from request body
        const email = sessionUser?.email || body.email;

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

        // Find user
        const user = await User.findOne({ email });

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

        // Generate new OTP
        const otp = generateOTP();
        const otpExpires = getOTPExpiry();

        // Update user with new OTP (pre-save hook will hash it)
        user.otp = otp;
        user.otpExpires = otpExpires;
        await user.save();

        // Send verification email
        await sendVerificationEmail(email, otp);

        // Safe debug logging: only in development with DEBUG_OTP flag, and mask the OTP
        if (process.env.NODE_ENV === 'development' && process.env.DEBUG_OTP === 'true') {
            const maskedOtp = otp.length > 4 
                ? `${otp.substring(0, 2)}${'*'.repeat(otp.length - 4)}${otp.substring(otp.length - 2)}`
                : '****';
            console.log('📧 OTP resent for', email, ':', maskedOtp);
        }

        return NextResponse.json({
            message: 'Verification code sent to your email'
        });
    } catch (error: any) {
        console.error('❌ Resend OTP error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
