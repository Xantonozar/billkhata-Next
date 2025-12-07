import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import connectDB from '@/lib/db';
import {
    verifyToken,
    generateAccessToken,
    generateRefreshToken,
    setAuthCookies,
    getRefreshTokenFromCookies
} from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * Refresh access token using refresh token
 * Can be called when access token expires
 */
export async function POST(req: NextRequest) {
    try {
        console.log('🔄 POST /api/auth/refresh called');
        await connectDB();

        // Get refresh token from cookies or body
        let refreshToken = getRefreshTokenFromCookies(req);

        // Fallback to body for API clients
        if (!refreshToken) {
            try {
                const body = await req.json();
                refreshToken = body.refreshToken;
            } catch {
                // No body provided
            }
        }

        if (!refreshToken) {
            return NextResponse.json(
                { message: 'No refresh token provided' },
                { status: 401 }
            );
        }

        // Verify refresh token
        const decoded = verifyToken(refreshToken);

        if (!decoded || decoded.type !== 'refresh') {
            console.log('⚠️ Invalid or expired refresh token');
            return NextResponse.json(
                { message: 'Invalid or expired refresh token' },
                { status: 401 }
            );
        }

        // Check if user still exists
        const user = await User.findById(decoded.id).select('-password').lean();

        if (!user) {
            console.log('⚠️ User not found for refresh token');
            return NextResponse.json(
                { message: 'User not found' },
                { status: 401 }
            );
        }

        // Generate new tokens (token rotation for security)
        const newAccessToken = generateAccessToken(decoded.id);
        const newRefreshToken = generateRefreshToken(decoded.id);

        console.log('✅ Token refreshed for user:', decoded.id);

        // Create response
        const response = NextResponse.json({
            token: newAccessToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                roomStatus: user.roomStatus,
                khataId: user.khataId
            }
        });

        // Set new cookies
        setAuthCookies(response, newAccessToken, newRefreshToken);

        return response;
    } catch (error: any) {
        console.error('❌ Token refresh error:', error);
        return NextResponse.json(
            { message: 'Server error during token refresh' },
            { status: 500 }
        );
    }
}
