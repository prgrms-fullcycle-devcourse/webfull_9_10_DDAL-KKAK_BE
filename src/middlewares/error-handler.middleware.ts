import { type NextFunction, type Request, type Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import config from '../config/index.js';
import { AppError } from '../errors/app-error.js';
import { sendError } from '../utils/response.js';

export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  void _next;

  if (error instanceof AppError) {
    console.error(`[AppError]: ${error.code} - ${error.message}`);
    if (typeof error.stack === 'string') {
      console.error(error.stack);
    }

    sendError(res, error.status, error.message, error.code, error.detail);
  }

  console.error('[Unhandled Error]:', error);
  sendError(
    res,
    StatusCodes.INTERNAL_SERVER_ERROR,
    '요청 처리 중 오류가 발생했습니다.',
    'COMMON_001',
    config.nodeEnv === 'development'
      ? (error as Error).message // 개발 환경에서만 에러 원인 노출
      : '알 수 없는 서버 오류입니다.',
  );
};
