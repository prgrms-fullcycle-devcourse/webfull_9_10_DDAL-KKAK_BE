import { SocialProvider } from '../generated/prisma/enums.js';
import type { AuthParams } from '../types/auth.types.js';

const config: Record<SocialProvider, AuthParams> = {
  GOOGLE: {
    urls: {
      base: 'https://accounts.google.com/o/oauth2/v2/auth',
      token: 'https://oauth2.googleapis.com/token',
      user: 'https://www.googleapis.com/oauth2/v3/userinfo',
    },
    params: {
      client_id: process.env.GOOGLE_CLIENT_ID as string,
      client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI as string,
      response_type: 'code',
      scope: 'email profile',
    },
  },
  KAKAO: {
    urls: {
      base: 'https://kauth.kakao.com/oauth/authorize',
      token: 'https://kauth.kakao.com/oauth/token',
      user: 'https://kapi.kakao.com/v2/user/me',
    },
    params: {
      client_id: process.env.KAKAO_CLIENT_ID as string,
      client_secret: process.env.KAKAO_CLIENT_SECRET as string,
      redirect_uri:
        process.env.NODE_ENV === 'production'
          ? `${process.env.URL}/auth/kakao/callback`
          : `http://localhost:${process.env.PORT}/auth/kakao/callback`,
      response_type: 'code',
      scope: 'profile_nickname',
    },
  },
};

export default config;
