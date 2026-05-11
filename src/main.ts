import app from './app.js';
import config from './config/index.js';
import { initSchedulers } from './schedulers/index.js';

const { port } = config;
const env = config.nodeEnv;

// 스케줄러 등록
initSchedulers();

const serverUrl = process.env.RENDER_EXTERNAL_URL ?? `http://localhost:${port}`;

app.listen(port, () => {
  console.log(
    `🚀 Server is running at ${env === 'production' ? serverUrl : `http://localhost:${port}`} in ${env}`,
  );
});
