import bcrypt from 'bcrypt';

import { CRYPTO_CONSTANTS } from '../constants/crypto.js';

/**
 * 데이터를 해싱합니다
 * @param data 해싱할 데이터
 */
export const hashData = async (data: string): Promise<string> => {
  return await bcrypt.hash(data, CRYPTO_CONSTANTS.SALT_ROUNDS);
};

/**
 * 원본 데이터와 해싱된 데이터를 비교합니다.
 * @param plainData 해싱되지 않은 원본 데이터 (ex: 사용자가 보낸 토큰)
 * @param hashedData DB에 저장된 해싱된 데이터
 */
export const compareData = async (
  plainData: string,
  hashedData: string,
): Promise<boolean> => {
  return await bcrypt.compare(plainData, hashedData);
};
