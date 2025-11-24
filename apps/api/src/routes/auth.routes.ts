import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@omraflow/database';
import {
  loginSchema,
  registerSchema,
  passwordResetSchema,
  passwordResetConfirmSchema,
} from '@omraflow/shared';
import { ValidationError, UnauthorizedError } from '@omraflow/shared';
import { hashPassword, comparePassword } from '../utils/password';
import { generateTokens, verifyRefreshToken } from '../utils/jwt';
import { authenticate } from '../middleware/auth';
import { strictRateLimiter } from '../middleware/rateLimiter';
import { slugify, generateCode } from '@omraflow/shared';

const router = Router();

/**
 * POST /api/auth/register
 * Register new tenant and admin user
 */
router.post('/register', strictRateLimiter, async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);

    // Check if email already exists
    const existingUser = await prisma.user.findFirst({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ValidationError('Email already registered');
    }

    // Create tenant
    const slug = slugify(data.tenantName);
    const tenant = await prisma.tenant.create({
      data: {
        name: data.tenantName,
        slug: `${slug}-${generateCode(4)}`,
        subscriptionPlan: 'STARTER',
        subscriptionStatus: 'TRIAL',
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Create admin user
    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: 'ADMIN',
        permissions: ['*'],
        isActive: true,
      },
    });

    // Generate tokens
    const tokens = generateTokens({
      id: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
    });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
        },
        ...tokens,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', strictRateLimiter, async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);

    // Find user
    const user = await prisma.user.findFirst({
      where: { email: data.email },
      include: { tenant: true },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedError('Account is deactivated');
    }

    // Check password
    const isPasswordValid = await comparePassword(data.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const tokens = generateTokens({
      id: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        tenant: {
          id: user.tenant.id,
          name: user.tenant.name,
          slug: user.tenant.slug,
        },
        ...tokens,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new UnauthorizedError('No refresh token provided');
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Generate new tokens
    const tokens = generateTokens({
      id: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
    });

    res.json({
      success: true,
      data: tokens,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/me
 * Get current user
 */
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            subscriptionPlan: true,
            subscriptionStatus: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
        permissions: user.permissions,
        tenant: user.tenant,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/logout
 * Logout user (client should delete tokens)
 */
router.post('/logout', authenticate, async (req, res) => {
  // In a more sophisticated setup, you might invalidate the refresh token here
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

/**
 * POST /api/auth/forgot-password
 * Request password reset
 */
router.post('/forgot-password', strictRateLimiter, async (req, res, next) => {
  try {
    const data = passwordResetSchema.parse(req.body);

    const user = await prisma.user.findFirst({
      where: { email: data.email },
    });

    // Don't reveal if user exists or not for security
    if (!user) {
      return res.json({
        success: true,
        message: 'If your email is registered, you will receive a password reset link',
      });
    }

    // Generate reset token
    const resetToken = generateCode(32);
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpiresAt: resetExpiry,
      },
    });

    // TODO: Send email with reset link
    // await sendPasswordResetEmail(user.email, resetToken);

    res.json({
      success: true,
      message: 'If your email is registered, you will receive a password reset link',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
router.post('/reset-password', strictRateLimiter, async (req, res, next) => {
  try {
    const data = passwordResetConfirmSchema.parse(req.body);

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: data.token,
        passwordResetExpiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new ValidationError('Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await hashPassword(data.password);

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
      },
    });

    res.json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
