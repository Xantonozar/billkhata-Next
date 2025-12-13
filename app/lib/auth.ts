import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import connectDB from '@/lib/db';
import { globalCache } from '@/lib/cache';
import crypto from 'crypto';

// ============================================
// CONFIGURATION
// ============================================

const ACCESS_TOKEN_EXPIRES = process.env.JWT_ACCESS_EXPIRES || '30d';
const REFRESH_TOKEN_EXPIRES = process.env.JWT_REFRESH_EXPIRES || '7d';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Cookie configuration
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: 'lax' as const,
    path: '/',
};

// ============================================
// TOKEN GENERATION
// ============================================

/**
 * Generate short-lived access token (15 minutes by default)
 */
export const generateAccessToken = (userId: string): string => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined');
    }
    return jwt.sign(
        { id: userId, type: 'access' },
        process.env.JWT_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRES } as jwt.SignOptions
    );
};

/**
 * Generate long-lived refresh token (7 days by default)
 */
export const generateRefreshToken = (userId: string): string => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined');
    }
    // Add a random jti (JWT ID) for uniqueness
    const jti = crypto.randomBytes(16).toString('hex');
    return jwt.sign(
        { id: userId, type: 'refresh', jti },
        process.env.JWT_SECRET,
        { expiresIn: REFRESH_TOKEN_EXPIRES } as jwt.SignOptions
    );
};

/**
 * Legacy token generation (for backward compatibility during migration)
 * @deprecated Use generateAccessToken instead
 */
export const generateToken = (id: string) => {
    return generateAccessToken(id);
};

// ============================================
// TOKEN VERIFICATION
// ============================================

interface TokenPayload {
    id: string;
    type: 'access' | 'refresh';
    jti?: string;
    iat: number;
    exp: number;
}

/**
 * Verify and decode a JWT token
 */
export const verifyToken = (token: string): TokenPayload | null => {
    if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET is not defined');
        return null;
    }
    try {
        return jwt.verify(token, process.env.JWT_SECRET) as TokenPayload;
    } catch (error) {
        return null;
    }
};

// ============================================
// SESSION MANAGEMENT
// ============================================

/**
 * Get current user session from request
 * Checks both Authorization header (Bearer token) and cookies
 */
export const getSession = async (req: NextRequest) => {
    await connectDB();
    let token: string | null = null;

    // Try Authorization header first (for API clients)
    const authHeader = req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    }

    // Fall back to cookie (for browser clients)
    if (!token) {
        token = req.cookies.get('accessToken')?.value || null;
    }

    if (!token) {
        return null;
    }

    try {
        const decoded = verifyToken(token);

        if (!decoded || decoded.type !== 'access') {
            return null;
        }

        // Try to get user from cache first (fast path)
        const cacheKey = `user:${decoded.id}`;
        const cachedUser = globalCache.getValue(cacheKey);
        if (cachedUser) {
            return cachedUser;
        }

        const user = await User.findById(decoded.id).select('-password').lean();

        if (user) {
            globalCache.set(cacheKey, user, 60); // Cache for 60 seconds
        }

        return user;
    } catch (error) {
        console.error('Auth error:', error);
        return null;
    }
};

// ============================================
// COOKIE HELPERS
// ============================================

/**
 * Set authentication cookies on response
 */
export const setAuthCookies = (
    response: NextResponse,
    accessToken: string,
    refreshToken: string
): void => {
    // Access token - shorter expiry
    response.cookies.set('accessToken', accessToken, {
        ...COOKIE_OPTIONS,
        maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    // Refresh token - longer expiry
    response.cookies.set('refreshToken', refreshToken, {
        ...COOKIE_OPTIONS,
        maxAge: 30 * 24 * 60 * 60, // 30 days
    });
};

/**
 * Clear authentication cookies
 */
export const clearAuthCookies = (response: NextResponse): void => {
    response.cookies.delete('accessToken');
    response.cookies.delete('refreshToken');
};

/**
 * Get refresh token from request cookies
 */
export const getRefreshTokenFromCookies = (req: NextRequest): string | null => {
    return req.cookies.get('refreshToken')?.value || null;
};

// ============================================
// ROLE CHECKING
// ============================================

/**
 * Check if user has manager role
 */
export const isManager = (user: any): boolean => {
    return user?.role === 'Manager';
};

/**
 * Require manager role, returns error response if not authorized
 */
export const requireManager = (user: any): NextResponse | null => {
    if (!user) {
        return NextResponse.json({ message: 'Not authorized' }, { status: 401 });
    }
    if (!isManager(user)) {
        return NextResponse.json({ message: 'Manager access required' }, { status: 403 });
    }
    return null;
};

/**
 * Check if user belongs to the specified room/khata
 */
export const belongsToKhata = (user: any, khataId: string): boolean => {
    return user?.khataId === khataId;
};

/**
 * Require user belongs to khata, returns error response if not
 */
export const requireKhataAccess = (user: any, khataId: string): NextResponse | null => {
    if (!user) {
        return NextResponse.json({ message: 'Not authorized' }, { status: 401 });
    }
    if (!belongsToKhata(user, khataId)) {
        return NextResponse.json({ message: 'Access denied to this room' }, { status: 403 });
    }
    return null;
};
