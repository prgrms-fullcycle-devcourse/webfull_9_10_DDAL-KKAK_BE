import 'dotenv/config';

import dbConfig from './db.config.js';

const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: process.env.PORT ?? 3000,
  isProd: process.env.NODE_ENV === 'production',

  db: dbConfig,
} as const;

export default config;
