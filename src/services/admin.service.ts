import { prisma } from '../db/prisma.js';
import { env } from '../config/env.js';
import { AppError, ErrorCodes } from '../utils/errors.js';

export type UserShadowInput = {
  userId: string;
  username?: string | null;
  email?: string | null;
  role: string;
};

export async function listUsers() {
  return prisma.userShadow.findMany({
    orderBy: { createdAt: 'desc' }
  });
}

export async function deleteUser(userId: string) {
  const existing = await prisma.userShadow.findUnique({ where: { userId } });
  if (!existing) {
    throw new AppError(ErrorCodes.NotFound, 404, 'User not found');
  }

  await prisma.userShadow.delete({ where: { userId } });
  return existing;
}

async function fetchUsersFromAuth(token: string, fetcher: typeof fetch) {
  const response = await fetcher(`${env.AUTH_SERVICE_URL}/admin/users`, {
    method: 'GET',
    headers: {
      authorization: token,
      'content-type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new AppError(ErrorCodes.Internal, 502, 'Failed to sync users from auth service');
  }

  const payload = (await response.json()) as { users?: UserShadowInput[] } | UserShadowInput[];
  const users = Array.isArray(payload) ? payload : payload.users ?? [];
  return users;
}

export async function syncUsersFromAuth(token: string, fetcher: typeof fetch = fetch) {
  const users = await fetchUsersFromAuth(token, fetcher);

  for (const user of users) {
    if (!user.userId) continue;
    await prisma.userShadow.upsert({
      where: { userId: user.userId },
      create: {
        userId: user.userId,
        username: user.username ?? undefined,
        email: user.email ?? undefined,
        role: user.role
      },
      update: {
        username: user.username ?? undefined,
        email: user.email ?? undefined,
        role: user.role
      }
    });
  }

  return listUsers();
}
