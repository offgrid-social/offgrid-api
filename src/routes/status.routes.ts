import { FastifyInstance } from 'fastify';
import { z } from 'zod';

const statusResponseSchema = z.object({
  status: z.literal('ok')
});

export default async function statusRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/status',
    {
      schema: {
        tags: ['system'],
        response: {
          200: statusResponseSchema
        }
      },
      config: { auth: { public: true } }
    },
    async () => ({ status: 'ok' })
  );

  fastify.get(
    '/openapi.json',
    {
      schema: {
        tags: ['system']
      }
    },
    async () => fastify.swagger()
  );
}
