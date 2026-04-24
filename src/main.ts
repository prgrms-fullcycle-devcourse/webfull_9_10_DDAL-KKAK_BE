import app from './app.js';
import config from './config/index.js';

const { port } = config;
const env = config.nodeEnv;

app.listen(port, () => {
  console.log(`🚀 Server is running at http://localhost:${port} in ${env}`);
});
