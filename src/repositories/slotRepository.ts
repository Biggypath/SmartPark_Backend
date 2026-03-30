import { prisma } from '../config/db.js';
import type { SlotStatus, SlotType } from '@prisma/client';

export const getAllSlots = async () => {
  return prisma.parkingSlot.findMany({
    orderBy: { slot_id: 'asc' }
  });
};

export const findSlotById = async (slotId: string) => {
  return prisma.parkingSlot.findUnique({ where: { slot_id: slotId } });
};

export const updateSlotStatus = async (slotId: string, status: SlotStatus) => {
  return prisma.parkingSlot.update({
    where: { slot_id: slotId },
    data: { status }
  });
};

export const findFreeSlotByType = async (slotType: SlotType) => {
  return prisma.parkingSlot.findFirst({
    where: {
      status: 'FREE',
      slot_type: slotType,
      is_active: true
    },
    orderBy: { slot_id: 'asc' }
  });
};