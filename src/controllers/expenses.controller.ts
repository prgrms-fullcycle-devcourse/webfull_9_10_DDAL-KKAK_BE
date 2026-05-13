import { type NextFunction, type Request, type Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { MulterError } from 'multer';

import { AppError } from '../errors/app-error.js';
import { uploadReceiptImage } from '../middlewares/upload.middleware.js';
import { expensesService } from '../services/expenses.service.js';
import {
  createOcrJob,
  deleteOcrJob,
  getOcrJob,
} from '../services/ocr.service.js';
import type { CreateExpenseInput } from '../types/expenses.types.js';
import { sendSuccess } from '../utils/response.js';

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

      const userId = req.user.sub;
      const currencyHint = req.body.currencyHint as string | undefined;
      const receiptLocale = req.body.receiptLocale as string | undefined;
      const createJobParams = {
        tripId,
        userId,
        imageBuffer: receiptFile.buffer,
        originalFileName: receiptFile.originalname,
        ...(currencyHint !== undefined && { currencyHint }),
        ...(receiptLocale !== undefined && { receiptLocale }),
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

export const createExpense = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user.sub;
    const payload = req.body as {
      tripId?: string;
      payerParticipantId?: string;
      title?: string;
      category?: 'FOOD' | 'SHOPPING' | 'TRANSPORT' | 'TOUR' | 'ETC';
      note?: string;
      spentAt?: string;
      currency?: 'KRW' | 'TRIP';
      amountOriginal?: number;
      fxMode?: 'FIXED' | 'REALTIME';
      fxRateTripToKrw?: number;
      amountKrw?: number;
      receiptId?: string;
    };

    const createInput: CreateExpenseInput = {
      tripId: String(payload.tripId ?? ''),
      payerParticipantId: String(payload.payerParticipantId ?? ''),
      title: String(payload.title ?? ''),
      ...(payload.category !== undefined && { category: payload.category }),
      ...(payload.note !== undefined && { note: payload.note }),
      spentAt: String(payload.spentAt ?? ''),
      currency: (payload.currency ?? 'TRIP') as 'KRW' | 'TRIP',
      amountOriginal: Number(payload.amountOriginal ?? 0),
      ...(payload.fxMode !== undefined && { fxMode: payload.fxMode }),
      fxRateTripToKrw: Number(payload.fxRateTripToKrw ?? 0),
      amountKrw: Number(payload.amountKrw ?? 0),
    };
    if (
      payload.receiptId !== undefined &&
      String(payload.receiptId).trim() !== ''
    ) {
      createInput.receiptId = String(payload.receiptId);
    }

    const createdExpense = await expensesService.createExpense(
      userId,
      createInput,
    );

    sendSuccess(
      res,
      StatusCodes.CREATED,
      '지출이 성공적으로 생성되었습니다.',
      createdExpense,
    );
  } catch (error) {
    next(error);
  }
};

export const updateExpense = async (
  req: Request<{ expenseId: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user.sub;
    const { expenseId } = req.params;

    if (expenseId === undefined || expenseId.trim() === '') {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'EXP_007',
        '지출을 찾을 수 없습니다.',
        'expenseId가 필요합니다.',
      );
    }

    const payload = req.body as {
      payerParticipantId?: string;
      title?: string;
      category?: 'FOOD' | 'SHOPPING' | 'TRANSPORT' | 'TOUR' | 'ETC';
      note?: string | null;
      spentAt?: string;
      currency?: 'KRW' | 'TRIP';
      amountOriginal?: number;
      fxMode?: 'FIXED' | 'REALTIME';
      fxRateTripToKrw?: number;
      amountKrw?: number;
      receiptId?: string | null;
    };

    const updateInput = {
      ...(payload.payerParticipantId !== undefined && {
        payerParticipantId: String(payload.payerParticipantId),
      }),
      ...(payload.title !== undefined && { title: String(payload.title) }),
      ...(payload.category !== undefined && { category: payload.category }),
      ...(payload.note !== undefined && { note: payload.note }),
      ...(payload.spentAt !== undefined && {
        spentAt: String(payload.spentAt),
      }),
      ...(payload.currency !== undefined && { currency: payload.currency }),
      ...(payload.amountOriginal !== undefined && {
        amountOriginal: Number(payload.amountOriginal),
      }),
      ...(payload.fxMode !== undefined && { fxMode: payload.fxMode }),
      ...(payload.fxRateTripToKrw !== undefined && {
        fxRateTripToKrw: Number(payload.fxRateTripToKrw),
      }),
      ...(payload.amountKrw !== undefined && {
        amountKrw: Number(payload.amountKrw),
      }),
      ...(payload.receiptId !== undefined && {
        receiptId:
          payload.receiptId === null ? null : String(payload.receiptId).trim(),
      }),
    };

    const updatedExpense = await expensesService.updateExpense(
      userId,
      expenseId,
      updateInput,
    );

    sendSuccess(
      res,
      StatusCodes.OK,
      '지출이 성공적으로 수정되었습니다.',
      updatedExpense,
    );
  } catch (error) {
    next(error);
  }
};

export const getExpenses = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user.sub;
    const tripId = String(req.query.tripId ?? '');
    const expenses = await expensesService.getExpenses(userId, tripId);

    sendSuccess(
      res,
      StatusCodes.OK,
      '요청이 성공적으로 처리되었습니다.',
      expenses,
    );
  } catch (error) {
    next(error);
  }
};

export const getExpenseById = async (
  req: Request<{ expenseId: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user.sub;
    const { expenseId } = req.params;

    if (expenseId === undefined || expenseId.trim() === '') {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'EXP_007',
        '지출을 찾을 수 없습니다.',
        'expenseId가 필요합니다.',
      );
    }

    const expense = await expensesService.getExpenseById(userId, expenseId);
    sendSuccess(
      res,
      StatusCodes.OK,
      '요청이 성공적으로 처리되었습니다.',
      expense,
    );
  } catch (error) {
    next(error);
  }
};

export const deleteExpense = async (
  req: Request<{ expenseId: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user.sub;
    const { expenseId } = req.params;

    if (expenseId === undefined || expenseId.trim() === '') {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'EXP_007',
        '지출을 찾을 수 없습니다.',
        'expenseId가 필요합니다.',
      );
    }

    await expensesService.deleteExpense(userId, expenseId);
    sendSuccess(res, StatusCodes.OK, '지출이 성공적으로 삭제되었습니다.', null);
  } catch (error) {
    next(error);
  }
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

    const userId = req.user.sub;
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

export const deleteReceiptOcrJob = async (
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

    const userId = req.user.sub;
    const result = await deleteOcrJob(receiptId, userId);

    sendSuccess(res, StatusCodes.OK, 'OCR 결과가 삭제되었습니다.', result);
  } catch (error) {
    next(error);
  }
};
