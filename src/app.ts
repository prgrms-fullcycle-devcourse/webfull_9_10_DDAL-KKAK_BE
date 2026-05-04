import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { logger } from './middlewares/logger.middleware.js';

const app = express();

// 미들웨어 설정
app.use(helmet());
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);

app.get('/', (_req, res) => {
  return res.json({ success: true });
});

export default app;
