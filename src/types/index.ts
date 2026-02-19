// src/types/index.ts

// 1. Request Object for Reservation (What React sends)
export interface CreateReservationDTO {
  slotId: string;
  licensePlate: string;
  durationHours?: number; // Optional user input
}

// 2. Response Object for Fee Calculation (What React receives)
export interface ExitFeeResponse {
  sessionId: string;
  entryTime: Date;
  exitTime: Date;
  durationMinutes: number;
  totalFee: number;
  currency: string;
}

export interface ParkingDetailsResponse {
  sessionId: string;
  slotId: string;
  licensePlate: string;
  entryTime: Date;
  currentTime: Date;
  // currentStatus: 'PENDING' | 'PAID';
  totalFee: number; 
}

// 3. MQTT Payload Structure (What ESP32 sends)
export interface SensorPayload {
  slot_id: string;
  status: 'OCCUPIED' | 'FREE';
  distance_cm?: number;
}