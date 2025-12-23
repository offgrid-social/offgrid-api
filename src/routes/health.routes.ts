import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ensureDatabaseConnection } from '../db/prisma.js';

const healthResponseSchema = z.object({
  status: z.literal('up')
});

const readyResponseSchema = z.object({
  status: z.literal('ready'),
  database: z.literal('ok')
});

export default async function healthRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/health',
    {
      schema: {
        tags: ['system'],
        response: { 200: healthResponseSchema }
      },
      config: { auth: { public: true } }
    },
    async () => ({ status: 'up' })
  );

  fastify.get(
    '/ready',
    {
      schema: {
        tags: ['system'],
        security: [{ bearerAuth: [] }],
        response: { 200: readyResponseSchema }
      }
    },
    async () => {
      await ensureDatabaseConnection();
      return { status: 'ready', database: 'ok' };
    }
  );
}
