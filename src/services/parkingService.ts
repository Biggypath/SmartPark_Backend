import { prisma } from '../config/db.js';
import * as slotRepo from '../repositories/slotRepository.js';
import * as SessionRepo from '../repositories/sessionRepository.js'
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

export const processEntryEvent = async (slotId: string) => {
    // Logic: When car enters, update status to OCCUPIED
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