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
  roads?: {
    cx: number;
    cy: number;
    w: number;
    d: number;
    horizontal: boolean;
    connections?: Record<string, boolean> | null;
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
        ...(input.roads?.length
          ? {
              roads: {
                create: input.roads.map((r) => ({
                  cx: r.cx,
                  cy: r.cy,
                  w: r.w,
                  d: r.d,
                  horizontal: r.horizontal,
                  ...(r.connections != null ? { connections: r.connections } : {}),
                })),
              },
            }
          : {}),
      },
      include: {
        slots: true,
        roads: true,
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

// ---------------------------------------------------------
// Mall CRUD
// ---------------------------------------------------------

export const getAllMalls = async () => {
  return prisma.mall.findMany({
    include: { lots: true },
    orderBy: { name: 'asc' },
  });
};

export const createMall = async (name: string) => {
  return prisma.mall.create({ data: { name } });
};

export const updateMall = async (mallId: string, name: string) => {
  return prisma.mall.update({ where: { mall_id: mallId }, data: { name } });
};

export const deleteMall = async (mallId: string) => {
  return prisma.$transaction(async (tx) => {
    const lots = await tx.privilegeParking.findMany({
      where: { mall_id: mallId },
      select: { lot_id: true },
    });
    const lotIds = lots.map((l) => l.lot_id);

    if (lotIds.length > 0) {
      const slots = await tx.parkingSlot.findMany({
        where: { lot_id: { in: lotIds } },
        select: { slot_id: true },
      });
      const slotIds = slots.map((s) => s.slot_id);

      if (slotIds.length > 0) {
        await tx.parkingSession.deleteMany({ where: { slot_id: { in: slotIds } } });
        await tx.sensorLog.deleteMany({ where: { slot_id: { in: slotIds } } });
        await tx.parkingSlot.deleteMany({ where: { slot_id: { in: slotIds } } });
      }

      await tx.road.deleteMany({ where: { lot_id: { in: lotIds } } });
      await tx.pricingRule.deleteMany({ where: { parkinglot_id: { in: lotIds } } });
      await tx.privilegeParking.deleteMany({ where: { lot_id: { in: lotIds } } });
    }

    return tx.mall.delete({ where: { mall_id: mallId } });
  });
};

// ---------------------------------------------------------
// Privilege Programs (read-only for listing)
// ---------------------------------------------------------

export const getAllPrograms = async () => {
  return prisma.privilegeProgram.findMany({ orderBy: { provider_name: 'asc' } });
};

// ---------------------------------------------------------
// Lot management
// ---------------------------------------------------------

export const updateLot = async (lotId: string, data: { name?: string; program_id?: string }) => {
  return prisma.privilegeParking.update({
    where: { lot_id: lotId },
    data,
    include: { slots: true, pricingRule: true, mall: true, program: true },
  });
};

export const deleteLot = async (lotId: string) => {
  return prisma.$transaction(async (tx) => {
    const slots = await tx.parkingSlot.findMany({
      where: { lot_id: lotId },
      select: { slot_id: true },
    });
    const slotIds = slots.map((s) => s.slot_id);

    if (slotIds.length > 0) {
      await tx.parkingSession.deleteMany({ where: { slot_id: { in: slotIds } } });
      await tx.sensorLog.deleteMany({ where: { slot_id: { in: slotIds } } });
      await tx.parkingSlot.deleteMany({ where: { lot_id: lotId } });
    }

    await tx.road.deleteMany({ where: { lot_id: lotId } });
    await tx.pricingRule.deleteMany({ where: { parkinglot_id: lotId } });
    return tx.privilegeParking.delete({ where: { lot_id: lotId } });
  });
};

// ---------------------------------------------------------
// Slot management
// ---------------------------------------------------------

export const toggleSlotActive = async (slotId: string) => {
  const slot = await prisma.parkingSlot.findUniqueOrThrow({ where: { slot_id: slotId } });
  return prisma.parkingSlot.update({
    where: { slot_id: slotId },
    data: { is_active: !slot.is_active },
  });
};

export const deleteSlot = async (slotId: string) => {
  return prisma.$transaction(async (tx) => {
    await tx.parkingSession.deleteMany({ where: { slot_id: slotId } });
    await tx.sensorLog.deleteMany({ where: { slot_id: slotId } });
    return tx.parkingSlot.delete({ where: { slot_id: slotId } });
  });
};
