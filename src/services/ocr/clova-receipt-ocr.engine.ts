import { randomUUID } from 'crypto';

import type {
  ReceiptOcrEngine,
  ReceiptOcrEngineInput,
  ReceiptOcrEngineResult,
} from './receipt-ocr-engine.interface.js';
import { parseReceiptFromPlainText } from './receipt-text-parser.js';

type ClovaField = {
  inferText?: string;
};

type ClovaCell = {
  cellTextLines?: Array<{
    cellWords?: Array<{
      inferText?: string;
    }>;
  }>;
};

type ClovaImageResult = {
  inferResult?: string;
  fields?: ClovaField[];
  tables?: Array<{
    cells?: ClovaCell[];
  }>;
};

type ClovaOcrResponse = {
  images?: ClovaImageResult[];
};

export class ClovaOcrError extends Error {
  constructor(
    message: string,
    readonly statusCode?: number,
    readonly retryable = false,
  ) {
    super(message);
    this.name = 'ClovaOcrError';
  }
}

const getRequiredEnv = (key: string): string => {
  const value = process.env[key]?.trim();
  if (value === undefined || value === '') {
    throw new Error(`${key} 환경 변수가 설정되지 않았습니다.`);
  }

  return value;
};

const guessFormat = (originalFileName: string): 'jpg' | 'png' | 'webp' => {
  const ext = originalFileName.split('.').pop()?.toLowerCase();
  if (ext === 'png') {
    return 'png';
  }

  if (ext === 'webp') {
    return 'webp';
  }

  return 'jpg';
};

const extractRawText = (response: ClovaOcrResponse): string => {
  const firstImage = response.images?.[0];
  if (firstImage === undefined) {
    return '';
  }

  const fieldTexts =
    firstImage.fields
      ?.map(field => field.inferText?.trim() ?? '')
      .filter(text => text !== '') ?? [];

  if (fieldTexts.length > 0) {
    return fieldTexts.join('\n');
  }

  const tableTexts: string[] = [];
  for (const table of firstImage.tables ?? []) {
    for (const cell of table.cells ?? []) {
      for (const line of cell.cellTextLines ?? []) {
        const lineText = (line.cellWords ?? [])
          .map(word => word.inferText?.trim() ?? '')
          .filter(text => text !== '')
          .join(' ');
        if (lineText !== '') {
          tableTexts.push(lineText);
        }
      }
    }
  }

  return tableTexts.join('\n');
};

export class ClovaReceiptOcrEngine implements ReceiptOcrEngine {
  private readonly invokeUrl = getRequiredEnv('CLOVA_OCR_INVOKE_URL');

  private readonly secretKey = getRequiredEnv('CLOVA_OCR_SECRET_KEY');

  private readonly timeoutMs = Number.parseInt(
    process.env.OCR_CLOVA_TIMEOUT_MS ?? '10000',
    10,
  );

  async recognize(
    input: ReceiptOcrEngineInput,
  ): Promise<ReceiptOcrEngineResult> {
    const requestBody = {
      images: [
        {
          format: guessFormat(input.originalFileName),
          name: input.originalFileName,
          data: input.imageBuffer.toString('base64'),
        },
      ],
      requestId: randomUUID(),
      version: 'V2',
      timestamp: Date.now(),
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    let response: Response;
    try {
      response = await fetch(this.invokeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-OCR-SECRET': this.secretKey,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ClovaOcrError(
          `Clova OCR 요청 타임아웃 (${this.timeoutMs}ms)`,
          undefined,
          true,
        );
      }

      throw new ClovaOcrError(
        `Clova OCR 네트워크 오류: ${String(error)}`,
        undefined,
        true,
      );
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new ClovaOcrError(
        `Clova OCR 요청 실패 (${response.status}): ${errorText.slice(0, 500)}`,
        response.status,
        response.status >= 500 || response.status === 429,
      );
    }

    const payload = (await response.json()) as ClovaOcrResponse;
    const rawText = extractRawText(payload);
    const parsed = parseReceiptFromPlainText(rawText, input.currencyHint);

    return {
      parsed,
      rawText,
    };
  }
}
