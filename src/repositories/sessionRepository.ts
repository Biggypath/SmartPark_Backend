// src/repositories/sessionRepository.ts
import { prisma } from '../config/db.js';

// 1. Start a Session (Car Enters)
export const createSession = async (data: {
  slotId?: string;
  registration?: string;
  province?: string;
  vehicleId?: string;
}) => {
  return prisma.parkingSession.create({
    data: {
      slot_id: data.slotId ?? null,
      registration: data.registration ?? null,
      province: data.province ?? null,
      vehicle_id: data.vehicleId ?? null,
      entry_time: new Date(),
      payment_status: 'PENDING'
    }
  });
};

// 2. Find Active Session by Slot (for sensor occupation events)
export const findActiveSessionBySlot = async (slotId: string) => {
  return prisma.parkingSession.findFirst({
    where: {
      slot_id: slotId,
      exit_time: null
    }
  });
};

// 2b. Find Active Session by License Plate (for session check endpoint)
export const findActiveSessionByPlate = async (registration: string, province: string) => {
  return prisma.parkingSession.findFirst({
    where: {
      registration,
      province,
      exit_time: null
    },
    include: {
      slot: true,
      vehicle: {
        include: {
          cards: {
            where: { is_active: true },
            include: { program: true }
          }
        }
      }
    }
  });
};

// 3. End Session (Car Exits)
export const updateSessionExit = async (
  sessionId: string,
  exitTime: Date,
  fee: number,
  durationMinutes: number
) => {
  return prisma.parkingSession.update({
    where: { session_id: sessionId },
    data: {
      exit_time: exitTime,
      total_fee: fee,
      duration_minutes: durationMinutes,
      payment_status: 'PAID'
    }
  });
};

// 4. Get parking history for a user's registered vehicles
export const findSessionsByUserId = async (userId: string) => {
  return prisma.parkingSession.findMany({
    where: {
      vehicle: {
        cards: {
          some: {
            user_id: userId
          }
        }
      }
    },
    include: {
      slot: {
        include: {
          lot: { select: { name: true, location: true } }
        }
      }
    },
    orderBy: { entry_time: 'desc' }
  });
};