import { prisma } from '../lib/prisma.js';
import type { CreateTripInput } from '../types/trips.types.js';

export const tripRepository = {
  create(input: CreateTripInput) {
    return prisma.trip.create({
      data: {
        ownerUserId: input.ownerUserId,
        title: input.title,
        tripCurrencyCode: input.tripCurrencyCode,
        defaultFxMode: input.defaultFxMode ?? 'FIXED',
        fixedExchangeRate: input.fixedExchangeRate ?? null,
        startDate:
          input.startDate !== null && input.startDate !== undefined
            ? new Date(input.startDate)
            : null,
        endDate:
          input.endDate !== null && input.endDate !== undefined
            ? new Date(input.endDate)
            : null,
      },
    });
  },

  findManyByOwner(ownerUserId: string) {
    return prisma.trip.findMany({
      where: { ownerUserId },
      orderBy: { createdAt: 'desc' },
    });
  },
};
