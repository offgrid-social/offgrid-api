process.env.AUTH_SERVICE_URL ??= 'http://auth.test';
process.env.DATABASE_URL ??= 'postgresql://postgres:postgres@localhost:5432/offgrid_test';

import Fastify from 'fastify';
import { describe, expect, beforeEach, afterEach, it, vi } from 'vitest';
import { ErrorCodes } from '../src/utils/errors.js';

const { default: authPlugin } = await import('../src/plugins/auth.js');

describe('auth plugin', () => {
  const token = 'test-token';
  const user = { id: 'user-1', role: 'user' };
  const fetchMock = vi.fn(async () => ({
    ok: true,
    json: async () => ({ valid: true, user })
  }));

  let app: ReturnType<typeof Fastify>;

  beforeEach(async () => {
    fetchMock.mockClear();
    app = Fastify();
    app.register(authPlugin, { fetch: fetchMock, cacheTtlMs: 1000, authServiceUrl: 'http://auth.test' });
    app.get('/protected', async (request) => ({ user: request.user }));
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it('caches token validation responses', async () => {
    const headers = { authorization: `Bearer ${token}` };
    const first = await app.inject({ method: 'GET', url: '/protected', headers });
    expect(first.statusCode).toBe(200);

    const second = await app.inject({ method: 'GET', url: '/protected', headers });
    expect(second.statusCode).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('rejects missing tokens', async () => {
    const response = await app.inject({ method: 'GET', url: '/protected' });
    expect(response.statusCode).toBe(401);
    const body = response.json() as { error: { code: string } };
    expect(body.error.code).toBe(ErrorCodes.Unauthorized);
  });
});
