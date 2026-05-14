import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { AppError } from '../errors/app-error.js';
import * as reportService from '../services/report.service.js';
import { sendSuccess } from '../utils/response.js';

export const getAiConsumptionReport = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { tripId } = req.params;
    const userId = req.user.sub;

    if (tripId === undefined || typeof tripId !== 'string') {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'INVALID_TRIP_ID',
        '유효하지 않은 Trip ID입니다.',
        `요청하신 tripId${tripId}는 유효하지 않습니다.`,
      );
    }

    const result = await reportService.getAiConsumptionReport(tripId, userId);

    sendSuccess(
      res,
      StatusCodes.OK,
      'AI 소비 분석 리포트가 생성되었습니다.',
      result,
    );
  } catch (err) {
    if (err instanceof AppError) {
      return next(err);
    }

    return next(
      new AppError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'ANALYSIS_FAILED',
        '데이터 분석 중 서버 내부 오류가 발생했습니다.',
      ),
    );
  }
};
