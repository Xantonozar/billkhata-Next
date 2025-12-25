import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import connectDB from '@/lib/db';
import {
    generateAccessToken,
    generateRefreshToken,
    setAuthCookies
} from '@/lib/auth';
import { SignupSchema, validateBody } from '@/lib/validation';
import { generateOTP, hashOTP, getOTPExpiry } from '@/lib/otp';
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
        const hashedOtp = await hashOTP(otp);
        const otpExpires = getOTPExpiry();

        // Create user with unverified status
        const user = await User.create({
            name,
            email,
            password,
            role,
            roomStatus: 'NoRoom',
            isVerified: false,
            otp: hashedOtp,
            otpExpires
        });

        // Send verification email (don't block signup if email fails)
        sendVerificationEmail(email, otp).catch(err => {
            console.error('Failed to send verification email:', err);
        });

        console.log('📧 OTP generated for', email, ':', otp); // Remove in production

        // Generate tokens
        const accessToken = generateAccessToken(user._id.toString());
        const refreshToken = generateRefreshToken(user._id.toString());

        console.log('✅ Signup successful for:', email);

        // Create response
        const response = NextResponse.json({
            token: accessToken,
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

        // Set HttpOnly cookies
        setAuthCookies(response, accessToken, refreshToken);

        return response;
    } catch (error: any) {
        console.error('❌ Signup error:', error);
        return NextResponse.json(
            { message: error.message || 'Server error during signup' },
            { status: 500 }
        );
    }
}

