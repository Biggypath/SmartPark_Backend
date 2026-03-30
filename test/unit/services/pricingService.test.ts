const mockPrisma = {
  pricingRule: {
    findFirst: jest.fn(),
  },
};

jest.mock('../../../src/config/db', () => ({
  prisma: mockPrisma,
}));

import { calculateFee, getActiveRate } from '../../../src/services/pricingService';

describe('pricingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateFee', () => {
    it('should calculate fee with custom rate, no free hours', () => {
      const entry = new Date('2026-03-30T10:00:00Z');
      const exit = new Date('2026-03-30T12:30:00Z');

      const result = calculateFee(entry, exit, 0, 25);

      // 2h30m → ceil to 3h → 3 * 25 = 75
      expect(result.totalFee).toBe(75);
      expect(result.durationMinutes).toBe(150);
      expect(result.billableHours).toBe(3);
      expect(result.freeHours).toBe(0);
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

      const result = calculateFee(entry, exit, 2, 20);

      // 3 hours parked - 2 free hours = 1 billable hour → 1 * 20 = 20
      expect(result.totalFee).toBe(20);
      expect(result.billableHours).toBe(1);
      expect(result.freeHours).toBe(2);
    });

    it('should not produce negative fee when free hours exceed duration', () => {
      const entry = new Date('2026-03-30T10:00:00Z');
      const exit = new Date('2026-03-30T11:00:00Z');

      const result = calculateFee(entry, exit, 5, 20);

      // 1 hour - 5 free hours → max(0, -4) = 0 billable
      expect(result.totalFee).toBe(0);
      expect(result.billableHours).toBe(0);
    });

    it('should round up partial hours before subtracting free hours', () => {
      const entry = new Date('2026-03-30T10:00:00Z');
      const exit = new Date('2026-03-30T10:15:00Z');

      const result = calculateFee(entry, exit, 0, 10);

      // 15 min → ceil to 1h → 1 * 10 = 10
      expect(result.totalFee).toBe(10);
      expect(result.durationMinutes).toBe(15);
      expect(result.billableHours).toBe(1);
    });

    it('should handle exactly the free hours duration', () => {
      const entry = new Date('2026-03-30T10:00:00Z');
      const exit = new Date('2026-03-30T12:00:00Z');

      const result = calculateFee(entry, exit, 2, 20);

      // 2 hours - 2 free = 0 billable
      expect(result.totalFee).toBe(0);
      expect(result.billableHours).toBe(0);
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
