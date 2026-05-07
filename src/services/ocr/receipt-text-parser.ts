import type { OcrParsedResult } from '../../types/ocr.types.js';

const detectCurrency = (currencyHint?: string): string => {
  if (currencyHint !== undefined && currencyHint.trim() !== '') {
    return currencyHint.toUpperCase();
  }

  return 'KRW';
};

const parseAmountToken = (token: string): number | undefined => {
  const cleaned = token.replace(/,/g, '').replace(/\s/g, '');
  const n = Number.parseInt(cleaned, 10);
  if (Number.isNaN(n) || n <= 0 || n > 1e12) {
    return undefined;
  }

  return n;
};

const extractNumbersFromLine = (line: string): number[] => {
  const amounts: number[] = [];
  const re = /([\d,]+(?:\.\d+)?)\s*(?:원|₩|KRW|USD|EUR)?/gi;
  let m: RegExpExecArray | null = re.exec(line);
  while (m !== null) {
    const token = m[1];
    if (token !== undefined) {
      const v = parseAmountToken(token);
      if (v !== undefined) {
        amounts.push(v);
      }
    }

    m = re.exec(line);
  }

  return amounts;
};

const extractPurchaseDate = (raw: string): string | undefined => {
  const iso = raw.match(/\b(\d{4}-\d{2}-\d{2})[T ]\d{2}:\d{2}/);
  if (iso !== null) {
    return new Date(iso[0].replace(' ', 'T')).toISOString();
  }

  const ymdDot = raw.match(/\b(20\d{2})\.\s*(\d{1,2})\.\s*(\d{1,2})\b/);
  if (ymdDot !== null) {
    const d = new Date(
      Number(ymdDot[1]),
      Number(ymdDot[2]) - 1,
      Number(ymdDot[3]),
    );
    if (!Number.isNaN(d.getTime())) {
      return d.toISOString();
    }
  }

  const ymdSlash = raw.match(/\b(20\d{2})\/(\d{1,2})\/(\d{1,2})\b/);
  if (ymdSlash !== null) {
    const d = new Date(
      Number(ymdSlash[1]),
      Number(ymdSlash[2]) - 1,
      Number(ymdSlash[3]),
    );
    if (!Number.isNaN(d.getTime())) {
      return d.toISOString();
    }
  }

  return undefined;
};

const pickMerchantLine = (lines: string[]): string => {
  for (const line of lines) {
    if (line.length < 2 || line.length > 120) {
      continue;
    }

    if (/^[\d\s.,:₩\-/]+$/.test(line)) {
      continue;
    }

    if (/영수증|RECEIPT|사업자등록|Tel\.?|TEL|주소|Address/i.test(line)) {
      continue;
    }

    return line.slice(0, 120);
  }

  return '미확인 가맹점';
};

const extractTotalAmount = (rawText: string, lines: string[]): number => {
  const keyword =
    /(합\s*계|총\s*계|결제\s*금액|승인\s*금액|카드\s*승인|청구\s*금액|받을\s*금액|금\s*액|TOTAL|AMOUNT\s*DUE|GRAND\s*TOTAL)/i;

  for (const line of lines) {
    if (keyword.test(line)) {
      const nums = extractNumbersFromLine(line);
      if (nums.length > 0) {
        return Math.max(...nums);
      }
    }
  }

  const globalNums = extractNumbersFromLine(rawText.replace(/\n/g, ' '));
  if (globalNums.length > 0) {
    return Math.max(...globalNums);
  }

  return 0;
};

export const parseReceiptFromPlainText = (
  rawText: string,
  currencyHint?: string,
): OcrParsedResult => {
  const currency = detectCurrency(currencyHint);
  const lines = rawText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  const merchantName = pickMerchantLine(lines);
  const totalAmount = extractTotalAmount(rawText, lines);
  const purchasedAt = extractPurchaseDate(rawText) ?? new Date().toISOString();

  return {
    merchantName,
    totalAmount,
    currency,
    purchasedAt,
  };
};
