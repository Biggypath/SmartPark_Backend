// src/repositories/sessionRepository.ts
import { prisma } from '../config/db.js';
import { PaymentStatus } from '@prisma/client';

// 1. Start a Session (Car Enters)
export const createSession = async (slotId: string, licensePlate?: string, reservationId?: string) => {
  return prisma.parkingSession.create({
    data: {
      slot_id: slotId,
      license_plate: licensePlate || "UNKNOWN", // Updated later via OCR
      reservation_id: reservationId ?? null,
      entry_time: new Date(),
      payment_status: 'PENDING'
    }
  });
};

// 2. Find Active Session (To calculate fee)
export const findActiveSessionBySlot = async (slotId: string) => {
  return prisma.parkingSession.findFirst({
    where: {
      slot_id: slotId,
      exit_time: null // Still parked
    }
  });
};

// 3. End Session (Car Exits)
export const updateSessionExit = async (sessionId: string, exitTime: Date, fee: number, duration: number) => {
  return prisma.parkingSession.update({
    where: { session_id: sessionId },
    data: {
      exit_time: exitTime,
      total_fee: fee,
      duration_minutes: duration,
      payment_status: 'PAID'
    }
  });
};

export const findActiveSessionByLicensePlate = async (licensePlate: string) => {
  return prisma.parkingSession.findFirst({
    where: {
      license_plate: licensePlate,
      exit_time: null // Still parked
    }
  });
};