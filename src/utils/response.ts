import { type Response } from 'express';

import type { ErrorResponse, SuccessResponse } from '../types/api.types.js';

export const sendSuccess = <tData>(
  res: Response,
  status: number,
  message: string,
  data: tData,
): Response<SuccessResponse<tData>> => {
  return res.status(status).json({
    success: true,
    status,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

export const sendError = (
  res: Response,
  status: number,
  message: string,
  code: string,
  detail: string,
): Response<ErrorResponse> => {
  return res.status(status).json({
    success: false,
    status,
    message,
    error: {
      code,
      detail,
    },
    timestamp: new Date().toISOString(),
  });
};
