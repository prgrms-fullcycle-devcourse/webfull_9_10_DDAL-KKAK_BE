import type { ReceiptOcrEngine } from './receipt-ocr-engine.interface.js';
import { TesseractReceiptOcrEngine } from './tesseract-receipt-ocr.engine.js';

/**
 * OCR_ENGINE 환경 변수로 구현체를 고릅니다.
 * - tesseract (기본): 로컬 Tesseract, 비용 없음
 * - clova: 추후 ClovaReceiptOcrEngine 연결 예정
 */
export const getReceiptOcrEngine = (): ReceiptOcrEngine => {
  const kind = (process.env.OCR_ENGINE ?? 'tesseract').toLowerCase();

  if (kind === 'clova' || kind === 'naver') {
    throw new Error(
      'OCR_ENGINE=clova|naver 은 아직 연결되지 않았습니다. OCR_ENGINE=tesseract 를 사용하세요.',
    );
  }

  return new TesseractReceiptOcrEngine();
};
