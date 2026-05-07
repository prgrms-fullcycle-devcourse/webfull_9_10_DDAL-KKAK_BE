import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { StatusCodes } from 'http-status-codes';

import config from './config/index.js';
import { errorHandler } from './middlewares/error-handler.middleware.js';
import { logger } from './middlewares/logger.middleware.js';
import authRouter from './routes/auth.routes.js';
import currenciesRouter from './routes/currencies.routes.js';
import expensesRouter from './routes/expenses.routes.js';
import tripsRouter from './routes/trips.routes.js';

const app = express();

// 미들웨어 설정
app.use(helmet());
app.use(cookieParser(config.cookie.secret));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS 설정
const originsString = process.env.ALLOWED_ORIGINS ?? '';
const allowedOrigins = originsString
  .split(',')
  .map(url => url.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: [...allowedOrigins, /^http:\/\/localhost(:\d+)?$/], // 추후 배포 시 localhost 제거
    credentials: true,
    methods: 'GET,POST,PATCH,DELETE',
    allowedHeaders: 'Content-Type,Authorization',
  }),
);

app.get('/health-check', (_req, res) => {
  return res.sendStatus(StatusCodes.OK);
});

app.use(logger);

// 라우터 설정
app.use('/auth', authRouter);
app.use('/currencies', currenciesRouter);
app.use('/expenses', expensesRouter);
app.use('/trips', tripsRouter);

// 전역 에러 핸들러
app.use(errorHandler);

export default app;
