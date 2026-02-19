jest.mock('../../../src/services/parkingService', () => ({
  getDashboardData: jest.fn(),
  reserveParkingSlot: jest.fn(),
  processEntryEvent: jest.fn(),
  getParkingDetails: jest.fn(),
}));

import { Request, Response } from 'express';
import * as parkingController from '../../../src/controllers/parkingController';
import * as parkingService from '../../../src/services/parkingService';

const mockedService = parkingService as jest.Mocked<typeof parkingService>;

const mockResponse = (): Response => {
  const res = {} as Response;
  res.json = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  return res;
};

describe('parkingController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSlots', () => {
    it('should return slots data with 200 status', async () => {
      const mockSlots = [
        { slot_id: 'A1', status: 'FREE' },
        { slot_id: 'A2', status: 'OCCUPIED' },
      ];
      mockedService.getDashboardData.mockResolvedValue(mockSlots as any);

      const req = {} as Request;
      const res = mockResponse();

      await parkingController.getSlots(req, res);

      expect(mockedService.getDashboardData).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith(mockSlots);
    });

    it('should return 500 on internal error', async () => {
      mockedService.getDashboardData.mockRejectedValue(new Error('DB Error'));

      const req = {} as Request;
      const res = mockResponse();

      await parkingController.getSlots(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
    });
  });

  describe('reserve', () => {
    it('should return 201 with reservation data on success', async () => {
      const mockReservation = {
        reservation_id: 'res-1',
        slot_id: 'A1',
        license_plate: 'ABC123',
        status: 'ACTIVE',
      };
      mockedService.reserveParkingSlot.mockResolvedValue(mockReservation as any);

      const req = { body: { slotId: 'A1', licensePlate: 'ABC123' } } as Request;
      const res = mockResponse();

      await parkingController.reserve(req, res);

      expect(mockedService.reserveParkingSlot).toHaveBeenCalledWith('A1', 'ABC123');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockReservation });
    });

    it('should return 400 when slot is already taken', async () => {
      mockedService.reserveParkingSlot.mockRejectedValue(
        new Error('Slot is already taken or invalid.')
      );

      const req = { body: { slotId: 'A1', licensePlate: 'ABC123' } } as Request;
      const res = mockResponse();

      await parkingController.reserve(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Slot is already taken or invalid.',
      });
    });

    it('should pass slotId and licensePlate from request body', async () => {
      mockedService.reserveParkingSlot.mockResolvedValue({} as any);

      const req = { body: { slotId: 'C5', licensePlate: 'XYZ789' } } as Request;
      const res = mockResponse();

      await parkingController.reserve(req, res);

      expect(mockedService.reserveParkingSlot).toHaveBeenCalledWith('C5', 'XYZ789');
    });
  });

  describe('getParkingDetails', () => {
    it('should return parking details for valid license plate', async () => {
      const mockDetails = {
        sessionId: 'sess-1',
        slotId: 'A1',
        licensePlate: 'ABC123',
        entryTime: new Date('2026-02-19T10:00:00Z'),
        currentTime: new Date('2026-02-19T12:00:00Z'),
        totalFee: 40,
      };
      mockedService.getParkingDetails.mockResolvedValue(mockDetails);

      const req = { query: { licensePlate: 'ABC123' } } as unknown as Request;
      const res = mockResponse();

      await parkingController.getParkingDetails(req, res);

      expect(mockedService.getParkingDetails).toHaveBeenCalledWith('ABC123');
      expect(res.json).toHaveBeenCalledWith(mockDetails);
    });

    it('should return 400 if licensePlate query param is missing', async () => {
      const req = { query: {} } as Request;
      const res = mockResponse();

      await parkingController.getParkingDetails(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'licensePlate query parameter is required and must be a string.',
      });
    });

    it('should return 400 if licensePlate is not a string', async () => {
      const req = { query: { licensePlate: ['ABC', 'DEF'] } } as unknown as Request;
      const res = mockResponse();

      await parkingController.getParkingDetails(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 500 on service error', async () => {
      mockedService.getParkingDetails.mockRejectedValue(new Error('DB Error'));

      const req = { query: { licensePlate: 'ABC123' } } as unknown as Request;
      const res = mockResponse();

      await parkingController.getParkingDetails(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Internal Server Error' })
      );
    });
  });
});
