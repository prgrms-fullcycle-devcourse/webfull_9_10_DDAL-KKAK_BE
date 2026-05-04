export type CreateTripInput = {
  ownerUserId: string;
  title: string;
  tripCurrencyCode: string;
  defaultFxMode?: 'FIXED' | 'REALTIME';
  fixedExchangeRate?: number;
  startDate?: string;
  endDate?: string;
};

export type UpdateTripInput = {
  title?: string;
  tripCurrencyCode?: string;
  defaultFxMode?: 'FIXED' | 'REALTIME';
  fixedExchangeRate?: number | null;
  startDate?: string | null;
  endDate?: string | null;
};
