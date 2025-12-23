import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

loadEnv();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.string().default('info'),
  AUTH_SERVICE_URL: z.string().url(),
  DATABASE_URL: z.string().url(),
  CORS_ORIGINS: z.string().optional(),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  BODY_LIMIT_BYTES: z.coerce.number().int().positive().default(1_048_576),
  AUTH_CACHE_TTL_MS: z.coerce.number().int().positive().default(60_000)
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const formatted = parsed.error.flatten().fieldErrors;
  throw new Error(`Invalid environment variables: ${JSON.stringify(formatted)}`);
}

const corsOrigins = parsed.data.CORS_ORIGINS
  ? parsed.data.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
  : [];

export const env = {
  ...parsed.data,
  CORS_ORIGINS: corsOrigins
};

export type Env = typeof env;
