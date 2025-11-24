import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError, ForbiddenError, AccessTokenPayload, UserContext } from '@omraflow/shared';
import { prisma } from '@omraflow/database';

// Extend Express Request type to include user context
declare global {
  namespace Express {
    interface Request {
      user?: UserContext;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7);

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as AccessTokenPayload;

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: {
        id: decoded.userId,
        tenantId: decoded.tenantId,
      },
      select: {
        id: true,
        tenantId: true,
        email: true,
        role: true,
        permissions: true,
        isActive: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('User account is deactivated');
    }

    // Attach user context to request
    req.user = {
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
      permissions: user.permissions as string[],
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('Invalid token'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError('Token expired'));
    } else {
      next(error);
    }
  }
};

/**
 * Middleware to check if user has required role
 */
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Not authenticated'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError('Insufficient permissions'));
    }

    next();
  };
};

/**
 * Middleware to check if user has required permission
 */
export const requirePermission = (...permissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Not authenticated'));
    }

    const hasPermission = permissions.some(permission =>
      req.user!.permissions.includes(permission) ||
      req.user!.permissions.includes('*')
    );

    if (!hasPermission) {
      return next(new ForbiddenError('Insufficient permissions'));
    }

    next();
  };
};

/**
 * Optional authentication - doesn't fail if no token
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as AccessTokenPayload;

    const user = await prisma.user.findUnique({
      where: {
        id: decoded.userId,
        tenantId: decoded.tenantId,
      },
      select: {
        id: true,
        tenantId: true,
        email: true,
        role: true,
        permissions: true,
        isActive: true,
      },
    });

    if (user && user.isActive) {
      req.user = {
        userId: user.id,
        tenantId: user.tenantId,
        email: user.email,
        role: user.role,
        permissions: user.permissions as string[],
      };
    }

    next();
  } catch (error) {
    // Silently fail and continue without user context
    next();
  }
};
