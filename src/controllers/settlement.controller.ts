import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { AppError } from '../errors/app-error.js';
import * as settlementService from '../services/settlement.service.js';
import type { AuthenticatedRequest } from '../types/auth.types.js';
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

export const getMySettlementSummary = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { tripId } = req.params;
    const { sub: userId } = (req as AuthenticatedRequest).user;

    if (tripId === undefined || typeof tripId !== 'string') {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'INVALID_REQUEST_PARAMS',
        '잘못된 요청입니다.',
        '필수 항목인 tripId가 누락되었거나 데이터 형식이 올바르지 않습니다.',
      );
    }

    const result = await settlementService.getMySettlementSummary(
      tripId,
      userId,
    );

    sendSuccess(res, StatusCodes.OK, '나의 실시간 정산 요약 조회 성공', result);
  } catch (err) {
    if (err instanceof AppError) {
      return next(err);
    }

    return next(
      new AppError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'CALCULATION_FAILED',
        '데이터 처리 중 오류가 발생했습니다.',
        '사용자의 소비 내역 합산 과정에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      ),
    );
  }
};
