import { env } from './config/env.js';
import { buildServer } from './server.js';

async function start() {
  const server = buildServer();

  try {
    await server.listen({ port: env.PORT, host: '0.0.0.0' });
    server.log.info(`Server listening on port ${env.PORT}`);
  } catch (error) {
    server.log.error({ err: error }, 'Failed to start server');
    process.exit(1);
  }
}

void start();
