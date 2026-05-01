import { type Request, type RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import multer, { type FileFilterCallback } from 'multer';

import { AppError } from '../errors/app-error.js';

const allowedMimeTypes = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

const maxFileSize = 10 * 1024 * 1024;

const fileFilter = (
  _req: Request,
  file: { mimetype: string },
  callback: FileFilterCallback,
): void => {
  if (!allowedMimeTypes.has(file.mimetype)) {
    callback(
      new AppError(
        StatusCodes.UNSUPPORTED_MEDIA_TYPE,
        'OCR_001',
        '지원하지 않는 영수증 형식입니다.',
        '허용 파일 형식은 jpg, jpeg, png, webp 입니다.',
      ),
    );

    return;
  }

  callback(null, true);
};

export const uploadReceiptImage: RequestHandler = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: maxFileSize,
  },
}).single('receipt');
