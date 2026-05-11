import { createId } from '@paralleldrive/cuid2';

import type { ExchangeRate, Prisma } from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';

export const findLatestRates = async (
  baseCode: string,
  quoteCodes: string[],
): Promise<ExchangeRate[]> => {
  const where: Prisma.ExchangeRateWhereInput = {
    baseCode: baseCode.toUpperCase(),
  };

  if (quoteCodes.length > 0) {
    where.quoteCode = {
      in: quoteCodes.map(code => code.toUpperCase()),
    };
  }

  return await prisma.exchangeRate.findMany({
    where,
    distinct: ['quoteCode'],
    orderBy: {
      fetchedAt: 'desc',
    },
  });
};

export const createManyRates = async (
  baseCode: string,
  rates: Record<string, number>,
  provider: string,
) => {
  const fetchedAt = new Date();

  const data = Object.entries(rates).map(([quoteCode, rate]) => ({
    id: `cl-rate-${createId()}`,
    baseCode,
    quoteCode,
    rate,
    provider,
    fetchedAt,
    expiresAt: new Date(fetchedAt.getTime() + 60 * 60 * 1000),
  }));

  return prisma.exchangeRate.createMany({
    data,
    skipDuplicates: true,
  });
};
