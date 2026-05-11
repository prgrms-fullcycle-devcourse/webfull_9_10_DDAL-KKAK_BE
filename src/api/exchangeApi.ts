import axios from 'axios';

interface ExchangeRateApiResponse {
  result: string;
  base_code: string;
  conversion_rates: Record<string, number>;
  time_last_update_unix: number;
  time_next_update_unix: number;
}

export const fetchLatestRates = async (baseCode: string) => {
  const apiKey = process.env.EXCHANGE_RATE_API_KEY;
  if (apiKey === undefined) {
    throw new Error('EXCHANGE_RATE_API_KEY가 설정되지 않았습니다.');
  }

  const url = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${baseCode}`;

  try {
    const response = await axios.get<ExchangeRateApiResponse>(url);
    if (response.data.result !== 'success') {
      throw new Error(`Exchange API Error: ${response.data.result}`);
    }

    return {
      baseCode: response.data.base_code,
      rates: response.data.conversion_rates,
      expiresAt: new Date(response.data.time_next_update_unix * 1000),
    };
  } catch (err) {
    if (axios.isAxiosError(err) === true) {
      console.error('Exchange API Fetch Error');
    }
    throw err;
  }
};
