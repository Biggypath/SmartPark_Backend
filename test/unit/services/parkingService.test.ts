const mockPrisma = {
  $transaction: jest.fn(),
};

jest.mock('../../../src/config/db.js', () => ({
  prisma: mockPrisma,
}));

jest.mock('../../../src/repositories/slotRepository.js', () => ({
  getAllSlots: jest.fn(),
  findSlotById: jest.fn(),
  updateSlotStatus: jest.fn(),
  findFreeSlotByType: jest.fn(),
}));

jest.mock('../../../src/repositories/sessionRepository.js', () => ({
  createSession: jest.fn(),
  findActiveSessionBySlot: jest.fn(),
  findActiveSessionByPlate: jest.fn(),
  updateSessionExit: jest.fn(),
}));

jest.mock('../../../src/repositories/logRepository.js', () => ({
  createLog: jest.fn(),
}));

import * as parkingService from '../../../src/services/parkingService.js';
import * as slotRepo from '../../../src/repositories/slotRepository.js';
import * as sessionRepo from '../../../src/repositories/sessionRepository.js';
import * as logRepo from '../../../src/repositories/logRepository.js';

const mockedGetAllSlots = slotRepo.getAllSlots as jest.MockedFunction<typeof slotRepo.getAllSlots>;
const mockedFindSlotById = slotRepo.findSlotById as jest.MockedFunction<typeof slotRepo.findSlotById>;
const mockedUpdateSlotStatus = slotRepo.updateSlotStatus as jest.MockedFunction<typeof slotRepo.updateSlotStatus>;
const mockedFindActiveBySlot = sessionRepo.findActiveSessionBySlot as jest.MockedFunction<typeof sessionRepo.findActiveSessionBySlot>;
const mockedFindActiveByPlate = sessionRepo.findActiveSessionByPlate as jest.MockedFunction<typeof sessionRepo.findActiveSessionByPlate>;
const mockedCreateLog = logRepo.createLog as jest.MockedFunction<typeof logRepo.createLog>;

