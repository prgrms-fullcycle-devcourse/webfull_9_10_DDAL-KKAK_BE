import { type Request, type RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import multer, { type FileFilterCallback } from 'multer';

import { UPLOAD_CONSTANTS } from '../constants/upload.js';
import { AppError } from '../errors/app-error.js';

const fileFilter = (
  _req: Request,
  file: { mimetype: string },
  callback: FileFilterCallback,
): void => {
  if (!UPLOAD_CONSTANTS.ALLOWED_MIME_TYPES.has(file.mimetype)) {
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
    fileSize: UPLOAD_CONSTANTS.MAX_FILE_SIZE,
  },
}).single('receipt');
