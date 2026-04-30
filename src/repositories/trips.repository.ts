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
        startDate: input.startDate ? new Date(input.startDate) : null,
        endDate: input.endDate ? new Date(input.endDate) : null,
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
