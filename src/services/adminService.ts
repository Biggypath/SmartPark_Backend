import * as adminRepo from '../repositories/adminRepository.js';

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
