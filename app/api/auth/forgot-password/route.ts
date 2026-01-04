import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import connectDB from '@/lib/db';
import { generateOTP, getOTPExpiry, hashOTP } from '@/lib/otp';
import { sendPasswordResetEmail } from '@/lib/brevo';
import { EmailSchema } from '@/lib/validation';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

// Simple in-memory rate limiting with per-email mutex to prevent race conditions
const rateLimitMap = new Map<string, { count: number; firstRequest: number }>();
const lockMap = new Map<string, Promise<void>>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 3; // Max 3 requests per minute

async function checkRateLimit(email: string): Promise<boolean> {
    // Wait for any existing lock for this email to be released
    while (lockMap.has(email)) {
        await lockMap.get(email);
    }

    // Create a new lock for this email
    let releaseLock: () => void;
    const lockPromise = new Promise<void>((resolve) => {
        releaseLock = resolve;
    });
    lockMap.set(email, lockPromise);

    try {
        const now = Date.now();
        const record = rateLimitMap.get(email);

        if (!record) {
            // Create new record atomically
            rateLimitMap.set(email, { count: 1, firstRequest: now });
            return true;
        }

        if (now - record.firstRequest > RATE_LIMIT_WINDOW) {
            // Reset window atomically
            rateLimitMap.set(email, { count: 1, firstRequest: now });
            return true;
        }

        if (record.count >= MAX_REQUESTS) {
            return false;
        }

        // Create new record with incremented count (avoid mutating in place)
        rateLimitMap.set(email, { count: record.count + 1, firstRequest: record.firstRequest });
        return true;
    } finally {
        // Release the lock
        releaseLock!();
        lockMap.delete(email);
    }
}

export async function POST(req: NextRequest) {
    let email: string | undefined;
    try {
        const body = await req.json();
        email = body?.email;

        if (!email) {
            return NextResponse.json(
                { message: 'Email is required' },
                { status: 400 }
            );
        }

        // Validate and normalize email format (trim and lowercase)
        const emailValidation = EmailSchema.safeParse(email);
        if (!emailValidation.success) {
            return NextResponse.json(
                { message: 'Invalid email' },
                { status: 400 }
            );
        }

        const normalizedEmail = emailValidation.data;

        await connectDB();

        // Rate limiting with per-email mutex to prevent race conditions
        if (!(await checkRateLimit(normalizedEmail))) {
            return NextResponse.json(
                { message: 'Too many requests. Please wait a minute before trying again.' },
                { status: 429 }
            );
        }

        // Always generate OTP and hash it before checking user existence to maintain consistent timing
        // This prevents timing attacks that could reveal which emails are registered
        const otp = generateOTP();
        const hashedOtp = await hashOTP(otp);
        const otpExpires = getOTPExpiry();

        // Find user (don't reveal if user exists or not for security)
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            // Simulate email sending delay to maintain timing consistency
            // Use a delay that approximates typical email API call (e.g., 800-1200ms)
            const delay = 800 + Math.random() * 400; // Random delay between 800-1200ms
            await new Promise(resolve => setTimeout(resolve, delay));
            // Return success even if user doesn't exist (security best practice)
            // Note: hashedOtp is discarded here but was computed for timing consistency
            return NextResponse.json({
                message: 'If an account exists with this email, you will receive a password reset code.'
            });
        }

        // Send password reset email first, before persisting OTP
        // This ensures we don't leave a valid OTP in the DB if email fails
        try {
            const emailSent = await sendPasswordResetEmail(normalizedEmail, otp);
            
            if (!emailSent) {
                // Email failed to send, don't persist OTP
                console.error('❌ Failed to send password reset email to', normalizedEmail);
                return NextResponse.json(
                    { message: 'Failed to send password reset email. Please try again later.' },
                    { status: 500 }
                );
            }

            // Email sent successfully, now persist the OTP (pre-save hook will hash it)
            user.otp = otp;
            user.otpExpires = otpExpires;
            await user.save();

            // Only log OTP in non-production environments for debugging
            if (process.env.NODE_ENV !== 'production') {
                console.log('📧 Password reset OTP for', normalizedEmail, ':', otp);
            }

            return NextResponse.json({
                message: 'If an account exists with this email, you will receive a password reset code.'
            });
        } catch (emailError: any) {
            // Handle unexpected errors during email sending
            console.error('❌ Error sending password reset email:', emailError);
            // Don't persist OTP if email failed
            return NextResponse.json(
                { message: 'Failed to send password reset email. Please try again later.' },
                { status: 500 }
            );
        }
    } catch (error: any) {
        // Log full error details with request context for debugging
        console.error('❌ Forgot password error:', {
            message: error.message,
            stack: error.stack,
            name: error.name,
            request: {
                method: req.method,
                url: req.url,
                email: email || 'unknown'
            }
        });
        // Return generic error message to client to prevent information leakage
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
