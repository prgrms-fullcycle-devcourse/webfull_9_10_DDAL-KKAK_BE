import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { StatusCodes } from 'http-status-codes';

import { errorHandler } from './middlewares/error-handler.middleware.js';
import { logger } from './middlewares/logger.middleware.js';
import authRouter from './routes/auth.routes.js';
import currenciesRouter from './routes/currencies.routes.js';
import expensesRouter from './routes/expenses.routes.js';
import tripsRouter from './routes/trips.routes.js';

const app = express();

// 미들웨어 설정
app.use(helmet());
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health-check', (_req, res) => {
  return res.sendStatus(StatusCodes.OK);
});

app.use(logger);

// 라우터 설정
app.use('/auth', authRouter);
app.use('/currencies', currenciesRouter);
app.use('/expenses', expensesRouter);
app.use('/trips', tripsRouter);
app.use(errorHandler);

export default app;
