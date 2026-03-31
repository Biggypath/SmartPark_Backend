const mockPrisma = {
  parkingSession: {
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
};

jest.mock('../../../src/config/db.js', () => ({
  prisma: mockPrisma,
}));

import * as sessionRepo from '../../../src/repositories/sessionRepository.js';

describe('sessionRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createSession', () => {
    it('should create a session for a registered vehicle', async () => {
      const mockSession = {
        session_id: 'sess-1',
        slot_id: 'VIP-A1',
        registration: '1กข 1234',
        province: 'กรุงเทพมหานคร',
        vehicle_id: 'v-1',
        entry_time: new Date(),
        payment_status: 'PENDING',
      };
      mockPrisma.parkingSession.create.mockResolvedValue(mockSession);

      const result = await sessionRepo.createSession({
        slotId: 'VIP-A1',
        registration: '1กข 1234',
        province: 'กรุงเทพมหานคร',
        vehicleId: 'v-1',
      });

      expect(result).toEqual(mockSession);
      expect(mockPrisma.parkingSession.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          slot_id: 'VIP-A1',
          registration: '1กข 1234',
          province: 'กรุงเทพมหานคร',
          vehicle_id: 'v-1',
          payment_status: 'PENDING',
        }),
      });
    });

    it('should create a session for a guest (no vehicle_id)', async () => {
      mockPrisma.parkingSession.create.mockResolvedValue({});

      await sessionRepo.createSession({
        slotId: 'GEN-A1',
        registration: '2ขค 5678',
        province: 'เชียงใหม่',
      });

      expect(mockPrisma.parkingSession.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          slot_id: 'GEN-A1',
          registration: '2ขค 5678',
          province: 'เชียงใหม่',
          vehicle_id: null,
        }),
      });
    });

    it('should set null for missing registration and province', async () => {
      mockPrisma.parkingSession.create.mockResolvedValue({});

      await sessionRepo.createSession({ slotId: 'GEN-A1' });

      expect(mockPrisma.parkingSession.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          registration: null,
          province: null,
          vehicle_id: null,
        }),
      });
    });
  });

  describe('findActiveSessionBySlot', () => {
    it('should find active session for a slot', async () => {
      const mockSession = { session_id: 'sess-1', slot_id: 'VIP-A1', exit_time: null };
      mockPrisma.parkingSession.findFirst.mockResolvedValue(mockSession);

      const result = await sessionRepo.findActiveSessionBySlot('VIP-A1');

      expect(result).toEqual(mockSession);
      expect(mockPrisma.parkingSession.findFirst).toHaveBeenCalledWith({
        where: { slot_id: 'VIP-A1', exit_time: null },
      });
    });

    it('should return null when no active session exists', async () => {
      mockPrisma.parkingSession.findFirst.mockResolvedValue(null);

      const result = await sessionRepo.findActiveSessionBySlot('GEN-A1');

      expect(result).toBeNull();
    });
  });

  describe('updateSessionExit', () => {
    it('should update session with exit details', async () => {
      const exitTime = new Date('2026-03-30T14:00:00Z');
      const mockUpdated = {
        session_id: 'sess-1',
        exit_time: exitTime,
        total_fee: 60,
        duration_minutes: 180,
        payment_status: 'PAID',
      };
      mockPrisma.parkingSession.update.mockResolvedValue(mockUpdated);

      const result = await sessionRepo.updateSessionExit('sess-1', exitTime, 60, 180);

      expect(result).toEqual(mockUpdated);
      expect(mockPrisma.parkingSession.update).toHaveBeenCalledWith({
        where: { session_id: 'sess-1' },
        data: {
          exit_time: exitTime,
          total_fee: 60,
          duration_minutes: 180,
          payment_status: 'PAID',
        },
      });
    });
  });
});
