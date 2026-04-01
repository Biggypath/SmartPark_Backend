import { prisma } from '../config/db.js';

export const getAllSessions = async (filters?: {
  status?: 'active' | 'completed';
  registration?: string;
}) => {
  const where: Record<string, unknown> = {};

  if (filters?.status === 'active') {
    where.exit_time = null;
  } else if (filters?.status === 'completed') {
    where.exit_time = { not: null };
  }

  if (filters?.registration) {
    where.registration = { contains: filters.registration, mode: 'insensitive' };
  }

  return prisma.parkingSession.findMany({
    where,
    include: {
      slot: true,
      vehicle: {
        include: {
          cards: {
            include: { program: true }
          }
        }
      }
    },
    orderBy: { entry_time: 'desc' }
  });
};

export const getAllSensorLogs = async (filters?: {
  slot_id?: string;
  event_type?: string;
}) => {
  const where: Record<string, unknown> = {};

  if (filters?.slot_id) {
    where.slot_id = filters.slot_id;
  }
  if (filters?.event_type) {
    where.event_type = filters.event_type;
  }

  return prisma.sensorLog.findMany({
    where,
    include: { slot: true },
    orderBy: { timestamp: 'desc' }
  });
};
