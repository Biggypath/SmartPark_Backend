import { prisma } from '../config/db.js';
import * as slotRepo from '../repositories/slotRepository.js';
import * as sessionRepo from '../repositories/sessionRepository.js';
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
 * Returns all road segments for a specific parking lot.
 */
export const getRoadsByLot = async (lotId: string) => {
  return await slotRepo.getRoadsByLotId(lotId);
};

/**
 * Returns all slots for the 3D Digital Twin dashboard.
 */
export const getDashboardData = async () => {
  return await slotRepo.getAllSlots();
};

/**
 * Handle OCR Entry Event:
 * 1. The ESP32-CAM is attached to a specific slot — slotId comes from the event.
 * 2. Look up vehicle in RegisteredVehicle by composite key.
 * 3. Mark the slot as OCCUPIED and create a parking session.
 */
export const handleOcrEntry = async (registration: string, province: string, lotId: string, slotId: string) => {
  return await prisma.$transaction(async (tx) => {
    // Verify the slot exists and is available
    const slot = await tx.parkingSlot.findUnique({
      where: { slot_id: slotId }
    });

    if (!slot || slot.lot_id !== lotId) {
      throw new Error(`Slot ${slotId} not found in lot ${lotId}.`);
    }

    if (slot.status !== 'FREE') {
      throw new Error(`Slot ${slotId} is not available (current status: ${slot.status}).`);
    }

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

    // Mark slot as OCCUPIED
    await tx.parkingSlot.update({
      where: { slot_id: slotId },
      data: { status: 'OCCUPIED' }
    });

    // Create parking session
    const session = await tx.parkingSession.create({
      data: {
        slot_id: slotId,
        registration,
        province,
        vehicle_id: vehicle?.vehicle_id ?? null,
        entry_time: new Date(),
        payment_status: 'PENDING'
      }
    });

    // Log entry event
    await tx.sensorLog.create({
      data: {
        slot_id: slotId,
        event_type: 'ENTRY',
        raw_data: `OCR_ENTRY: ${registration} ${province}`
      }
    });

    return { session, slot, isRegistered };
  });
};

/**
 * Handle OCR Exit Event:
 * 1. The ESP32-CAM at the slot provides the slotId directly.
 * 2. Find active session by license plate.
 * 3. Calculate fee.
 * 4. Close session, free the slot.
 */
export const handleOcrExit = async (registration: string, province: string, lotId: string, slotId: string) => {
  return await prisma.$transaction(async (tx) => {
    // Find active session by license plate and slot
    const session = await tx.parkingSession.findFirst({
      where: { registration, province, slot_id: slotId, exit_time: null },
    });

    if (!session) {
      throw new Error(`No active parking session found for ${registration} (${province}) at slot ${slotId}.`);
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
      where: { slot_id: slotId },
      data: { status: 'FREE' }
    });

    // Log exit event
    await tx.sensorLog.create({
      data: {
        slot_id: slotId,
        event_type: 'EXIT',
        raw_data: `OCR_EXIT: ${registration} ${province}`
      }
    });

    return {
      sessionId: session.session_id,
      slotId,
      lotId,
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
