import { prisma } from '../lib/prisma.js';
import type { CreateTripInput, UpdateTripInput } from '../types/trips.types.js';

export const tripRepository = {
  create(input: CreateTripInput & { ownerName: string }) {
    return prisma.trip.create({
      data: {
        ownerUserId: input.ownerUserId,
        title: input.title,
        tripCurrencyCode: input.tripCurrencyCode,
        defaultFxMode: input.defaultFxMode ?? 'FIXED',
        fixedExchangeRate: input.fixedExchangeRate ?? null,
        budgetKrw: input.budgetKrw ?? null,
        startDate:
          input.startDate !== null && input.startDate !== undefined
            ? new Date(input.startDate)
            : null,
        endDate:
          input.endDate !== null && input.endDate !== undefined
            ? new Date(input.endDate)
            : null,
        participants: {
          create: [{ name: input.ownerName }],
        },
      },
      include: {
        participants: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  },

  findManyByOwner(ownerUserId: string) {
    return prisma.trip.findMany({
      where: { ownerUserId },
      orderBy: { createdAt: 'desc' },
      include: {
        participants: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  },

  findById(tripId: string) {
    return prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        participants: {
          select: {
            id: true,
            name: true,
          },
        },
      },
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
        ...(input.budgetKrw !== undefined && {
          budgetKrw: input.budgetKrw,
        }),
        ...(input.startDate !== undefined && {
          startDate:
            input.startDate !== null ? new Date(input.startDate) : null,
        }),
        ...(input.endDate !== undefined && {
          endDate: input.endDate !== null ? new Date(input.endDate) : null,
        }),
      },
      include: {
        participants: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  },
};
