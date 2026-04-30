export type OcrProcessingStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'FAILED'
  | 'EXPIRED';

export type OcrParsedResult = {
  merchantName: string;
  totalAmount: number;
  currency: string;
  purchasedAt: string;
};

export type OcrJobResult = {
  receiptId: string;
  status: OcrProcessingStatus;
  result?: OcrParsedResult;
  failure?: {
    code: string;
    detail: string;
  };
};
