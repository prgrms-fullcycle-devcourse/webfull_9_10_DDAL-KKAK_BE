import type { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';

import { tripService } from '../services/trips.service.js';
import { sendSuccess } from '../utils/response.js';

export const tripController = {
  async createTrip(req: Request, res: Response, next: NextFunction) {
    try {
      const trip = await tripService.createTrip(req.body);
      sendSuccess(res, StatusCodes.CREATED, '여행이 생성되었습니다.', trip);
    } catch (error) {
      next(error);
    }
  },

  async getTrips(req: Request, res: Response, next: NextFunction) {
    try {
      const ownerUserId = req.query.ownerUserId as string;
      const trips = await tripService.getTrips(ownerUserId);
      sendSuccess(
        res,
        StatusCodes.OK,
        '요청이 성공적으로 처리되었습니다.',
        trips,
      );
    } catch (error) {
      next(error);
    }
  },
};
