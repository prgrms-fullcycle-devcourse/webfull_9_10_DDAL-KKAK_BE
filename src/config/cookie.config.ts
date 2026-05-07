const config = {
  option: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  },
  secret: process.env.SESSION_SECRET as string,
} as const;

export default config;
