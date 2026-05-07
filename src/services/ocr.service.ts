import { randomUUID } from 'crypto';

import { StatusCodes } from 'http-status-codes';

import { AppError } from '../errors/app-error.js';
import {
  createOcrReceipt,
  deleteOcrReceiptById,
  findOcrReceiptById,
  markOcrReceiptAsFailed,
  markOcrReceiptAsSuccess,
} from '../repositories/ocr.repository.js';
import { type OcrJobResult, type OcrParsedResult } from '../types/ocr.types.js';

import { getReceiptOcrEngine } from './ocr/receipt-ocr-engine.factory.js';

const processingReceiptIds = new Set<string>();

type CreateOcrJobParams = {
  tripId: string;
  userId: string;
  imageBuffer: Buffer;
  originalFileName: string;
  currencyHint?: string;
  receiptLocale?: string;
};

const buildTemporaryImageUrl = (originalFileName: string): string => {
  const normalizedFileName = originalFileName
    .replace(/\s+/g, '-')
    .toLowerCase();
  const randomToken = randomUUID();

  return `temporary://receipt/${randomToken}-${normalizedFileName}`;
};

const runOcrPipeline = async (
  receiptId: string,
  imageBuffer: Buffer,
  originalFileName: string,
  currencyHint?: string,
  receiptLocale?: string,
): Promise<void> => {
  try {
    const engine = getReceiptOcrEngine();
    const { parsed: parsedResult, rawText } = await engine.recognize({
      imageBuffer,
      originalFileName,
      ...(currencyHint !== undefined && { currencyHint }),
      ...(receiptLocale !== undefined && { receiptLocale }),
    });

    if (parsedResult.totalAmount <= 0) {
      throw new AppError(
        StatusCodes.UNPROCESSABLE_ENTITY,
        'OCR_007',
        '파싱 실패(핵심 필드 미검출)',
        '영수증 총액을 추출하지 못했습니다. 이미지 품질이나 양식을 확인해 주세요.',
      );
    }

    await markOcrReceiptAsSuccess({
      receiptId,
      parsedJson: parsedResult,
      ocrText: rawText.trim() === '' ? null : rawText,
    });
  } catch (error) {
    const detail =
      error instanceof AppError
        ? `${error.code}: ${error.detail}`
        : 'OCR_006: OCR 벤더 연동 실패';

    await markOcrReceiptAsFailed({
      receiptId,
      errorMessage: detail,
    });
  } finally {
    processingReceiptIds.delete(receiptId);
  }
};

export const createOcrJob = async ({
  tripId,
  userId,
  imageBuffer,
  originalFileName,
  currencyHint,
  receiptLocale,
}: CreateOcrJobParams): Promise<{ receiptId: string; status: 'PENDING' }> => {
  if (imageBuffer.length === 0) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'OCR_004',
      '손상된 이미지 파일입니다.',
      '업로드된 파일이 비어 있습니다.',
    );
  }

  const temporaryImageUrl = buildTemporaryImageUrl(originalFileName);

  const receipt = await createOcrReceipt({
    tripId,
    createdByUserId: userId,
    imageUrl: temporaryImageUrl,
  });

  processingReceiptIds.add(receipt.id);
  void runOcrPipeline(
    receipt.id,
    imageBuffer,
    originalFileName,
    currencyHint,
    receiptLocale,
  );

  return {
    receiptId: receipt.id,
    status: 'PENDING',
  };
};

export const getOcrJob = async (
  receiptId: string,
  userId: string,
): Promise<OcrJobResult> => {
  const receipt = await findOcrReceiptById(receiptId);

  if (receipt === null) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      'OCR_009',
      '존재하지 않는 OCR 작업입니다.',
      '해당 receiptId를 찾을 수 없습니다.',
    );
  }

  if (receipt.createdByUserId !== userId) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      'OCR_008',
      '접근 권한이 없습니다.',
      '본인 소유의 OCR 결과만 조회할 수 있습니다.',
    );
  }

  if (receipt.status === 'FAILED') {
    return {
      receiptId,
      status: 'FAILED',
      failure: {
        code: 'OCR_002',
        detail: receipt.errorMessage ?? 'OCR 처리에 실패했습니다.',
      },
    };
  }

  if (processingReceiptIds.has(receiptId)) {
    return {
      receiptId,
      status: 'PROCESSING',
    };
  }

  if (receipt.status === 'SUCCESS') {
    const parsedResult = receipt.parsedJson;

    if (
      typeof parsedResult === 'object' &&
      parsedResult !== null &&
      'merchantName' in parsedResult &&
      'totalAmount' in parsedResult &&
      'currency' in parsedResult &&
      'purchasedAt' in parsedResult
    ) {
      return {
        receiptId,
        status: 'SUCCESS',
        result: parsedResult as OcrParsedResult,
      };
    }

    throw new AppError(
      StatusCodes.UNPROCESSABLE_ENTITY,
      'OCR_007',
      '파싱 실패(핵심 필드 미검출)',
      'OCR 결과가 유효한 형식이 아닙니다.',
    );
  }

  return {
    receiptId,
    status: 'PENDING',
  };
};

export const deleteOcrJob = async (
  receiptId: string,
  userId: string,
): Promise<{ receiptId: string; deleted: true }> => {
  const receipt = await findOcrReceiptById(receiptId);

  if (receipt === null) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      'OCR_009',
      '존재하지 않는 OCR 작업입니다.',
      '해당 receiptId를 찾을 수 없습니다.',
    );
  }

  if (receipt.createdByUserId !== userId) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      'OCR_008',
      '접근 권한이 없습니다.',
      '본인 소유의 OCR 결과만 삭제할 수 있습니다.',
    );
  }

  await deleteOcrReceiptById(receiptId);
  processingReceiptIds.delete(receiptId);

  return {
    receiptId,
    deleted: true,
  };
};
