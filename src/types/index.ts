// src/types/index.ts

import type { Request } from 'express';

// 1. OCR Entry Event (from ThaiLicensePlateOCR server via RabbitMQ)
export interface OcrEntryEvent {
  registration: string;  // e.g. "1กข 1234"
  province: string;      // e.g. "กรุงเทพมหานคร"
  lotId: string;         // Which parking lot this camera belongs to
  camId?: string;        // Camera identifier
}

// 2. OCR Exit Event (from ThaiLicensePlateOCR server via RabbitMQ)
export interface OcrExitEvent {
  registration: string;
  province: string;
  lotId: string;
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

// 5. Response Object for Fee Calculation
export interface ExitFeeResult {
  durationMinutes: number;
  billableHours: number;
  ratePerHour: number;
  totalFee: number;
  exitTime: Date;
}

// 6. Authenticated Request (JWT payload attached by authMiddleware)
export interface AuthRequest extends Request {
  user?: { user_id: string; role: string };
}