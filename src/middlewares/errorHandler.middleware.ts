import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../errors/AppError.js';
import type { ErrorResponse } from '../types/api.types.js';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  void next;
  const timestamp = new Date().toISOString();

  if (err instanceof AppError) {
    const hasCode =
      err.code !== null && err.code !== undefined && err.code.length > 0;
    const hasDetail =
      err.detail !== null && err.detail !== undefined && err.detail.length > 0;
    const body: ErrorResponse = {
      success: false,
      status: err.statusCode,
      message: err.message,
      ...(hasCode && {
        error: {
          code: err.code as string,
          ...(hasDetail && { detail: err.detail }),
        },
      }),
      timestamp,
    };

    res.status(err.statusCode).json(body);

    return;
  }

  const body: ErrorResponse = {
    success: false,
    status: 500,
    message: '서버 내부 오류가 발생했습니다.',
    timestamp,
  };

  res.status(500).json(body);
}
