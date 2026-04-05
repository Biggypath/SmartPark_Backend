jest.mock('../../../src/repositories/adminRepository.js', () => ({
  createLotWithSlots: jest.fn(),
  getAllSessions: jest.fn(),
  getAllSensorLogs: jest.fn(),
  getAllMalls: jest.fn(),
  createMall: jest.fn(),
  updateMall: jest.fn(),
  deleteMall: jest.fn(),
  getAllPrograms: jest.fn(),
  updateLot: jest.fn(),
  deleteLot: jest.fn(),
  toggleSlotActive: jest.fn(),
  deleteSlot: jest.fn(),
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

  describe('getAllMalls', () => {
    it('should delegate to repository', async () => {
      mockAdminRepo.getAllMalls.mockResolvedValue([]);
      const result = await adminService.getAllMalls();
      expect(result).toEqual([]);
      expect(mockAdminRepo.getAllMalls).toHaveBeenCalled();
    });
  });

  describe('createMall', () => {
    it('should delegate to repository', async () => {
      const mall = { mall_id: 'm1', name: 'Mall' };
      mockAdminRepo.createMall.mockResolvedValue(mall as any);
      const result = await adminService.createMall('Mall');
      expect(result).toEqual(mall);
    });
  });

  describe('updateMall', () => {
    it('should delegate to repository', async () => {
      mockAdminRepo.updateMall.mockResolvedValue({ mall_id: 'm1', name: 'X' } as any);
      await adminService.updateMall('m1', 'X');
      expect(mockAdminRepo.updateMall).toHaveBeenCalledWith('m1', 'X');
    });
  });

  describe('deleteMall', () => {
    it('should delegate to repository', async () => {
      mockAdminRepo.deleteMall.mockResolvedValue({ mall_id: 'm1' } as any);
      await adminService.deleteMall('m1');
      expect(mockAdminRepo.deleteMall).toHaveBeenCalledWith('m1');
    });
  });

  describe('getAllPrograms', () => {
    it('should delegate to repository', async () => {
      mockAdminRepo.getAllPrograms.mockResolvedValue([]);
      const result = await adminService.getAllPrograms();
      expect(result).toEqual([]);
    });
  });

  describe('updateLot', () => {
    it('should delegate to repository', async () => {
      mockAdminRepo.updateLot.mockResolvedValue({} as any);
      await adminService.updateLot('lot-1', { name: 'X' });
      expect(mockAdminRepo.updateLot).toHaveBeenCalledWith('lot-1', { name: 'X' });
    });
  });

  describe('deleteLot', () => {
    it('should delegate to repository', async () => {
      mockAdminRepo.deleteLot.mockResolvedValue({} as any);
      await adminService.deleteLot('lot-1');
      expect(mockAdminRepo.deleteLot).toHaveBeenCalledWith('lot-1');
    });
  });

  describe('toggleSlotActive', () => {
    it('should delegate to repository', async () => {
      mockAdminRepo.toggleSlotActive.mockResolvedValue({} as any);
      await adminService.toggleSlotActive('A1');
      expect(mockAdminRepo.toggleSlotActive).toHaveBeenCalledWith('A1');
    });
  });

  describe('deleteSlot', () => {
    it('should delegate to repository', async () => {
      mockAdminRepo.deleteSlot.mockResolvedValue({} as any);
      await adminService.deleteSlot('A1');
      expect(mockAdminRepo.deleteSlot).toHaveBeenCalledWith('A1');
    });
  });
});
