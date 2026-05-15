import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { AppError } from '../errors/app-error.js';
import * as screenshotService from '../services/screenshot.service.js';

export const generateReportScreenshot = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { tripId } = req.params;
    const { authorization } = req.headers;

    if (typeof tripId !== 'string' || authorization === undefined) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'INVALID_REQUEST',
        '요청 형식이 올바르지 않습니다.',
      );
    }

    const imageBuffer = await screenshotService.captureReport(
      tripId,
      authorization,
    );

    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="travel-tick-report-${tripId}.png"`,
      'Content-Length': imageBuffer.length,
    });

    return res.send(imageBuffer);
  } catch (err) {
    return next(err);
  }
};
