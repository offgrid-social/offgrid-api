import { PrismaClient } from '@prisma/client';
import { pino } from 'pino';
import { env } from '../config/env.js';

const logger = pino({ level: env.LOG_LEVEL });

export const prisma = new PrismaClient({
  log: env.NODE_ENV === 'production' ? ['warn', 'error'] : ['query', 'info', 'warn', 'error']
});

export async function ensureDatabaseConnection() {
  await prisma.$queryRaw`SELECT 1`;
}
