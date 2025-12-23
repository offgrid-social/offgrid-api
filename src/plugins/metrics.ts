import fp from 'fastify-plugin';
import { collectDefaultMetrics, Histogram, Registry } from 'prom-client';

export const metricsRegistry = new Registry();

collectDefaultMetrics({
  register: metricsRegistry,
  prefix: 'offgrid_'
});

const httpRequestDurationSeconds = new Histogram({
  name: 'offgrid_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  registers: [metricsRegistry],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5]
});

declare module 'fastify' {
  interface FastifyInstance {
    metricsRegistry: Registry;
  }
}

export default fp(async (fastify) => {
  fastify.decorate('metricsRegistry', metricsRegistry);

  fastify.addHook('onResponse', async (request, reply) => {
    const route = request.routerPath ?? request.url;
    const durationMs = reply.getResponseTime?.() ?? 0;
    httpRequestDurationSeconds.observe(
      {
        method: request.method,
        route,
        status_code: reply.statusCode
      },
      durationMs / 1000
    );
  });

  fastify.get('/metrics', {
    schema: {
      tags: ['metrics'],
      security: [{ bearerAuth: [] }]
    },
    config: { auth: {} },
    logLevel: 'warn',
    handler: async (_request, reply) => {
      reply.header('Content-Type', metricsRegistry.contentType);
      return metricsRegistry.metrics();
    }
  });
});
