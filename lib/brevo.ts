import * as Brevo from '@getbrevo/brevo';

const apiInstance = new Brevo.TransactionalEmailsApi();

// Set API key using the proper method
const apiKey = process.env.BREVO_API_KEY;
if (apiKey) {
  apiInstance.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey);
}
const senderEmail = process.env.SENDER_EMAIL || 'noreply@billkhata.com';
const senderName = process.env.SENDER_NAME || 'BillKhata';

/**
 * Validates OTP format: must be exactly 6 digits
 * @param otp - The OTP string to validate
 * @returns true if valid, false otherwise
 */
function validateOTP(otp: string): boolean {
    if (!otp || typeof otp !== 'string') {
        return false;
    }
    // Strict regex: exactly 6 digits, no other characters
    const otpRegex = /^\d{6}$/;
    return otpRegex.test(otp);
}

/**
 * Escapes HTML special characters to prevent XSS
 * @param text - The text to escape
 * @returns Escaped HTML-safe string
 */
function escapeHtml(text: string): string {
    const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * Masks email address to protect PII in logs
 * Returns format: first_char***@domain (e.g., "u***@example.com")
 */
function maskEmail(email: string): string {
    const atIndex = email.indexOf('@');
    if (atIndex === -1 || atIndex === 0) {
        return '[REDACTED]';
    }
    const localPart = email.substring(0, atIndex);
    const domain = email.substring(atIndex);
    return `${localPart.charAt(0)}***${domain}`;
}

interface EmailOptions {
    to: string;
    subject: string;
    htmlContent: string;
}

async function sendEmail({ to, subject, htmlContent }: EmailOptions): Promise<boolean> {
    try {
        if (!process.env.BREVO_API_KEY) {
            const isDevelopment = process.env.NODE_ENV === 'development' || process.env.IS_TEST === 'true';
            
            if (isDevelopment) {
                console.debug('📧 Email would be sent to:', maskEmail(to));
                console.debug('📧 Subject:', subject);
                return true; // Return true for development/test convenience
            } else {
                console.error('❌ BREVO_API_KEY not set. Email send failed.');
                return false; // Explicitly signal failure in production
            }
        }

        const sendSmtpEmail = new Brevo.SendSmtpEmail();
        sendSmtpEmail.sender = { email: senderEmail, name: senderName };
        sendSmtpEmail.to = [{ email: to }];
        sendSmtpEmail.subject = subject;
        sendSmtpEmail.htmlContent = htmlContent;

        await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log('✅ Email sent successfully to:', maskEmail(to));
        return true;
    } catch (error) {
        console.error('❌ Failed to send email:', error);
        return false;
    }
}

/**
 * Send OTP for email verification
 */
export async function sendVerificationEmail(email: string, otp: string): Promise<boolean> {
    // Validate OTP at the top - reject invalid values
    if (!validateOTP(otp)) {
        console.error('❌ Invalid OTP format. Expected exactly 6 digits.');
        return false;
    }

    // Escape OTP to prevent HTML injection
    const escapedOTP = escapeHtml(otp);

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
            <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 24px;">
                    <h1 style="color: #7c3aed; margin: 0; font-size: 28px;">BillKhata</h1>
                </div>
                <h2 style="color: #1e293b; margin-bottom: 16px;">Verify Your Email</h2>
                <p style="color: #64748b; line-height: 1.6;">Use the following OTP to verify your email address:</p>
                <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
                    <span style="font-size: 32px; font-weight: bold; color: white; letter-spacing: 8px;">${escapedOTP}</span>
                </div>
                <p style="color: #64748b; font-size: 14px; line-height: 1.6;">
                    This code will expire in <strong>10 minutes</strong>.<br>
                    If you didn't request this, please ignore this email.
                </p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
                <p style="color: #94a3b8; font-size: 12px; text-align: center;">
                    © ${new Date().getFullYear()} BillKhata. All rights reserved.
                </p>
            </div>
        </body>
        </html>
    `;

    return sendEmail({
        to: email,
        subject: 'Verify Your Email - BillKhata',
        htmlContent
    });
}

/**
 * Send OTP for password reset
 */
export async function sendPasswordResetEmail(email: string, otp: string): Promise<boolean> {
    // Validate OTP at the top - reject invalid values
    if (!validateOTP(otp)) {
        console.error('❌ Invalid OTP format. Expected exactly 6 digits.');
        return false;
    }

    // Escape OTP to prevent HTML injection
    const escapedOTP = escapeHtml(otp);

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
            <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 24px;">
                    <h1 style="color: #7c3aed; margin: 0; font-size: 28px;">BillKhata</h1>
                </div>
                <h2 style="color: #1e293b; margin-bottom: 16px;">Reset Your Password</h2>
                <p style="color: #64748b; line-height: 1.6;">You requested to reset your password. Use the following OTP:</p>
                <div style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
                    <span style="font-size: 32px; font-weight: bold; color: white; letter-spacing: 8px;">${escapedOTP}</span>
                </div>
                <p style="color: #64748b; font-size: 14px; line-height: 1.6;">
                    This code will expire in <strong>10 minutes</strong>.<br>
                    If you didn't request this, please secure your account immediately.
                </p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
                <p style="color: #94a3b8; font-size: 12px; text-align: center;">
                    © ${new Date().getFullYear()} BillKhata. All rights reserved.
                </p>
            </div>
        </body>
        </html>
    `;

    return sendEmail({
        to: email,
        subject: 'Reset Your Password - BillKhata',
        htmlContent
    });
}
