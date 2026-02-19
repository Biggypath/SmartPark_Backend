const mockPrisma = {
  parkingSlot: {
    update: jest.fn(),
  },
  $transaction: jest.fn(),
};

jest.mock('../../../src/config/db', () => ({
  prisma: mockPrisma,
}));

jest.mock('../../../src/repositories/slotRepository', () => ({
  getAllSlots: jest.fn(),
  findSlotById: jest.fn(),
  updateSlotStatus: jest.fn(),
}));

jest.mock('../../../src/repositories/sessionRepository', () => ({
  createSession: jest.fn(),
  findActiveSessionBySlot: jest.fn(),
  findActiveSessionByLicensePlate: jest.fn(),
  updateSessionExit: jest.fn(),
}));

jest.mock('../../../src/services/pricingService', () => ({
  calculateExitFee: jest.fn(),
}));

import * as parkingService from '../../../src/services/parkingService';
import * as slotRepo from '../../../src/repositories/slotRepository';
import * as SessionRepo from '../../../src/repositories/sessionRepository';
import { calculateExitFee } from '../../../src/services/pricingService';

const mockedGetAllSlots = slotRepo.getAllSlots as jest.MockedFunction<typeof slotRepo.getAllSlots>;
const mockedFindActiveSession = SessionRepo.findActiveSessionByLicensePlate as jest.MockedFunction<typeof SessionRepo.findActiveSessionByLicensePlate>;
const mockedCalcFee = calculateExitFee as jest.MockedFunction<typeof calculateExitFee>;

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

  describe('reserveParkingSlot', () => {
    it('should reserve a free slot via transaction', async () => {
      const mockReservation = {
        reservation_id: 'res-1',
        slot_id: 'A1',
        license_plate: 'ABC123',
        status: 'ACTIVE',
      };

      mockPrisma.$transaction.mockImplementation(async (cb: Function) => {
        const tx = {
          parkingSlot: {
            findUnique: jest.fn().mockResolvedValue({ slot_id: 'A1', status: 'FREE' }),
            update: jest.fn().mockResolvedValue({}),
          },
          reservation: {
            create: jest.fn().mockResolvedValue(mockReservation),
          },
        };
        return cb(tx);
      });

      const result = await parkingService.reserveParkingSlot('A1', 'ABC123');

      expect(result).toEqual(mockReservation);
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it('should update slot status to RESERVED in transaction', async () => {
      const mockTx = {
        parkingSlot: {
          findUnique: jest.fn().mockResolvedValue({ slot_id: 'A1', status: 'FREE' }),
          update: jest.fn().mockResolvedValue({}),
        },
        reservation: {
          create: jest.fn().mockResolvedValue({}),
        },
      };

      mockPrisma.$transaction.mockImplementation(async (cb: Function) => cb(mockTx));

      await parkingService.reserveParkingSlot('A1', 'ABC123');

      expect(mockTx.parkingSlot.update).toHaveBeenCalledWith({
        where: { slot_id: 'A1' },
        data: { status: 'RESERVED' },
      });
    });

    it('should create reservation with correct data', async () => {
      const mockTx = {
        parkingSlot: {
          findUnique: jest.fn().mockResolvedValue({ slot_id: 'B2', status: 'FREE' }),
          update: jest.fn().mockResolvedValue({}),
        },
        reservation: {
          create: jest.fn().mockResolvedValue({}),
        },
      };

      mockPrisma.$transaction.mockImplementation(async (cb: Function) => cb(mockTx));

      await parkingService.reserveParkingSlot('B2', 'XYZ789');

      expect(mockTx.reservation.create).toHaveBeenCalledWith({
        data: {
          slot_id: 'B2',
          license_plate: 'XYZ789',
          status: 'ACTIVE',
        },
      });
    });

    it('should throw error if slot is OCCUPIED', async () => {
      mockPrisma.$transaction.mockImplementation(async (cb: Function) => {
        const tx = {
          parkingSlot: {
            findUnique: jest.fn().mockResolvedValue({ slot_id: 'A1', status: 'OCCUPIED' }),
          },
        };
        return cb(tx);
      });

      await expect(
        parkingService.reserveParkingSlot('A1', 'ABC123')
      ).rejects.toThrow('Slot is already taken or invalid.');
    });

    it('should throw error if slot is RESERVED', async () => {
      mockPrisma.$transaction.mockImplementation(async (cb: Function) => {
        const tx = {
          parkingSlot: {
            findUnique: jest.fn().mockResolvedValue({ slot_id: 'A1', status: 'RESERVED' }),
          },
        };
        return cb(tx);
      });

      await expect(
        parkingService.reserveParkingSlot('A1', 'ABC123')
      ).rejects.toThrow('Slot is already taken or invalid.');
    });

    it('should throw error if slot does not exist', async () => {
      mockPrisma.$transaction.mockImplementation(async (cb: Function) => {
        const tx = {
          parkingSlot: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
        };
        return cb(tx);
      });

      await expect(
        parkingService.reserveParkingSlot('Z99', 'ABC123')
      ).rejects.toThrow('Slot is already taken or invalid.');
    });
  });

  describe('processEntryEvent', () => {
    it('should update slot status to OCCUPIED', async () => {
      mockPrisma.parkingSlot.update.mockResolvedValue({});

      await parkingService.processEntryEvent('A1');

      expect(mockPrisma.parkingSlot.update).toHaveBeenCalledWith({
        where: { slot_id: 'A1' },
        data: { status: 'OCCUPIED' },
      });
    });

    it('should be called with the correct slot ID', async () => {
      mockPrisma.parkingSlot.update.mockResolvedValue({});

      await parkingService.processEntryEvent('C3');

      expect(mockPrisma.parkingSlot.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { slot_id: 'C3' } })
      );
    });
  });

  describe('getParkingDetails', () => {
    it('should return parking details for active session', async () => {
      const entryTime = new Date('2026-02-19T10:00:00Z');
      const exitTime = new Date('2026-02-19T12:00:00Z');

      const mockSession = {
        session_id: 'sess-1',
        slot_id: 'A1',
        license_plate: 'ABC123',
        entry_time: entryTime,
      };
      const mockFee = {
        durationMinutes: 120,
        fee: 40,
        exitTime: exitTime,
      };

      mockedFindActiveSession.mockResolvedValue(mockSession as any);
      mockedCalcFee.mockResolvedValue(mockFee);

      const result = await parkingService.getParkingDetails('ABC123');

      expect(result).toEqual({
        sessionId: 'sess-1',
        slotId: 'A1',
        licensePlate: 'ABC123',
        entryTime: entryTime,
        currentTime: exitTime,
        totalFee: 40,
      });
    });

    it('should call calculateExitFee with session id', async () => {
      mockedFindActiveSession.mockResolvedValue({
        session_id: 'sess-5',
        slot_id: 'A1',
        license_plate: 'DEF456',
        entry_time: new Date(),
      } as any);
      mockedCalcFee.mockResolvedValue({
        durationMinutes: 60,
        fee: 20,
        exitTime: new Date(),
      });

      await parkingService.getParkingDetails('DEF456');

      expect(mockedCalcFee).toHaveBeenCalledWith('sess-5');
    });

    it('should return totalFee as 0 when fee is falsy', async () => {
      mockedFindActiveSession.mockResolvedValue({
        session_id: 'sess-1',
        slot_id: 'A1',
        license_plate: 'ABC123',
        entry_time: new Date(),
      } as any);
      mockedCalcFee.mockResolvedValue({
        durationMinutes: 0,
        fee: 0,
        exitTime: new Date(),
      });

      const result = await parkingService.getParkingDetails('ABC123');

      expect(result.totalFee).toBe(0);
    });

    it('should throw error if no active session found', async () => {
      mockedFindActiveSession.mockResolvedValue(null);

      await expect(
        parkingService.getParkingDetails('XYZ000')
      ).rejects.toThrow('No active parking session found for this license plate.');
    });
  });
});
