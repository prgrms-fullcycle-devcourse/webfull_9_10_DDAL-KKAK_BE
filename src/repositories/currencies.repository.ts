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
