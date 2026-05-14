import openai from 'openai';

import config from '../config/index.js';
import type { AiReportResponse, TripDataForAi } from '../types/ai.types.js';

const openAi = new openai({ apiKey: config.ai.apiKey });

export const generateAiReport = async (
  tripData: TripDataForAi,
): Promise<AiReportResponse> => {
  const prompt = `
    당신은 여행 소비 분석 전문가입니다. 아래 여행 소비 내역 데이터를 분석하여 리포트를 작성하세요.
    각 지출의 제목(title)을 참고하여 사용자의 소비 성향을 구체적으로 파악하세요.
    
    [여행 소비내역 데이터 정보]
    - 총 지출: ${tripData.totalAmountKrw}원
    - 소비 건수: ${tripData.expenseCount}건
    - 소비 내역: ${JSON.stringify(tripData.expenses)}

    [주의사항]
    1. 카테고리는 반드시 데이터에 주어진 한국어 명칭(식비, 쇼핑, 교통, 관광, 기타)만 사용하세요.
    2. 소비 스타일은 위트 있게 'OOO한 OOO' 형태로 지어주세요.

    [응답 양식]
    반드시 JSON 형식으로 응답하며, 모든 필드는 한국어로 작성하세요.
    반드시 아래 필드를 포함한 JSON 형식으로만 응답하세요:
    {
      "title": "리포트 제목",
      "consumptionStyle": "소비 스타일 키워드",
      "totalAnalysis": "전체 요약 분석 (3문장 내외)",
      "categoryInsights": [
        { 
          "category": "소비 카테고리",
          "amount": 12345, // 이 카테고리의 지출 합계를 소수점 2자리 숫자로 적어주세요.
          "insight": "해당 카테고리 소비 특징"
        }
      ], // 카테고리별로 분석 데이터를 작성해주세요.
      "suggestions": ["조언1", "조언2"]
    }
  `;

  const response = await openAi.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          '당신은 냉철하면서도 따뜻한 조언을 건네는 여행 자산 관리사입니다.',
      },
      { role: 'user', content: prompt },
    ],
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content ?? '{}';

  return JSON.parse(content) as AiReportResponse;
};
