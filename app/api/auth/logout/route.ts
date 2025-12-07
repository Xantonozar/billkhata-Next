import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookies, getSession } from '@/lib/auth';
import { globalCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

/**
 * Logout user - clears authentication cookies and invalidates cache
 */
export async function POST(req: NextRequest) {
    try {
        console.log('🚪 POST /api/auth/logout called');

        // Get current user (optional - logout should work even if token is expired)
        const user = await getSession(req);

        // Invalidate user cache if we have a valid session
        if (user?._id) {
            globalCache.delete(`user:${user._id}`);
            console.log('✅ Cache cleared for user:', user._id);
        }

        // Create response
        const response = NextResponse.json({
            message: 'Logged out successfully'
        });

        // Clear auth cookies
        clearAuthCookies(response);

        console.log('✅ Logout successful');
        return response;
    } catch (error: any) {
        console.error('❌ Logout error:', error);

        // Even on error, try to clear cookies
        const response = NextResponse.json(
            { message: 'Logged out' },
            { status: 200 }
        );
        clearAuthCookies(response);

        return response;
    }
}

/**
 * Also support GET for convenience (e.g., redirect from link)
 */
export async function GET(req: NextRequest) {
    return POST(req);
}
