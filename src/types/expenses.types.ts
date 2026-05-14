export type CreateExpenseInput = {
  tripId: string;
  payerParticipantId: string;
  title: string;
  category?: 'FOOD' | 'SHOPPING' | 'TRANSPORT' | 'TOUR' | 'ETC';
  note?: string;
  spentAt: string;
  currency: 'KRW' | 'TRIP';
  amountOriginal: number;
  fxMode?: 'FIXED' | 'REALTIME';
  fxRateTripToKrw: number;
  amountKrw: number;
  receiptId?: string;
  /** 공동 지출 분담 대상 참가자 id(동일 여행). 비어 있거나 생략 시 결제자 1인만 분담(amountKrw 전액). */
  splitWithParticipantIds?: string[];
};

export type UpdateExpenseInput = {
  payerParticipantId?: string;
  title?: string;
  category?: 'FOOD' | 'SHOPPING' | 'TRANSPORT' | 'TOUR' | 'ETC';
  note?: string | null;
  spentAt?: string;
  currency?: 'KRW' | 'TRIP';
  amountOriginal?: number;
  fxMode?: 'FIXED' | 'REALTIME';
  fxRateTripToKrw?: number;
  amountKrw?: number;
  receiptId?: string | null;
  /** 요청 본문에 키가 있으면 기존 분담을 모두 교체. 빈 배열이면 결제자만 분담. */
  splitWithParticipantIds?: string[];
};
