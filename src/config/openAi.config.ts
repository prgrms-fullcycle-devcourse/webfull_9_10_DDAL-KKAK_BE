const apiKey = process.env.OPENAI_API_KEY;

if (typeof apiKey !== 'string' || apiKey.trim() === '') {
  throw new Error('OPENAI API KEY가 설정되지 않았습니다.');
}

const config = {
  apiKey,
};

export default config;
