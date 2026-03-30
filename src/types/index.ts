// src/types/index.ts

// 1. LPR Camera Events (from LPR server via RabbitMQ)
export interface LprEntryEvent {
  registration: string;  // e.g. "1กข 1234"
  province: string;      // e.g. "กรุงเทพมหานคร"
}

// 2. ESP32 Sensor Events (from IoT hardware via RabbitMQ)
export interface SensorSlotEvent {
  slotId: string;
  status: 'OCCUPIED' | 'FREE';
  rawData?: string;      // Raw IR sensor value
}

// 3. Response Object for Fee Calculation
export interface ExitFeeResult {
  durationMinutes: number;
  freeHours: number;
  billableHours: number;
  ratePerHour: number;
  totalFee: number;
  exitTime: Date;
}