import crypto from 'crypto';

import { StatusCodes } from 'http-status-codes';
import jwt from 'jsonwebtoken';

import config from '../config/index.js';
import { AppError } from '../errors/app-error.js';
import type { SocialProvider } from '../generated/prisma/enums.js';
import * as userRepository from '../repositories/auth.repository.js';
import type { JwtPayload, KakaoToken, KakaoUser } from '../types/auth.types.js';
import { compareData, hashData } from '../utils/crypto.util.js';

const isValidProvider = (p: string): p is SocialProvider => {
  return ['KAKAO', 'GOOGLE'].includes(p);
};

export const getSocialLoginInfo = (
  providerName: string,
): { redirectUrl: string; state: string } => {
  const provider = providerName.toUpperCase();
  const state = crypto.randomBytes(16).toString('hex');

  if (!provider || !isValidProvider(provider)) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'INVALID_AUTH_PROVIDER',
      '잘못된 요청입니다.',
      "지원하지 않는 인증 제공자입니다. 'kakao' 또는 'google'만 사용 가능합니다.",
    );
  }

  const {
    params: { client_id, redirect_uri, response_type, scope },
    urls: { base },
  } = config.auth[provider];
  const params = new URLSearchParams({
    client_id,
    redirect_uri,
    response_type,
    scope,
    state,
  });

  return { redirectUrl: `${base}?${params}`, state };
};

const fetchSocialAccessToken = async (
  provider: SocialProvider,
  code: string,
): Promise<string> => {
  const {
    params: { client_id, client_secret, redirect_uri },
    urls: { token },
  } = config.auth[provider];

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id,
    client_secret,
    redirect_uri,
    code,
  }).toString();

  if (provider === 'KAKAO') {
    try {
      const response = await fetch(`${token}?${params}`, {
        method: 'POST',
        headers: {
          Accept: 'application/json;charset=UTF-8',
        },
      });

      if (!response.ok) {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          'INVALID_OAUTH_CODE',
          '비정상적인 요청입니다.',
          '인증 코드 값이 유효하지 않습니다.',
        );
      }

      const kakaoToken = (await response.json()) as KakaoToken;

      return kakaoToken.access_token;
    } catch (err) {
      console.error(err);

      if (err instanceof AppError) {
        throw err;
      }

      throw new AppError(
        StatusCodes.BAD_GATEWAY,
        'OAUTH_PLATFORM_ERROR',
        '인증 서버와 통신할 수 없습니다.',
        '소셜 로그인 제공자(Provider) 서버의 응답이 지연되거나 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
      );
    }
  }

  if (provider === 'GOOGLE') {
    return '';
  }

  return '';
};

const fetchSocialUserInfo = async (
  provider: SocialProvider,
  socialToken: string,
) => {
  const {
    urls: { user },
  } = config.auth[provider];

  try {
    const response = await fetch(user, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${socialToken}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
    });

    const userData = (await response.json()) as KakaoUser;

    return userData;
  } catch (err) {
    console.error(err);
    throw new AppError(
      StatusCodes.UNAUTHORIZED,
      'USERINFO_FETCH_FAILED',
      '유저 정보 요청에 실패했습니다.',
    );
  }
};

const generateTokens = (userId: string) => {
  const accessTokenSecret = process.env.JWT_ACCESS_SECRET;
  const refreshTokenSecret = process.env.JWT_REFRESH_SECRET;

  if (accessTokenSecret === undefined || refreshTokenSecret === undefined) {
    throw new Error('Missing Token Secret');
  }

  const accessToken = jwt.sign({ sub: userId }, accessTokenSecret, {
    expiresIn: '1h',
    issuer: 'travel-tick',
  });

  const refreshToken = jwt.sign({ sub: userId }, refreshTokenSecret, {
    expiresIn: '14d',
    issuer: 'travel-tick',
  });

  return { accessToken, refreshToken };
};

export const loginWithSocial = async (providerName: string, code: string) => {
  const provider = providerName.toUpperCase() as SocialProvider;

  // 토큰 요청
  const socialToken = await fetchSocialAccessToken(provider, code);

  // 토큰을 이용하여 사용자 정보 조회
  const socialUser = await fetchSocialUserInfo(provider, socialToken);

  const socialId = socialUser.id.toString();
  let user = await userRepository.findBySocialId(provider, socialId);

  // 사용자가 존재하지 않으면 생성
  if (user === null) {
    user = await userRepository.createUser(provider, socialUser);
  }

  // JWT 토큰 생성
  const { accessToken, refreshToken } = generateTokens(user.id);

  // 갱신 토큰 해싱
  const hashedRefreshToken = await hashData(refreshToken);

  // 갱신 토큰 DB 저장
  await userRepository.updateRefreshToken(user.id, hashedRefreshToken);

  return {
    accessToken,
    refreshToken,
    tokenInfo: { grantType: 'bearer', expiresIn: 3600 },
    user: { id: user.id, name: user.name, imageUrl: user.imageUrl },
  };
};

export const logoutUser = async (userId: string) => {
  // 사용자의 Refresh Token 삭제
  await userRepository.deleteRefreshToken(userId);
};

export const refreshAccessToken = async (refreshToken: string) => {
  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET as string,
    ) as JwtPayload;

    const userId = decoded.sub;

    const user = await userRepository.findByUserId(userId);

    if (user === null || user.refreshToken === null) {
      // 리프래쉬 토큰이 탈취된 가능성
      throw new AppError(
        StatusCodes.UNAUTHORIZED,
        'INVALID_REFRESH_TOKEN',
        '인증 정보가 유효하지 않습니다.',
        '유효하지 않은 형식의 리프레시 토큰입니다.',
      );
    }

    const isMatch = await compareData(refreshToken, user.refreshToken);
    if (!isMatch) {
      await userRepository.deleteRefreshToken(user.id);

      throw new AppError(
        StatusCodes.UNAUTHORIZED,
        'TOKEN_REUSE_DETECTED',
        '보안 경고: 비정상적인 접근입니다.',
        '이미 사용된 리프레시 토큰입니다. 보안을 위해 모든 기기에서 로그아웃됩니다.',
      );
    }

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      generateTokens(userId);

    await userRepository.updateRefreshToken(userId, newRefreshToken);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      tokenType: 'Bearer',
      expiresIn: 3600,
    };
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      // 리프래쉬 토큰 만료
      throw new AppError(
        StatusCodes.UNAUTHORIZED,
        'EXPIRED_REFRESH_TOKEN',
        '세션이 만료되었습니다.',
        '리프레시 토큰이 만료되었습니다. 다시 로그인하여 세션을 시작하세요.',
      );
    }

    if (err instanceof jwt.JsonWebTokenError) {
      // 유효하지 않은 리프래쉬 토큰
      throw new AppError(
        StatusCodes.UNAUTHORIZED,
        'INVALID_REFRESH_TOKEN',
        '인증 정보가 유효하지 않습니다.',
        '유효하지 않은 형식의 리프레시 토큰입니다.',
      );
    }

    throw err;
  }
};

export const withdrawUser = async (userId: string) => {
  const user = await userRepository.findByUserId(userId);

  if (user === null) {
    // 사용자가 존재하지 않음
    throw new AppError(
      StatusCodes.NOT_FOUND,
      'USER_NOT_FOUND',
      '탈퇴를 진행할 수 없습니다.',
      '해당 사용자를 찾을 수 없습니다. 이미 탈퇴 처리된 계정일 수 있습니다.',
    );
  }

  await userRepository.deleteUser(userId);
};
