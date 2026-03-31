const mockPrisma = {
  registeredVehicle: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

jest.mock('../../../src/config/db.js', () => ({
  prisma: mockPrisma,
}));

import * as vehicleRepo from '../../../src/repositories/vehicleRepository.js';

describe('vehicleRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createVehicle', () => {
    it('should create a vehicle linked to cards', async () => {
      const mockVehicle = { vehicle_id: 'v1', registration: 'ABC', cards: [] };
      mockPrisma.registeredVehicle.create.mockResolvedValue(mockVehicle);

      const result = await vehicleRepo.createVehicle({
        registration: 'ABC',
        province: 'BKK',
        cardIds: ['c1'],
      });

      expect(result).toEqual(mockVehicle);
      expect(mockPrisma.registeredVehicle.create).toHaveBeenCalledWith({
        data: {
          registration: 'ABC',
          province: 'BKK',
          cards: { connect: [{ card_id: 'c1' }] },
        },
        include: { cards: true },
      });
    });
  });

  describe('findVehicleById', () => {
    it('should return vehicle with cards', async () => {
      const mockVehicle = { vehicle_id: 'v1', cards: [{ card_id: 'c1' }] };
      mockPrisma.registeredVehicle.findUnique.mockResolvedValue(mockVehicle);

      const result = await vehicleRepo.findVehicleById('v1');

      expect(result).toEqual(mockVehicle);
      expect(mockPrisma.registeredVehicle.findUnique).toHaveBeenCalledWith({
        where: { vehicle_id: 'v1' },
        include: { cards: true },
      });
    });

    it('should return null when not found', async () => {
      mockPrisma.registeredVehicle.findUnique.mockResolvedValue(null);
      const result = await vehicleRepo.findVehicleById('none');
      expect(result).toBeNull();
    });
  });

  describe('updateVehicle', () => {
    it('should update registration only', async () => {
      const mockVehicle = { vehicle_id: 'v1', registration: 'XYZ' };
      mockPrisma.registeredVehicle.update.mockResolvedValue(mockVehicle);

      const result = await vehicleRepo.updateVehicle('v1', { registration: 'XYZ' });

      expect(result).toEqual(mockVehicle);
      expect(mockPrisma.registeredVehicle.update).toHaveBeenCalledWith({
        where: { vehicle_id: 'v1' },
        data: { registration: 'XYZ' },
        include: { cards: true },
      });
    });

    it('should update cards when cardIds provided', async () => {
      const mockVehicle = { vehicle_id: 'v1', cards: [{ card_id: 'c2' }] };
      mockPrisma.registeredVehicle.update.mockResolvedValue(mockVehicle);

      const result = await vehicleRepo.updateVehicle('v1', { cardIds: ['c2'] });

      expect(result).toEqual(mockVehicle);
      expect(mockPrisma.registeredVehicle.update).toHaveBeenCalledWith({
        where: { vehicle_id: 'v1' },
        data: { cards: { set: [{ card_id: 'c2' }] } },
        include: { cards: true },
      });
    });

    it('should update province and registration together', async () => {
      const mockVehicle = { vehicle_id: 'v1' };
      mockPrisma.registeredVehicle.update.mockResolvedValue(mockVehicle);

      await vehicleRepo.updateVehicle('v1', { registration: 'ABC', province: 'CNX' });

      expect(mockPrisma.registeredVehicle.update).toHaveBeenCalledWith({
        where: { vehicle_id: 'v1' },
        data: { registration: 'ABC', province: 'CNX' },
        include: { cards: true },
      });
    });
  });

  describe('findVehiclesByUserId', () => {
    it('should return vehicles linked to user cards', async () => {
      const mockVehicles = [{ vehicle_id: 'v1', cards: [{ card_id: 'c1' }] }];
      mockPrisma.registeredVehicle.findMany.mockResolvedValue(mockVehicles);

      const result = await vehicleRepo.findVehiclesByUserId('u1');

      expect(result).toEqual(mockVehicles);
      expect(mockPrisma.registeredVehicle.findMany).toHaveBeenCalledWith({
        where: { cards: { some: { user_id: 'u1' } } },
        include: { cards: true },
      });
    });
  });

  describe('deleteVehicle', () => {
    it('should disconnect cards then delete vehicle', async () => {
      mockPrisma.registeredVehicle.update.mockResolvedValue({});
      mockPrisma.registeredVehicle.delete.mockResolvedValue({ vehicle_id: 'v1' });

      const result = await vehicleRepo.deleteVehicle('v1');

      expect(result).toEqual({ vehicle_id: 'v1' });
      expect(mockPrisma.registeredVehicle.update).toHaveBeenCalledWith({
        where: { vehicle_id: 'v1' },
        data: { cards: { set: [] } },
      });
      expect(mockPrisma.registeredVehicle.delete).toHaveBeenCalledWith({
        where: { vehicle_id: 'v1' },
      });
    });
  });
});
