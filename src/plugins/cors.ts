import cors from '@fastify/cors';
import fp from 'fastify-plugin';
import { env } from '../config/env.js';

export default fp(async (fastify) => {
  await fastify.register(cors, {
    origin: (origin, cb) => {
      if (!origin) {
        cb(null, true);
        return;
      }

      if (env.CORS_ORIGINS.length === 0 || env.CORS_ORIGINS.includes(origin)) {
        cb(null, true);
        return;
      }

      cb(new Error('Origin not allowed'), false);
    },
    credentials: true
  });
});
