import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import connectDB from '@/lib/db';
import { isOTPExpired } from '@/lib/otp';
import { globalCache } from '@/lib/cache';
import { getSession, generateAccessToken, generateRefreshToken, setAuthCookies } from '@/lib/auth';
import crypto from 'crypto';
import net from 'net';

export const dynamic = 'force-dynamic';

// Rate limiting configuration
const MAX_ATTEMPTS_PER_EMAIL = 5; // Max 5 attempts per email per hour
const MAX_ATTEMPTS_PER_IP = 10; // Max 10 attempts per IP per hour
const MAX_FAILED_ATTEMPTS_LOCKOUT = 10; // Lock account after 10 failed attempts
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const LOCKOUT_DURATION = 60 * 60 * 1000; // 1 hour lockout
// Note: Progressive delays removed - serverless environments reject immediately instead
// Client-side delays can be implemented if needed, but immediate rejection is more efficient

// Helper to get client IP address
// Returns IP string or null if IP cannot be determined
function getClientIP(req: NextRequest): string | null {
    // Check various headers for IP (handles proxies/load balancers)
    const forwarded = req.headers.get('x-forwarded-for');
    const realIP = req.headers.get('x-real-ip');
    const cfConnectingIP = req.headers.get('cf-connecting-ip'); // Cloudflare
    
    if (forwarded) {
        // x-forwarded-for can contain multiple IPs, take the first one
        const ip = forwarded.split(',')[0].trim();
        // Validate IP format (IPv4 or IPv6)
        if (net.isIP(ip) > 0) {
            return ip;
        }
    }
    if (realIP) {
        const ip = realIP.trim();
        // Validate IP format (IPv4 or IPv6)
        if (net.isIP(ip) > 0) {
            return ip;
        }
    }
    if (cfConnectingIP) {
        const ip = cfConnectingIP.trim();
        // Validate IP format (IPv4 or IPv6)
        if (net.isIP(ip) > 0) {
            return ip;
        }
    }
    
    // No identifiable IP found - this is a security concern
    // Log warning with request details for investigation
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const referer = req.headers.get('referer') || 'unknown';
    console.warn('⚠️ SECURITY WARNING: Cannot determine client IP for OTP verification request', {
        userAgent,
        referer,
        url: req.url,
        timestamp: new Date().toISOString()
    });
    
    // In production, return null to reject requests without identifiable IPs
    // This prevents rate limit sharing and abuse via the 'unknown' bucket
    if (process.env.NODE_ENV === 'production') {
        return null;
    }
    
    // In development, use a fallback that includes additional identifiers
    // This prevents all dev requests from sharing the same bucket
    // Use a stable identifier so rate limiting works correctly
    let stableId: string;
    if (process.env.DEV_RATE_LIMIT_ID) {
        // Use environment variable if set
        stableId = process.env.DEV_RATE_LIMIT_ID;
    } else if (userAgent && userAgent !== 'unknown') {
        // Create a deterministic hash of userAgent (non-PII, stable across requests)
        stableId = crypto.createHash('sha256')
            .update(userAgent)
            .digest('hex')
            .substring(0, 16);
    } else {
        // Fallback to constant identifier
        stableId = 'dev';
    }
    const fallbackId = `dev-${stableId}`;
    console.warn('⚠️ Using fallback IP identifier in development:', fallbackId);
    return fallbackId;
}

// Rate limiting data structures
interface RateLimitRecord {
    count: number;
    firstAttempt: number;
    failedAttempts: number;
    lastFailedAttempt: number;
}

interface LockoutRecord {
    lockedUntil: number;
    reason: string;
}

// Check if account is locked
function isAccountLocked(email: string): { locked: boolean; lockedUntil?: number; reason?: string } {
    const lockoutKey = `otp_lockout:${email}`;
    const lockout = globalCache.getValue<LockoutRecord>(lockoutKey);
    
    if (lockout && Date.now() < lockout.lockedUntil) {
        return {
            locked: true,
            lockedUntil: lockout.lockedUntil,
            reason: lockout.reason
        };
    }
    
    // Clean up expired lockout
    if (lockout) {
        globalCache.delete(lockoutKey);
    }
    
    return { locked: false };
}

