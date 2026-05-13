import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { tripService } from '../services/trips.service.js';
import { sendSuccess } from '../utils/response.js';

export const tripController = {
  async createTrip(req: Request, res: Response, next: NextFunction) {
    try {
      const { sub: userId } = req.user;
      const trip = await tripService.createTrip(userId, req.body);
      sendSuccess(res, StatusCodes.CREATED, '여행이 생성되었습니다.', trip);
    } catch (error) {
      next(error);
    }
  },

  async getTrips(req: Request, res: Response, next: NextFunction) {
    try {
      const { sub: userId } = req.user;
      const trips = await tripService.getTrips(userId);
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

  async getTripById(
    req: Request<{ tripId: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { sub: userId } = req.user;
      const { tripId } = req.params;
      const trip = await tripService.getTripById(tripId, userId);
      sendSuccess(
        res,
        StatusCodes.OK,
        '요청이 성공적으로 처리되었습니다.',
        trip,
      );
    } catch (error) {
      next(error);
    }
  },

  async updateTrip(
    req: Request<{ tripId: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { sub: userId } = req.user;
      const { tripId } = req.params;
      const trip = await tripService.updateTrip(tripId, userId, req.body);
      sendSuccess(res, StatusCodes.OK, '여행 정보가 수정되었습니다.', trip);
    } catch (error) {
      next(error);
    }
  },

  async deleteTrip(
    req: Request<{ tripId: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { sub: userId } = req.user;
      const { tripId } = req.params;
      await tripService.deleteTrip(tripId, userId);
      sendSuccess(res, StatusCodes.OK, '여행이 삭제되었습니다.', null);
    } catch (error) {
      next(error);
    }
  },
};
