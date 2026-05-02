import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import session from 'express-session';
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
app.use(
  session({
    secret: process.env.SESSION_SECRET as string, // 세션 암호화 키
    resave: false, // 세션 데이터가 바뀌지 않아도 다시 저장할지 여부
    saveUninitialized: false, // 초기화되지 않은 세션을 저장할지 여부 (로그인 전 세션 생성 방지)
    cookie: {
      httpOnly: true, // 클라이언트 JS에서 쿠키 접근 불가 (보안)
      secure: process.env.NODE_ENV === 'production', // HTTPS에서만 전송 (운영 환경 true)
      maxAge: 1000 * 60 * 60, // 쿠키 유효 시간 (예: 1시간)
    },
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