// Check rate limit for email
function checkEmailRateLimit(email: string): { allowed: boolean; remaining?: number; retryAfter?: number } {
    const key = `otp_rate_limit:email:${email}`;
    const record = globalCache.getValue<RateLimitRecord>(key);
    const now = Date.now();
    
    if (!record || now - record.firstAttempt > RATE_LIMIT_WINDOW) {
        // Create new record
        globalCache.set(key, {
            count: 1,
            firstAttempt: now,
            failedAttempts: 0,
            lastFailedAttempt: 0
        }, RATE_LIMIT_WINDOW / 1000);
        return { allowed: true, remaining: MAX_ATTEMPTS_PER_EMAIL - 1 };
    }
    
    if (record.count >= MAX_ATTEMPTS_PER_EMAIL) {
        const retryAfter = Math.ceil((RATE_LIMIT_WINDOW - (now - record.firstAttempt)) / 1000);
        return { allowed: false, retryAfter };
    }
    
    // Increment count
    record.count++;
    globalCache.set(key, record, RATE_LIMIT_WINDOW / 1000);
    
    return { allowed: true, remaining: MAX_ATTEMPTS_PER_EMAIL - record.count };
}

// Check rate limit for IP
function checkIPRateLimit(ip: string): { allowed: boolean; remaining?: number; retryAfter?: number } {
    const key = `otp_rate_limit:ip:${ip}`;
    const record = globalCache.getValue<RateLimitRecord>(key);
    const now = Date.now();
    
    if (!record || now - record.firstAttempt > RATE_LIMIT_WINDOW) {
        // Create new record
        globalCache.set(key, {
            count: 1,
            firstAttempt: now,
            failedAttempts: 0,
            lastFailedAttempt: 0
        }, RATE_LIMIT_WINDOW / 1000);
        return { allowed: true, remaining: MAX_ATTEMPTS_PER_IP - 1 };
    }
    
    if (record.count >= MAX_ATTEMPTS_PER_IP) {
        const retryAfter = Math.ceil((RATE_LIMIT_WINDOW - (now - record.firstAttempt)) / 1000);
        return { allowed: false, retryAfter };
    }
    
    // Increment count
    record.count++;
    globalCache.set(key, record, RATE_LIMIT_WINDOW / 1000);
    
    return { allowed: true, remaining: MAX_ATTEMPTS_PER_IP - record.count };
}

// Record failed attempt and check for lockout
// Returns lockout status - immediate rejection is used instead of server-side delays
function recordFailedAttempt(email: string, ip: string): { locked: boolean; lockedUntil?: number; failedAttempts: number } {
    const emailKey = `otp_rate_limit:email:${email}`;
    const ipKey = `otp_rate_limit:ip:${ip}`;
    
    let emailRecord = globalCache.getValue<RateLimitRecord>(emailKey);
    const ipRecord = globalCache.getValue<RateLimitRecord>(ipKey);
    const now = Date.now();
    
    // Create or update email record
    if (!emailRecord || now - emailRecord.firstAttempt > RATE_LIMIT_WINDOW) {
        emailRecord = {
            count: 0,
            firstAttempt: now,
            failedAttempts: 1,
            lastFailedAttempt: now
        };
    } else {
        emailRecord.failedAttempts++;
        emailRecord.lastFailedAttempt = now;
    }
    
    globalCache.set(emailKey, emailRecord, RATE_LIMIT_WINDOW / 1000);
    
    // Check for lockout
    if (emailRecord.failedAttempts >= MAX_FAILED_ATTEMPTS_LOCKOUT) {
        const lockoutKey = `otp_lockout:${email}`;
        const lockedUntil = now + LOCKOUT_DURATION;
        globalCache.set(lockoutKey, {
            lockedUntil,
            reason: 'Too many failed OTP verification attempts'
        }, LOCKOUT_DURATION / 1000);
        
        return { locked: true, lockedUntil, failedAttempts: emailRecord.failedAttempts };
    }
    
    // Update IP record
    if (ipRecord && now - ipRecord.firstAttempt <= RATE_LIMIT_WINDOW) {
        ipRecord.failedAttempts++;
        ipRecord.lastFailedAttempt = now;
        globalCache.set(ipKey, ipRecord, RATE_LIMIT_WINDOW / 1000);
    } else if (!ipRecord || now - ipRecord.firstAttempt > RATE_LIMIT_WINDOW) {
        globalCache.set(ipKey, {
            count: 0,
            firstAttempt: now,
            failedAttempts: 1,
            lastFailedAttempt: now
        }, RATE_LIMIT_WINDOW / 1000);
    }
    
    // Return failed attempts count for rate limit headers (no server-side delay)
    return { locked: false, failedAttempts: emailRecord.failedAttempts };
}

