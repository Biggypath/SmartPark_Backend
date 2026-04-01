jest.mock('../../../src/services/adminService.js', () => ({
  getSessions: jest.fn(),
  getSensorLogs: jest.fn(),
}));

import * as adminService from '../../../src/services/adminService.js';
import * as adminController from '../../../src/controllers/adminController.js';
import type { AuthRequest } from '../../../src/types/index.js';
import type { Response } from 'express';

const mockAdminService = adminService as jest.Mocked<typeof adminService>;

const mockRes = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn().mockReturnThis();
  return res;
};

describe('adminController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSessions', () => {
    it('should return 200 with sessions', async () => {
      const sessions = [{ session_id: 's1' }];
      mockAdminService.getSessions.mockResolvedValue(sessions as any);

      const req = { query: {} } as AuthRequest;
      const res = mockRes();

      await adminController.getSessions(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(sessions);
    });

    it('should pass status and registration filters from query', async () => {
      mockAdminService.getSessions.mockResolvedValue([]);

      const req = { query: { status: 'active', registration: 'ABC' } } as unknown as AuthRequest;
      const res = mockRes();

      await adminController.getSessions(req, res);

      expect(mockAdminService.getSessions).toHaveBeenCalledWith({
        status: 'active',
        registration: 'ABC',
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 500 on error', async () => {
      mockAdminService.getSessions.mockRejectedValue(new Error('DB error'));

      const req = { query: {} } as AuthRequest;
      const res = mockRes();

      await adminController.getSessions(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'DB error' });
    });
  });

  describe('getSensorLogs', () => {
    it('should return 200 with sensor logs', async () => {
      const logs = [{ log_id: 'l1' }];
      mockAdminService.getSensorLogs.mockResolvedValue(logs as any);

      const req = { query: {} } as AuthRequest;
      const res = mockRes();

      await adminController.getSensorLogs(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(logs);
    });

    it('should pass slot_id and event_type filters from query', async () => {
      mockAdminService.getSensorLogs.mockResolvedValue([]);

      const req = { query: { slot_id: 'A1', event_type: 'ENTRY' } } as unknown as AuthRequest;
      const res = mockRes();

      await adminController.getSensorLogs(req, res);

      expect(mockAdminService.getSensorLogs).toHaveBeenCalledWith({
        slot_id: 'A1',
        event_type: 'ENTRY',
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 500 on error', async () => {
      mockAdminService.getSensorLogs.mockRejectedValue(new Error('DB error'));

      const req = { query: {} } as AuthRequest;
      const res = mockRes();

      await adminController.getSensorLogs(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'DB error' });
    });
  });
});
