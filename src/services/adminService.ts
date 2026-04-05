import * as adminRepo from '../repositories/adminRepository.js';
import type { CreateLotInput } from '../repositories/adminRepository.js';

export const createLotWithSlots = async (input: CreateLotInput) => {
  return adminRepo.createLotWithSlots(input);
};

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
