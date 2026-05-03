import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { AppError } from '../errors/app-error.js';
import * as authService from '../services/auth.service.js';
import type { AuthenticatedRequest } from '../types/auth.types.js';
import { setRefreshTokenCookie } from '../utils/auth.utils.js';
import { sendSuccess } from '../utils/response.js';

interface LoginRequestParams {
  provider: string;
}

export const startLogin = (req: Request<LoginRequestParams>, res: Response) => {
  const { provider } = req.params;

  const { redirectUrl, state } = authService.getSocialLoginInfo(provider);

  req.session.authState = state;

  res.redirect(redirectUrl);
};

export const finishLogin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { provider } = req.params;
    const { code, state, error } = req.query;

    if (state === undefined || state !== req.session.authState) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'CSRF_ERROR',
        '비정상적인 요청입니다.',
        '인증 상태 값이 일치하지 않습니다.',
      );
    }

    if (error === 'access_denied') {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'USER_CANCELLED',
        '로그인에 실패했습니다.',
        '사용자가 소셜 로그인 승인을 취소했습니다.',
      );
    }

    if (error === 'consent_required') {
      throw new AppError(
        StatusCodes.UNPROCESSABLE_ENTITY,
        'REQUIRED_INFO_MISSING',
        '필수 정보가 누락되었습니다.',
        '소셜 플랫폼으로부터 이메일 정보를 제공받지 못했습니다. 동의 화면에서 필수 항목을 체크해 주세요.',
      );
    }

    delete req.session.authState;

    const { refreshToken, accessToken, tokenInfo, user } =
      await authService.loginWithSocial(provider as string, code as string);

    // refreshToken을 쿠키에 저장
    setRefreshTokenCookie(res, refreshToken);

    sendSuccess(res, StatusCodes.OK, '로그인이 성공적으로 완료되었습니다.', {
      tokenInfo: {
        accessToken,
        ...tokenInfo,
      },
      user,
    });
  } catch (err) {
    next(err);
  }
};

export const logoutUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      user: { sub: userId },
    } = req as AuthenticatedRequest;

    // 사용자 로그아웃 처리
    await authService.logoutUser(userId);

    return sendSuccess(
      res,
      StatusCodes.OK,
      '로그아웃이 성공적으로 완료되었습니다.',
      null,
    );
  } catch (err: unknown) {
    if (err instanceof Error) {
      return next(err);
    }
  }
};

export const refreshUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { refreshToken: oldRefreshToken } = req.cookies;

    if (oldRefreshToken === undefined) {
      // 갱신 토큰이 쿠키에 존재하지 않음
      throw new AppError(
        StatusCodes.UNAUTHORIZED,
        'MISSING_REFRESH_TOKEN',
        '인증 정보가 없습니다.',
        '인증을 위한 리프레시 토큰이 쿠키에 존재하지 않습니다.',
      );
    }

    const {
      accessToken,
      refreshToken: newRefreshToken,
      tokenType,
      expiresIn,
    } = await authService.refreshAccessToken(oldRefreshToken);

    setRefreshTokenCookie(res, newRefreshToken);

    return sendSuccess(
      res,
      StatusCodes.OK,
      '토큰이 성공적으로 갱신되었습니다.',
      { accessToken, tokenType, expiresIn },
    );
  } catch (err) {
    if (err instanceof AppError) {
      return next(err);
    }

    if (err instanceof Error) {
      return next(err);
    }
  }
};
