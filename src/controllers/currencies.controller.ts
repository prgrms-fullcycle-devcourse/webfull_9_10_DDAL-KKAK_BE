import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { CURRENCY_CONSTANTS } from '../constants/currency.js';
import { AppError } from '../errors/app-error.js';
import * as exchangeRateService from '../services/currencies.service.js';
import { sendSuccess } from '../utils/response.js';

const isInvalidFormat = (code: string) =>
  !CURRENCY_CONSTANTS.CURRENCY_FORMAT_REGEX.test(code);

export const getCurrencies = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { base = CURRENCY_CONSTANTS.DEFAULT_BASE_CURRENCY, symbols } =
      req.query as {
        base?: string;
        symbols?: string;
      };
    if (isInvalidFormat(base)) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'INVALID_CODE_FORMAT',
        '통화코드 형식이 올바르지 않습니다.',
        '통화코드는 쉼표로 구분된 영문 대문자 3자리 코드여야 합니다. (예: USD,JPY)',
      );
    }

    const quoteCodes: string[] =
      symbols !== undefined
        ? symbols
            .split(',')
            .map(s => s.trim().toUpperCase())
            .filter(Boolean)
        : [];
    const invalidSymbols = quoteCodes.filter(isInvalidFormat);

    if (invalidSymbols.length > 0) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'INVALID_CODE_FORMAT',
        '통화코드 형식이 올바르지 않습니다.',
        '통화코드는 쉼표로 구분된 영문 대문자 3자리 코드여야 합니다. (예: USD,JPY)',
      );
    }

    const data = await exchangeRateService.getLatestRates(base, quoteCodes);

    sendSuccess(
      res,
      StatusCodes.OK,
      '최신 환율 정보 조회가 완료되었습니다.',
      data,
    );
  } catch (err) {
    next(err);
  }
};
