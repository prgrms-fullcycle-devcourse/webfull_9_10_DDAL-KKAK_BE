import { StatusCodes } from 'http-status-codes';

import * as exchangeApiService from '../api/exchangeApi.js';
import { isSupportedCurrency } from '../constants/currency.js';
import { AppError } from '../errors/app-error.js';
import * as exchangeRateRepository from '../repositories/currencies.repository.js';

const PROVIDER_NAME = 'ExchangeRate-API';

export const getExchangeRates = async (base: string, quoteCodes: string[]) => {
  const baseCode = base.toUpperCase();
  if (!isSupportedCurrency(baseCode)) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'INVALID_CURRENCY_CODE',
      '지원하지 않는 통화 코드입니다.',
      `요청하신 통화 코드(${baseCode})는 지원되지 않습니다. ISO 4217 표준 코드를 사용해주세요.`,
    );
  }

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

  let rates = await exchangeRateRepository.findLatestRates(
    baseCode,
    quoteCodes,
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isMissing = rates.length < quoteCodes.length;
  const isStale = rates.some(r => r.fetchedAt < today);

  if (isMissing || isStale) {
    try {
      const externalData = await exchangeApiService.fetchLatestRates(baseCode);

      await exchangeRateRepository.createManyRates(
        baseCode,
        externalData.rates,
        PROVIDER_NAME,
      );

      rates = await exchangeRateRepository.findLatestRates(
        baseCode,
        quoteCodes,
      );
    } catch (err) {
      console.warn(
        `Exchange API Err: ${err instanceof Error ? err.message : String(err)}`,
      );

      if (rates.length === 0) {
        throw new AppError(
          StatusCodes.SERVICE_UNAVAILABLE,
          'EXCHANGE_UPDATE_FAILED',
          '실시간 환율 정보를 가져오는데 실패했습니다.',
          `외부 환율 제공처(${PROVIDER_NAME})와의 통신이 원활하지 않습니다. 시스템에 저장된 마지막 환율 데이터를 사용하거나 나중에 다시 시도해주세요.`,
        );
      }
    }
  }

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
