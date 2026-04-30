import { type NextFunction, type Request, type Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { AppError } from '../errors/app-error.js';
import { sendError } from '../utils/response.js';

export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): Response => {
  void _next;

  if (error instanceof AppError) {
    return sendError(
      res,
      error.status,
      error.message,
      error.code,
      error.detail,
    );
  }

  return sendError(
    res,
    StatusCodes.INTERNAL_SERVER_ERROR,
    '요청 처리 중 오류가 발생했습니다.',
    'COMMON_001',
    '알 수 없는 서버 오류입니다.',
  );
};
