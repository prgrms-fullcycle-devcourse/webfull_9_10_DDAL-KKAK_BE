/**
 * 현재 시간을 KST(Asia/Seoul) 포맷 문자열로 반환합니다.
 * @returns {string} 포맷팅된 날짜 문자열 (예: "2026. 04. 24. 16:15:30")
 * @example
 * const timestamp = getKSTTimestamp();
 * console.log(timestamp); // "2026. 04. 24. 16:15:30"
 */
export const getKSTTimestamp = (): string => {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Asia/Seoul',
  }).format(new Date());
};
