import { prisma } from '../lib/prisma.js';

export const getSettlementData = async (tripId: string) => {
  return await prisma.trip.findUnique({
    where: {
      id: tripId,
    },
    include: {
      participants: {
        include: {
          expenses: {
            select: { amountKrw: true },
          },
          expenseShares: {
            select: { shareAmountKrw: true },
          },
        },
      },
    },
  });
};
