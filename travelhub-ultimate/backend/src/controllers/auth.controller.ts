import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import prisma from '../lib/prisma.js';
import { generateToken, generateRefreshToken, verifyRefreshToken } from '../middleware/auth.middleware.js';
import {
  generateVerificationToken,
  verifyEmailToken,
  clearVerificationToken,
  sendVerificationEmail as sendVerificationEmailUtil,
} from '../utils/email.utils.js';
import { config } from '../config/index.js';

/**
 * Auth Controller
 * Handles user authentication, registration, and password management
 * Now using Prisma ORM with PostgreSQL
 */

/**
 * POST /api/auth/register
 * Register a new user
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;

    // Validation
    if (!email || !password || !firstName || !lastName) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Email, password, first name, and last name are required.'
      });
      return;
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      res.status(400).json({
        success: false,
        error: 'User already exists',
        message: 'A user with this email already exists.'
      });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in database
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone: phone || null,
        role: 'user',
        status: 'active'
      }
    });

    // Generate tokens
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    const refreshToken = generateRefreshToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    // Save refresh token to database
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });

    // Set httpOnly cookies
    res.cookie(config.cookie.names.accessToken, token, {
      httpOnly: config.cookie.httpOnly,
      secure: config.cookie.secure,
      sameSite: config.cookie.sameSite,
      maxAge: config.cookie.maxAge.accessToken
    });

    res.cookie(config.cookie.names.refreshToken, refreshToken, {
      httpOnly: config.cookie.httpOnly,
      secure: config.cookie.secure,
      sameSite: config.cookie.sameSite,
      maxAge: config.cookie.maxAge.refreshToken
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          role: user.role,
          status: user.status
        }
        // Tokens are now in httpOnly cookies, not in response body
      }
    });
  } catch (error: any) {
    console.error('❌ Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      message: error.message || 'An error occurred during registration.'
    });
  }
};

/**
 * POST /api/auth/login
 * Login user
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Email and password are required.'
      });
      return;
    }

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Invalid email or password.'
      });
      return;
    }

    // Check if account is active
    if (user.status !== 'active') {
      res.status(403).json({
        success: false,
        error: 'Account inactive',
        message: `Your account is ${user.status}. Please contact support.`
      });
      return;
    }

    // Verify password
    if (!user.password) {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'This account uses OAuth. Please login with Google.'
      });
      return;
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Invalid email or password.'
      });
      return;
    }

    // Update last login time
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Generate tokens
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    const refreshToken = generateRefreshToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    // Save refresh token to database
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });

    // Set httpOnly cookies
    res.cookie(config.cookie.names.accessToken, token, {
      httpOnly: config.cookie.httpOnly,
      secure: config.cookie.secure,
      sameSite: config.cookie.sameSite,
      maxAge: config.cookie.maxAge.accessToken
    });

    res.cookie(config.cookie.names.refreshToken, refreshToken, {
      httpOnly: config.cookie.httpOnly,
      secure: config.cookie.secure,
      sameSite: config.cookie.sameSite,
      maxAge: config.cookie.maxAge.refreshToken
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          avatar: user.avatar,
          role: user.role,
          status: user.status
        }
        // Tokens are now in httpOnly cookies, not in response body
      }
    });
  } catch (error: any) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
      message: error.message || 'An error occurred during login.'
    });
  }
};

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token from httpOnly cookie
 */
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get refresh token from httpOnly cookie (preferred) or request body (fallback)
    const refreshToken = req.cookies?.[config.cookie.names.refreshToken] || req.body.refreshToken;

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Refresh token is required.'
      });
      return;
    }

    // Check if refresh token exists in database
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken }
    });

    if (!storedToken) {
      res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
        message: 'Refresh token not found.'
      });
      return;
    }

    // Check if token is expired
    if (storedToken.expiresAt < new Date()) {
      // Delete expired token
      await prisma.refreshToken.delete({
        where: { token: refreshToken }
      });

      res.status(401).json({
        success: false,
        error: 'Token expired',
        message: 'Refresh token has expired. Please login again.'
      });
      return;
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'User not found',
        message: 'User associated with this token no longer exists.'
      });
      return;
    }

    // Generate new access token
    const newToken = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    // Update httpOnly cookie
    res.cookie(config.cookie.names.accessToken, newToken, {
      httpOnly: config.cookie.httpOnly,
      secure: config.cookie.secure,
      sameSite: config.cookie.sameSite,
      maxAge: config.cookie.maxAge.accessToken
    });

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        // Token is now in httpOnly cookie
      }
    });
  } catch (error: any) {
    console.error('❌ Token refresh error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid refresh token',
      message: 'Failed to refresh token. Please login again.'
    });
  }
};

