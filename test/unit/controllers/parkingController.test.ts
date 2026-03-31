jest.mock('../../../src/services/parkingService.js', () => ({
  getDashboardData: jest.fn(),
  handleLprEntry: jest.fn(),
  handleSlotOccupation: jest.fn(),
  handleSlotExit: jest.fn(),
  checkSession: jest.fn(),
}));

import * as parkingController from '../../../src/controllers/parkingController.js';
import * as parkingService from '../../../src/services/parkingService.js';

const mockParkingService = parkingService as jest.Mocked<typeof parkingService>;

const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('parkingController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboard', () => {
    it('should return 200 with all slots', async () => {
      const mockSlots = [
        { slot_id: 'VIP-A1', status: 'OCCUPIED', slot_type: 'VIP', location_coordinates: '{}', is_active: true },
        { slot_id: 'GEN-A1', status: 'FREE', slot_type: 'GENERAL', location_coordinates: '{}', is_active: true },
      ];
      const req = {} as any;
      const res = mockRes();
      mockParkingService.getDashboardData.mockResolvedValue(mockSlots as any);

      await parkingController.getDashboard(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockSlots);
    });

    it('should return 200 with empty array when no slots', async () => {
      const req = {} as any;
      const res = mockRes();
      mockParkingService.getDashboardData.mockResolvedValue([]);

      await parkingController.getDashboard(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('should return 500 on service error', async () => {
      const req = {} as any;
      const res = mockRes();
      mockParkingService.getDashboardData.mockRejectedValue(new Error('DB connection failed'));

      await parkingController.getDashboard(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'DB connection failed' });
    });
  });

  describe('checkSession', () => {
    it('should return 400 if registration is missing', async () => {
      const req = { query: { province: 'กรุงเทพมหานคร' } } as any;
      const res = mockRes();

      await parkingController.checkSession(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'registration and province query parameters are required.',
      });
    });

    it('should return 400 if province is missing', async () => {
      const req = { query: { registration: '1กข 1234' } } as any;
      const res = mockRes();

      await parkingController.checkSession(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 when no active session found', async () => {
      const req = { query: { registration: '9ZZ 0000', province: 'ชลบุรี' } } as any;
      const res = mockRes();
      mockParkingService.checkSession.mockResolvedValue(null);

      await parkingController.checkSession(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'No active parking session found for this vehicle.',
      });
    });

    it('should return 200 with session data', async () => {
      const sessionData = {
        session_id: 'sess-1',
        slot: { slot_id: 'VIP-A1', slot_type: 'VIP', status: 'OCCUPIED' },
        registration: '1กข 1234',
        province: 'กรุงเทพมหานคร',
        is_registered: true,
        entry_time: new Date(),
        duration_minutes: 60,
        estimated_fee: 0,
        free_hours: 5,
        payment_status: 'PENDING',
      };
      const req = { query: { registration: '1กข 1234', province: 'กรุงเทพมหานคร' } } as any;
      const res = mockRes();
      mockParkingService.checkSession.mockResolvedValue(sessionData as any);

      await parkingController.checkSession(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(sessionData);
      expect(mockParkingService.checkSession).toHaveBeenCalledWith('1กข 1234', 'กรุงเทพมหานคร');
    });

    it('should return 500 on service error', async () => {
      const req = { query: { registration: '1กข 1234', province: 'กรุงเทพมหานคร' } } as any;
      const res = mockRes();
      mockParkingService.checkSession.mockRejectedValue(new Error('DB down'));

      await parkingController.checkSession(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'DB down' });
    });
  });
});
