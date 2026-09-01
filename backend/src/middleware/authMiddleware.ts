import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt';
import { prisma } from '../prisma/client';
import { Role } from '../config/constants';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        name: string;
        providerId?: string;
      };
    }
  }
}

export const authenticateJwt = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Authentication token missing or invalid format (Bearer token required)',
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    // Verify user still exists in DB
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { provider: true },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User account not found or deactivated',
      });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      providerId: user.provider?.id,
    };

    next();
  } catch (error: any) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token',
      error: error.message,
    });
  }
};

export const authorizeRoles = (...allowedRoles: (Role | string)[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized: Authentication required',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to roles [${allowedRoles.join(', ')}]. Current role: ${req.user.role}`,
      });
      return;
    }

    next();
  };
};

export const requireFrontDesk = authorizeRoles(Role.FRONT_DESK);
export const requireProvider = authorizeRoles(Role.PROVIDER);
