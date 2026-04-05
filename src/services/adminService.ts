import * as adminRepo from '../repositories/adminRepository.js';
import type { CreateLotInput } from '../repositories/adminRepository.js';

// Mall
export const getAllMalls = async () => adminRepo.getAllMalls();
export const createMall = async (name: string) => adminRepo.createMall(name);
export const updateMall = async (mallId: string, name: string) => adminRepo.updateMall(mallId, name);
export const deleteMall = async (mallId: string) => adminRepo.deleteMall(mallId);

// Programs
export const getAllPrograms = async () => adminRepo.getAllPrograms();

// Lot
export const createLotWithSlots = async (input: CreateLotInput) => {
  return adminRepo.createLotWithSlots(input);
};
export const updateLot = async (lotId: string, data: { name?: string; program_id?: string }) => adminRepo.updateLot(lotId, data);
export const deleteLot = async (lotId: string) => adminRepo.deleteLot(lotId);

// Slot
export const toggleSlotActive = async (slotId: string) => adminRepo.toggleSlotActive(slotId);
export const deleteSlot = async (slotId: string) => adminRepo.deleteSlot(slotId);

export const getSessions = async (filters?: {
  status?: 'active' | 'completed';
  registration?: string;
}) => {
  return adminRepo.getAllSessions(filters);
};

export const getSensorLogs = async (filters?: {
  slot_id?: string;
  event_type?: string;
}) => {
  return adminRepo.getAllSensorLogs(filters);
};
