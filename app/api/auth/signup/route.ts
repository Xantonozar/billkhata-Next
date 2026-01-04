import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import connectDB from '@/lib/db';
import { SignupSchema, validateBody } from '@/lib/validation';
import { generateOTP, getOTPExpiry } from '@/lib/otp';
import { sendVerificationEmail } from '@/lib/brevo';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        console.log('🔍 POST /api/auth/signup called');
        await connectDB();

        // Parse and validate request body
        const body = await req.json();
        const validation = validateBody(SignupSchema, body);

        if (!validation.success) {
            console.log('⚠️ Signup validation failed:', validation.error);
            return NextResponse.json({ message: validation.error }, { status: 400 });
        }

        const { name, email, password, role } = validation.data;

        // Check if user already exists
        const userExists = await User.findOne({ email });

        if (userExists) {
            return NextResponse.json(
                { message: 'User already exists with this email' },
                { status: 400 }
            );
        }

        // Generate OTP for email verification
        const otp = generateOTP();
        const otpExpires = getOTPExpiry();

        // Create user with unverified status (pre-save hook will hash the OTP)
        const user = await User.create({
            name,
            email,
            password,
            role,
            roomStatus: 'NoRoom',
            isVerified: false,
            otp: otp,
            otpExpires
        });

        // Send verification email (don't block signup if email fails)
        sendVerificationEmail(email, otp).catch(err => {
            console.error('Failed to send verification email:', err);
        });

        // Log OTP generation (development only, without exposing the actual OTP)
        if (process.env.NODE_ENV === 'development') {
            console.log('📧 OTP generated for', email);
        }

        console.log('✅ Signup successful for:', email, '- Email verification required');

        // Return success response without tokens
        // Tokens will be issued only after email verification
        return NextResponse.json({
            message: 'Account created successfully. Please verify your email to continue.',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                roomStatus: user.roomStatus,
                khataId: user.khataId,
                isVerified: user.isVerified
            }
        }, { status: 201 });
    } catch (error: any) {
        console.error('❌ Signup error:', error);
        return NextResponse.json(
            { message: error.message || 'Server error during signup' },
            { status: 500 }
        );
    }
}

