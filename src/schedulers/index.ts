import cron from 'node-cron';

import { updateAllRates } from '../services/currencies.service.js';

export const initSchedulers = () => {
  // 정각마다 외부 API를 통한 환율 DB 갱신
  cron.schedule('0 0 * * * *', async () => {
    await updateAllRates();
  });

  console.log('매 정각 실행되는 환율 갱신 스케줄러가 등록되었습니다.');
};
