const dbUrl = process.env.DATABASE_URL;
const directUrl = process.env.DIRECT_URL;

if (typeof dbUrl !== 'string' || dbUrl.trim() === '') {
  throw new Error('❌ DATABASE_URL 환경 변수가 설정되지 않았습니다.');
}

if (typeof directUrl !== 'string' || directUrl.trim() === '') {
  throw new Error('❌ DIRECT_URL 환경 변수가 설정되지 않았습니다.');
}

const config = {
  url: dbUrl,
  directUrl, // 마이그레이션용 URL
  maxConnections: 10,
} as const;

export default config;
