jest.mock('../../../src/services/adminService.js', () => ({
  createLotWithSlots: jest.fn(),
  getSessions: jest.fn(),
  getSensorLogs: jest.fn(),
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

import * as adminService from '../../../src/services/adminService.js';
import * as adminController from '../../../src/controllers/adminController.js';
import type { AuthRequest } from '../../../src/types/index.js';
import type { Response } from 'express';

const mockAdminService = adminService as jest.Mocked<typeof adminService>;

const mockRes = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn().mockReturnThis();
  res.send = jest.fn().mockReturnThis();
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

  describe('getMalls', () => {
    it('should return 200 with malls', async () => {
      const malls = [{ mall_id: 'm1', name: 'Mall A' }];
      mockAdminService.getAllMalls.mockResolvedValue(malls as any);

      const req = {} as AuthRequest;
      const res = mockRes();
      await adminController.getMalls(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(malls);
    });

    it('should return 500 on error', async () => {
      mockAdminService.getAllMalls.mockRejectedValue(new Error('fail'));
      const req = {} as AuthRequest;
      const res = mockRes();
      await adminController.getMalls(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('createMall', () => {
    it('should return 201 with created mall', async () => {
      const mall = { mall_id: 'm1', name: 'New' };
      mockAdminService.createMall.mockResolvedValue(mall as any);

      const req = { body: { name: 'New' } } as AuthRequest;
      const res = mockRes();
      await adminController.createMall(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mall);
    });

    it('should return 400 if name missing', async () => {
      const req = { body: {} } as AuthRequest;
      const res = mockRes();
      await adminController.createMall(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 500 on error', async () => {
      mockAdminService.createMall.mockRejectedValue(new Error('dup'));
      const req = { body: { name: 'X' } } as AuthRequest;
      const res = mockRes();
      await adminController.createMall(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updateMall', () => {
    it('should return 200 with updated mall', async () => {
      mockAdminService.updateMall.mockResolvedValue({ mall_id: 'm1', name: 'X' } as any);
      const req = { params: { mall_id: 'm1' }, body: { name: 'X' } } as unknown as AuthRequest;
      const res = mockRes();
      await adminController.updateMall(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 400 if name missing', async () => {
      const req = { params: { mall_id: 'm1' }, body: {} } as unknown as AuthRequest;
      const res = mockRes();
      await adminController.updateMall(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('deleteMall', () => {
    it('should return 204', async () => {
      mockAdminService.deleteMall.mockResolvedValue({} as any);
      const req = { params: { mall_id: 'm1' } } as unknown as AuthRequest;
      const res = mockRes();
      await adminController.deleteMall(req, res);
      expect(res.status).toHaveBeenCalledWith(204);
    });

    it('should return 500 on error', async () => {
      mockAdminService.deleteMall.mockRejectedValue(new Error('fail'));
      const req = { params: { mall_id: 'm1' } } as unknown as AuthRequest;
      const res = mockRes();
      await adminController.deleteMall(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getPrograms', () => {
    it('should return 200 with programs', async () => {
      mockAdminService.getAllPrograms.mockResolvedValue([]);
      const req = {} as AuthRequest;
      const res = mockRes();
      await adminController.getPrograms(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('updateLot', () => {
    it('should return 200 with updated lot', async () => {
      mockAdminService.updateLot.mockResolvedValue({} as any);
      const req = { params: { lot_id: 'lot-1' }, body: { name: 'New' } } as unknown as AuthRequest;
      const res = mockRes();
      await adminController.updateLot(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 400 if no fields provided', async () => {
      const req = { params: { lot_id: 'lot-1' }, body: {} } as unknown as AuthRequest;
      const res = mockRes();
      await adminController.updateLot(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('deleteLot', () => {
    it('should return 204', async () => {
      mockAdminService.deleteLot.mockResolvedValue({} as any);
      const req = { params: { lot_id: 'lot-1' } } as unknown as AuthRequest;
      const res = mockRes();
      await adminController.deleteLot(req, res);
      expect(res.status).toHaveBeenCalledWith(204);
    });
  });

  describe('toggleSlotActive', () => {
    it('should return 200 with toggled slot', async () => {
      mockAdminService.toggleSlotActive.mockResolvedValue({ slot_id: 'A1', is_active: false } as any);
      const req = { params: { slot_id: 'A1' } } as unknown as AuthRequest;
      const res = mockRes();
      await adminController.toggleSlotActive(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('deleteSlot', () => {
    it('should return 204', async () => {
      mockAdminService.deleteSlot.mockResolvedValue({} as any);
      const req = { params: { slot_id: 'A1' } } as unknown as AuthRequest;
      const res = mockRes();
      await adminController.deleteSlot(req, res);
      expect(res.status).toHaveBeenCalledWith(204);
    });
  });
});
