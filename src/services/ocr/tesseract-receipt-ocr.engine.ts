import { createWorker } from 'tesseract.js';

import type {
  ReceiptOcrEngine,
  ReceiptOcrEngineInput,
  ReceiptOcrEngineResult,
} from './receipt-ocr-engine.interface.js';
import { parseReceiptFromPlainText } from './receipt-text-parser.js';
import { resolveTesseractLangs } from './tesseract-lang-resolver.js';

export class TesseractReceiptOcrEngine implements ReceiptOcrEngine {
  async recognize(
    input: ReceiptOcrEngineInput,
  ): Promise<ReceiptOcrEngineResult> {
    const langs = resolveTesseractLangs({
      ...(input.receiptLocale !== undefined && {
        receiptLocale: input.receiptLocale,
      }),
      ...(input.currencyHint !== undefined && {
        currencyHint: input.currencyHint,
      }),
    });
    const worker = await createWorker(langs);

    try {
      const { data } = await worker.recognize(input.imageBuffer);
      const rawText = data.text;
      const parsed = parseReceiptFromPlainText(rawText, input.currencyHint);

      return { parsed, rawText };
    } finally {
      await worker.terminate();
    }
  }
}