/**
 * POST /api/auth/logout
 * Logout user and clear cookies
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get refresh token from cookie
    const refreshToken = req.cookies?.[config.cookie.names.refreshToken];

    // If refresh token exists, delete it from database
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken }
      });
    }

    // Clear httpOnly cookies
    res.clearCookie(config.cookie.names.accessToken, {
      httpOnly: config.cookie.httpOnly,
      secure: config.cookie.secure,
      sameSite: config.cookie.sameSite
    });

    res.clearCookie(config.cookie.names.refreshToken, {
      httpOnly: config.cookie.httpOnly,
      secure: config.cookie.secure,
      sameSite: config.cookie.sameSite
    });

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error: any) {
    console.error('❌ Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed',
      message: 'Failed to logout.'
    });
  }
};

/**
 * POST /api/auth/forgot-password
 * Request password reset
 */
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Email is required.'
      });
      return;
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    // Don't reveal if user exists or not (security best practice)
    if (!user) {
      res.json({
        success: true,
        message: 'If an account with that email exists, password reset instructions have been sent.'
      });
      return;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(resetToken, 10);

    // Save reset token to database
    await prisma.passwordResetToken.create({
      data: {
        token: hashedToken,
        userId: user.id,
        email: user.email,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        used: false
      }
    });

    // TODO: Send email with reset link
    // const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    // await sendPasswordResetEmail(user.email, resetLink);

    console.log(`🔑 Password reset token for ${email}: ${resetToken}`);

    res.json({
      success: true,
      message: 'If an account with that email exists, password reset instructions have been sent.'
    });
  } catch (error: any) {
    console.error('❌ Forgot password error:', error);
    res.status(500).json({
      success: false,
      error: 'Request failed',
      message: 'Failed to process password reset request.'
    });
  }
};

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Token and new password are required.'
      });
      return;
    }

    // Find all unused, non-expired tokens
    const resetTokens = await prisma.passwordResetToken.findMany({
      where: {
        used: false,
        expiresAt: {
          gte: new Date()
        }
      }
    });

    // Find matching token
    let validToken = null;
    for (const resetToken of resetTokens) {
      const isValid = await bcrypt.compare(token, resetToken.token);
      if (isValid) {
        validToken = resetToken;
        break;
      }
    }

    if (!validToken) {
      res.status(400).json({
        success: false,
        error: 'Invalid or expired token',
        message: 'Password reset token is invalid or has expired.'
      });
      return;
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await prisma.user.update({
      where: { id: validToken.userId },
      data: { password: hashedPassword }
    });

    // Mark token as used
    await prisma.passwordResetToken.update({
      where: { id: validToken.id },
      data: {
        used: true,
        usedAt: new Date()
      }
    });

    // Delete all refresh tokens for this user (force re-login)
    await prisma.refreshToken.deleteMany({
      where: { userId: validToken.userId }
    });

    res.json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.'
    });
  } catch (error: any) {
    console.error('❌ Reset password error:', error);
    res.status(500).json({
      success: false,
      error: 'Reset failed',
      message: 'Failed to reset password.'
    });
  }
};

/**
 * GET /api/auth/google
 * Initiate Google OAuth flow
 */
export const googleAuth = async (req: Request, res: Response): Promise<void> => {
  // TODO: Implement Google OAuth
  // Redirect to Google OAuth URL
  res.status(302).redirect('https://accounts.google.com/o/oauth2/v2/auth');
};

/**
 * GET /api/auth/google/callback
 * Google OAuth callback
 */
export const googleAuthCallback = async (req: Request, res: Response): Promise<void> => {
  // TODO: Implement Google OAuth callback
  // 1. Exchange code for token
  // 2. Get user info from Google
  // 3. Find or create user in database
  // 4. Generate JWT tokens
  // 5. Redirect to frontend with tokens
  res.status(302).redirect(process.env.FRONTEND_URL || 'http://localhost:5173');
};

