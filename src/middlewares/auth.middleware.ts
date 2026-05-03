import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import jwt from 'jsonwebtoken';

import { AppError } from '../errors/app-error.js';
import type { AuthenticatedRequest, JwtPayload } from '../types/auth.types.js';

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    // 헤더 검증
    if (authHeader?.startsWith('Bearer ') !== true) {
      throw new AppError(
        StatusCodes.UNAUTHORIZED,
        'MISSING_TOKEN',
        '인증에 실패했습니다.',
        '요청 인증 토큰(Access Token)이 포함되어야 합니다.',
      );
    }

    // 토큰 추출
    const token = authHeader.split(' ')[1];

    if (token === undefined || token === '') {
      throw new AppError(
        StatusCodes.UNAUTHORIZED,
        'INVALID_TOKEN',
        '인증에 실패했습니다.',
        '유효하지 않은 토큰입니다. 토큰의 형식이 잘못되었습니다.',
      );
    }

    // 토큰 검증
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET as string, {
      issuer: 'travel-tick',
    }) as JwtPayload;

    (req as AuthenticatedRequest).user = decoded;

    next();
  } catch (err: unknown) {
    if (err instanceof AppError) {
      return next(err);
    }

    if (err instanceof Error) {
      // 토큰 만료
      if (err.name === 'TokenExpiredError') {
        return next(
          new AppError(
            StatusCodes.UNAUTHORIZED,
            'EXPIRED_TOKEN',
            '인증이 필요합니다.',
            '액세스 토큰이 만료되었습니다. 다시 로그인하거나 토큰을 갱신해 주세요.',
          ),
        );
      }

      return next(
        new AppError(
          StatusCodes.UNAUTHORIZED,
          'INVALID_TOKEN',
          '인증에 실패했습니다.',
          '유효하지 않은 토큰입니다. 형식, 서명이 틀리거나 발행처(issuer)가 일치하지 않습니다.',
        ),
      );
    }

    // 그 외 에러
    return next(err);
  }
};
