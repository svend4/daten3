/**
 * Email Utilities
 * Email verification and sending helpers
 */

import crypto from 'crypto';

/**
 * Email verification token storage (in production, use Redis or database)
 */
const verificationTokens = new Map<string, { email: string; expiresAt: Date }>();

/**
 * Generate email verification token
 */
export function generateVerificationToken(email: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  verificationTokens.set(token, { email, expiresAt });

  return token;
}

/**
 * Verify email verification token
 */
export function verifyEmailToken(token: string): { valid: boolean; email?: string } {
  const data = verificationTokens.get(token);

  if (!data) {
    return { valid: false };
  }

  if (data.expiresAt < new Date()) {
    verificationTokens.delete(token);
    return { valid: false };
  }

  return { valid: true, email: data.email };
}

/**
 * Clear verification token after use
 */
export function clearVerificationToken(token: string): void {
  verificationTokens.delete(token);
}

/**
 * Clean up expired tokens (call periodically)
 */
export function cleanupExpiredTokens(): void {
  const now = new Date();
  for (const [token, data] of verificationTokens.entries()) {
    if (data.expiresAt < now) {
      verificationTokens.delete(token);
    }
  }
}

// Clean up tokens every hour
setInterval(cleanupExpiredTokens, 60 * 60 * 1000);

/**
 * Generate password reset token
 */
export function generatePasswordResetToken(userId: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

  verificationTokens.set(token, { email: userId, expiresAt });

  return token;
}

/**
 * Send verification email (mock implementation)
 * In production, integrate with SendGrid, AWS SES, or similar service
 */
export async function sendVerificationEmail(
  email: string,
  token: string,
  baseUrl: string
): Promise<{ success: boolean; message: string }> {
  const verificationUrl = `${baseUrl}/verify-email?token=${token}`;

  // TODO: Integrate with email service
  console.log(`
    ═══════════════════════════════════════════════════
    📧 EMAIL VERIFICATION (Development Mode)
    ═══════════════════════════════════════════════════
    To: ${email}
    Subject: Verify your TravelHub account

    Click the link below to verify your email address:
    ${verificationUrl}

    This link expires in 24 hours.
    ═══════════════════════════════════════════════════
  `);

  return {
    success: true,
    message: 'Verification email sent (check console in development)',
  };
}

/**
 * Send password reset email (mock implementation)
 */
export async function sendPasswordResetEmail(
  email: string,
  token: string,
  baseUrl: string
): Promise<{ success: boolean; message: string }> {
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  // TODO: Integrate with email service
  console.log(`
    ═══════════════════════════════════════════════════
    🔐 PASSWORD RESET (Development Mode)
    ═══════════════════════════════════════════════════
    To: ${email}
    Subject: Reset your TravelHub password

    Click the link below to reset your password:
    ${resetUrl}

    This link expires in 1 hour.

    If you didn't request this, please ignore this email.
    ═══════════════════════════════════════════════════
  `);

  return {
    success: true,
    message: 'Password reset email sent (check console in development)',
  };
}

/**
 * Send booking confirmation email (mock implementation)
 */
export async function sendBookingConfirmationEmail(
  email: string,
  bookingDetails: {
    bookingId: string;
    hotelName: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    totalPrice: number;
  }
): Promise<{ success: boolean; message: string }> {
  // TODO: Integrate with email service
  console.log(`
    ═══════════════════════════════════════════════════
    ✅ BOOKING CONFIRMATION (Development Mode)
    ═══════════════════════════════════════════════════
    To: ${email}
    Subject: Booking Confirmation - ${bookingDetails.hotelName}

    Booking ID: ${bookingDetails.bookingId}
    Hotel: ${bookingDetails.hotelName}
    Check-in: ${bookingDetails.checkIn}
    Check-out: ${bookingDetails.checkOut}
    Guests: ${bookingDetails.guests}
    Total: $${bookingDetails.totalPrice}

    Thank you for booking with TravelHub!
    ═══════════════════════════════════════════════════
  `);

  return {
    success: true,
    message: 'Booking confirmation email sent',
  };
}

/**
 * Validate email format (additional validation)
 */
export function isValidEmailFormat(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if email domain is disposable (spam prevention)
 */
export function isDisposableEmail(email: string): boolean {
  const disposableDomains = [
    'tempmail.com',
    'throwaway.email',
    '10minutemail.com',
    'guerrillamail.com',
    'mailinator.com',
    'yopmail.com',
  ];

  const domain = email.split('@')[1]?.toLowerCase();
  return disposableDomains.includes(domain);
}
