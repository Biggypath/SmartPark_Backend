jest.mock('../../../src/services/parkingService.js', () => ({
  getDashboardData: jest.fn(),
  getLots: jest.fn(),
  getDashboardByLot: jest.fn(),
  getParkingHistory: jest.fn(),
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
        { slot_id: 'A1', status: 'OCCUPIED', location_coordinates: '{}', is_active: true },
        { slot_id: 'B1', status: 'FREE', location_coordinates: '{}', is_active: true },
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

  describe('getLots', () => {
    it('should return 200 with lots list', async () => {
      const lots = [{ lot_id: 'lot-1', name: 'CentralWorld SCB' }];
      const req = {} as any;
      const res = mockRes();
      mockParkingService.getLots.mockResolvedValue(lots as any);

      await parkingController.getLots(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(lots);
    });

    it('should return 500 on error', async () => {
      const req = {} as any;
      const res = mockRes();
      mockParkingService.getLots.mockRejectedValue(new Error('DB down'));

      await parkingController.getLots(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getLotDashboard', () => {
    it('should return 200 with slots for the lot', async () => {
      const slots = [{ slot_id: 'A1', status: 'FREE', lot_id: 'lot-1' }];
      const req = { params: { lotId: 'lot-1' } } as any;
      const res = mockRes();
      mockParkingService.getDashboardByLot.mockResolvedValue(slots as any);

      await parkingController.getLotDashboard(req, res);

      expect(mockParkingService.getDashboardByLot).toHaveBeenCalledWith('lot-1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(slots);
    });

    it('should return 500 on error', async () => {
      const req = { params: { lotId: 'lot-1' } } as any;
      const res = mockRes();
      mockParkingService.getDashboardByLot.mockRejectedValue(new Error('DB down'));

      await parkingController.getLotDashboard(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
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
        slot: { slot_id: 'A1', status: 'OCCUPIED' },
        registration: '1กข 1234',
        province: 'กรุงเทพมหานคร',
        is_registered: true,
        entry_time: new Date(),
        duration_minutes: 60,
        estimated_fee: 0,
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

  describe('getParkingHistory', () => {
    it('should return 200 with history', async () => {
      const history = [
        { session_id: 's1', location: 'CentralWorld SCB', slot_id: 'A1', entry_time: '2026-04-01T10:00:00Z', exit_time: '2026-04-01T12:00:00Z', total_fee: 40 },
      ];
      const req = { user: { user_id: 'u1' } } as any;
      const res = mockRes();
      mockParkingService.getParkingHistory.mockResolvedValue(history as any);

      await parkingController.getParkingHistory(req, res);

      expect(mockParkingService.getParkingHistory).toHaveBeenCalledWith('u1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(history);
    });

    it('should return 500 on error', async () => {
      const req = { user: { user_id: 'u1' } } as any;
      const res = mockRes();
      mockParkingService.getParkingHistory.mockRejectedValue(new Error('DB down'));

      await parkingController.getParkingHistory(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
