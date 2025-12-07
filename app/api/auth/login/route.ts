import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import connectDB from '@/lib/db';
import {
    generateAccessToken,
    generateRefreshToken,
    setAuthCookies
} from '@/lib/auth';
import { LoginSchema, validateBody } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        console.log('🔍 POST /api/auth/login called');
        await connectDB();

        // Parse and validate request body
        const body = await req.json();
        const validation = validateBody(LoginSchema, body);

        if (!validation.success) {
            console.log('⚠️ Login validation failed:', validation.error);
            return NextResponse.json({ message: validation.error }, { status: 400 });
        }

        const { email, password } = validation.data;
        console.log('📝 Login attempt for:', email);

        // Find user (include password for comparison)
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            console.log('⚠️ Login failed: User not found');
            return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            console.log('⚠️ Login failed: Password mismatch');
            return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
        }

        // Generate tokens
        const accessToken = generateAccessToken(user._id.toString());
        const refreshToken = generateRefreshToken(user._id.toString());

        console.log('✅ Login successful for:', email);

        // Create response with user data
        const response = NextResponse.json({
            // Still return token in body for backward compatibility with mobile/API clients
            token: accessToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                roomStatus: user.roomStatus,
                khataId: user.khataId
            }
        });

        // Set HttpOnly cookies for browser clients
        setAuthCookies(response, accessToken, refreshToken);

        return response;
    } catch (error: any) {
        console.error('❌ Login error:', error);
        return NextResponse.json(
            { message: error.message || 'Server error during login' },
            { status: 500 }
        );
    }
}
