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
};
