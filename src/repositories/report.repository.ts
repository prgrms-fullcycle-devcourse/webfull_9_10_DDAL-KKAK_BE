import { prisma } from '../lib/prisma.js';

export const findTripWithExpenses = async (tripId: string) => {
  return await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      expenses: true,
    },
  });
};
