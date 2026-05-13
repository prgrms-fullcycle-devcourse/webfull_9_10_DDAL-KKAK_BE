import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import * as userService from '../services/users.service.js';
import type { AuthenticatedRequest } from '../types/auth.types.js';
import { sendSuccess } from '../utils/response.js';

export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const {
    user: { sub: userId },
  } = req as AuthenticatedRequest;

  try {
    const userInfo = await userService.getMyInfo(userId);

    sendSuccess(res, StatusCodes.OK, '', userInfo);
  } catch (err) {
    next(err);
  }
};
