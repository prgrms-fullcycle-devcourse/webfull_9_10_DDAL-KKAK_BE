import { type Response } from 'express';

type ApiSuccessResponse<tData> = {
  success: true;
  status: number;
  message: string;
  data: tData;
};

type ApiErrorResponse = {
  success: false;
  status: number;
  message: string;
  error: {
    code: string;
    detail: string;
  };
};

export const sendSuccess = <tData>(
  res: Response,
  status: number,
  message: string,
  data: tData,
): Response<ApiSuccessResponse<tData>> => {
  return res.status(status).json({
    success: true,
    status,
    message,
    data,
  });
};

export const sendError = (
  res: Response,
  status: number,
  message: string,
  code: string,
  detail: string,
): Response<ApiErrorResponse> => {
  return res.status(status).json({
    success: false,
    status,
    message,
    error: {
      code,
      detail,
    },
  });
};
