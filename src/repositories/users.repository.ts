import { prisma } from '../lib/prisma.js';

export const findByUserId = async (userId: string) => {
  return await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      imageUrl: true,
    },
  });
};
