import type { SocialProvider } from '../generated/prisma/enums.js';
import { prisma } from '../lib/prisma.js';
import type { KakaoUser } from '../types/auth.types.js';

export const findBySocialId = async (
  provider: SocialProvider,
  socialId: string,
) => {
  const user = await prisma.user.findFirst({
    where: {
      oauthAccount: {
        some: {
          providerAccountId: socialId,
          provider,
        },
      },
    },
    select: {
      id: true,
      name: true,
      imageUrl: true,
    },
  });

  return user;
};

export const findByUserId = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      refreshToken: true,
    },
  });

  return user;
};

export const createUser = async (
  provider: SocialProvider,
  userData: KakaoUser,
) => {
  const authAccount = await prisma.oAuthAccount.create({
    data: {
      provider,
      providerAccountId: userData.id.toString(),
      profileImageUrl:
        userData.kakao_account?.profile?.profile_image_url ?? null,
      profileName: userData.kakao_account?.profile?.nickname ?? 'GUEST',
      user: {
        create: {
          name: userData.kakao_account?.profile?.nickname ?? 'GUEST',
          imageUrl: userData.kakao_account?.profile?.profile_image_url ?? null,
        },
      },
    },
    include: { user: { select: { id: true, name: true, imageUrl: true } } },
  });

  return authAccount.user;
};

export const updateRefreshToken = async (
  userId: string,
  refreshToken: string,
) => {
  try {
    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        refreshToken,
      },
    });

    return;
  } catch (err) {
    console.error(err);
    throw new Error('DB Error');
  }
};

export const deleteRefreshToken = async (userId: string) => {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        refreshToken: null,
      },
    });
  } catch (err) {
    console.error(err);
    throw new Error('DB Error');
  }
};

export const deleteUser = async (userId: string) => {
  return await prisma.user.delete({
    where: {
      id: userId,
    },
  });
};
