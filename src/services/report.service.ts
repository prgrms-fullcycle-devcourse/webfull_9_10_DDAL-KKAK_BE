import { StatusCodes } from 'http-status-codes';

import { AppError } from '../errors/app-error.js';
import * as reportRepository from '../repositories/report.repository.js';
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
  const dailyAverage = totalAmountKrw / days;

  // 리포트 데이터 구성
  return {
    tripId: trip.id,
    generatedAt: new Date().toISOString(),
    statistics: {
      totalAmountKrw,
      mostSpentCategory: '식비',
      dailyAverageKrw: Math.round(dailyAverage),
      expenseCount,
    },
    report: {
      title: '미식과 쇼핑의 경계에서',
      consumptionStyle: '계획적인 미식가',
      totalAnalysis:
        '전반적으로 계획된 예산 내에서 소비하셨습니다. 특히 식비에 투자를 아끼지 않으면서도 교통비에서 절약한 모습이 인상적입니다.',
      categoryInsights: [
        {
          category: '식비',
          amountKrw: 850000.0,
          insight:
            '전체 지출의 68%를 차지합니다. 현지 맛집 탐방에 집중된 소비 패턴을 보입니다.',
        },
        {
          category: '쇼핑',
          amountKrw: 250000.0,
          insight: '여행 마지막 날 기념품 구입에 지출이 집중되었습니다.',
        },
      ],
      suggestions: [
        '식비 비중이 높으므로 다음 여행에선 조식이 포함된 숙소를 고려해보세요.',
        '현지 패스권을 미리 구입하여 교통비를 더 절감할 수 있습니다.',
      ],
    },
  };
};
