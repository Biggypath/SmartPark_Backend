import { prisma } from '../config/db.js';
import * as slotRepo from '../repositories/slotRepository.js';
import * as sessionRepo from '../repositories/sessionRepository.js';
import * as logRepo from '../repositories/logRepository.js';
import { calculateFee } from './pricingService.js';

/**
 * Returns all slots for the 3D Digital Twin dashboard.
 */
export const getDashboardData = async () => {
  return await slotRepo.getAllSlots();
};

/**
 * Handle LPR Entry Event:
 * 1. Look up vehicle in RegisteredVehicle by composite key.
 * 2. If registered with active cards → prefer VIP slot, fallback to GENERAL.
 * 3. If guest → assign a GENERAL slot.
 * 4. Create ParkingSession and mark slot as ASSIGNED.
 */
export const handleLprEntry = async (registration: string, province: string) => {
  return await prisma.$transaction(async (tx) => {
    // Look up registered vehicle with active cards
    const vehicle = await tx.registeredVehicle.findUnique({
      where: { registration_province: { registration, province } },
      include: {
        cards: {
          where: { is_active: true },
          include: { program: true }
        }
      }
    });

    const isRegistered = vehicle && vehicle.cards.length > 0;
    let slot;

    if (isRegistered) {
      // Prefer VIP, fallback to GENERAL
      slot = await tx.parkingSlot.findFirst({
        where: { status: 'FREE', slot_type: 'VIP', is_active: true },
        orderBy: { slot_id: 'asc' }
      });
      if (!slot) {
        slot = await tx.parkingSlot.findFirst({
          where: { status: 'FREE', slot_type: 'GENERAL', is_active: true },
          orderBy: { slot_id: 'asc' }
        });
      }
    } else {
      // Guest: GENERAL only
      slot = await tx.parkingSlot.findFirst({
        where: { status: 'FREE', slot_type: 'GENERAL', is_active: true },
        orderBy: { slot_id: 'asc' }
      });
    }

    if (!slot) {
      throw new Error('No available parking slots.');
    }

    // Mark slot as ASSIGNED
    await tx.parkingSlot.update({
      where: { slot_id: slot.slot_id },
      data: { status: 'ASSIGNED' }
    });

    // Create parking session
    const session = await tx.parkingSession.create({
      data: {
        slot_id: slot.slot_id,
        registration,
        province,
        vehicle_id: vehicle?.vehicle_id ?? null,
        entry_time: new Date(),
        payment_status: 'PENDING'
      }
    });

    return { session, slot };
  });
};

/**
 * Handle Slot Occupation Event (ESP32 IR sensor):
 * Transition slot from ASSIGNED → OCCUPIED when car physically parks.
 */
export const handleSlotOccupation = async (slotId: string, rawData?: string) => {
  const slot = await slotRepo.findSlotById(slotId);
  if (!slot) {
    throw new Error(`Slot ${slotId} not found.`);
  }

  if (slot.status !== 'ASSIGNED') {
    throw new Error(`Slot ${slotId} is not in ASSIGNED state (current: ${slot.status}).`);
  }

  // Transition to OCCUPIED
  await slotRepo.updateSlotStatus(slotId, 'OCCUPIED');

  // Log sensor event
  await logRepo.createLog(slotId, 'ENTRY', rawData ?? 'IR_TRIGGERED');

  // Verify active session exists
  const session = await sessionRepo.findActiveSessionBySlot(slotId);
  return { slot: { ...slot, status: 'OCCUPIED' }, session };
};

/**
 * Handle Slot Exit Event (ESP32 sensor detects car left):
 * 1. Find active session by slot.
 * 2. Calculate fee (with privilege free_hours if registered).
 * 3. Close session, free slot.
 */
export const handleSlotExit = async (slotId: string, rawData?: string) => {
  return await prisma.$transaction(async (tx) => {
    // Find active session by slot
    const session = await tx.parkingSession.findFirst({
      where: { slot_id: slotId, exit_time: null }
    });

    if (!session) {
      throw new Error(`No active parking session found for slot ${slotId}.`);
    }

    const now = new Date();

    // Determine free hours from privilege cards
    let freeHours = 0;
    if (session.vehicle_id) {
      const vehicle = await tx.registeredVehicle.findUnique({
        where: { vehicle_id: session.vehicle_id },
        include: {
          cards: {
            where: { is_active: true },
            include: { program: { select: { free_hours: true, is_active: true } } }
          }
        }
      });

      if (vehicle?.cards) {
        // Conflict resolution: pick the card with the highest free_hours
        for (const card of vehicle.cards) {
          if (card.program.is_active && card.program.free_hours > freeHours) {
            freeHours = card.program.free_hours;
          }
        }
      }
    }

    // Calculate fee
    const feeResult = calculateFee(session.entry_time, now, freeHours);

    // Close session
    await tx.parkingSession.update({
      where: { session_id: session.session_id },
      data: {
        exit_time: now,
        duration_minutes: feeResult.durationMinutes,
        total_fee: feeResult.totalFee,
        payment_status: feeResult.totalFee > 0 ? 'PENDING' : 'PAID'
      }
    });

    // Free the slot
    await tx.parkingSlot.update({
      where: { slot_id: session.slot_id },
      data: { status: 'FREE' }
    });

    // Log sensor event
    await tx.sensorLog.create({
      data: {
        slot_id: session.slot_id,
        event_type: 'EXIT',
        raw_data: rawData ?? 'IR_DEPARTED'
      }
    });

    return {
      sessionId: session.session_id,
      slotId: session.slot_id,
      ...feeResult
    };
  });
};
