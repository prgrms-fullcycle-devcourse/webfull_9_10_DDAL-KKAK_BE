import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { AppError } from '../errors/app-error.js';
import * as authService from '../services/auth.service.js';
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
    const { code, state } = req.query;

    if (state === undefined || state !== req.session.authState) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'CSRF_ERROR',
        '비정상적인 요청입니다.',
        '인증 상태 값이 일치하지 않습니다.',
      );
    }

    delete req.session.authState;

    const { refreshToken, accessToken, tokenInfo, user } =
      await authService.loginWithSocial(provider as string, code as string);

    // refreshToken을 쿠키에 저장
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 14 * 24 * 60 * 60 * 1000,
    });

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
