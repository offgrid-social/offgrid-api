process.env.AUTH_SERVICE_URL ??= 'http://auth.test';
process.env.DATABASE_URL ??= 'postgresql://postgres:postgres@localhost:5432/offgrid_test';
process.env.PORT ??= '3100';

import { describe, beforeAll, afterAll, beforeEach, it, expect, vi } from 'vitest';
import { FastifyInstance } from 'fastify';

const { prisma } = await import('../src/db/prisma.js');
const { buildServer } = await import('../src/server.js');

describe('devices routes', () => {
  const user = { id: 'user-1', role: 'user' };
  const fetchMock = vi.fn(async () => ({
    ok: true,
    json: async () => ({ valid: true, user })
  }));

  let app: FastifyInstance;

  beforeAll(async () => {
    await prisma.device.deleteMany({});
    app = buildServer({ auth: { fetch: fetchMock, authServiceUrl: process.env.AUTH_SERVICE_URL, cacheTtlMs: 1000 } });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.device.deleteMany({});
    fetchMock.mockClear();
  });

  it('registers and lists devices for a user', async () => {
    const register = await app.inject({
      method: 'POST',
      url: '/devices/register',
      headers: { authorization: 'Bearer test-token' },
      payload: { type: 'cli', name: 'cli-device' }
    });

    expect(register.statusCode).toBe(200);
    const registered = register.json() as { data: { id: number } };
    expect(registered.data.id).toBeGreaterThan(0);

    const list = await app.inject({
      method: 'GET',
      url: '/devices',
      headers: { authorization: 'Bearer test-token' }
    });

    expect(list.statusCode).toBe(200);
    const devices = list.json() as { data: Array<{ name: string }> };
    expect(devices.data).toHaveLength(1);
    expect(devices.data[0].name).toBe('cli-device');
  });

  it('removes a device belonging to the user', async () => {
    const register = await app.inject({
      method: 'POST',
      url: '/devices/register',
      headers: { authorization: 'Bearer test-token' },
      payload: { type: 'web', name: 'web-device' }
    });

    const { data } = register.json() as { data: { id: number } };

    const remove = await app.inject({
      method: 'DELETE',
      url: `/devices/${data.id}`,
      headers: { authorization: 'Bearer test-token' }
    });

    expect(remove.statusCode).toBe(200);

    const list = await app.inject({
      method: 'GET',
      url: '/devices',
      headers: { authorization: 'Bearer test-token' }
    });

    const devices = list.json() as { data: Array<unknown> };
    expect(devices.data).toHaveLength(0);
  });
});
