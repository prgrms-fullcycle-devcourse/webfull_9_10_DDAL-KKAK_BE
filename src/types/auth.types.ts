import type { Request } from 'express';

export interface AuthParams {
  urls: {
    base: string;
    token: string;
    user: string;
  };
  params: {
    client_id: string;
    client_secret: string;
    redirect_uri: string;
    response_type: string;
    scope: string;
  };
}

export interface KakaoToken {
  access_token: string;
  token_type: 'bearer';
  refresh_token: string;
  expires_in: number;
  scope: 'profile_nickname';
  refresh_token_expires_in: number;
}

export interface KakaoUser {
  id: number;
  connected_at: string;
  properties: {
    nickname?: string;
    profile_image?: string;
    thumbnail_image?: string;
  };
  kakao_account?: {
    // 닉네임 동의 필요 여부 (false면 이미 동의했거나 필수 항목임)
    profile_nickname_needs_agreement?: boolean;
    // 프로필 이미지 동의 필요 여부
    profile_image_needs_agreement?: boolean;

    // 사용자가 정보 제공에 동의해야만 이 객체가 존재합니다.
    profile?: {
      nickname?: string; // 선택 동의 시 없을 수 있음
      is_default_nickname?: boolean;
      profile_image_url?: string; // 선택 동의 시 없을 수 있음
      thumbnail_image_url?: string; // 선택 동의 시 없을 수 있음
      is_default_image?: boolean;
    };
  };
}

export interface JwtPayload {
  sub: string;
  iss: string;
  iat: number;
  exp: number;
}

export type AuthenticatedRequest = Request & {
  user: JwtPayload;
};
