import { prisma } from '../config/db.js';
import * as slotRepo from '../repositories/slotRepository.js';
import * as sessionRepo from '../repositories/sessionRepository.js';
import * as logRepo from '../repositories/logRepository.js';
import { calculateFee } from './pricingService.js';

/**
 * Returns all parking lots.
 */
export const getLots = async () => {
  return await slotRepo.getAllLots();
};

/**
 * Returns parking history for a user's registered vehicles.
 */
export const getParkingHistory = async (userId: string) => {
  const sessions = await sessionRepo.findSessionsByUserId(userId);
  return sessions.map((s) => ({
    session_id: s.session_id,
    location: s.slot?.lot?.name ?? null,
    address: s.slot?.lot?.location ?? null,
    slot_id: s.slot_id,
    registration: s.registration,
    province: s.province,
    entry_time: s.entry_time,
    exit_time: s.exit_time,
    duration_minutes: s.duration_minutes,
    total_fee: s.total_fee,
    payment_status: s.payment_status,
  }));
};

/**
 * Returns all slots for a specific parking lot.
 */
export const getDashboardByLot = async (lotId: string) => {
  return await slotRepo.getSlotsByLotId(lotId);
};

/**
 * Returns all slots for the 3D Digital Twin dashboard.
 */
export const getDashboardData = async () => {
  return await slotRepo.getAllSlots();
};

/**
 * Handle LPR Entry Event:
 * 1. Look up vehicle in RegisteredVehicle by composite key.
 * 2. If registered with active cards → assign a free slot and mark ASSIGNED.
 * 3. If guest/unregistered → create session only (no slot assigned).
 */
export const handleLprEntry = async (registration: string, province: string, lotId: string) => {
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
    let slot = null;

    if (isRegistered) {
      // Registered with active card → assign a free slot within the specified lot
      slot = await tx.parkingSlot.findFirst({
        where: { lot_id: lotId, status: 'FREE', is_active: true },
        orderBy: { slot_id: 'asc' }
      });

      if (!slot) {
        throw new Error('No available parking slots.');
      }

      // Mark slot as ASSIGNED
      await tx.parkingSlot.update({
        where: { slot_id: slot.slot_id },
        data: { status: 'ASSIGNED' }
      });
    }

    // Create parking session (slot_id is null for guests)
    const session = await tx.parkingSession.create({
      data: {
        slot_id: slot?.slot_id ?? null,
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
 * 2. Calculate fee.
 * 3. Close session, free slot.
 */
export const handleSlotExit = async (slotId: string, rawData?: string) => {
  return await prisma.$transaction(async (tx) => {
    // Find active session by slot
    const session = await tx.parkingSession.findFirst({
      where: { slot_id: slotId, exit_time: null },
      include: { slot: { select: { lot_id: true } } }
    });

    if (!session) {
      throw new Error(`No active parking session found for slot ${slotId}.`);
    }

    if (!session.slot_id) {
      throw new Error(`Session ${session.session_id} has no assigned slot.`);
    }

    const now = new Date();

    // Calculate fee
    const feeResult = calculateFee(session.entry_time, now);

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
      lotId: session.slot!.lot_id,
      ...feeResult
    };
  });
};

/**
 * Check Parking Session by License Plate:
 * Works for both guest and registered users.
 * Returns active session details including slot info and privilege data if registered.
 */
export const checkSession = async (registration: string, province: string) => {
  const session = await sessionRepo.findActiveSessionByPlate(registration, province);

  if (!session) {
    return null;
  }

  const now = new Date();
  const durationMs = now.getTime() - session.entry_time.getTime();
  const durationMinutes = Math.round(durationMs / 60000);

  const estimatedFee = calculateFee(session.entry_time, now);

  return {
    session_id: session.session_id,
    slot: session.slot ? {
      slot_id: session.slot.slot_id,
      status: session.slot.status,
    } : null,
    registration: session.registration,
    province: session.province,
    is_registered: session.vehicle_id !== null,
    entry_time: session.entry_time,
    duration_minutes: durationMinutes,
    estimated_fee: estimatedFee.totalFee,
    payment_status: session.payment_status,
  };
};
