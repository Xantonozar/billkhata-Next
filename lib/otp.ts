import bcrypt from 'bcryptjs';

/**
 * Generate a 6-digit OTP
 */
export function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Hash OTP for secure storage
 */
export async function hashOTP(otp: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(otp, salt);
}

/**
 * Verify OTP against hashed value
 */
export async function verifyOTP(inputOTP: string, hashedOTP: string): Promise<boolean> {
    return bcrypt.compare(inputOTP, hashedOTP);
}

/**
 * Get OTP expiry time (10 minutes from now)
 */
export function getOTPExpiry(): Date {
    return new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
}

/**
 * Check if OTP is expired
 */
export function isOTPExpired(expiryDate: Date | null): boolean {
    if (!expiryDate) return true;
    return new Date() > new Date(expiryDate);
}
