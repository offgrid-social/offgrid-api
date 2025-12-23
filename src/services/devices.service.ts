import { DeviceType } from '@prisma/client';
import { prisma } from '../db/prisma.js';
import { AppError, ErrorCodes } from '../utils/errors.js';

export type RegisterDeviceInput = {
  type: DeviceType;
  name: string;
};

export async function registerDevice(userId: string, input: RegisterDeviceInput) {
  const now = new Date();

  return prisma.device.upsert({
    where: {
      userId_name_type: {
        userId,
        name: input.name,
        type: input.type
      }
    },
    create: {
      userId,
      name: input.name,
      type: input.type,
      lastSeenAt: now
    },
    update: {
      name: input.name,
      lastSeenAt: now
    }
  });
}

export function listDevices(userId: string) {
  return prisma.device.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' }
  });
}

export async function removeDevice(userId: string, deviceId: number) {
  const device = await prisma.device.findFirst({
    where: {
      id: deviceId,
      userId
    }
  });

  if (!device) {
    throw new AppError(ErrorCodes.NotFound, 404, 'Device not found');
  }

  await prisma.device.delete({
    where: { id: deviceId }
  });

  return device;
}
