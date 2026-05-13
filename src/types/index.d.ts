import 'express-session';
import { JwtPayload } from './auth.types.ts';

declare module 'express-session' {
  interface SessionData {
    authState?: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      user: JwtPayload;
    }
  }
}
