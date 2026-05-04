import { type NextFunction, type Request, type Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { MulterError } from 'multer';

import { AppError } from '../errors/app-error.js';
import { uploadReceiptImage } from '../middlewares/upload.middleware.js';
import { createOcrJob, getOcrJob } from '../services/ocr.service.js';
import { sendSuccess } from '../utils/response.js';

const getUserIdFromHeader = (req: Request): string => {
  const userId = req.header('x-user-id');

  if (userId === undefined || userId.trim() === '') {
    throw new AppError(
      StatusCodes.UNAUTHORIZED,
      'AUTH_001',
      '인증 정보가 필요합니다.',
      'x-user-id 헤더가 필요합니다. 추후 인증 미들웨어로 대체됩니다.',
    );
  }

  return userId;
};

export const createReceiptOcrJob = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  uploadReceiptImage(req, res, async error => {
    try {
      if (error instanceof MulterError && error.code === 'LIMIT_FILE_SIZE') {
        throw new AppError(
          StatusCodes.REQUEST_TOO_LONG,
          'OCR_003',
          '파일 용량이 너무 큽니다.',
          '최대 파일 크기는 10MB 입니다.',
        );
      }

      if (error !== undefined && error !== null) {
        throw error;
      }

      const receiptFile = req.file;

      if (receiptFile === undefined) {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          'OCR_004',
          '손상된 이미지 파일입니다.',
          'receipt 파일을 multipart/form-data로 전달해주세요.',
        );
      }

      const tripId = req.body.tripId as string | undefined;

      if (tripId === undefined || tripId.trim() === '') {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          'OCR_011',
          '필수 입력값이 누락되었습니다.',
          'tripId는 필수 값입니다.',
        );
      }

      const userId = getUserIdFromHeader(req);
      const currencyHint = req.body.currencyHint as string | undefined;
      const createJobParams = {
        tripId,
        userId,
        imageBuffer: receiptFile.buffer,
        originalFileName: receiptFile.originalname,
        ...(currencyHint !== undefined && { currencyHint }),
      };
      const result = await createOcrJob(createJobParams);

      sendSuccess(
        res,
        StatusCodes.ACCEPTED,
        'OCR 분석 요청이 접수되었습니다.',
        result,
      );
    } catch (caughtError) {
      next(caughtError);
    }
  });
};

export const getReceiptOcrJob = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const receiptIdParam = req.params.receiptId;
    const receiptId = Array.isArray(receiptIdParam)
      ? receiptIdParam[0]
      : receiptIdParam;

    if (receiptId === undefined || receiptId.trim() === '') {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'OCR_009',
        '존재하지 않는 OCR 작업입니다.',
        'receiptId가 필요합니다.',
      );
    }

    const userId = getUserIdFromHeader(req);
    const result = await getOcrJob(receiptId, userId);

    sendSuccess(
      res,
      StatusCodes.OK,
      '요청이 성공적으로 처리되었습니다.',
      result,
    );
  } catch (error) {
    next(error);
  }
};
