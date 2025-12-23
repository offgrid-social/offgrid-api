import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { deleteUser, listUsers, syncUsersFromAuth } from '../services/admin.service.js';
import { AppError, ErrorCodes } from '../utils/errors.js';
import { ok, parseBoolean } from '../utils/http.js';

const userShadowSchema = z.object({
  userId: z.string(),
  username: z.string().nullish(),
  email: z.string().nullish(),
  role: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

const listResponseSchema = z.object({
  data: z.array(userShadowSchema)
});

const deleteParamsSchema = z.object({
  id: z.string()
});

const deleteResponseSchema = z.object({
  data: userShadowSchema
});

const listQuerySchema = z.object({
  sync: z.string().optional()
});

function serializeUser(user: {
  userId: string;
  username: string | null;
  email: string | null;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...user,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString()
  };
}

export default async function adminRoutes(fastify: FastifyInstance) {
  const router = fastify.withTypeProvider<ZodTypeProvider>();

  router.get(
    '/users',
    {
      schema: {
        tags: ['admin'],
        security: [{ bearerAuth: [] }],
        querystring: listQuerySchema,
        response: { 200: listResponseSchema }
      },
      config: { auth: { admin: true } }
    },
    async (request) => {
      const shouldSync = parseBoolean(request.query.sync);
      const token = request.headers.authorization;
      if (!token) {
        throw new AppError(ErrorCodes.Unauthorized, 401, 'Authorization token missing');
      }

      let users = await listUsers();
      if (shouldSync || users.length === 0) {
        users = await syncUsersFromAuth(token);
      }

      return ok(users.map(serializeUser));
    }
  );

  router.delete(
    '/users/:id',
    {
      schema: {
        tags: ['admin'],
        security: [{ bearerAuth: [] }],
        params: deleteParamsSchema,
        response: { 200: deleteResponseSchema }
      },
      config: { auth: { admin: true } }
    },
    async (request) => {
      const removed = await deleteUser(request.params.id);
      return ok(serializeUser(removed));
    }
  );
}
