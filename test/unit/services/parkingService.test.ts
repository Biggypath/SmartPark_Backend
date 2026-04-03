const mockPrisma = {
  $transaction: jest.fn(),
};

jest.mock('../../../src/config/db.js', () => ({
  prisma: mockPrisma,
}));

jest.mock('../../../src/repositories/slotRepository.js', () => ({
  getAllSlots: jest.fn(),
  getAllLots: jest.fn(),
  getSlotsByLotId: jest.fn(),
  findSlotById: jest.fn(),
  updateSlotStatus: jest.fn(),
}));

jest.mock('../../../src/repositories/sessionRepository.js', () => ({
  createSession: jest.fn(),
  findActiveSessionBySlot: jest.fn(),
  findActiveSessionByPlate: jest.fn(),
  findSessionsByUserId: jest.fn(),
  updateSessionExit: jest.fn(),
}));

jest.mock('../../../src/repositories/logRepository.js', () => ({}));

import * as parkingService from '../../../src/services/parkingService.js';
import * as slotRepo from '../../../src/repositories/slotRepository.js';
import * as sessionRepo from '../../../src/repositories/sessionRepository.js';

const mockedGetAllSlots = slotRepo.getAllSlots as jest.MockedFunction<typeof slotRepo.getAllSlots>;
const mockedGetAllLots = slotRepo.getAllLots as jest.MockedFunction<typeof slotRepo.getAllLots>;
const mockedGetSlotsByLotId = slotRepo.getSlotsByLotId as jest.MockedFunction<typeof slotRepo.getSlotsByLotId>;
const mockedFindSlotById = slotRepo.findSlotById as jest.MockedFunction<typeof slotRepo.findSlotById>;
const mockedUpdateSlotStatus = slotRepo.updateSlotStatus as jest.MockedFunction<typeof slotRepo.updateSlotStatus>;
const mockedFindActiveBySlot = sessionRepo.findActiveSessionBySlot as jest.MockedFunction<typeof sessionRepo.findActiveSessionBySlot>;
const mockedFindActiveByPlate = sessionRepo.findActiveSessionByPlate as jest.MockedFunction<typeof sessionRepo.findActiveSessionByPlate>;
const mockedFindSessionsByUserId = sessionRepo.findSessionsByUserId as jest.MockedFunction<typeof sessionRepo.findSessionsByUserId>;

