import type { OcrParsedResult } from '../../types/ocr.types.js';

export type ReceiptOcrEngineInput = {
  imageBuffer: Buffer;
  originalFileName: string;
  /** 통화 코드 (예: JPY). locale 없을 때 Tesseract 언어 보조에 사용 */
  currencyHint?: string;
  /**
   * 영수증 국가·스크립트 힌트 (예: KR, JP, CN, TW, US).
   * 지정 시 해당 스크립트+eng만 로드해 메모리 부담을 줄입니다.
   */
  receiptLocale?: string;
};

export type ReceiptOcrEngineResult = {
  parsed: OcrParsedResult;
  rawText: string;
};

/**
 * 영수증 이미지에서 구조화 결과까지 만드는 OCR 백엔드 추상화.
 * 유료(Clova 등) 엔진은 동일 인터페이스로 교체하면 됩니다.
 */
export type ReceiptOcrEngine = {
  recognize(input: ReceiptOcrEngineInput): Promise<ReceiptOcrEngineResult>;
};
