jest.mock('../../../src/repositories/adminRepository.js', () => ({
  createLotWithSlots: jest.fn(),
  getAllSessions: jest.fn(),
  getAllSensorLogs: jest.fn(),
}));

import * as adminRepository from '../../../src/repositories/adminRepository.js';
import * as adminService from '../../../src/services/adminService.js';

const mockAdminRepo = adminRepository as jest.Mocked<typeof adminRepository>;

describe('adminService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createLotWithSlots', () => {
    it('should delegate to repository', async () => {
      const input = {
        name: 'Test Lot',
        mall_id: 'mall-1',
        program_id: 'prog-1',
        slots: [{ slot_id: 'A1', location_coordinates: '{}', rotation: 0 }],
      };
      const mockResult = { lot_id: 'lot-1', ...input };
      mockAdminRepo.createLotWithSlots.mockResolvedValue(mockResult as any);

      const result = await adminService.createLotWithSlots(input);

      expect(result).toEqual(mockResult);
      expect(mockAdminRepo.createLotWithSlots).toHaveBeenCalledWith(input);
    });
  });

  describe('getSessions', () => {
    it('should return all sessions without filters', async () => {
      const mockSessions = [{ session_id: 's1' }, { session_id: 's2' }];
      mockAdminRepo.getAllSessions.mockResolvedValue(mockSessions as any);

      const result = await adminService.getSessions();

      expect(result).toEqual(mockSessions);
      expect(mockAdminRepo.getAllSessions).toHaveBeenCalledWith(undefined);
    });

    it('should pass filters to repository', async () => {
      mockAdminRepo.getAllSessions.mockResolvedValue([]);

      const filters = { status: 'active' as const, registration: 'ABC' };
      await adminService.getSessions(filters);

      expect(mockAdminRepo.getAllSessions).toHaveBeenCalledWith(filters);
    });
  });

  describe('getSensorLogs', () => {
    it('should return all sensor logs without filters', async () => {
      const mockLogs = [{ log_id: 'l1' }];
      mockAdminRepo.getAllSensorLogs.mockResolvedValue(mockLogs as any);

      const result = await adminService.getSensorLogs();

      expect(result).toEqual(mockLogs);
      expect(mockAdminRepo.getAllSensorLogs).toHaveBeenCalledWith(undefined);
    });

    it('should pass filters to repository', async () => {
      mockAdminRepo.getAllSensorLogs.mockResolvedValue([]);

      const filters = { slot_id: 'A1', event_type: 'ENTRY' };
      await adminService.getSensorLogs(filters);

      expect(mockAdminRepo.getAllSensorLogs).toHaveBeenCalledWith(filters);
    });
  });
});
