jest.mock('../../../src/services/adminService.js', () => ({
  createLotWithSlots: jest.fn(),
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

  describe('createLot', () => {
    const validBody = {
      name: 'Test Lot',
      mall_id: 'mall-1',
      program_id: 'prog-1',
      location: 'Bangkok',
      rate_per_hour: 25,
      slots: [
        { slot_id: 'A1', location_coordinates: '{"x":0,"y":0,"z":0}', rotation: 0 },
        { slot_id: 'A2', location_coordinates: '{"x":10,"y":0,"z":0}', rotation: 90 },
      ],
    };

    it('should return 201 with created lot', async () => {
      const created = { lot_id: 'lot-1', ...validBody };
      mockAdminService.createLotWithSlots.mockResolvedValue(created as any);

      const req = { body: validBody } as AuthRequest;
      const res = mockRes();

      await adminController.createLot(req, res);

      expect(mockAdminService.createLotWithSlots).toHaveBeenCalledWith({
        name: 'Test Lot',
        mall_id: 'mall-1',
        program_id: 'prog-1',
        location: 'Bangkok',
        rate_per_hour: 25,
        slots: validBody.slots,
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(created);
    });

    it('should return 400 if name is missing', async () => {
      const req = { body: { mall_id: 'mall-1', program_id: 'prog-1', slots: [{ slot_id: 'A1', location_coordinates: '{}', rotation: 0 }] } } as AuthRequest;
      const res = mockRes();

      await adminController.createLot(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 if slots is empty', async () => {
      const req = { body: { name: 'Lot', mall_id: 'mall-1', program_id: 'prog-1', slots: [] } } as AuthRequest;
      const res = mockRes();

      await adminController.createLot(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 if a slot is missing required fields', async () => {
      const req = { body: { name: 'Lot', mall_id: 'mall-1', program_id: 'prog-1', slots: [{ slot_id: 'A1' }] } } as AuthRequest;
      const res = mockRes();

      await adminController.createLot(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 500 on service error', async () => {
      mockAdminService.createLotWithSlots.mockRejectedValue(new Error('Duplicate name'));

      const req = { body: validBody } as AuthRequest;
      const res = mockRes();

      await adminController.createLot(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Duplicate name' });
    });
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
