import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { participantsService } from '../services/participants.service.js';
import { sendSuccess } from '../utils/response.js';

export const participantsController = {
  async createParticipant(
    req: Request<{ tripId: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { sub: userId } = req.user;
      const { tripId } = req.params;
      const participant = await participantsService.createParticipant(
        tripId,
        userId,
        req.body,
      );
      sendSuccess(
        res,
        StatusCodes.CREATED,
        '참여자가 추가되었습니다.',
        participant,
      );
    } catch (error) {
      next(error);
    }
  },

  async updateParticipant(
    req: Request<{ tripId: string; participantId: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { sub: userId } = req.user;
      const { tripId, participantId } = req.params;
      const participant = await participantsService.updateParticipant(
        tripId,
        participantId,
        userId,
        req.body,
      );
      sendSuccess(
        res,
        StatusCodes.OK,
        '참여자 정보가 수정되었습니다.',
        participant,
      );
    } catch (error) {
      next(error);
    }
  },

  async deleteParticipant(
    req: Request<{ tripId: string; participantId: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { sub: userId } = req.user;
      const { tripId, participantId } = req.params;
      await participantsService.deleteParticipant(
        tripId,
        participantId,
        userId,
      );
      sendSuccess(res, StatusCodes.OK, '참여자가 삭제되었습니다.', null);
    } catch (error) {
      next(error);
    }
  },
};
