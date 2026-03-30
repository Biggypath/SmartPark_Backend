import { prisma } from '../config/db.js';
import type { ExitFeeResult } from '../types/index.js';

/**
 * Get the current active pricing rate.
 */
export const getActiveRate = async (): Promise<number> => {
  const rule = await prisma.pricingRule.findFirst({
    orderBy: { effective_from: 'desc' }
  });
  return rule ? rule.rate_per_hour : 20.0;
};

/**
 * Calculate parking fee given entry time, exit time, and privilege free hours.
 * Pure calculation — no DB calls.
 */
export const calculateFee = (
  entryTime: Date,
  exitTime: Date,
  freeHours: number = 0,
  ratePerHour: number = 20.0
): ExitFeeResult => {
  const durationMs = exitTime.getTime() - entryTime.getTime();
  const durationMinutes = durationMs / 60000;
  const durationHours = durationMs / (1000 * 60 * 60);

  const billableHours = Math.max(0, Math.ceil(durationHours) - freeHours);
  const totalFee = billableHours * ratePerHour;

  return {
    durationMinutes,
    freeHours,
    billableHours,
    ratePerHour,
    totalFee,
    exitTime
  };
};