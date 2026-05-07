import type { Response } from 'express';

import config from '../config/index.js';
import { COOKIE_CONSTANTS } from '../constants/cookie.js';

export const setAccessTokenCookie = (res: Response, accessToken: string) => {
  res.cookie('accessToken', accessToken, {
    ...config.cookie.option,
    maxAge: COOKIE_CONSTANTS['1h'],
  });
};

export const clearAccessTokenCookie = (res: Response) => {
  res.clearCookie('accessToken', config.cookie.option);
};

export const setRefreshTokenCookie = (res: Response, refreshToken: string) => {
  res.cookie('refreshToken', refreshToken, {
    ...config.cookie.option,
    maxAge: COOKIE_CONSTANTS['14d'],
  });
};

export const clearRefreshTokenCookie = (res: Response) => {
  res.clearCookie('refreshToken', config.cookie.option);
};
