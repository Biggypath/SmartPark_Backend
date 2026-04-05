import { prisma } from '../config/db.js';

export interface CreateLotInput {
  name: string;
  mall_id: string;
  program_id: string;
  location?: string;
  rate_per_hour?: number;
  slots: {
    slot_id: string;
    location_coordinates: string;
    rotation: number;
  }[];
}

export const createLotWithSlots = async (input: CreateLotInput) => {
  return prisma.$transaction(async (tx) => {
    const lot = await tx.privilegeParking.create({
      data: {
        name: input.name,
        mall_id: input.mall_id,
        program_id: input.program_id,
        location: input.location ?? null,
        pricingRule: {
          create: { rate_per_hour: input.rate_per_hour ?? 20.0 },
        },
        slots: {
          create: input.slots.map((s) => ({
            slot_id: s.slot_id,
            location_coordinates: s.location_coordinates,
            rotation: s.rotation,
          })),
        },
      },
      include: {
        slots: true,
        pricingRule: true,
        mall: true,
        program: true,
      },
    });
    return lot;
  });
};

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
