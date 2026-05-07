import { StatusCodes } from 'http-status-codes';

import { isSupportedCurrency } from '../constants/currency.js';
import { AppError } from '../errors/app-error.js';
import * as exchangeRateRepository from '../repositories/currencies.repository.js';

export const getLatestRates = async (base: string, quoteCodes: string[]) => {
  const baseCode = base.toUpperCase();
  if (!isSupportedCurrency(baseCode)) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'INVALID_CURRENCY_CODE',
      '지원하지 않는 통화 코드입니다.',
      `요청하신 통화 코드(${baseCode})는 지원되지 않습니다. ISO 4217 표준 코드를 사용해주세요.`,
    );
  }

  if (quoteCodes.length > 0) {
    const unsupportedCodes = quoteCodes.filter(
      code => !isSupportedCurrency(code),
    );

    if (unsupportedCodes.length > 0) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'INVALID_CURRENCY_CODE',
        '지원하지 않는 통화 코드입니다.',
        `요청하신 통화 코드(${unsupportedCodes.join(', ')})는 지원되지 않습니다. ISO 4217 표준 코드를 사용해주세요.`,
      );
    }
  }

  const rates = await exchangeRateRepository.findLatestRates(
    baseCode,
    quoteCodes,
  );

  if (quoteCodes.length > 0) {
    const foundCodes = rates.map(r => r.quoteCode);
    const missingCodes = quoteCodes.filter(code => !foundCodes.includes(code));

    if (missingCodes.length > 0) {
      throw new AppError(
        StatusCodes.NOT_FOUND,
        'EXCHANGE_DATA_NOT_FOUND',
        '환율 정보를 찾을 수 없습니다.',
        `현재 시스템 내에 ${missingCodes.map(c => `${baseCode}-${c}`).join(', ')} 대한 환율 기록이 존재하지 않습니다. 잠시 후 다시 시도하거나 관리자에게 문의하세요.`,
      );
    }
  } else if (rates.length === 0) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      'EXCHANGE_DATA_NOT_FOUND',
      '환율 정보를 찾을 수 없습니다.',
      `현재 시스템 내에 ${baseCode} 기준 환율 기록이 존재하지 않습니다. 잠시 후 다시 시도하거나 관리자에게 문의하세요.`,
    );
  }

  return {
    baseCode,
    fetchedAt: rates[0]?.fetchedAt ?? new Date(),
    rates: rates.map(r => ({
      id: r.id,
      quoteCode: r.quoteCode,
      rate: Number(r.rate),
      provider: r.provider,
      expiresAt: r.expiresAt,
    })),
  };
};
