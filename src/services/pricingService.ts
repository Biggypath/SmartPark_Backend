import { prisma } from '../config/db.js';

export const calculateExitFee = async (sessionId: string) => {
  const session = await prisma.parkingSession.findUnique({ where: { session_id: sessionId } });
  if (!session) throw new Error("Session not found");

  const now = new Date();
  const durationMs = now.getTime() - session.entry_time.getTime();
  const durationHours = Math.ceil(durationMs / (1000 * 60 * 60)); // Round up

  // Get current rate
  const rule = await prisma.pricingRule.findFirst({ orderBy: { effective_from: 'desc' } });
  const rate = rule ? rule.rate_per_hour : 20.0;

  return {
    durationMinutes: durationMs / 60000,
    fee: durationHours * rate,
    exitTime: now
  };
};