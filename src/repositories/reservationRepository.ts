
import { prisma } from '../config/db.js';

export const createReservation = async (slotId: string, licensePlate: string, reservationTime: Date) => {
  return prisma.reservation.create({
    data: {
      slot_id: slotId,
      license_plate: licensePlate,
      reservation_time: reservationTime
    }
  });
}


export const findActiveReservationBySlot = async (slotId: string) => {
  return prisma.reservation.findFirst({
    where: {
      slot_id: slotId,
      status: 'ACTIVE'
    }
  })
};

export const cancelReservation = async (reservationId: string) => {
  return prisma.reservation.update({
    where: { reservation_id: reservationId },
    data: { status: 'CANCELLED' }
  });
};