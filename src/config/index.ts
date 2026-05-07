import 'dotenv/config';

import authConfig from './auth.config.js';
import cookieConfig from './cookie.config.js';
import dbConfig from './db.config.js';

const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: process.env.PORT ?? 3000,
  isProd: process.env.NODE_ENV === 'production',

  db: dbConfig,
  auth: authConfig,
  cookie: cookieConfig,
} as const;

export default config;
