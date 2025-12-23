import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { registerDevice, listDevices, removeDevice } from '../services/devices.service.js';
import { ok } from '../utils/http.js';

const deviceSchema = z.object({
  id: z.number(),
  userId: z.string(),
  type: z.enum(['cli', 'web', 'mobile']),
  name: z.string(),
  lastSeenAt: z.string().datetime(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

const registerBodySchema = z.object({
  type: z.enum(['cli', 'web', 'mobile']),
  name: z.string().min(1).max(100)
});

const registerResponseSchema = z.object({
  data: deviceSchema
});

const listDevicesResponseSchema = z.object({
  data: z.array(deviceSchema)
});

const deleteParamsSchema = z.object({
  id: z.coerce.number().int().positive()
});

const deleteResponseSchema = z.object({
  data: deviceSchema
});

function serializeDevice(device: {
  id: number;
  userId: string;
  type: 'cli' | 'web' | 'mobile';
  name: string;
  lastSeenAt: Date;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...device,
    lastSeenAt: device.lastSeenAt.toISOString(),
    createdAt: device.createdAt.toISOString(),
    updatedAt: device.updatedAt.toISOString()
  };
}

export default async function devicesRoutes(fastify: FastifyInstance) {
  const router = fastify.withTypeProvider<ZodTypeProvider>();

  router.post(
    '/register',
    {
      schema: {
        tags: ['devices'],
        security: [{ bearerAuth: [] }],
        body: registerBodySchema,
        response: { 200: registerResponseSchema }
      }
    },
    async (request) => {
      const device = await registerDevice(request.user!.id, request.body);
      return ok(serializeDevice(device));
    }
  );

  router.get(
    '/',
    {
      schema: {
        tags: ['devices'],
        security: [{ bearerAuth: [] }],
        response: { 200: listDevicesResponseSchema }
      }
    },
    async (request) => {
      const devices = await listDevices(request.user!.id);
      return ok(devices.map(serializeDevice));
    }
  );

  router.delete(
    '/:id',
    {
      schema: {
        tags: ['devices'],
        security: [{ bearerAuth: [] }],
        params: deleteParamsSchema,
        response: { 200: deleteResponseSchema }
      }
    },
    async (request) => {
      const device = await removeDevice(request.user!.id, request.params.id);
      return ok(serializeDevice(device));
    }
  );
}
