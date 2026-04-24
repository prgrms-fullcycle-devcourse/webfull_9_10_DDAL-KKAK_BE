import morgan from 'morgan';

import config from '../config/index.js';
import { getKSTTimestamp } from '../utils/date.utils.js';

morgan.token('date', () => getKSTTimestamp());

const isProd = config.isProd === true;

export const logger = morgan((tokens, req, res) => {
  const logData = {
    method: tokens.method?.(req, res) ?? '-',
    url: tokens.url?.(req, res) ?? '-',
    status: Number(tokens.status?.(req, res) ?? 0),
    responseTime: Number(tokens['response-time']?.(req, res) ?? 0),
    timestamp: tokens.date?.(req, res) ?? '-',
  };

  return isProd
    ? JSON.stringify(logData)
    : `[${logData.timestamp}] ${logData.method} ${logData.url} ${logData.status} - ${logData.responseTime}ms`;
});
