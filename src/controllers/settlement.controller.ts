import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { AppError } from '../errors/app-error.js';
import * as settlementService from '../services/settlement.service.js';
import { sendSuccess } from '../utils/response.js';

export const getTripSettlement = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { tripId } = req.params;

    if (typeof tripId !== 'string') {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'INVALID_TRIP_ID',
        '유효하지 않은 여행 ID 형식입니다.',
      );
    }

    const result = await settlementService.calculateSettlement(tripId);

    sendSuccess(
      res,
      StatusCodes.OK,
      '정산 결과가 성공적으로 도출되었습니다.',
      result,
    );
  } catch (err) {
    if (err instanceof AppError) {
      next(err);
    }

    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'SETTLEMENT_CALC_ERROR',
      '정산 계산 중 오류가 발생했습니다.',
    );
  }
};