describe('parkingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboardData', () => {
    it('should return all slots from repository', async () => {
      const mockSlots = [
        { slot_id: 'A1', status: 'FREE' },
        { slot_id: 'A2', status: 'OCCUPIED' },
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

  describe('getLots', () => {
    it('should return all lots from repository', async () => {
      const mockLots = [{ lot_id: 'lot-1', name: 'CentralWorld SCB' }];
      mockedGetAllLots.mockResolvedValue(mockLots as any);

      const result = await parkingService.getLots();

      expect(result).toEqual(mockLots);
      expect(mockedGetAllLots).toHaveBeenCalledTimes(1);
    });
  });

  describe('getDashboardByLot', () => {
    it('should return slots for a specific lot', async () => {
      const mockSlots = [{ slot_id: 'A1', lot_id: 'lot-1', status: 'FREE' }];
      mockedGetSlotsByLotId.mockResolvedValue(mockSlots as any);

      const result = await parkingService.getDashboardByLot('lot-1');

      expect(result).toEqual(mockSlots);
      expect(mockedGetSlotsByLotId).toHaveBeenCalledWith('lot-1');
    });
  });

  describe('handleOcrEntry', () => {
    it('should assign a free slot to registered vehicle with active card', async () => {
      const mockSlot = { slot_id: 'A1', status: 'FREE', is_active: true };
      const mockSession = { session_id: 'sess-1', slot_id: 'A1' };

      mockPrisma.$transaction.mockImplementation(async (cb: Function) => {
        const tx = {
          registeredVehicle: {
            findUnique: jest.fn().mockResolvedValue({
              vehicle_id: 'v-1',
              cards: [{ is_active: true, program: {} }],
            }),
          },
          parkingSlot: {
            findFirst: jest.fn().mockResolvedValue(mockSlot),
            update: jest.fn().mockResolvedValue({ ...mockSlot, status: 'OCCUPIED' }),
          },
          parkingSession: {
            create: jest.fn().mockResolvedValue(mockSession),
          },
          sensorLog: {
            create: jest.fn().mockResolvedValue({}),
          },
        };
        return cb(tx);
      });

      const result = await parkingService.handleOcrEntry('1กข 1234', 'กรุงเทพมหานคร', 'lot-1');

      expect(result.session).toEqual(mockSession);
      expect(result.slot).toEqual(mockSlot);
    });

    it('should assign a free slot when no specific type preference', async () => {
      const mockSlot = { slot_id: 'A1', status: 'FREE', is_active: true };
      const mockSession = { session_id: 'sess-2', slot_id: 'A1' };

      mockPrisma.$transaction.mockImplementation(async (cb: Function) => {
        const tx = {
          registeredVehicle: {
            findUnique: jest.fn().mockResolvedValue({
              vehicle_id: 'v-1',
              cards: [{ is_active: true, program: {} }],
            }),
          },
          parkingSlot: {
            findFirst: jest.fn()
              .mockResolvedValueOnce(mockSlot),
            update: jest.fn().mockResolvedValue({}),
          },
          parkingSession: {
            create: jest.fn().mockResolvedValue(mockSession),
          },
          sensorLog: {
            create: jest.fn().mockResolvedValue({}),
          },
        };
        return cb(tx);
      });

      const result = await parkingService.handleOcrEntry('1กข 1234', 'กรุงเทพมหานคร', 'lot-1');

      expect(result.session).toEqual(mockSession);
      expect(result.slot).toEqual(mockSlot);
    });

    it('should not assign a slot to guest (unregistered vehicle)', async () => {
      const mockSession = { session_id: 'sess-3', slot_id: null };

      mockPrisma.$transaction.mockImplementation(async (cb: Function) => {
        const tx = {
          registeredVehicle: {
            findUnique: jest.fn().mockResolvedValue(null), // Not registered
          },
          parkingSession: {
            create: jest.fn().mockResolvedValue(mockSession),
          },
        };
        return cb(tx);
      });

      const result = await parkingService.handleOcrEntry('2ขค 5678', 'เชียงใหม่', 'lot-1');

      expect(result.session).toEqual(mockSession);
      expect(result.slot).toBeNull();
    });

    it('should not assign a slot to vehicle with no active cards', async () => {
      const mockSession = { session_id: 'sess-4', slot_id: null };

      mockPrisma.$transaction.mockImplementation(async (cb: Function) => {
        const tx = {
          registeredVehicle: {
            findUnique: jest.fn().mockResolvedValue({
              vehicle_id: 'v-2',
              cards: [], // No active cards
            }),
          },
          parkingSession: {
            create: jest.fn().mockResolvedValue(mockSession),
          },
        };
        return cb(tx);
      });

      const result = await parkingService.handleOcrEntry('3คง 9999', 'ชลบุรี', 'lot-1');

      expect(result.slot).toBeNull();
    });

    it('should throw error when no slots are available for registered vehicle', async () => {
      mockPrisma.$transaction.mockImplementation(async (cb: Function) => {
        const tx = {
          registeredVehicle: {
            findUnique: jest.fn().mockResolvedValue({
              vehicle_id: 'v-1',
              cards: [{ is_active: true, program: {} }],
            }),
          },
          parkingSlot: {
            findFirst: jest.fn().mockResolvedValue(null),
          },
        };
        return cb(tx);
      });

      await expect(
        parkingService.handleOcrEntry('9ZZ 9999', 'นครราชสีมา', 'lot-1')
      ).rejects.toThrow('No available parking slots.');
    });

    it('should set slot status to OCCUPIED for registered vehicle', async () => {
      const mockUpdate = jest.fn().mockResolvedValue({});
      const mockSlot = { slot_id: 'A1', status: 'FREE', is_active: true };

      mockPrisma.$transaction.mockImplementation(async (cb: Function) => {
        const tx = {
          registeredVehicle: {
            findUnique: jest.fn().mockResolvedValue({
              vehicle_id: 'v-1',
              cards: [{ is_active: true, program: {} }],
            }),
          },
          parkingSlot: {
            findFirst: jest.fn().mockResolvedValue(mockSlot),
            update: mockUpdate,
          },
          parkingSession: {
            create: jest.fn().mockResolvedValue({ session_id: 'sess-5' }),
          },
          sensorLog: {
            create: jest.fn().mockResolvedValue({}),
          },
        };
        return cb(tx);
      });

      await parkingService.handleOcrEntry('1AB 1111', 'กรุงเทพมหานคร', 'lot-1');

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { slot_id: 'A1' },
        data: { status: 'OCCUPIED' },
      });
    });

    it('should create session with vehicle_id for registered vehicle', async () => {
      const mockCreate = jest.fn().mockResolvedValue({ session_id: 'sess-6' });

      mockPrisma.$transaction.mockImplementation(async (cb: Function) => {
        const tx = {
          registeredVehicle: {
            findUnique: jest.fn().mockResolvedValue({
              vehicle_id: 'v-10',
              cards: [{ is_active: true, program: {} }],
            }),
          },
          parkingSlot: {
            findFirst: jest.fn().mockResolvedValue({ slot_id: 'A1' }),
            update: jest.fn().mockResolvedValue({}),
          },
          parkingSession: { create: mockCreate },
          sensorLog: {
            create: jest.fn().mockResolvedValue({}),
          },
        };
        return cb(tx);
      });

      await parkingService.handleOcrEntry('1กข 1234', 'กรุงเทพมหานคร', 'lot-1');

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          vehicle_id: 'v-10',
          registration: '1กข 1234',
          province: 'กรุงเทพมหานคร',
        }),
      });
    });

    it('should create session with null slot_id and vehicle_id for guest', async () => {
      const mockCreate = jest.fn().mockResolvedValue({ session_id: 'sess-7' });

      mockPrisma.$transaction.mockImplementation(async (cb: Function) => {
        const tx = {
          registeredVehicle: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
          parkingSession: { create: mockCreate },
        };
        return cb(tx);
      });

      await parkingService.handleOcrEntry('2ขค 5678', 'เชียงใหม่', 'lot-1');

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          slot_id: null,
          vehicle_id: null,
          registration: '2ขค 5678',
          province: 'เชียงใหม่',
        }),
      });
    });
  });

  describe('handleOcrExit', () => {
    it('should calculate fee and close session by license plate', async () => {
      mockPrisma.$transaction.mockImplementation(async (cb: Function) => {
        const tx = {
          parkingSession: {
            findFirst: jest.fn().mockResolvedValue({
              session_id: 'sess-1',
              slot_id: 'GEN-A1',
              slot: { lot_id: 'lot-1' },
              vehicle_id: null,
              registration: '2ขค 5678',
              province: 'เชียงใหม่',
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

      const result = await parkingService.handleOcrExit('2ขค 5678', 'เชียงใหม่', 'lot-1');

      expect(result.sessionId).toBe('sess-1');
      expect(result.slotId).toBe('GEN-A1');
      expect(result.totalFee).toBeGreaterThanOrEqual(0);
    });

    it('should apply correct fee for registered vehicle', async () => {
      const entryTime = new Date('2026-03-30T10:00:00Z');

      mockPrisma.$transaction.mockImplementation(async (cb: Function) => {
        const tx = {
          parkingSession: {
            findFirst: jest.fn().mockResolvedValue({
              session_id: 'sess-2',
              slot_id: 'VIP-A1',
              slot: { lot_id: 'lot-1' },
              vehicle_id: 'v-1',
              registration: '1กข 1234',
              province: 'กรุงเทพมหานคร',
              entry_time: entryTime,
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

      const result = await parkingService.handleOcrExit('1กข 1234', 'กรุงเทพมหานคร', 'lot-1');

      expect(result.totalFee).toBeGreaterThanOrEqual(0);
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
        parkingService.handleOcrExit('9ZZ 0000', 'ชลบุรี', 'lot-1')
      ).rejects.toThrow('No active parking session found for 9ZZ 0000 (ชลบุรี).');
    });

    it('should free the slot back to FREE status', async () => {
      const mockSlotUpdate = jest.fn().mockResolvedValue({});

      mockPrisma.$transaction.mockImplementation(async (cb: Function) => {
        const tx = {
          parkingSession: {
            findFirst: jest.fn().mockResolvedValue({
              session_id: 'sess-3',
              slot_id: 'GEN-B1',
              slot: { lot_id: 'lot-1' },
              vehicle_id: null,
              registration: '3คง 9999',
              province: 'ชลบุรี',
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

      await parkingService.handleOcrExit('3คง 9999', 'ชลบุรี', 'lot-1');

      expect(mockSlotUpdate).toHaveBeenCalledWith({
        where: { slot_id: 'GEN-B1' },
        data: { status: 'FREE' },
      });
    });

    it('should log OCR exit event in sensor log', async () => {
      const mockLogCreate = jest.fn().mockResolvedValue({});

      mockPrisma.$transaction.mockImplementation(async (cb: Function) => {
        const tx = {
          parkingSession: {
            findFirst: jest.fn().mockResolvedValue({
              session_id: 'sess-5',
              slot_id: 'GEN-A1',
              slot: { lot_id: 'lot-1' },
              vehicle_id: null,
              registration: '2ขค 5678',
              province: 'เชียงใหม่',
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

      await parkingService.handleOcrExit('2ขค 5678', 'เชียงใหม่', 'lot-1');

      expect(mockLogCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          event_type: 'EXIT',
          raw_data: 'OCR_EXIT: 2ขค 5678 เชียงใหม่',
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

    it('should return session details for a guest vehicle (no slot)', async () => {
      const entryTime = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
      mockedFindActiveByPlate.mockResolvedValue({
        session_id: 'sess-1',
        slot_id: null,
        registration: '2ขค 5678',
        province: 'เชียงใหม่',
        vehicle_id: null,
        vehicle: null,
        entry_time: entryTime,
        exit_time: null,
        duration_minutes: null,
        total_fee: null,
        payment_status: 'PENDING',
        slot: null,
      } as any);

      const result = await parkingService.checkSession('2ขค 5678', 'เชียงใหม่');

      expect(result).not.toBeNull();
      expect(result!.is_registered).toBe(false);
      expect(result!.slot).toBeNull();
      expect(result!.estimated_fee).toBeGreaterThanOrEqual(0);
    });

    it('should return session details for a registered vehicle', async () => {
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
            { is_active: true, program: { is_active: true } },
          ],
        },
        entry_time: entryTime,
        exit_time: null,
        duration_minutes: null,
        total_fee: null,
        payment_status: 'PENDING',
        slot: { slot_id: 'A1', status: 'OCCUPIED', location_coordinates: '{}', is_active: true },
      } as any);

      const result = await parkingService.checkSession('1กข 1234', 'กรุงเทพมหานคร');

      expect(result).not.toBeNull();
      expect(result!.is_registered).toBe(true);
    });
  });

  describe('getParkingHistory', () => {
    it('should return mapped parking history', async () => {
      mockedFindSessionsByUserId.mockResolvedValue([
        {
          session_id: 's1',
          slot_id: 'A1',
          registration: '1กข 1234',
          province: 'กรุงเทพมหานคร',
          entry_time: new Date('2026-04-01T10:00:00Z'),
          exit_time: new Date('2026-04-01T12:00:00Z'),
          duration_minutes: 120,
          total_fee: 40,
          payment_status: 'COMPLETED',
          vehicle_id: 'v1',
          slot: {
            slot_id: 'A1',
            lot: { lot_id: 'lot1', name: 'Central SCB', location: '123 Road' },
          },
        },
      ] as any);

      const result = await parkingService.getParkingHistory('u1');

      expect(mockedFindSessionsByUserId).toHaveBeenCalledWith('u1');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        session_id: 's1',
        location: 'Central SCB',
        address: '123 Road',
        slot_id: 'A1',
        registration: '1กข 1234',
        province: 'กรุงเทพมหานคร',
        entry_time: new Date('2026-04-01T10:00:00Z'),
        exit_time: new Date('2026-04-01T12:00:00Z'),
        duration_minutes: 120,
        total_fee: 40,
        payment_status: 'COMPLETED',
      });
    });

    it('should return empty array when no sessions', async () => {
      mockedFindSessionsByUserId.mockResolvedValue([]);

      const result = await parkingService.getParkingHistory('u2');

      expect(result).toEqual([]);
    });
  });
});
