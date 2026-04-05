const mockTx = {
  privilegeParking: {
    create: jest.fn(),
  },
};

const mockPrisma = {
  $transaction: jest.fn((fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx)),
  parkingSession: {
    findMany: jest.fn(),
  },
  sensorLog: {
    findMany: jest.fn(),
  },
};

jest.mock('../../../src/config/db.js', () => ({
  prisma: mockPrisma,
}));

import * as adminRepo from '../../../src/repositories/adminRepository.js';

describe('adminRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createLotWithSlots', () => {
    it('should create lot with slots and pricing rule in a transaction', async () => {
      const input = {
        name: 'Test Lot',
        mall_id: 'mall-1',
        program_id: 'prog-1',
        location: 'Bangkok',
        rate_per_hour: 25,
        slots: [
          { slot_id: 'A1', location_coordinates: '{"x":0}', rotation: 0 },
          { slot_id: 'A2', location_coordinates: '{"x":10}', rotation: 90 },
        ],
      };
      const mockResult = { lot_id: 'lot-1', name: 'Test Lot' };
      mockTx.privilegeParking.create.mockResolvedValue(mockResult);

      const result = await adminRepo.createLotWithSlots(input);

      expect(result).toEqual(mockResult);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockTx.privilegeParking.create).toHaveBeenCalledWith({
        data: {
          name: 'Test Lot',
          mall_id: 'mall-1',
          program_id: 'prog-1',
          location: 'Bangkok',
          pricingRule: { create: { rate_per_hour: 25 } },
          slots: {
            create: [
              { slot_id: 'A1', location_coordinates: '{"x":0}', rotation: 0 },
              { slot_id: 'A2', location_coordinates: '{"x":10}', rotation: 90 },
            ],
          },
        },
        include: {
          slots: true,
          pricingRule: true,
          mall: true,
          program: true,
        },
      });
    });

    it('should use default rate_per_hour when not provided', async () => {
      const input = {
        name: 'Lot',
        mall_id: 'mall-1',
        program_id: 'prog-1',
        slots: [{ slot_id: 'B1', location_coordinates: '{}', rotation: 0 }],
      };
      mockTx.privilegeParking.create.mockResolvedValue({});

      await adminRepo.createLotWithSlots(input);

      expect(mockTx.privilegeParking.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            pricingRule: { create: { rate_per_hour: 20.0 } },
          }),
        })
      );
    });
  });

  describe('getAllSessions', () => {
    it('should return all sessions with no filters', async () => {
      const mockSessions = [{ session_id: 'sess-1' }, { session_id: 'sess-2' }];
      mockPrisma.parkingSession.findMany.mockResolvedValue(mockSessions);

      const result = await adminRepo.getAllSessions();

      expect(result).toEqual(mockSessions);
      expect(mockPrisma.parkingSession.findMany).toHaveBeenCalledWith({
        where: {},
        include: expect.objectContaining({ slot: true, vehicle: expect.any(Object) }),
        orderBy: { entry_time: 'desc' },
      });
    });

    it('should filter active sessions', async () => {
      mockPrisma.parkingSession.findMany.mockResolvedValue([]);

      await adminRepo.getAllSessions({ status: 'active' });

      expect(mockPrisma.parkingSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { exit_time: null },
        })
      );
    });

    it('should filter completed sessions', async () => {
      mockPrisma.parkingSession.findMany.mockResolvedValue([]);

      await adminRepo.getAllSessions({ status: 'completed' });

      expect(mockPrisma.parkingSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { exit_time: { not: null } },
        })
      );
    });

    it('should filter by registration', async () => {
      mockPrisma.parkingSession.findMany.mockResolvedValue([]);

      await adminRepo.getAllSessions({ registration: '1กข' });

      expect(mockPrisma.parkingSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { registration: { contains: '1กข', mode: 'insensitive' } },
        })
      );
    });

    it('should combine multiple filters', async () => {
      mockPrisma.parkingSession.findMany.mockResolvedValue([]);

      await adminRepo.getAllSessions({ status: 'active', registration: '1กข' });

      expect(mockPrisma.parkingSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            exit_time: null,
            registration: { contains: '1กข', mode: 'insensitive' },
          },
        })
      );
    });
  });

  describe('getAllSensorLogs', () => {
    it('should return all sensor logs with no filters', async () => {
      const mockLogs = [{ log_id: 'log-1' }];
      mockPrisma.sensorLog.findMany.mockResolvedValue(mockLogs);

      const result = await adminRepo.getAllSensorLogs();

      expect(result).toEqual(mockLogs);
      expect(mockPrisma.sensorLog.findMany).toHaveBeenCalledWith({
        where: {},
        include: { slot: true },
        orderBy: { timestamp: 'desc' },
      });
    });

    it('should filter by slot_id', async () => {
      mockPrisma.sensorLog.findMany.mockResolvedValue([]);

      await adminRepo.getAllSensorLogs({ slot_id: 'VIP-A1' });

      expect(mockPrisma.sensorLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { slot_id: 'VIP-A1' },
        })
      );
    });

    it('should filter by event_type', async () => {
      mockPrisma.sensorLog.findMany.mockResolvedValue([]);

      await adminRepo.getAllSensorLogs({ event_type: 'ENTRY' });

      expect(mockPrisma.sensorLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { event_type: 'ENTRY' },
        })
      );
    });

    it('should combine slot_id and event_type filters', async () => {
      mockPrisma.sensorLog.findMany.mockResolvedValue([]);

      await adminRepo.getAllSensorLogs({ slot_id: 'VIP-A1', event_type: 'EXIT' });

      expect(mockPrisma.sensorLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { slot_id: 'VIP-A1', event_type: 'EXIT' },
        })
      );
    });
  });
});
