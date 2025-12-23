import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { AppError, ErrorCodes } from '../utils/errors.js';
import { ok } from '../utils/http.js';

const meResponseSchema = z.object({
  data: z.object({
    id: z.string(),
    role: z.string(),
    username: z.string().optional(),
    email: z.string().optional()
  })
});

export default async function meRoutes(fastify: FastifyInstance) {
  const router = fastify.withTypeProvider<ZodTypeProvider>();

  router.get(
    '/me',
    {
      schema: {
        tags: ['auth'],
        security: [{ bearerAuth: [] }],
        response: { 200: meResponseSchema }
      }
    },
    async (request) => {
      if (!request.user) {
        throw new AppError(ErrorCodes.Unauthorized, 401, 'Unauthorized');
      }

      return ok({
        id: request.user.id,
        role: request.user.role,
        username: request.user.username,
        email: request.user.email
      });
    }
  );
}
