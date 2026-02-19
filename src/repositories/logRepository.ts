// src/repositories/logRepository.ts
import { prisma } from '../config/db.js';
import { LogEventType } from '@prisma/client';

export const createLog = async (slotId: string, event: LogEventType, rawData: string) => {
  return prisma.sensorLog.create({
    data: {
      slot_id: slotId,
      event_type: event,
      raw_data: rawData,
      timestamp: new Date()
    }
  });
};

// Optional: Get logs for the dashboard chart
export const getLogsBySlot = async (slotId: string) => {
  return prisma.sensorLog.findMany({
    where: { slot_id: slotId },
    orderBy: { timestamp: 'desc' },
    take: 50 // Only last 50 events
  });
};