/**
 * GET /api/auth/me
 * Get current user (protected route)
 */
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    // User is already attached by authenticate middleware
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Not authenticated'
      });
      return;
    }

    // Fetch full user data from database
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        status: true,
        createdAt: true,
        lastLoginAt: true
      }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User no longer exists.'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        user
      }
    });
  } catch (error: any) {
    console.error('❌ Get current user error:', error);
    res.status(500).json({
      success: false,
      error: 'Request failed',
      message: 'Failed to get user data.'
    });
  }
};

/**
 * PUT /api/auth/me
 * Update user profile
 */
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
      return;
    }

    const { firstName, lastName, phone, avatar } = req.body;

    // Build update data object (only include provided fields)
    const updateData: any = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phone = phone || null;
    if (avatar !== undefined) updateData.avatar = avatar || null;

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        status: true
      }
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: updatedUser
      }
    });
  } catch (error: any) {
    console.error('❌ Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Update failed',
      message: 'Failed to update profile.'
    });
  }
};

/**
 * PUT /api/auth/me/password
 * Change password
 */
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Current and new password are required.'
      });
      return;
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user || !user.password) {
      res.status(400).json({
        success: false,
        error: 'Cannot change password',
        message: 'This account uses OAuth authentication.'
      });
      return;
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);

    if (!isValid) {
      res.status(401).json({
        success: false,
        error: 'Invalid password',
        message: 'Current password is incorrect.'
      });
      return;
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    // Delete all refresh tokens (force re-login on all devices)
    await prisma.refreshToken.deleteMany({
      where: { userId: user.id }
    });

    res.json({
      success: true,
      message: 'Password changed successfully. Please login again on all devices.'
    });
  } catch (error: any) {
    console.error('❌ Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Change failed',
      message: 'Failed to change password.'
    });
  }
};

/**
 * DELETE /api/auth/me
 * Delete user account
 */
export const deleteAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
      return;
    }

    // Delete user from database (cascade delete will handle related records)
    await prisma.user.delete({
      where: { id: req.user.id }
    });

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error: any) {
    console.error('❌ Delete account error:', error);
    res.status(500).json({
      success: false,
      error: 'Deletion failed',
      message: 'Failed to delete account.'
    });
  }
};

/**
 * POST /api/auth/send-verification-email
 * Send or resend email verification
 */
export const sendVerificationEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Email is required',
      });
      return;
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists (security best practice)
      res.json({
        success: true,
        message: 'If an account exists with this email, a verification link has been sent.',
      });
      return;
    }

    // Check if already verified
    if (user.emailVerified) {
      res.json({
        success: true,
        message: 'Email is already verified.',
      });
      return;
    }

    // Generate verification token
    const token = generateVerificationToken(email);

    // Get base URL for verification link
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    // Send verification email
    const result = await sendVerificationEmailUtil(email, token, baseUrl);

    res.json({
      success: true,
      message: result.message,
      data: {
        email,
        // In development, include the token for easy testing
        ...(process.env.NODE_ENV === 'development' && { token }),
      },
    });
  } catch (error: any) {
    console.error('❌ Send verification email error:', error);
    res.status(500).json({
      success: false,
      error: 'Email send failed',
      message: 'Failed to send verification email.',
    });
  }
};

/**
 * GET /api/auth/verify-email?token=xxx
 * Verify email address with token
 */
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Verification token is required',
      });
      return;
    }

    // Verify the token
    const result = verifyEmailToken(token);

    if (!result.valid || !result.email) {
      res.status(400).json({
        success: false,
        error: 'Invalid token',
        message: 'Verification token is invalid or expired',
      });
      return;
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: result.email },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User account not found',
      });
      return;
    }

    // Check if already verified
    if (user.emailVerified) {
      res.json({
        success: true,
        message: 'Email is already verified',
        data: {
          email: user.email,
          verified: true,
        },
      });
      return;
    }

    // Mark email as verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });

    // Clear the verification token
    clearVerificationToken(token);

    res.json({
      success: true,
      message: 'Email verified successfully',
      data: {
        email: user.email,
        verified: true,
      },
    });
  } catch (error: any) {
    console.error('❌ Email verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Verification failed',
      message: 'Failed to verify email.',
    });
  }
};
