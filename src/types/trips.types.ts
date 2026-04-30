export type CreateTripInput = {
  ownerUserId: string;
  title: string;
  tripCurrencyCode: string;
  defaultFxMode?: 'FIXED' | 'REALTIME';
  fixedExchangeRate?: number;
  startDate?: string;
  endDate?: string;
};
