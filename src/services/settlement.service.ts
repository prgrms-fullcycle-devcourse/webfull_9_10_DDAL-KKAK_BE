import { Decimal } from '@prisma/client/runtime/client';
import { StatusCodes } from 'http-status-codes';

import { AppError } from '../errors/app-error.js';
import * as settlementRepository from '../repositories/settlement.repository.js';

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
