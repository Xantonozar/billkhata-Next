import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Edge Middleware
 * 
 * Purpose:
 * 1. Signal API routes to use connection warming
 * 2. Pre-validate auth tokens at the edge when possible
 * 3. Reduce cold start latency by priming connections
 */
export function middleware(request: NextRequest) {
    const response = NextResponse.next();

    // Add header to signal backend to use warm connections
    // This helps API routes prioritize cached connections
    if (request.nextUrl.pathname.startsWith('/api/')) {
        response.headers.set('X-Connection-Warm', '1');
    }

    // For dashboard and protected routes, check if token exists
    // This allows early redirect before page loads
    const protectedPaths = ['/dashboard', '/bills', '/meals', '/shopping', '/calendar', '/members', '/settings', '/pending-approvals', '/reports-analytics'];
    const isProtectedPath = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path));

    if (isProtectedPath) {
        const hasToken = request.cookies.has('accessToken') ||
            request.headers.get('authorization')?.startsWith('Bearer ');

        if (!hasToken && !request.cookies.has('refreshToken')) {
            // No tokens found - redirect to login
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }
    return response;
}

export const config = {
    matcher: [
        // Match API routes for connection warming
        '/api/:path*',
        // Match protected pages for early auth checks
        '/dashboard/:path*',
        '/bills/:path*',
        '/meals/:path*',
        '/shopping/:path*',
        '/calendar/:path*',
        '/members/:path*',
        '/settings/:path*',
        '/pending-approvals/:path*',
        '/reports-analytics/:path*',
    ]
};
