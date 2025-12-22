/**
 * Email Service
 * Integration point for email service providers
 *
 * TODO: Choose and integrate an email service provider:
 * - SendGrid (recommended for production)
 * - AWS SES (cost-effective for high volume)
 * - Nodemailer (flexible, works with any SMTP)
 * - Mailgun (good for transactional emails)
 * - Postmark (focused on transactional emails)
 */

import logger from '../utils/logger.js';

/**
 * Email configuration
 * Set via environment variables
 */
interface EmailConfig {
  provider: 'console' | 'sendgrid' | 'ses' | 'smtp' | 'mailgun';
  from: {
    email: string;
    name: string;
  };
  apiKey?: string;
  smtpConfig?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
}

const emailConfig: EmailConfig = {
  provider: (process.env.EMAIL_PROVIDER as any) || 'console',
  from: {
    email: process.env.EMAIL_FROM || 'noreply@travelhub.com',
    name: process.env.EMAIL_FROM_NAME || 'TravelHub'
  },
  apiKey: process.env.EMAIL_API_KEY,
  smtpConfig: process.env.SMTP_HOST ? {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || ''
    }
  } : undefined
};

/**
 * Email template interface
 */
interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Email service class
 */
class EmailService {
  private config: EmailConfig;

  constructor(config: EmailConfig) {
    this.config = config;
  }

