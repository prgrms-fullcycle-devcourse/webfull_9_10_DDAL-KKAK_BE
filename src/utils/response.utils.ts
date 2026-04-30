import type { Response } from 'express';

import type { SuccessResponse } from '../types/api.types.js';

export function sendSuccess<tData>(
  res: Response,
  data: tData,
  options?: { status?: number; message?: string },
): void {
  const status = options?.status ?? 200;
  const message = options?.message ?? '요청이 성공적으로 처리되었습니다.';

  const body: SuccessResponse<tData> = {
    success: true,
    status,
    message,
    data,
    timestamp: new Date().toISOString(),
  };

  res.status(status).json(body);
}