describe('parkingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboardData', () => {
    it('should return all slots from repository', async () => {
      const mockSlots = [
        { slot_id: 'GEN-A1', status: 'FREE', slot_type: 'GENERAL' },
        { slot_id: 'VIP-A1', status: 'OCCUPIED', slot_type: 'VIP' },
      ];
      mockedGetAllSlots.mockResolvedValue(mockSlots as any);

      const result = await parkingService.getDashboardData();

      expect(result).toEqual(mockSlots);
      expect(mockedGetAllSlots).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no slots', async () => {
      mockedGetAllSlots.mockResolvedValue([]);

      const result = await parkingService.getDashboardData();

      expect(result).toEqual([]);
    });
  });

  describe('handleLprEntry', () => {
    it('should assign VIP slot to registered vehicle with active card', async () => {
      const mockSlot = { slot_id: 'VIP-A1', status: 'FREE', slot_type: 'VIP', is_active: true };
      const mockSession = { session_id: 'sess-1', slot_id: 'VIP-A1' };

      mockPrisma.$transaction.mockImplementation(async (cb: Function) => {
        const tx = {
          registeredVehicle: {
            findUnique: jest.fn().mockResolvedValue({
              vehicle_id: 'v-1',
              cards: [{ is_active: true, program: { free_hours: 2 } }],
            }),
          },
          parkingSlot: {
            findFirst: jest.fn().mockResolvedValue(mockSlot),
            update: jest.fn().mockResolvedValue({ ...mockSlot, status: 'ASSIGNED' }),
          },
          parkingSession: {
            create: jest.fn().mockResolvedValue(mockSession),
          },
        };
        return cb(tx);
      });

      const result = await parkingService.handleLprEntry('1กข 1234', 'กรุงเทพมหานคร');

      expect(result.session).toEqual(mockSession);
      expect(result.slot).toEqual(mockSlot);
    });

    it('should fallback to GENERAL slot when no VIP available for registered vehicle', async () => {
      const mockGeneralSlot = { slot_id: 'GEN-A1', status: 'FREE', slot_type: 'GENERAL', is_active: true };
      const mockSession = { session_id: 'sess-2', slot_id: 'GEN-A1' };

      mockPrisma.$transaction.mockImplementation(async (cb: Function) => {
        const tx = {
          registeredVehicle: {
            findUnique: jest.fn().mockResolvedValue({
              vehicle_id: 'v-1',
              cards: [{ is_active: true, program: { free_hours: 1 } }],
            }),
          },
          parkingSlot: {
            findFirst: jest.fn()
              .mockResolvedValueOnce(null)          // No VIP
              .mockResolvedValueOnce(mockGeneralSlot), // Fallback GENERAL
            update: jest.fn().mockResolvedValue({}),
          },
          parkingSession: {
            create: jest.fn().mockResolvedValue(mockSession),
          },
        };
        return cb(tx);
      });

      const result = await parkingService.handleLprEntry('1กข 1234', 'กรุงเทพมหานคร');

      expect(result.session).toEqual(mockSession);
      expect(result.slot).toEqual(mockGeneralSlot);
    });

    it('should assign GENERAL slot to guest (unregistered vehicle)', async () => {
      const mockSlot = { slot_id: 'GEN-B1', status: 'FREE', slot_type: 'GENERAL', is_active: true };
      const mockSession = { session_id: 'sess-3', slot_id: 'GEN-B1' };

      mockPrisma.$transaction.mockImplementation(async (cb: Function) => {
        const tx = {
          registeredVehicle: {
            findUnique: jest.fn().mockResolvedValue(null), // Not registered
          },
          parkingSlot: {
            findFirst: jest.fn().mockResolvedValue(mockSlot),
            update: jest.fn().mockResolvedValue({}),
          },
          parkingSession: {
            create: jest.fn().mockResolvedValue(mockSession),
          },
        };
        return cb(tx);
      });

      const result = await parkingService.handleLprEntry('2ขค 5678', 'เชียงใหม่');

      expect(result.session).toEqual(mockSession);
      expect(result.slot).toEqual(mockSlot);
    });

    it('should assign GENERAL slot to vehicle with no active cards', async () => {
      const mockSlot = { slot_id: 'GEN-C1', status: 'FREE', slot_type: 'GENERAL', is_active: true };

      mockPrisma.$transaction.mockImplementation(async (cb: Function) => {
        const tx = {
          registeredVehicle: {
            findUnique: jest.fn().mockResolvedValue({
              vehicle_id: 'v-2',
              cards: [], // No active cards
            }),
          },
          parkingSlot: {
            findFirst: jest.fn().mockResolvedValue(mockSlot),
            update: jest.fn().mockResolvedValue({}),
          },
          parkingSession: {
            create: jest.fn().mockResolvedValue({ session_id: 'sess-4' }),
          },
        };
        return cb(tx);
      });

      const result = await parkingService.handleLprEntry('3คง 9999', 'ชลบุรี');

      expect(result.slot).toEqual(mockSlot);
    });

    it('should throw error when no slots are available', async () => {
      mockPrisma.$transaction.mockImplementation(async (cb: Function) => {
        const tx = {
          registeredVehicle: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
          parkingSlot: {
            findFirst: jest.fn().mockResolvedValue(null),
          },
        };
        return cb(tx);
      });

      await expect(
        parkingService.handleLprEntry('9ZZ 9999', 'นครราชสีมา')
      ).rejects.toThrow('No available parking slots.');
    });

    it('should set slot status to ASSIGNED', async () => {
      const mockUpdate = jest.fn().mockResolvedValue({});
      const mockSlot = { slot_id: 'GEN-A1', status: 'FREE', slot_type: 'GENERAL', is_active: true };

      mockPrisma.$transaction.mockImplementation(async (cb: Function) => {
        const tx = {
          registeredVehicle: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
          parkingSlot: {
            findFirst: jest.fn().mockResolvedValue(mockSlot),
            update: mockUpdate,
          },
          parkingSession: {
            create: jest.fn().mockResolvedValue({ session_id: 'sess-5' }),
          },
        };
        return cb(tx);
      });

      await parkingService.handleLprEntry('1AB 1111', 'กรุงเทพมหานคร');

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { slot_id: 'GEN-A1' },
        data: { status: 'ASSIGNED' },
      });
    });

    it('should create session with vehicle_id for registered vehicle', async () => {
      const mockCreate = jest.fn().mockResolvedValue({ session_id: 'sess-6' });

      mockPrisma.$transaction.mockImplementation(async (cb: Function) => {
        const tx = {
          registeredVehicle: {
            findUnique: jest.fn().mockResolvedValue({
              vehicle_id: 'v-10',
              cards: [{ is_active: true, program: { free_hours: 1 } }],
            }),
          },
          parkingSlot: {
            findFirst: jest.fn().mockResolvedValue({ slot_id: 'VIP-A1' }),
            update: jest.fn().mockResolvedValue({}),
          },
          parkingSession: { create: mockCreate },
        };
        return cb(tx);
      });

      await parkingService.handleLprEntry('1กข 1234', 'กรุงเทพมหานคร');

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          vehicle_id: 'v-10',
          registration: '1กข 1234',
          province: 'กรุงเทพมหานคร',
        }),
      });
    });

    it('should create session with null vehicle_id for guest', async () => {
      const mockCreate = jest.fn().mockResolvedValue({ session_id: 'sess-7' });

      mockPrisma.$transaction.mockImplementation(async (cb: Function) => {
        const tx = {
          registeredVehicle: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
          parkingSlot: {
            findFirst: jest.fn().mockResolvedValue({ slot_id: 'GEN-A1' }),
            update: jest.fn().mockResolvedValue({}),
          },
          parkingSession: { create: mockCreate },
        };
        return cb(tx);
      });

      await parkingService.handleLprEntry('2ขค 5678', 'เชียงใหม่');

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          vehicle_id: null,
          registration: '2ขค 5678',
          province: 'เชียงใหม่',
        }),
      });
    });
  });

  describe('handleSlotOccupation', () => {
    it('should transition slot from ASSIGNED to OCCUPIED', async () => {
      mockedFindSlotById.mockResolvedValue({
        slot_id: 'VIP-A1', status: 'ASSIGNED', slot_type: 'VIP', is_active: true,
        location_coordinates: '{}',
      } as any);
      mockedUpdateSlotStatus.mockResolvedValue({} as any);
      mockedCreateLog.mockResolvedValue({} as any);
      mockedFindActiveBySlot.mockResolvedValue({ session_id: 'sess-1' } as any);

      const result = await parkingService.handleSlotOccupation('VIP-A1');

      expect(mockedUpdateSlotStatus).toHaveBeenCalledWith('VIP-A1', 'OCCUPIED');
      expect(mockedCreateLog).toHaveBeenCalledWith('VIP-A1', 'ENTRY', 'IR_TRIGGERED');
    });

    it('should pass raw data to sensor log', async () => {
      mockedFindSlotById.mockResolvedValue({
        slot_id: 'GEN-A1', status: 'ASSIGNED', slot_type: 'GENERAL', is_active: true,
        location_coordinates: '{}',
      } as any);
      mockedUpdateSlotStatus.mockResolvedValue({} as any);
      mockedCreateLog.mockResolvedValue({} as any);
      mockedFindActiveBySlot.mockResolvedValue({ session_id: 'sess-2' } as any);

      await parkingService.handleSlotOccupation('GEN-A1', 'distance:5cm');

      expect(mockedCreateLog).toHaveBeenCalledWith('GEN-A1', 'ENTRY', 'distance:5cm');
    });

    it('should throw error if slot not found', async () => {
      mockedFindSlotById.mockResolvedValue(null);

      await expect(
        parkingService.handleSlotOccupation('NONEXISTENT')
      ).rejects.toThrow('Slot NONEXISTENT not found.');
    });

    it('should throw error if slot is not in ASSIGNED state', async () => {
      mockedFindSlotById.mockResolvedValue({
        slot_id: 'GEN-A1', status: 'FREE', slot_type: 'GENERAL', is_active: true,
        location_coordinates: '{}',
      } as any);

      await expect(
        parkingService.handleSlotOccupation('GEN-A1')
      ).rejects.toThrow('Slot GEN-A1 is not in ASSIGNED state (current: FREE).');
    });

    it('should throw error if slot is already OCCUPIED', async () => {
      mockedFindSlotById.mockResolvedValue({
        slot_id: 'GEN-A1', status: 'OCCUPIED', slot_type: 'GENERAL', is_active: true,
        location_coordinates: '{}',
      } as any);

      await expect(
        parkingService.handleSlotOccupation('GEN-A1')
      ).rejects.toThrow('Slot GEN-A1 is not in ASSIGNED state (current: OCCUPIED).');
    });
  });

  describe('handleSlotExit', () => {
    it('should calculate fee for guest (no vehicle_id) and close session', async () => {
      mockPrisma.$transaction.mockImplementation(async (cb: Function) => {
        const tx = {
          parkingSession: {
            findFirst: jest.fn().mockResolvedValue({
              session_id: 'sess-1',
              slot_id: 'GEN-A1',
              vehicle_id: null,
              entry_time: new Date('2026-03-30T10:00:00Z'),
            }),
            update: jest.fn().mockResolvedValue({}),
          },
          parkingSlot: {
            update: jest.fn().mockResolvedValue({}),
          },
          sensorLog: {
            create: jest.fn().mockResolvedValue({}),
          },
          registeredVehicle: {
            findUnique: jest.fn(),
          },
        };
        return cb(tx);
      });

      const result = await parkingService.handleSlotExit('GEN-A1');

      expect(result.sessionId).toBe('sess-1');
      expect(result.slotId).toBe('GEN-A1');
      expect(result.totalFee).toBeGreaterThanOrEqual(0);
    });

    it('should apply free hours for registered vehicle and pick highest', async () => {
      const entryTime = new Date('2026-03-30T10:00:00Z');

      mockPrisma.$transaction.mockImplementation(async (cb: Function) => {
        const tx = {
          parkingSession: {
            findFirst: jest.fn().mockResolvedValue({
              session_id: 'sess-2',
              slot_id: 'VIP-A1',
              vehicle_id: 'v-1',
              entry_time: entryTime,
            }),
            update: jest.fn().mockResolvedValue({}),
          },
          registeredVehicle: {
            findUnique: jest.fn().mockResolvedValue({
              vehicle_id: 'v-1',
              cards: [
                { is_active: true, program: { free_hours: 2, is_active: true } },
                { is_active: true, program: { free_hours: 5, is_active: true } }, // Highest
                { is_active: true, program: { free_hours: 1, is_active: true } },
              ],
            }),
          },
          parkingSlot: {
            update: jest.fn().mockResolvedValue({}),
          },
          sensorLog: {
            create: jest.fn().mockResolvedValue({}),
          },
        };
        return cb(tx);
      });

      const result = await parkingService.handleSlotExit('VIP-A1');

      // freeHours should have been 5 (highest)
      expect(result.freeHours).toBe(5);
    });

    it('should throw error if no active session found', async () => {
      mockPrisma.$transaction.mockImplementation(async (cb: Function) => {
        const tx = {
          parkingSession: {
            findFirst: jest.fn().mockResolvedValue(null),
          },
        };
        return cb(tx);
      });

      await expect(
        parkingService.handleSlotExit('GEN-Z9')
      ).rejects.toThrow('No active parking session found for slot GEN-Z9.');
    });

    it('should free the slot back to FREE status', async () => {
      const mockSlotUpdate = jest.fn().mockResolvedValue({});

      mockPrisma.$transaction.mockImplementation(async (cb: Function) => {
        const tx = {
          parkingSession: {
            findFirst: jest.fn().mockResolvedValue({
              session_id: 'sess-3',
              slot_id: 'GEN-B1',
              vehicle_id: null,
              entry_time: new Date('2026-03-30T10:00:00Z'),
            }),
            update: jest.fn().mockResolvedValue({}),
          },
          parkingSlot: {
            update: mockSlotUpdate,
          },
          sensorLog: {
            create: jest.fn().mockResolvedValue({}),
          },
        };
        return cb(tx);
      });

      await parkingService.handleSlotExit('GEN-B1');

      expect(mockSlotUpdate).toHaveBeenCalledWith({
        where: { slot_id: 'GEN-B1' },
        data: { status: 'FREE' },
      });
    });

    it('should set 0 free hours for guest vehicles', async () => {
      mockPrisma.$transaction.mockImplementation(async (cb: Function) => {
        const tx = {
          parkingSession: {
            findFirst: jest.fn().mockResolvedValue({
              session_id: 'sess-4',
              slot_id: 'GEN-A1',
              vehicle_id: null,
              entry_time: new Date('2026-03-30T10:00:00Z'),
            }),
            update: jest.fn().mockResolvedValue({}),
          },
          parkingSlot: {
            update: jest.fn().mockResolvedValue({}),
          },
          sensorLog: {
            create: jest.fn().mockResolvedValue({}),
          },
        };
        return cb(tx);
      });

      const result = await parkingService.handleSlotExit('GEN-A1');

      expect(result.freeHours).toBe(0);
    });

    it('should pass raw data to exit sensor log', async () => {
      const mockLogCreate = jest.fn().mockResolvedValue({});

      mockPrisma.$transaction.mockImplementation(async (cb: Function) => {
        const tx = {
          parkingSession: {
            findFirst: jest.fn().mockResolvedValue({
              session_id: 'sess-5',
              slot_id: 'GEN-A1',
              vehicle_id: null,
              entry_time: new Date('2026-03-30T10:00:00Z'),
            }),
            update: jest.fn().mockResolvedValue({}),
          },
          parkingSlot: {
            update: jest.fn().mockResolvedValue({}),
          },
          sensorLog: {
            create: mockLogCreate,
          },
        };
        return cb(tx);
      });

      await parkingService.handleSlotExit('GEN-A1', 'distance:>30cm');

      expect(mockLogCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          event_type: 'EXIT',
          raw_data: 'distance:>30cm',
        }),
      });
    });
  });

  describe('checkSession', () => {
    it('should return null when no active session found', async () => {
      mockedFindActiveByPlate.mockResolvedValue(null);

      const result = await parkingService.checkSession('9ZZ 0000', 'ชลบุรี');

      expect(result).toBeNull();
      expect(mockedFindActiveByPlate).toHaveBeenCalledWith('9ZZ 0000', 'ชลบุรี');
    });

    it('should return session details for a guest vehicle', async () => {
      const entryTime = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
      mockedFindActiveByPlate.mockResolvedValue({
        session_id: 'sess-1',
        slot_id: 'GEN-A1',
        registration: '2ขค 5678',
        province: 'เชียงใหม่',
        vehicle_id: null,
        vehicle: null,
        entry_time: entryTime,
        exit_time: null,
        duration_minutes: null,
        total_fee: null,
        payment_status: 'PENDING',
        slot: { slot_id: 'GEN-A1', slot_type: 'GENERAL', status: 'OCCUPIED', location_coordinates: '{}', is_active: true },
      } as any);

      const result = await parkingService.checkSession('2ขค 5678', 'เชียงใหม่');

      expect(result).not.toBeNull();
      expect(result!.is_registered).toBe(false);
      expect(result!.free_hours).toBe(0);
      expect(result!.slot.slot_type).toBe('GENERAL');
      expect(result!.estimated_fee).toBeGreaterThanOrEqual(0);
    });

    it('should return session details with free hours for a registered vehicle', async () => {
      const entryTime = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
      mockedFindActiveByPlate.mockResolvedValue({
        session_id: 'sess-2',
        slot_id: 'VIP-A1',
        registration: '1กข 1234',
        province: 'กรุงเทพมหานคร',
        vehicle_id: 'v-1',
        vehicle: {
          vehicle_id: 'v-1',
          cards: [
            { is_active: true, program: { free_hours: 5, is_active: true } },
            { is_active: true, program: { free_hours: 2, is_active: true } },
          ],
        },
        entry_time: entryTime,
        exit_time: null,
        duration_minutes: null,
        total_fee: null,
        payment_status: 'PENDING',
        slot: { slot_id: 'VIP-A1', slot_type: 'VIP', status: 'OCCUPIED', location_coordinates: '{}', is_active: true },
      } as any);

      const result = await parkingService.checkSession('1กข 1234', 'กรุงเทพมหานคร');

      expect(result).not.toBeNull();
      expect(result!.is_registered).toBe(true);
      expect(result!.free_hours).toBe(5); // Picks the highest
      expect(result!.slot.slot_type).toBe('VIP');
    });

    it('should pick highest free_hours among active cards', async () => {
      const entryTime = new Date(Date.now() - 30 * 60 * 1000); // 30 min ago
      mockedFindActiveByPlate.mockResolvedValue({
        session_id: 'sess-3',
        slot_id: 'VIP-B1',
        registration: '3คง 9999',
        province: 'นครราชสีมา',
        vehicle_id: 'v-2',
        vehicle: {
          vehicle_id: 'v-2',
          cards: [
            { is_active: true, program: { free_hours: 3, is_active: true } },
            { is_active: true, program: { free_hours: 0, is_active: false } },
          ],
        },
        entry_time: entryTime,
        exit_time: null,
        duration_minutes: null,
        total_fee: null,
        payment_status: 'PENDING',
        slot: { slot_id: 'VIP-B1', slot_type: 'VIP', status: 'OCCUPIED', location_coordinates: '{}', is_active: true },
      } as any);

      const result = await parkingService.checkSession('3คง 9999', 'นครราชสีมา');

      expect(result!.free_hours).toBe(3); // Inactive program ignored
    });
  });
});
