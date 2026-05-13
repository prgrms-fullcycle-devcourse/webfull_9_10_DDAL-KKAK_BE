import { Decimal } from '@prisma/client/runtime/client';
import { StatusCodes } from 'http-status-codes';

import { AppError } from '../errors/app-error.js';
import * as settlementRepository from '../repositories/settlement.repository.js';
import * as userRepository from '../repositories/users.repository.js';

export const calculateSettlement = async (tripId: string) => {
  const trip = await settlementRepository.getSettlementData(tripId);
  if (!trip) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      'TRIP_NOT_FOUND',
      '존재하지 않는 여행입니다.',
      `tripId(${tripId})에 해당하는 정보를 찾을 수 없습니다.`,
    );
  }

  let totalAmountKrw = new Decimal(0);

  // 참가자별 요약 데이터 생성
  const settlementSummary = trip.participants.map(p => {
    const totalPaidKrw = p.expenses.reduce(
      (acc, curr) => acc.plus(curr.amountKrw),
      new Decimal(0),
    );
    const totalShareKrw = p.expenseShares.reduce(
      (acc, curr) => acc.plus(curr.shareAmountKrw),
      new Decimal(0),
    );
    const netAmount = totalPaidKrw.minus(totalShareKrw);

    totalAmountKrw = totalAmountKrw.plus(totalPaidKrw);

    return {
      participantId: p.id,
      name: p.name,
      totalPaidKrw: totalPaidKrw.toNumber(),
      totalShareKrw: totalShareKrw.toNumber(),
      netAmount: netAmount.toNumber(),
    };
  });

  // 송금 계산 알고리즘
  const remittances = [];
  const debtors = settlementSummary
    .filter(s => s.netAmount < 0)
    .map(s => ({ ...s, netAmount: Math.abs(s.netAmount) }));
  const creditors = settlementSummary
    .filter(s => s.netAmount > 0)
    .map(s => ({ ...s }));

  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];

    if (!debtor || !creditor) {
      break;
    }

    const amount = Math.min(debtor.netAmount, creditor.netAmount);

    if (amount > 0) {
      remittances.push({
        sender: { id: debtor.participantId, name: debtor.name },
        receiver: { id: creditor.participantId, name: creditor.name },
        amount: Number(amount.toFixed(2)),
      });
    }

    debtor.netAmount -= amount;
    creditor.netAmount -= amount;

    if (debtor.netAmount <= 0) {
      dIdx++;
    }

    if (creditor.netAmount <= 0) {
      cIdx++;
    }
  }

  return {
    tripId: trip.id,
    totalAmountKrw: totalAmountKrw.toNumber(),
    remittances,
    settlementSummary,
  };
};

export const getMySettlementSummary = async (
  tripId: string,
  userId: string,
) => {
  const user = await userRepository.findByUserId(userId);
  if (user === null || user.name === null) {
    throw new AppError(
      StatusCodes.UNAUTHORIZED,
      'USER_NOT_FOUND',
      '사용자 정보가 유효하지 않습니다.',
      '요청하신 사용자의 프로필 정보(이름)를 확인할 수 없습니다. 프로필 설정 후 다시 시도해주세요.',
    );
  }

  const trip = await settlementRepository.getMySettlementData(
    tripId,
    user.name,
  );
  if (!trip) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      'TRIP_NOT_FOUND',
      '여행 정보를 찾을 수 없습니다.',
      `입력하신 tripId(${tripId})는 유효하지 않은 식별자입니다.`,
    );
  }

  if (trip.ownerUserId !== userId) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      'FORBIDDEN_ACCESS',
      '해당 여행 정보를 조회할 권한이 없습니다.',
      '귀하는 해당 여행의 생성자가 아닙니다.',
    );
  }

  const myInfo = trip.participants[0];
  if (myInfo === undefined) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      'PARTICIPANT_NOT_FOUND',
      '참여자 정보를 찾을 수 없습니다.',
      '귀하는 해당 여행의 생성자이나, 정산 대상자(Participant) 명단에 등록되어 있지 않아 개인 정산 요약을 산출할 수 없습니다.',
    );
  }

  // 합산금액 계산
  const totalSpentOriginal = myInfo.expenses.reduce(
    (acc, curr) => acc.plus(curr.amountOriginal),
    new Decimal(0),
  );
  const totalSpentKrw = myInfo.expenses.reduce(
    (acc, curr) => acc.plus(curr.amountKrw),
    new Decimal(0),
  );
  const totalShareKrw = myInfo.expenseShares.reduce(
    (acc, curr) => acc.plus(curr.shareAmountKrw),
    new Decimal(0),
  );

  // 최종 정산
  const netAmountKrw = totalSpentKrw.minus(totalShareKrw);

  return {
    tripId: trip.id,
    tripTitle: trip.title,
    summary: {
      totalSpentOriginal: totalSpentOriginal.toNumber(),
      currencyCode: trip.tripCurrencyCode,
      totalSpentKrw: totalSpentKrw.toNumber(),
      netAmountKrw: netAmountKrw.toNumber(),
    },
  };
};
