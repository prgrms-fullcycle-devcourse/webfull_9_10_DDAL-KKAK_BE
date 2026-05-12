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
    return;
  }

  const prismaCode =
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
      ? (error as { code: string }).code
      : undefined;

  if (prismaCode === 'P2003') {
    console.error('[Prisma P2003 FK violation]:', error);
    sendError(
      res,
      StatusCodes.BAD_REQUEST,
      '연관 데이터가 유효하지 않습니다.',
      'OCR_011',
      'tripId 또는 사용자 정보가 데이터베이스에 존재하지 않습니다.',
    );
    return;
  }

  console.error('[Unhandled Error]:', error);
  if (error instanceof Error && typeof error.stack === 'string') {
    console.error(error.stack);
  }

  sendError(
    res,
    StatusCodes.INTERNAL_SERVER_ERROR,
    '요청 처리 중 오류가 발생했습니다.',
    'COMMON_001',
    config.nodeEnv === 'development'
      ? error instanceof Error
        ? error.message
        : String(error)
      : '알 수 없는 서버 오류입니다.',
  );
};
