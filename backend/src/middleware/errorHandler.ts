import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Prisma unique constraint error
  if (err.code === 'P2002') {
    res.status(409).json({
      success: false,
      message: `A record with this unique field already exists: ${err.meta?.target || 'unknown field'}`,
    });
    return;
  }

  // Prisma record not found error
  if (err.code === 'P2025') {
    res.status(404).json({
      success: false,
      message: 'Requested record was not found in database',
    });
    return;
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};
