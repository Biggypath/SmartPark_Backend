import { prisma } from '../config/db.js';
import { SlotStatus } from '@prisma/client';

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