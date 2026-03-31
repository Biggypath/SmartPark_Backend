jest.mock('../../../src/repositories/vehicleRepository.js', () => ({
  createVehicle: jest.fn(),
  findVehicleById: jest.fn(),
  updateVehicle: jest.fn(),
  deleteVehicle: jest.fn(),
}));

jest.mock('../../../src/repositories/cardRepository.js', () => ({
  findCardById: jest.fn(),
  findCardsByUserId: jest.fn(),
}));

import * as vehicleService from '../../../src/services/vehicleService.js';
import * as vehicleRepo from '../../../src/repositories/vehicleRepository.js';
import * as cardRepo from '../../../src/repositories/cardRepository.js';

const mockVehicleRepo = vehicleRepo as jest.Mocked<typeof vehicleRepo>;
const mockCardRepo = cardRepo as jest.Mocked<typeof cardRepo>;

describe('vehicleService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerVehicle', () => {
    it('should register a vehicle linked to a card', async () => {
      mockCardRepo.findCardById.mockResolvedValue({ card_id: 'c1', user_id: 'u1' } as any);
      const mockVehicle = { vehicle_id: 'v1', registration: 'ABC', province: 'BKK', cards: [] } as any;
      mockVehicleRepo.createVehicle.mockResolvedValue(mockVehicle);

      const result = await vehicleService.registerVehicle('u1', 'ABC', 'BKK', 'c1');

      expect(result).toEqual(mockVehicle);
      expect(mockVehicleRepo.createVehicle).toHaveBeenCalledWith({
        registration: 'ABC',
        province: 'BKK',
        cardIds: ['c1'],
      });
    });

    it('should throw if card not found', async () => {
      mockCardRepo.findCardById.mockResolvedValue(null);

      await expect(vehicleService.registerVehicle('u1', 'ABC', 'BKK', 'c1'))
        .rejects.toThrow('Card not found.');
    });

    it('should throw if card belongs to another user', async () => {
      mockCardRepo.findCardById.mockResolvedValue({ card_id: 'c1', user_id: 'other' } as any);

      await expect(vehicleService.registerVehicle('u1', 'ABC', 'BKK', 'c1'))
        .rejects.toThrow('You do not own this card.');
    });
  });

  describe('updateVehicle', () => {
    it('should update vehicle when user has access', async () => {
      mockVehicleRepo.findVehicleById.mockResolvedValue({
        vehicle_id: 'v1',
        cards: [{ card_id: 'c1' }],
      } as any);
      mockCardRepo.findCardsByUserId.mockResolvedValue([{ card_id: 'c1' }] as any);
      mockVehicleRepo.updateVehicle.mockResolvedValue({ vehicle_id: 'v1', province: 'CNX' } as any);

      const result = await vehicleService.updateVehicle('u1', 'v1', { province: 'CNX' });

      expect(result).toEqual({ vehicle_id: 'v1', province: 'CNX' });
    });

    it('should throw if vehicle not found', async () => {
      mockVehicleRepo.findVehicleById.mockResolvedValue(null);

      await expect(vehicleService.updateVehicle('u1', 'v1', {}))
        .rejects.toThrow('Vehicle not found.');
    });

    it('should throw if user has no access to the vehicle', async () => {
      mockVehicleRepo.findVehicleById.mockResolvedValue({
        vehicle_id: 'v1',
        cards: [{ card_id: 'c1' }],
      } as any);
      mockCardRepo.findCardsByUserId.mockResolvedValue([{ card_id: 'c99' }] as any);

      await expect(vehicleService.updateVehicle('u1', 'v1', {}))
        .rejects.toThrow('You do not have access to this vehicle.');
    });

    it('should throw if target card for update not owned', async () => {
      mockVehicleRepo.findVehicleById.mockResolvedValue({
        vehicle_id: 'v1',
        cards: [{ card_id: 'c1' }],
      } as any);
      mockCardRepo.findCardsByUserId.mockResolvedValue([{ card_id: 'c1' }] as any);
      mockCardRepo.findCardById.mockResolvedValue({ card_id: 'c2', user_id: 'other' } as any);

      await expect(vehicleService.updateVehicle('u1', 'v1', { card_id: 'c2' }))
        .rejects.toThrow('You do not own the target card.');
    });

    it('should update card link when user owns the new card', async () => {
      mockVehicleRepo.findVehicleById.mockResolvedValue({
        vehicle_id: 'v1',
        cards: [{ card_id: 'c1' }],
      } as any);
      mockCardRepo.findCardsByUserId.mockResolvedValue([{ card_id: 'c1' }, { card_id: 'c2' }] as any);
      mockCardRepo.findCardById.mockResolvedValue({ card_id: 'c2', user_id: 'u1' } as any);
      mockVehicleRepo.updateVehicle.mockResolvedValue({ vehicle_id: 'v1' } as any);

      await vehicleService.updateVehicle('u1', 'v1', { card_id: 'c2' });

      expect(mockVehicleRepo.updateVehicle).toHaveBeenCalledWith('v1', { cardIds: ['c2'] });
    });
  });

  describe('deleteVehicle', () => {
    it('should delete vehicle when user has access', async () => {
      mockVehicleRepo.findVehicleById.mockResolvedValue({
        vehicle_id: 'v1',
        cards: [{ card_id: 'c1' }],
      } as any);
      mockCardRepo.findCardsByUserId.mockResolvedValue([{ card_id: 'c1' }] as any);
      mockVehicleRepo.deleteVehicle.mockResolvedValue({ vehicle_id: 'v1' } as any);

      await vehicleService.deleteVehicle('u1', 'v1');

      expect(mockVehicleRepo.deleteVehicle).toHaveBeenCalledWith('v1');
    });

    it('should throw if vehicle not found', async () => {
      mockVehicleRepo.findVehicleById.mockResolvedValue(null);

      await expect(vehicleService.deleteVehicle('u1', 'v1'))
        .rejects.toThrow('Vehicle not found.');
    });

    it('should throw if user has no access', async () => {
      mockVehicleRepo.findVehicleById.mockResolvedValue({
        vehicle_id: 'v1',
        cards: [{ card_id: 'c1' }],
      } as any);
      mockCardRepo.findCardsByUserId.mockResolvedValue([{ card_id: 'c99' }] as any);

      await expect(vehicleService.deleteVehicle('u1', 'v1'))
        .rejects.toThrow('You do not have access to this vehicle.');
    });
  });
});
