import type { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';

import { tripService } from '../services/trips.service.js';
import { sendSuccess } from '../utils/response.utils.js';

export const tripController = {
  async createTrip(req: Request, res: Response, next: NextFunction) {
    try {
      const trip = await tripService.createTrip(req.body);
      sendSuccess(res, trip, {
        status: StatusCodes.CREATED,
        message: '여행이 생성되었습니다.',
      });
    } catch (error) {
      next(error);
    }
  },

  async getTrips(req: Request, res: Response, next: NextFunction) {
    try {
      const ownerUserId = req.query.ownerUserId as string;
      const trips = await tripService.getTrips(ownerUserId);
      sendSuccess(res, trips);
    } catch (error) {
      next(error);
    }
  },
};
