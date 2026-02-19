const mockPrisma = {
  parkingSession: {
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
};

jest.mock('../../../src/config/db', () => ({
  prisma: mockPrisma,
}));

import * as sessionRepo from '../../../src/repositories/sessionRepository';

describe('sessionRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createSession', () => {
    it('should create a session with all details', async () => {
      const mockSession = {
        session_id: 'sess-1',
        slot_id: 'A1',
        license_plate: 'ABC123',
        reservation_id: 'res-1',
        entry_time: new Date(),
        payment_status: 'PENDING',
      };
      mockPrisma.parkingSession.create.mockResolvedValue(mockSession);

      const result = await sessionRepo.createSession('A1', 'ABC123', 'res-1');

      expect(result).toEqual(mockSession);
      expect(mockPrisma.parkingSession.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          slot_id: 'A1',
          license_plate: 'ABC123',
          reservation_id: 'res-1',
          payment_status: 'PENDING',
        }),
      });
    });

    it('should use "UNKNOWN" for missing license plate', async () => {
      mockPrisma.parkingSession.create.mockResolvedValue({});

      await sessionRepo.createSession('A1');

      expect(mockPrisma.parkingSession.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          license_plate: 'UNKNOWN',
        }),
      });
    });

    it('should set reservationId to undefined when not provided', async () => {
      mockPrisma.parkingSession.create.mockResolvedValue({});

      await sessionRepo.createSession('A1', 'ABC123');

      expect(mockPrisma.parkingSession.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          reservation_id: undefined,
        }),
      });
    });
  });

  describe('findActiveSessionBySlot', () => {
    it('should find active session for a slot', async () => {
      const mockSession = { session_id: 'sess-1', slot_id: 'A1', exit_time: null };
      mockPrisma.parkingSession.findFirst.mockResolvedValue(mockSession);

      const result = await sessionRepo.findActiveSessionBySlot('A1');

      expect(result).toEqual(mockSession);
      expect(mockPrisma.parkingSession.findFirst).toHaveBeenCalledWith({
        where: { slot_id: 'A1', exit_time: null },
      });
    });

    it('should return null when no active session exists', async () => {
      mockPrisma.parkingSession.findFirst.mockResolvedValue(null);

      const result = await sessionRepo.findActiveSessionBySlot('A1');

      expect(result).toBeNull();
    });
  });

  describe('updateSessionExit', () => {
    it('should update session with exit details', async () => {
      const exitTime = new Date('2026-02-19T14:00:00Z');
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

  describe('findActiveSessionByLicensePlate', () => {
    it('should find active session by license plate', async () => {
      const mockSession = {
        session_id: 'sess-1',
        license_plate: 'ABC123',
        exit_time: null,
      };
      mockPrisma.parkingSession.findFirst.mockResolvedValue(mockSession);

      const result = await sessionRepo.findActiveSessionByLicensePlate('ABC123');

      expect(result).toEqual(mockSession);
      expect(mockPrisma.parkingSession.findFirst).toHaveBeenCalledWith({
        where: { license_plate: 'ABC123', exit_time: null },
      });
    });

    it('should return null when no active session for plate', async () => {
      mockPrisma.parkingSession.findFirst.mockResolvedValue(null);

      const result = await sessionRepo.findActiveSessionByLicensePlate('XYZ999');

      expect(result).toBeNull();
    });
  });
});
