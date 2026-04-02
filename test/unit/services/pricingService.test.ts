const mockPrisma = {
  pricingRule: {
    findFirst: jest.fn(),
  },
};

jest.mock('../../../src/config/db.js', () => ({
  prisma: mockPrisma,
}));

import { calculateFee, getActiveRate } from '../../../src/services/pricingService.js';

describe('pricingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateFee', () => {
    it('should calculate fee with custom rate', () => {
      const entry = new Date('2026-03-30T10:00:00Z');
      const exit = new Date('2026-03-30T12:30:00Z');

      const result = calculateFee(entry, exit, 25);

      // 2h30m → ceil to 3h → 3 * 25 = 75
      expect(result.totalFee).toBe(75);
      expect(result.durationMinutes).toBe(150);
      expect(result.billableHours).toBe(3);
      expect(result.ratePerHour).toBe(25);
    });

    it('should use default rate of 20 when not specified', () => {
      const entry = new Date('2026-03-30T10:00:00Z');
      const exit = new Date('2026-03-30T11:00:00Z');

      const result = calculateFee(entry, exit);

      // 1 hour * 20 (default)
      expect(result.totalFee).toBe(20);
      expect(result.durationMinutes).toBe(60);
    });

    it('should subtract free hours from billable duration', () => {
      const entry = new Date('2026-03-30T10:00:00Z');
      const exit = new Date('2026-03-30T13:00:00Z');

      const result = calculateFee(entry, exit, 20);

      // 3 hours parked → ceil to 3h → 3 * 20 = 60
      expect(result.totalFee).toBe(60);
      expect(result.billableHours).toBe(3);
    });

    it('should handle short duration parking', () => {
      const entry = new Date('2026-03-30T10:00:00Z');
      const exit = new Date('2026-03-30T10:15:00Z');

      const result = calculateFee(entry, exit, 20);

      // 15 min → ceil to 1h → 1 * 20 = 20
      expect(result.totalFee).toBe(20);
      expect(result.durationMinutes).toBe(15);
      expect(result.billableHours).toBe(1);
    });

    it('should handle exact hour duration', () => {
      const entry = new Date('2026-03-30T10:00:00Z');
      const exit = new Date('2026-03-30T12:00:00Z');

      const result = calculateFee(entry, exit, 20);

      // 2 hours → 2 * 20 = 40
      expect(result.totalFee).toBe(40);
      expect(result.billableHours).toBe(2);
    });

    it('should return the exit time passed', () => {
      const entry = new Date('2026-03-30T10:00:00Z');
      const exit = new Date('2026-03-30T11:00:00Z');

      const result = calculateFee(entry, exit);

      expect(result.exitTime).toEqual(exit);
    });
  });

  describe('getActiveRate', () => {
    it('should return rate from latest pricing rule', async () => {
      mockPrisma.pricingRule.findFirst.mockResolvedValue({ rate_per_hour: 25.0 });

      const rate = await getActiveRate();

      expect(rate).toBe(25.0);
      expect(mockPrisma.pricingRule.findFirst).toHaveBeenCalledWith({
        orderBy: { effective_from: 'desc' },
      });
    });

    it('should return default rate of 20 when no rule exists', async () => {
      mockPrisma.pricingRule.findFirst.mockResolvedValue(null);

      const rate = await getActiveRate();

      expect(rate).toBe(20.0);
    });
  });
});
