import fp from 'fastify-plugin';
import { LRUCache } from 'lru-cache';
import { env } from '../config/env.js';
import { AppError, ErrorCodes } from '../utils/errors.js';

export type AuthUser = {
  id: string;
  role: string;
  username?: string;
  email?: string;
};

type VerifyResponse = {
  valid: boolean;
  user?: AuthUser;
};

export type AuthPluginOptions = {
  authServiceUrl?: string;
  cacheTtlMs?: number;
  fetch?: typeof fetch;
};

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser;
  }

  interface FastifyContextConfig {
    auth?: {
      public?: boolean;
      admin?: boolean;
    };
  }
}

const defaultCache = new LRUCache<string, AuthUser>({
  ttl: env.AUTH_CACHE_TTL_MS,
  max: 1_000
});

async function callAuthService(
  token: string,
  authServiceUrl: string,
  fetcher: typeof fetch,
  requestId: string
): Promise<AuthUser> {
  try {
    const response = await fetcher(`${authServiceUrl}/auth/verify-token`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`,
        'x-request-id': requestId
      },
      body: JSON.stringify({ token })
    });

    if (!response.ok) {
      throw new AppError(ErrorCodes.Unauthorized, 401, 'Token validation failed');
    }

    const payload = (await response.json()) as VerifyResponse;

    if (!payload.valid || !payload.user) {
      throw new AppError(ErrorCodes.Unauthorized, 401, 'Invalid token');
    }

    return payload.user;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(ErrorCodes.Internal, 502, 'Auth service unreachable', error);
  }
}

function getBearerToken(header?: string) {
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (!scheme || !token) return null;
  if (scheme.toLowerCase() !== 'bearer') return null;
  return token;
}

export default fp<AuthPluginOptions>(async (fastify, opts) => {
  const cache = opts.cacheTtlMs ? new LRUCache<string, AuthUser>({ ttl: opts.cacheTtlMs, max: 1_000 }) : defaultCache;
  const authServiceUrl = opts.authServiceUrl ?? env.AUTH_SERVICE_URL;
  const fetcher = opts.fetch ?? fetch;

  fastify.decorateRequest('user', null);

  fastify.addHook('preHandler', async (request) => {
    const authConfig = request.context.config?.auth;
    if (authConfig?.public) {
      return;
    }

    const token = getBearerToken(request.headers.authorization);
    if (!token) {
      throw new AppError(ErrorCodes.Unauthorized, 401, 'Missing bearer token');
    }

    const cached = cache.get(token);
    const user = cached ?? (await callAuthService(token, authServiceUrl, fetcher, request.id));
    if (!cached) {
      cache.set(token, user);
    }

    if (authConfig?.admin && user.role !== 'admin') {
      throw new AppError(ErrorCodes.Forbidden, 403, 'Admin access required');
    }

    request.user = user;
  });
});
