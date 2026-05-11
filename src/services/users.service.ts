import { StatusCodes } from 'http-status-codes';

import { AppError } from '../errors/app-error.js';
import * as userRepository from '../repositories/users.repository.js';

export const getMyInfo = async (userId: string) => {
  const user = await userRepository.findByUserId(userId);
  if (user === null) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      'USER_NOT_FOUND',
      '사용자가 존재하지 않습니다.',
      '해당 ID를 가진 사용자가 데이터베이스에 존재하지 않습니다.',
    );
  }

  return user;
};