  /**
   * Send email using configured provider
   */
  async send(template: EmailTemplate): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      switch (this.config.provider) {
        case 'sendgrid':
          return await this.sendWithSendGrid(template);
        case 'ses':
          return await this.sendWithSES(template);
        case 'smtp':
          return await this.sendWithSMTP(template);
        case 'mailgun':
          return await this.sendWithMailgun(template);
        case 'console':
        default:
          return this.sendToConsole(template);
      }
    } catch (error: any) {
      logger.error('Email send failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(email: string, token: string, baseUrl: string): Promise<{ success: boolean }> {
    const verificationUrl = `${baseUrl}/verify-email?token=${token}`;

    const template: EmailTemplate = {
      to: email,
      subject: 'Verify your TravelHub account',
      html: this.getVerificationEmailHTML(verificationUrl),
      text: `Welcome to TravelHub! Click the link below to verify your email address:\n\n${verificationUrl}\n\nThis link expires in 24 hours.`
    };

    const result = await this.send(template);
    return { success: result.success };
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, token: string, baseUrl: string): Promise<{ success: boolean }> {
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    const template: EmailTemplate = {
      to: email,
      subject: 'Reset your TravelHub password',
      html: this.getPasswordResetEmailHTML(resetUrl),
      text: `Click the link below to reset your password:\n\n${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you didn't request this, please ignore this email.`
    };

    const result = await this.send(template);
    return { success: result.success };
  }

  /**
   * Send booking confirmation email
   */
  async sendBookingConfirmation(
    email: string,
    bookingDetails: {
      bookingId: string;
      hotelName: string;
      checkIn: string;
      checkOut: string;
      guests: number;
      totalPrice: number;
      currency: string;
    }
  ): Promise<{ success: boolean }> {
    const template: EmailTemplate = {
      to: email,
      subject: `Booking Confirmation - ${bookingDetails.hotelName}`,
      html: this.getBookingConfirmationHTML(bookingDetails),
      text: `Booking Confirmation\n\nBooking ID: ${bookingDetails.bookingId}\nHotel: ${bookingDetails.hotelName}\nCheck-in: ${bookingDetails.checkIn}\nCheck-out: ${bookingDetails.checkOut}\nGuests: ${bookingDetails.guests}\nTotal: ${bookingDetails.totalPrice} ${bookingDetails.currency}\n\nThank you for booking with TravelHub!`
    };

    const result = await this.send(template);
    return { success: result.success };
  }

  /**
   * Send price alert notification
   */
  async sendPriceAlert(
    email: string,
    alertDetails: {
      destination: string;
      targetPrice: number;
      currentPrice: number;
      currency: string;
      type: 'hotel' | 'flight';
    }
  ): Promise<{ success: boolean }> {
    const template: EmailTemplate = {
      to: email,
      subject: `Price Alert: ${alertDetails.destination} is now ${alertDetails.currentPrice} ${alertDetails.currency}!`,
      html: this.getPriceAlertHTML(alertDetails),
      text: `Great news! The price for ${alertDetails.destination} has dropped!\n\nYour target price: ${alertDetails.targetPrice} ${alertDetails.currency}\nCurrent price: ${alertDetails.currentPrice} ${alertDetails.currency}\n\nBook now at TravelHub!`
    };

    const result = await this.send(template);
    return { success: result.success };
  }

  /**
   * SendGrid integration
   * TODO: Install @sendgrid/mail package
   * npm install @sendgrid/mail
   */
  private async sendWithSendGrid(template: EmailTemplate): Promise<{ success: boolean; messageId?: string }> {
    // TODO: Implement SendGrid integration
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(this.config.apiKey!);
    //
    // const msg = {
    //   to: template.to,
    //   from: this.config.from.email,
    //   subject: template.subject,
    //   text: template.text,
    //   html: template.html,
    // };
    //
    // const result = await sgMail.send(msg);
    // return { success: true, messageId: result[0].headers['x-message-id'] };

    logger.warn('SendGrid not configured, falling back to console');
    return this.sendToConsole(template);
  }

  /**
   * AWS SES integration
   * TODO: Install @aws-sdk/client-ses package
   * npm install @aws-sdk/client-ses
   */
  private async sendWithSES(template: EmailTemplate): Promise<{ success: boolean; messageId?: string }> {
    // TODO: Implement AWS SES integration
    // const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
    //
    // const client = new SESClient({ region: process.env.AWS_REGION || 'us-east-1' });
    //
    // const command = new SendEmailCommand({
    //   Source: this.config.from.email,
    //   Destination: { ToAddresses: [template.to] },
    //   Message: {
    //     Subject: { Data: template.subject },
    //     Body: {
    //       Html: { Data: template.html },
    //       Text: { Data: template.text }
    //     }
    //   }
    // });
    //
    // const result = await client.send(command);
    // return { success: true, messageId: result.MessageId };

    logger.warn('AWS SES not configured, falling back to console');
    return this.sendToConsole(template);
  }

  /**
   * SMTP integration with Nodemailer
   * TODO: Install nodemailer package
   * npm install nodemailer
   */
  private async sendWithSMTP(template: EmailTemplate): Promise<{ success: boolean; messageId?: string }> {
    // TODO: Implement Nodemailer SMTP integration
    // const nodemailer = require('nodemailer');
    //
    // const transporter = nodemailer.createTransport(this.config.smtpConfig);
    //
    // const info = await transporter.sendMail({
    //   from: `"${this.config.from.name}" <${this.config.from.email}>`,
    //   to: template.to,
    //   subject: template.subject,
    //   text: template.text,
    //   html: template.html
    // });
    //
    // return { success: true, messageId: info.messageId };

    logger.warn('SMTP not configured, falling back to console');
    return this.sendToConsole(template);
  }

  /**
   * Mailgun integration
   * TODO: Install mailgun.js package
   * npm install mailgun.js form-data
   */
  private async sendWithMailgun(template: EmailTemplate): Promise<{ success: boolean; messageId?: string }> {
    // TODO: Implement Mailgun integration
    // const formData = require('form-data');
    // const Mailgun = require('mailgun.js');
    //
    // const mailgun = new Mailgun(formData);
    // const mg = mailgun.client({
    //   username: 'api',
    //   key: this.config.apiKey!
    // });
    //
    // const result = await mg.messages.create(process.env.MAILGUN_DOMAIN!, {
    //   from: `${this.config.from.name} <${this.config.from.email}>`,
    //   to: [template.to],
    //   subject: template.subject,
    //   text: template.text,
    //   html: template.html
    // });
    //
    // return { success: true, messageId: result.id };

    logger.warn('Mailgun not configured, falling back to console');
    return this.sendToConsole(template);
  }

  /**
   * Console fallback (development only)
   */
  private sendToConsole(template: EmailTemplate): { success: boolean; messageId: string } {
    logger.info('═══════════════════════════════════════════════════');
    logger.info('📧 EMAIL (Development Mode - Console)');
    logger.info('═══════════════════════════════════════════════════');
    logger.info(`To: ${template.to}`);
    logger.info(`From: ${this.config.from.name} <${this.config.from.email}>`);
    logger.info(`Subject: ${template.subject}`);
    logger.info('');
    logger.info(template.text || 'No text version');
    logger.info('═══════════════════════════════════════════════════');

    return {
      success: true,
      messageId: `dev_${Date.now()}`
    };
  }

  /**
   * HTML Email Templates
   */

  private getVerificationEmailHTML(verificationUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 5px; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Welcome to TravelHub! 🎉</h2>
          <p>Thank you for signing up. Please verify your email address to get started.</p>
          <p><a href="${verificationUrl}" class="button">Verify Email Address</a></p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
          <p>This link expires in 24 hours.</p>
          <div class="footer">
            <p>If you didn't create an account, you can safely ignore this email.</p>
            <p>© ${new Date().getFullYear()} TravelHub. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getPasswordResetEmailHTML(resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { display: inline-block; padding: 12px 24px; background: #ef4444; color: white; text-decoration: none; border-radius: 5px; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Password Reset Request 🔐</h2>
          <p>We received a request to reset your password.</p>
          <p><a href="${resetUrl}" class="button">Reset Password</a></p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          <p>This link expires in 1 hour.</p>
          <div class="footer">
            <p>If you didn't request this, you can safely ignore this email.</p>
            <p>© ${new Date().getFullYear()} TravelHub. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getBookingConfirmationHTML(booking: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .booking-details { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Booking Confirmed! ✅</h2>
          <p>Your booking has been confirmed. Here are your details:</p>
          <div class="booking-details">
            <div class="detail-row"><strong>Booking ID:</strong> <span>${booking.bookingId}</span></div>
            <div class="detail-row"><strong>Hotel:</strong> <span>${booking.hotelName}</span></div>
            <div class="detail-row"><strong>Check-in:</strong> <span>${booking.checkIn}</span></div>
            <div class="detail-row"><strong>Check-out:</strong> <span>${booking.checkOut}</span></div>
            <div class="detail-row"><strong>Guests:</strong> <span>${booking.guests}</span></div>
            <div class="detail-row"><strong>Total:</strong> <span>${booking.totalPrice} ${booking.currency}</span></div>
          </div>
          <p>Thank you for booking with TravelHub! We hope you have a wonderful trip.</p>
          <div class="footer">
            <p>Need help? Contact us at support@travelhub.com</p>
            <p>© ${new Date().getFullYear()} TravelHub. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getPriceAlertHTML(alert: any): string {
    const savings = alert.targetPrice - alert.currentPrice;
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .alert-box { background: #dcfce7; border-left: 4px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .price { font-size: 32px; font-weight: bold; color: #10b981; }
          .button { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>🎉 Price Drop Alert!</h2>
          <div class="alert-box">
            <p><strong>${alert.destination}</strong></p>
            <p class="price">${alert.currentPrice} ${alert.currency}</p>
            <p>Your target: ${alert.targetPrice} ${alert.currency}</p>
            <p style="color: #10b981; font-weight: bold;">You save: ${savings} ${alert.currency}</p>
            <a href="https://travelhub.com/search?q=${encodeURIComponent(alert.destination)}" class="button">Book Now</a>
          </div>
          <p>This is a great opportunity to book your ${alert.type} to ${alert.destination}!</p>
          <div class="footer">
            <p>You're receiving this because you set up a price alert.</p>
            <p>© ${new Date().getFullYear()} TravelHub. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

// Export singleton instance
export const emailService = new EmailService(emailConfig);
