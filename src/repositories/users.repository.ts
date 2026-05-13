import { prisma } from '../lib/prisma.js';

export const findByUserId = async (userId: string) => {
  return await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      imageUrl: true,
    },
  });
};
