import type { Response } from 'express';

import config from '../config/index.js';
import { COOKIE_CONSTANTS } from '../constants/cookie.js';

export const setRefreshTokenCookie = (res: Response, refreshToken: string) => {
  res.cookie('refreshToken', refreshToken, {
    ...config.cookie,
    maxAge: COOKIE_CONSTANTS['14d'],
  });
};

export const clearRefreshTokenCookie = (res: Response) => {
  res.clearCookie('refreshToken');
};