// Clear rate limit on successful verification
function clearRateLimitOnSuccess(email: string, ip: string): void {
    globalCache.delete(`otp_rate_limit:email:${email}`);
    globalCache.delete(`otp_lockout:${email}`);
}
export async function POST(req: NextRequest) {
    try {
        await connectDB();

        // Try to get email from authenticated session first
        const sessionUser = await getSession(req);
        const body = await req.json();
        const { otp } = body;
        
        // Use email from session if available, otherwise from request body
        const email = sessionUser?.email || body.email;

        if (!email || !otp) {
            return NextResponse.json(
                { message: 'Email and OTP are required' },
                { status: 400 }
            );
        }

        // Normalize email
        const normalizedEmail = email.toLowerCase().trim();
        const clientIP = getClientIP(req);

        // Reject requests without identifiable IP in production (security requirement)
        if (!clientIP) {
            console.error('❌ OTP verification rejected: Cannot determine client IP address');
            return NextResponse.json(
                { 
                    message: 'Unable to verify request origin. Please ensure your request includes proper IP headers or contact support.' 
                },
                { status: 400 }
            );
        }

        // Check if account is locked
        const lockoutCheck = isAccountLocked(normalizedEmail);
        if (lockoutCheck.locked) {
            const retryAfter = Math.ceil((lockoutCheck.lockedUntil! - Date.now()) / 1000);
            return NextResponse.json(
                {
                    message: 'Account temporarily locked due to too many failed attempts. Please try again later.',
                    retryAfter
                },
                {
                    status: 429,
                    headers: {
                        'Retry-After': retryAfter.toString(),
                        'X-RateLimit-Limit': MAX_ATTEMPTS_PER_EMAIL.toString(),
                        'X-RateLimit-Remaining': '0'
                    }
                }
            );
        }

        // Check email-based rate limit
        const emailRateLimit = checkEmailRateLimit(normalizedEmail);
        if (!emailRateLimit.allowed) {
            return NextResponse.json(
                {
                    message: 'Too many verification attempts for this email. Please wait before trying again.',
                    retryAfter: emailRateLimit.retryAfter
                },
                {
                    status: 429,
                    headers: {
                        'Retry-After': emailRateLimit.retryAfter?.toString() || '3600',
                        'X-RateLimit-Limit': MAX_ATTEMPTS_PER_EMAIL.toString(),
                        'X-RateLimit-Remaining': '0'
                    }
                }
            );
        }

        // Check IP-based rate limit
        const ipRateLimit = checkIPRateLimit(clientIP);
        if (!ipRateLimit.allowed) {
            return NextResponse.json(
                {
                    message: 'Too many verification attempts from this IP address. Please wait before trying again.',
                    retryAfter: ipRateLimit.retryAfter
                },
                {
                    status: 429,
                    headers: {
                        'Retry-After': ipRateLimit.retryAfter?.toString() || '3600',
                        'X-RateLimit-Limit': MAX_ATTEMPTS_PER_IP.toString(),
                        'X-RateLimit-Remaining': '0'
                    }
                }
            );
        }

        // Find user with OTP fields
        const user = await User.findOne({ email: normalizedEmail }).select('+otp +otpExpires');

        if (!user) {
            // Don't reveal if user exists (security best practice)
            // Still record the attempt to prevent enumeration
            recordFailedAttempt(normalizedEmail, clientIP);
            return NextResponse.json(
                { message: 'Invalid OTP' },
                { status: 400 }
            );
        }

        if (user.isVerified) {
            return NextResponse.json(
                { message: 'Email is already verified' },
                { status: 400 }
            );
        }

        if (!user.otp || !user.otpExpires) {
            return NextResponse.json(
                { message: 'No OTP found. Please request a new one.' },
                { status: 400 }
            );
        }

        // Check if OTP is expired
        if (isOTPExpired(user.otpExpires)) {
            return NextResponse.json(
                { message: 'OTP has expired. Please request a new one.' },
                {
                    status: 400,
                    headers: {
                        'X-RateLimit-Limit': MAX_ATTEMPTS_PER_EMAIL.toString(),
                        'X-RateLimit-Remaining': Math.max(0, (emailRateLimit.remaining ?? 1) - 1).toString()
                    } as HeadersInit
                }
            );
        }

        // Verify OTP
        const isValid = await user.compareOTP(otp);

        if (!isValid) {
            // Record failed attempt (immediate rejection - no server-side delays)
            const failureResult = recordFailedAttempt(normalizedEmail, clientIP);
            
            return NextResponse.json(
                { message: 'Invalid OTP' },
                {
                    status: 400,
                    headers: {
                        'X-RateLimit-Limit': MAX_ATTEMPTS_PER_EMAIL.toString(),
                        'X-RateLimit-Remaining': (emailRateLimit.remaining! - 1).toString()
                    }
                }
            );
            // Immediate rejection with rate limit information
            // Client can implement exponential backoff if needed
            const remainingAttempts = MAX_FAILED_ATTEMPTS_LOCKOUT - failureResult.failedAttempts;
            return NextResponse.json(
                { 
                    message: 'Invalid OTP',
                    remainingAttempts: Math.max(0, remainingAttempts)
                },
                {
                    status: 400,
                    headers: {
                        'X-RateLimit-Limit': MAX_ATTEMPTS_PER_EMAIL.toString(),
                        'X-RateLimit-Remaining': (emailRateLimit.remaining! - 1).toString(),
                        'X-RateLimit-FailedAttempts': failureResult.failedAttempts.toString(),
                        'X-RateLimit-MaxFailedAttempts': MAX_FAILED_ATTEMPTS_LOCKOUT.toString()
                    }
                }
            );
        }

        // Clear rate limits on successful verification
        clearRateLimitOnSuccess(normalizedEmail, clientIP);

        // Update user to verified and clear OTP
        const updatedUser = await User.findByIdAndUpdate(
            user._id,
            {
                isVerified: true,
                otp: null,
                otpExpires: null
            },
            { new: true }
        );

        // Check if user was found and updated
        if (!updatedUser) {
            console.error('❌ Failed to update user during email verification:', {
                userId: user._id
            });
            return NextResponse.json(
                { message: 'Failed to update user verification status. Please try again.' },
                { status: 500 }
            );
        }

        // Invalidate user cache so fresh data is fetched
        globalCache.delete(`user:${user._id}`);

        // Generate tokens now that user is verified
        const accessToken = generateAccessToken(updatedUser._id.toString());
        const refreshToken = generateRefreshToken(updatedUser._id.toString());

        console.log('✅ Email verified for userId:', updatedUser._id);

        // Create response with tokens
        const response = NextResponse.json({
            message: 'Email verified successfully',
            token: accessToken,
            isVerified: true,
            user: {
                id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                roomStatus: updatedUser.roomStatus,
                khataId: updatedUser.khataId,
                isVerified: updatedUser.isVerified
            }
        }, {
            headers: {
                'X-RateLimit-Limit': MAX_ATTEMPTS_PER_EMAIL.toString(),
                'X-RateLimit-Remaining': MAX_ATTEMPTS_PER_EMAIL.toString()
            }
        });

        // Set HttpOnly cookies with tokens
        setAuthCookies(response, accessToken, refreshToken);

        return response;
    } catch (error: any) {
        console.error('❌ Email verification error:', error);
        return NextResponse.json(
            { message: 'Failed to verify email' },
            { status: 500 }
        );
    }
}
