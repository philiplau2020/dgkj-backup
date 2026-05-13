import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiException, UnauthorizedException } from '../filters/global-exception.filter';

export interface JwtPayload {
  userId: string;
  username: string;
  role: string;
  userType?: number;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authGuard(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('No authorization header');
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid authorization format');
    }

    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const payload = jwt.verify(token, secret) as JwtPayload;

    req.user = payload;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedException('Invalid token'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedException('Token expired'));
    } else {
      next(error);
    }
  }
}

export function roleGuard(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return next(new UnauthorizedException('Not authenticated'));
    }

    if (allowedRoles.length && !allowedRoles.includes(user.role)) {
      return next(new ApiException(403, 'Insufficient permissions'));
    }

    next();
  };
}
