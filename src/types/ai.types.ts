/** AI에게 전달할 여행 데이터 타입 */
export interface TripDataForAi {
  totalAmountKrw: number;
  expenseCount: number;
  expenses: {
    category: string;
    amount: number;
    title: string;
  }[];
}

/** AI가 반환할 리포트의 구조 */
export interface AiReportResponse {
  title: string;
  consumptionStyle: string;
  totalAnalysis: string;
  categoryInsights: {
    category: string;
    insight: string;
  }[];
  suggestions: string[];
}
