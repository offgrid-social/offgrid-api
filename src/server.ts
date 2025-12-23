import Fastify from 'fastify';
import helmet from '@fastify/helmet';
import { randomUUID } from 'crypto';
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod';
import { env } from './config/env.js';
import authPlugin from './plugins/auth.js';
import corsPlugin from './plugins/cors.js';
import metricsPlugin from './plugins/metrics.js';
import rateLimitPlugin from './plugins/rateLimit.js';
import swaggerPlugin from './plugins/swagger.js';
import { AuthPluginOptions } from './plugins/auth.js';
import adminRoutes from './routes/admin.routes.js';
import devicesRoutes from './routes/devices.routes.js';
import healthRoutes from './routes/health.routes.js';
import meRoutes from './routes/me.routes.js';
import statusRoutes from './routes/status.routes.js';
import { buildErrorBody, ErrorCodes, toErrorResponse } from './utils/errors.js';

export type ServerOptions = {
  auth?: AuthPluginOptions;
};

export function buildServer(opts?: ServerOptions) {
  const server = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      redact: ['req.headers.authorization'],
      transport:
        env.NODE_ENV === 'development'
          ? {
              target: 'pino-pretty',
              options: {
                translateTime: 'HH:MM:ss Z',
                colorize: true
              }
            }
          : undefined
    },
    genReqId: (request) => request.headers['x-request-id']?.toString() ?? randomUUID(),
    trustProxy: true,
    bodyLimit: env.BODY_LIMIT_BYTES
  }).withTypeProvider<ZodTypeProvider>();

  server.setValidatorCompiler(validatorCompiler);
  server.setSerializerCompiler(serializerCompiler);

  server.addHook('onRequest', async (request, reply) => {
    reply.header('x-request-id', request.id);
  });

  server.setErrorHandler((error, request, reply) => {
    const { statusCode, body } = toErrorResponse(error, request.id);
    request.log.error({ err: error }, 'Request failed');
    reply.status(statusCode).send(body);
  });

  server.setNotFoundHandler((request, reply) => {
    reply.status(404).send(buildErrorBody(ErrorCodes.NotFound, 'Route not found', request.id));
  });

  server.register(helmet, { global: true });
  server.register(corsPlugin);
  server.register(rateLimitPlugin);
  server.register(metricsPlugin);
  server.register(authPlugin, opts?.auth);
  server.register(swaggerPlugin);

  server.register(statusRoutes);
  server.register(healthRoutes);
  server.register(meRoutes);
  server.register(devicesRoutes, { prefix: '/devices' });
  server.register(adminRoutes, { prefix: '/admin' });

  return server;
}
