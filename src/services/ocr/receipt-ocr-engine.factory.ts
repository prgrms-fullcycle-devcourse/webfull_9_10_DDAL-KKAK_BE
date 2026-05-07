import {
  ClovaOcrError,
  ClovaReceiptOcrEngine,
} from './clova-receipt-ocr.engine.js';
import type {
  ReceiptOcrEngine,
  ReceiptOcrEngineInput,
  ReceiptOcrEngineResult,
} from './receipt-ocr-engine.interface.js';
import { TesseractReceiptOcrEngine } from './tesseract-receipt-ocr.engine.js';

/**
 * OCR_ENGINE 환경 변수로 구현체를 고릅니다.
 * - clova|naver (기본): CLOVA OCR API 사용
 * - tesseract: 로컬 Tesseract, 비용 없음
 * - clova|naver: CLOVA OCR API 사용
 */
class ClovaWithTesseractFallbackEngine implements ReceiptOcrEngine {
  constructor(
    private readonly primary: ReceiptOcrEngine,
    private readonly fallback: ReceiptOcrEngine,
  ) {}

  async recognize(
    input: ReceiptOcrEngineInput,
  ): Promise<ReceiptOcrEngineResult> {
    try {
      return await this.primary.recognize(input);
    } catch (error) {
      const canFallback =
        error instanceof ClovaOcrError
          ? error.retryable
          : error instanceof Error &&
            /timeout|network|5\d{2}|429|fetch/i.test(error.message);

      if (!canFallback) {
        throw error;
      }

      console.warn('[OCR] Clova failed. Falling back to Tesseract.', {
        reason: error instanceof Error ? error.message : String(error),
        locale: input.receiptLocale ?? null,
        fileName: input.originalFileName,
      });

      return this.fallback.recognize(input);
    }
  }
}

const isFallbackEnabled = (): boolean => {
  const value = (process.env.OCR_FALLBACK_ENABLED ?? 'true').toLowerCase();

  return value === 'true' || value === '1' || value === 'yes';
};

export const getReceiptOcrEngine = (): ReceiptOcrEngine => {
  const kind = (process.env.OCR_ENGINE ?? 'clova').toLowerCase();
  const tesseract = new TesseractReceiptOcrEngine();

  if (kind === 'tesseract') {
    return tesseract;
  }

  if (kind === 'clova' || kind === 'naver') {
    const clova = new ClovaReceiptOcrEngine();
    if (isFallbackEnabled()) {
      return new ClovaWithTesseractFallbackEngine(clova, tesseract);
    }

    return clova;
  }

  return tesseract;
};
