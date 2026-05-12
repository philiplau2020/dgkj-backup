import { Request, Response, NextFunction } from 'express';

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp: string;
}

export class ApiException extends Error {
  constructor(
    public code: number = 500,
    public message: string = 'Internal server error',
    public data?: any
  ) {
    super(message);
    this.name = 'ApiException';
  }
}

export class BadRequestException extends ApiException {
  constructor(message: string = 'Bad request') {
    super(400, message);
  }
}

export class UnauthorizedException extends ApiException {
  constructor(message: string = 'Unauthorized') {
    super(401, message);
  }
}

export class ForbiddenException extends ApiException {
  constructor(message: string = 'Forbidden') {
    super(403, message);
  }
}

export class NotFoundException extends ApiException {
  constructor(message: string = 'Resource not found') {
    super(404, message);
  }
}

export function errorHandler(
  err: Error | ApiException,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error:', err);

  if (err instanceof ApiException) {
    return res.status(err.code).json({
      code: err.code,
      message: err.message,
      data: err.data,
      timestamp: new Date().toISOString(),
    });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      code: 400,
      message: err.message,
      data: null,
      timestamp: new Date().toISOString(),
    });
  }

  // Default error
  return res.status(500).json({
    code: 500,
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    data: null,
    timestamp: new Date().toISOString(),
  });
}
