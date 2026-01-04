/**
 * Password configuration constants
 * Can be overridden via environment variable PASSWORD_MIN_LENGTH (server-side)
 * or NEXT_PUBLIC_PASSWORD_MIN_LENGTH (client-side, must be prefixed with NEXT_PUBLIC_)
 * Defaults to 8 characters for modern security standards
 */
const getMinLength = () => {
    // Try NEXT_PUBLIC_ first (works in both contexts), then fallback to server-only env var
    const envValue = process.env.NEXT_PUBLIC_PASSWORD_MIN_LENGTH || 
                     (typeof window === 'undefined' ? process.env.PASSWORD_MIN_LENGTH : undefined) ||
                     '8';
    return parseInt(envValue, 10);
};

export const PASSWORD_MIN_LENGTH = getMinLength();

// Ensure minimum is at least 8 for security
export const MIN_PASSWORD_LENGTH = Math.max(8, PASSWORD_MIN_LENGTH);

