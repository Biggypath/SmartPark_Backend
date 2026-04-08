import { prisma } from '../config/db.js';
import type { SlotStatus } from '@prisma/client';

export const getAllLots = async () => {
  return prisma.privilegeParking.findMany({
    include: { mall: true, program: true },
    orderBy: { name: 'asc' }
  });
};

export const getAllSlots = async () => {
  return prisma.parkingSlot.findMany({
    include: { lot: true },
    orderBy: { slot_id: 'asc' }
  });
};

export const getSlotsByLotId = async (lotId: string) => {
  return prisma.parkingSlot.findMany({
    where: { lot_id: lotId },
    include: {
      sessions: {
        where: { exit_time: null },
        select: {
          session_id: true,
          registration: true,
          province: true,
        }
      }
    },
    orderBy: { slot_id: 'asc' }
  });
};

export const findSlotById = async (slotId: string) => {
  return prisma.parkingSlot.findUnique({ where: { slot_id: slotId } });
};

export const findSlotByCamId = async (camId: string) => {
  return prisma.parkingSlot.findUnique({ where: { cam_id: camId }, include: { lot: true } });
};

export const updateSlotStatus = async (slotId: string, status: SlotStatus) => {
  return prisma.parkingSlot.update({
    where: { slot_id: slotId },
    data: { status }
  });
};

export const getRoadsByLotId = async (lotId: string) => {
  return prisma.road.findMany({
    where: { lot_id: lotId },
    orderBy: { road_id: 'asc' },
  });
};