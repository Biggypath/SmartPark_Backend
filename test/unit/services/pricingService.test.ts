const mockPrisma = {
  parkingSession: {
    findUnique: jest.fn(),
  },
  pricingRule: {
    findFirst: jest.fn(),
  },
};

jest.mock('../../../src/config/db', () => ({
  prisma: mockPrisma,
}));

import { calculateExitFee } from '../../../src/services/pricingService';

describe('pricingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe('calculateExitFee', () => {
    it('should calculate fee with custom rate', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-02-19T12:30:00Z'));

      mockPrisma.parkingSession.findUnique.mockResolvedValue({
        session_id: 'sess-1',
        entry_time: new Date('2026-02-19T10:00:00Z'),
      });
      mockPrisma.pricingRule.findFirst.mockResolvedValue({
        rate_per_hour: 25.0,
      });

      const result = await calculateExitFee('sess-1');

      // Duration: 2h 30m → ceil to 3 hours → 3 * 25 = 75
      expect(result.fee).toBe(75);
      expect(result.durationMinutes).toBe(150);
      expect(result.exitTime).toEqual(new Date('2026-02-19T12:30:00Z'));
    });

    it('should use default rate of 20 when no pricing rule exists', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-02-19T11:00:00Z'));

      mockPrisma.parkingSession.findUnique.mockResolvedValue({
        session_id: 'sess-1',
        entry_time: new Date('2026-02-19T10:00:00Z'),
      });
      mockPrisma.pricingRule.findFirst.mockResolvedValue(null);

      const result = await calculateExitFee('sess-1');

      // 1 hour * 20 (default rate)
      expect(result.fee).toBe(20);
      expect(result.durationMinutes).toBe(60);
    });

    it('should round up partial hours', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-02-19T10:15:00Z'));

      mockPrisma.parkingSession.findUnique.mockResolvedValue({
        session_id: 'sess-1',
        entry_time: new Date('2026-02-19T10:00:00Z'),
      });
      mockPrisma.pricingRule.findFirst.mockResolvedValue({
        rate_per_hour: 10.0,
      });

      const result = await calculateExitFee('sess-1');

      // 15 minutes → ceil to 1 hour → 1 * 10 = 10
      expect(result.fee).toBe(10);
      expect(result.durationMinutes).toBe(15);
    });

    it('should handle exactly 1 hour duration', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-02-19T11:00:00Z'));

      mockPrisma.parkingSession.findUnique.mockResolvedValue({
        session_id: 'sess-1',
        entry_time: new Date('2026-02-19T10:00:00Z'),
      });
      mockPrisma.pricingRule.findFirst.mockResolvedValue({
        rate_per_hour: 30.0,
      });

      const result = await calculateExitFee('sess-1');

      expect(result.fee).toBe(30);
      expect(result.durationMinutes).toBe(60);
    });

    it('should throw error if session not found', async () => {
      mockPrisma.parkingSession.findUnique.mockResolvedValue(null);

      await expect(calculateExitFee('nonexistent')).rejects.toThrow(
        'Session not found'
      );
    });

    it('should query the latest pricing rule', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-02-19T11:00:00Z'));

      mockPrisma.parkingSession.findUnique.mockResolvedValue({
        session_id: 'sess-1',
        entry_time: new Date('2026-02-19T10:00:00Z'),
      });
      mockPrisma.pricingRule.findFirst.mockResolvedValue({
        rate_per_hour: 15.0,
      });

      await calculateExitFee('sess-1');

      expect(mockPrisma.pricingRule.findFirst).toHaveBeenCalledWith({
        orderBy: { effective_from: 'desc' },
      });
    });
  });
});
