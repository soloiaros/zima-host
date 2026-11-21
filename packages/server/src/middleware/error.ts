import type { Request, Response, NextFunction } from 'express';
import type { ApiResponse } from '@zima-host/shared';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error('[error]', err.message, err.stack);

  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message =
    err instanceof AppError ? err.message : 'Internal server error';

  const response: ApiResponse = {
    success: false,
    error: message,
  };

  res.status(statusCode).json(response);
}
