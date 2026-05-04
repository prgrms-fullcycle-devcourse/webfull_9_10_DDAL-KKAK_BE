import { prisma } from '../lib/prisma.js';
import type { CreateTripInput, UpdateTripInput } from '../types/trips.types.js';

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

  findById(tripId: string) {
    return prisma.trip.findUnique({
      where: { id: tripId },
    });
  },

  deleteById(tripId: string) {
    return prisma.trip.delete({
      where: { id: tripId },
    });
  },

  update(tripId: string, input: UpdateTripInput) {
    return prisma.trip.update({
      where: { id: tripId },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.tripCurrencyCode !== undefined && {
          tripCurrencyCode: input.tripCurrencyCode,
        }),
        ...(input.defaultFxMode !== undefined && {
          defaultFxMode: input.defaultFxMode,
        }),
        ...(input.fixedExchangeRate !== undefined && {
          fixedExchangeRate: input.fixedExchangeRate,
        }),
        ...(input.startDate !== undefined && {
          startDate:
            input.startDate !== null ? new Date(input.startDate) : null,
        }),
        ...(input.endDate !== undefined && {
          endDate: input.endDate !== null ? new Date(input.endDate) : null,
        }),
      },
    });
  },
};
