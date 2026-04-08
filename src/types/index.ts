// src/types/index.ts

import type { Request } from 'express';

// 1. OCR Entry Event (from ThaiLicensePlateOCR server via RabbitMQ)
export interface OcrEntryEvent {
  registration: string;  // e.g. "1กข 1234"
  province: string;      // e.g. "กรุงเทพมหานคร"
  lotId: string;         // Which parking lot this camera belongs to
  slotId: string;        // The specific slot this ESP32-CAM is attached to
  camId?: string;        // Camera identifier
}

// 2. OCR Exit Event (from ThaiLicensePlateOCR server via RabbitMQ)
export interface OcrExitEvent {
  registration: string;
  province: string;
  lotId: string;
  slotId: string;        // The specific slot this ESP32-CAM is attached to
  camId?: string;
}

// 3. Entry ACK (sent back to ThaiLicensePlateOCR)
export interface OcrEntryAck {
  camId?: string | undefined;
  lotId: string;
  registration: string;
  province: string;
  status: 'ALLOWED' | 'REJECTED';
  slotId?: string | undefined;
  reason?: string | undefined;
}

// 4. Exit ACK (sent back to ThaiLicensePlateOCR)
export interface OcrExitAck {
  camId?: string | undefined;
  lotId: string;
  registration: string;
  province: string;
  status: 'OK' | 'ERROR';
  totalFee?: number;
  durationMinutes?: number;
  reason?: string;
}

// 5. Barrier Command (sent to ESP32 via MQTT through amq.topic exchange)
export interface BarrierCommand {
  camId: string;        // Target ESP32 camera/barrier ID
  lotId: string;        // Parking lot ID
  command: 'OPEN' | 'CLOSE'; // Barrier action
}

// 5b. Barrier Status (received from ESP32 via MQTT through amq.topic exchange)
export interface BarrierStatus {
  camId: string;
  slotState: string;       // e.g. "BLOCKED", "OPEN", etc.
  armDown: boolean;
  carUnderSensor: boolean;
  ultraDistanceCm: number;
  confirmRemainingMs: number;
  openCount: number;
  closeCount: number;
  abortCount: number;
  uptimeMs: number;
}

// 6. Response Object for Fee Calculation
export interface ExitFeeResult {
  durationMinutes: number;
  billableHours: number;
  ratePerHour: number;
  totalFee: number;
  exitTime: Date;
}

// 7. Authenticated Request (JWT payload attached by authMiddleware)
export interface AuthRequest extends Request {
  user?: { user_id: string; role: string };
}