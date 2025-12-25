import * as Brevo from '@getbrevo/brevo';

const apiInstance = new Brevo.TransactionalEmailsApi();

// Set API key using the proper method
apiInstance.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY || '');

const senderEmail = process.env.SENDER_EMAIL || 'noreply@billkhata.com';
const senderName = process.env.SENDER_NAME || 'BillKhata';

interface EmailOptions {
    to: string;
    subject: string;
    htmlContent: string;
}

async function sendEmail({ to, subject, htmlContent }: EmailOptions): Promise<boolean> {
    try {
        if (!process.env.BREVO_API_KEY) {
            console.warn('⚠️ BREVO_API_KEY not set. Email not sent.');
            console.log('📧 Email would be sent to:', to);
            console.log('📧 Subject:', subject);
            return true; // Return true for development
        }

        const sendSmtpEmail = new Brevo.SendSmtpEmail();
        sendSmtpEmail.sender = { email: senderEmail, name: senderName };
        sendSmtpEmail.to = [{ email: to }];
        sendSmtpEmail.subject = subject;
        sendSmtpEmail.htmlContent = htmlContent;

        await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log('✅ Email sent successfully to:', to);
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
                    <span style="font-size: 32px; font-weight: bold; color: white; letter-spacing: 8px;">${otp}</span>
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
                    <span style="font-size: 32px; font-weight: bold; color: white; letter-spacing: 8px;">${otp}</span>
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
