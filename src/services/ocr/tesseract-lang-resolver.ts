/**
 * Tesseract 언어 조합: 요청당 워커에 올리는 팩 수를 최소화해 메모리·초기화 비용을 줄입니다.
 * 네 언어를 한 문자열(kor+eng+jpn+chi_sim)로 동시에 쓰지 않는 것이 핵심입니다.
 *
 * - OCR_TESSERACT_LANGS: 비어 있지 않으면 그대로 사용(운영자가 강제 지정).
 * - receiptLocale: 클라이언트가 영수증 국가/스크립트를 알 때 전달 (KR, JP, CN, TW, US 등).
 * - currencyHint: locale 없을 때 JPY→일본어 팩 등으로 보조.
 */

const DEFAULT_LANGS = 'kor+eng';

const localeToLangs = new Map<string, string>([
  ['KR', 'kor+eng'],
  ['KO', 'kor+eng'],
  ['JP', 'jpn+eng'],
  ['JA', 'jpn+eng'],
  ['CN', 'chi_sim+eng'],
  ['ZH_CN', 'chi_sim+eng'],
  ['TW', 'chi_tra+eng'],
  ['HK', 'chi_tra+eng'],
  ['ZH_TW', 'chi_tra+eng'],
  ['US', 'eng'],
  ['GB', 'eng'],
  ['EN', 'eng'],
  ['EN_ONLY', 'eng'],
  ['AUTO', DEFAULT_LANGS],
]);

const currencyToLangs = new Map<string, string>([
  ['KRW', 'kor+eng'],
  ['JPY', 'jpn+eng'],
  ['CNY', 'chi_sim+eng'],
  ['TWD', 'chi_tra+eng'],
  ['HKD', 'chi_tra+eng'],
  ['USD', 'eng'],
  ['EUR', 'eng'],
  ['GBP', 'eng'],
]);

export type TesseractLangResolveInput = {
  receiptLocale?: string;
  currencyHint?: string;
};

export const resolveTesseractLangs = (
  input: TesseractLangResolveInput,
): string => {
  const fromEnv = process.env.OCR_TESSERACT_LANGS?.trim();
  if (fromEnv !== undefined && fromEnv !== '') {
    return fromEnv;
  }

  const loc = input.receiptLocale?.trim().toUpperCase().replace(/-/g, '_');
  if (loc !== undefined && loc !== '') {
    const langs = localeToLangs.get(loc);
    if (langs !== undefined) {
      return langs;
    }
  }

  const cur = input.currencyHint?.trim().toUpperCase();
  if (cur !== undefined && cur !== '') {
    const langs = currencyToLangs.get(cur);
    if (langs !== undefined) {
      return langs;
    }
  }

  return DEFAULT_LANGS;
};
