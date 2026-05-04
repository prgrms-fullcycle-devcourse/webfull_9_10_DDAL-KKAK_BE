const config = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'none',
} as const;

export default config;
