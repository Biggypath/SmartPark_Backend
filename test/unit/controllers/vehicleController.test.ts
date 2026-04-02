jest.mock('../../../src/services/vehicleService.js', () => ({
  getVehicles: jest.fn(),
  registerVehicle: jest.fn(),
  updateVehicle: jest.fn(),
  deleteVehicle: jest.fn(),
}));

import * as vehicleController from '../../../src/controllers/vehicleController.js';
import * as vehicleService from '../../../src/services/vehicleService.js';
import type { AuthRequest } from '../../../src/types/index.js';

const mockVehicleService = vehicleService as jest.Mocked<typeof vehicleService>;

const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

describe('vehicleController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getVehicles', () => {
    it('should return 200 with vehicles list', async () => {
      const req = { user: { user_id: 'u1' } } as AuthRequest;
      const res = mockRes();
      const vehicles = [{ vehicle_id: 'v1' }];
      mockVehicleService.getVehicles.mockResolvedValue(vehicles as any);

      await vehicleController.getVehicles(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(vehicles);
    });

    it('should return 400 on error', async () => {
      const req = { user: { user_id: 'u1' } } as AuthRequest;
      const res = mockRes();
      mockVehicleService.getVehicles.mockRejectedValue(new Error('Failed'));

      await vehicleController.getVehicles(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('registerVehicle', () => {
    it('should return 201 with created vehicle', async () => {
      const req = {
        user: { user_id: 'u1' },
        body: { registration: 'ABC', province: 'BKK', brand: 'Toyota', model: 'Camry', color: 'White', card_id: 'c1' },
      } as AuthRequest;
      const res = mockRes();
      const vehicle = { vehicle_id: 'v1' };
      mockVehicleService.registerVehicle.mockResolvedValue(vehicle as any);

      await vehicleController.registerVehicle(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(vehicle);
    });

    it('should return 400 if fields missing', async () => {
      const req = {
        user: { user_id: 'u1' },
        body: { registration: 'ABC' },
      } as AuthRequest;
      const res = mockRes();

      await vehicleController.registerVehicle(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 if card not found', async () => {
      const req = {
        user: { user_id: 'u1' },
        body: { registration: 'ABC', province: 'BKK', brand: 'Toyota', model: 'Camry', color: 'White', card_id: 'c1' },
      } as AuthRequest;
      const res = mockRes();
      mockVehicleService.registerVehicle.mockRejectedValue(new Error('Card not found.'));

      await vehicleController.registerVehicle(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 403 if card not owned', async () => {
      const req = {
        user: { user_id: 'u1' },
        body: { registration: 'ABC', province: 'BKK', brand: 'Toyota', model: 'Camry', color: 'White', card_id: 'c1' },
      } as AuthRequest;
      const res = mockRes();
      mockVehicleService.registerVehicle.mockRejectedValue(new Error('You do not own this card.'));

      await vehicleController.registerVehicle(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('updateVehicle', () => {
    it('should return 200 with updated vehicle', async () => {
      const req = {
        user: { user_id: 'u1' },
        params: { vehicle_id: 'v1' },
        body: { province: 'CNX' },
      } as unknown as AuthRequest;
      const res = mockRes();
      mockVehicleService.updateVehicle.mockResolvedValue({ vehicle_id: 'v1' } as any);

      await vehicleController.updateVehicle(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if vehicle not found', async () => {
      const req = {
        user: { user_id: 'u1' },
        params: { vehicle_id: 'v1' },
        body: {},
      } as unknown as AuthRequest;
      const res = mockRes();
      mockVehicleService.updateVehicle.mockRejectedValue(new Error('Vehicle not found.'));

      await vehicleController.updateVehicle(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 403 if no access', async () => {
      const req = {
        user: { user_id: 'u1' },
        params: { vehicle_id: 'v1' },
        body: {},
      } as unknown as AuthRequest;
      const res = mockRes();
      mockVehicleService.updateVehicle.mockRejectedValue(new Error('You do not have access to this vehicle.'));

      await vehicleController.updateVehicle(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('deleteVehicle', () => {
    it('should return 204 on success', async () => {
      const req = {
        user: { user_id: 'u1' },
        params: { vehicle_id: 'v1' },
      } as unknown as AuthRequest;
      const res = mockRes();
      mockVehicleService.deleteVehicle.mockResolvedValue(undefined as any);

      await vehicleController.deleteVehicle(req, res);

      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it('should return 404 if vehicle not found', async () => {
      const req = {
        user: { user_id: 'u1' },
        params: { vehicle_id: 'v1' },
      } as unknown as AuthRequest;
      const res = mockRes();
      mockVehicleService.deleteVehicle.mockRejectedValue(new Error('Vehicle not found.'));

      await vehicleController.deleteVehicle(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 403 if no access', async () => {
      const req = {
        user: { user_id: 'u1' },
        params: { vehicle_id: 'v1' },
      } as unknown as AuthRequest;
      const res = mockRes();
      mockVehicleService.deleteVehicle.mockRejectedValue(new Error('You do not have access to this vehicle.'));

      await vehicleController.deleteVehicle(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});
