import { prisma } from '../config/db.js';
import * as slotRepo from '../repositories/slotRepository.js';
import * as SessionRepo from '../repositories/sessionRepository.js'
import * as reservationRepo from '../repositories/reservationRepository.js';
import { calculateExitFee } from './pricingService.js';
import type { ParkingDetailsResponse } from '../types/index.js';

export const getDashboardData = async () => {
  return await slotRepo.getAllSlots();
};

export const reserveParkingSlot = async (slotId: string, licensePlate: string) => {
  // LOGIC: Use a Transaction to prevent Race Conditions (Requirement)
  return await prisma.$transaction(async (tx) => {
    // 1. Check if slot is truly FREE inside the transaction
    const slot = await tx.parkingSlot.findUnique({ where: { slot_id: slotId } });

    if (!slot || slot.status !== 'FREE') {
      throw new Error('Slot is already taken or invalid.');
    }

    // 2. Update Slot Status
    await tx.parkingSlot.update({
      where: { slot_id: slotId },
      data: { status: 'RESERVED' }
    });

    // 3. Create Reservation Record
    const reservation = await tx.reservation.create({
      data: {
        slot_id: slotId,
        license_plate: licensePlate,
        status: 'ACTIVE'
      }
    });

    return reservation;
  });
};

<<<<<<< Updated upstream

export const processEntryEvent = async (slotId: string) => {
=======
export const processEntryEvent = async (slotId: string, licensePlate: string, timestamp: string) => {
>>>>>>> Stashed changes
    // Logic: When car enters, update status to OCCUPIED
    const check = await CheckReservation(slotId, licensePlate, new Date(timestamp));

    if (!check) {
      throw new Error('Reservation check failed. Cannot process entry event.');
    }

    await prisma.parkingSlot.update({
        where: { slot_id: slotId },
        data: { status: 'OCCUPIED' }
    });
    // Additional logic: Start a ParkingSession here...
};

export const getParkingDetails = async (licensePlate: string) => {
  const slot = await SessionRepo.findActiveSessionByLicensePlate(licensePlate);
  if (!slot) {
    throw new Error('No active parking session found for this license plate.');
  }
  const fee = await calculateExitFee(slot.session_id);
  const response: ParkingDetailsResponse = {
    sessionId: slot.session_id,
    slotId: slot.slot_id,
    licensePlate: slot.license_plate!,
    entryTime: slot.entry_time,
    currentTime: fee.exitTime,
    totalFee: fee.fee || 0
  };
  return response;
}

<<<<<<< Updated upstream
export const cancelReservation = async (reservationId: string) => {
  // Logic: Cancel reservation and free up the slot
  return await prisma.$transaction(async (tx) => {
    const reservation = await tx.reservation.findUnique({ where: { reservation_id: reservationId } });
    if (!reservation || reservation.status !== 'ACTIVE') {
      throw new Error('Reservation not found or already inactive.');
    }

    // Update Reservation Status
    await tx.reservation.update({
      where: { reservation_id: reservationId },
      data: { status: 'CANCELLED' }
    });

    // Free up the Slot
    await tx.parkingSlot.update({
      where: { slot_id: reservation.slot_id },
      data: { status: 'FREE' }
    });

    return { message: 'Reservation cancelled successfully.' };
  });
};
=======
export const CheckReservation = async (slotId: string, licensePlate: string, entryTime: Date) => {
  const reservation = await reservationRepo.findActiveReservationBySlot(slotId);
  if (!reservation || reservation.license_plate !== licensePlate) {
    throw new Error('No active reservation found for this slot and license plate.');
  }
  if (reservation.reservation_time > entryTime) {
    throw new Error('Entry time is before reservation time.');
  }
  return true;
}
>>>>>>> Stashed changes
