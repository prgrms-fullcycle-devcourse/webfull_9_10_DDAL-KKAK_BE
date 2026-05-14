import { StatusCodes } from 'http-status-codes';

import { EXPENSE_CATEGORY } from '../constants/category.js';
import { AppError } from '../errors/app-error.js';
import * as reportRepository from '../repositories/report.repository.js';
import { generateAiReport } from '../utils/ai.utils.js';
import { getDurationInDays } from '../utils/date.utils.js';

export const getAiConsumptionReport = async (
  tripId: string,
  userId: string,
) => {
  const trip = await reportRepository.findTripWithExpenses(tripId);

  if (trip === null) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      'TRIP_NOT_FOUND',
      '대상 여행을 찾을 수 없습니다.',
      `요청하신 ID(${tripId})에 해당하는 여행 기록이 존재하지 않습니다.`,
    );
  }

  if (trip.ownerUserId !== userId) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      'FORBIDDEN_ACCESS',
      'AI 리포트 조회 권한이 없습니다.',
      '해당 여행의 멤버만 소비 분석 리포트를 확인할 수 있습니다.',
    );
  }

  if (trip.expenses === null || trip.expenses.length < 3) {
    throw new AppError(
      StatusCodes.UNPROCESSABLE_ENTITY,
      'INSUFFICIENT_DATA',
      '리포트 생성에 필요한 데이터가 부족합니다.',
      '지출 내역이 최소 3건 이상 등록되어야 AI 소비 분석이 가능합니다.',
    );
  }

  // 통계 계산
  const totalAmountKrw = trip.expenses.reduce(
    (sum, exp) => sum + Number(exp.amountKrw),
    0,
  );
  const expenseCount = trip.expenses.length;
  const days =
    trip.startDate && trip.endDate
      ? getDurationInDays(trip.startDate, trip.endDate)
      : 1;
  const dailyAverageKrw = totalAmountKrw / days;

  // 리포트 데이터 구성
  const aiAnalysis = await generateAiReport({
    totalAmountKrw,
    expenseCount,
    expenses: trip.expenses.map(e => ({
      category: (e.category && EXPENSE_CATEGORY[e.category]) ?? '기타',
      amount: Number(e.amountKrw),
      title: e.title,
    })),
  });

  const rawCategory = aiAnalysis.categoryInsights[0]?.category;
  const mostSpentCategory =
    rawCategory !== undefined && EXPENSE_CATEGORY[rawCategory] !== undefined
      ? EXPENSE_CATEGORY[rawCategory]
      : '기타';

  return {
    tripId: trip.id,
    generatedAt: new Date().toISOString(),
    statistics: {
      totalAmountKrw,
      mostSpentCategory,
      dailyAverageKrw,
      expenseCount,
    },
    report: aiAnalysis,
  };
};
