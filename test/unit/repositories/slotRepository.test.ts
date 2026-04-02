const mockPrisma = {
  privilegeParking: {
    findMany: jest.fn(),
  },
  parkingSlot: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

jest.mock('../../../src/config/db.js', () => ({
  prisma: mockPrisma,
}));

import * as slotRepo from '../../../src/repositories/slotRepository.js';

describe('slotRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllLots', () => {
    it('should return all lots with mall and program', async () => {
      const mockLots = [
        { lot_id: 'l1', name: 'SCB First', mall: { name: 'CentralWorld' }, program: { provider_name: 'SCB First' } },
      ];
      mockPrisma.privilegeParking.findMany.mockResolvedValue(mockLots);

      const result = await slotRepo.getAllLots();

      expect(result).toEqual(mockLots);
      expect(mockPrisma.privilegeParking.findMany).toHaveBeenCalledWith({
        include: { mall: true, program: true },
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('getAllSlots', () => {
    it('should return all slots ordered by slot_id', async () => {
      const mockSlots = [
        { slot_id: 'A1', status: 'FREE', lot: { name: 'The 1 Card' } },
        { slot_id: 'A2', status: 'OCCUPIED', lot: { name: 'The 1 Card' } },
      ];
      mockPrisma.parkingSlot.findMany.mockResolvedValue(mockSlots);

      const result = await slotRepo.getAllSlots();

      expect(result).toEqual(mockSlots);
      expect(mockPrisma.parkingSlot.findMany).toHaveBeenCalledWith({
        include: { lot: true },
        orderBy: { slot_id: 'asc' },
      });
    });

    it('should return empty array when no slots exist', async () => {
      mockPrisma.parkingSlot.findMany.mockResolvedValue([]);

      const result = await slotRepo.getAllSlots();

      expect(result).toEqual([]);
    });
  });

  describe('findSlotById', () => {
    it('should return a slot by ID', async () => {
      const mockSlot = { slot_id: 'A1', status: 'FREE' };
      mockPrisma.parkingSlot.findUnique.mockResolvedValue(mockSlot);

      const result = await slotRepo.findSlotById('A1');

      expect(result).toEqual(mockSlot);
      expect(mockPrisma.parkingSlot.findUnique).toHaveBeenCalledWith({
        where: { slot_id: 'A1' },
      });
    });

    it('should return null if slot not found', async () => {
      mockPrisma.parkingSlot.findUnique.mockResolvedValue(null);

      const result = await slotRepo.findSlotById('Z99');

      expect(result).toBeNull();
    });
  });

  describe('updateSlotStatus', () => {
    it('should update slot status to OCCUPIED', async () => {
      const mockUpdated = { slot_id: 'A1', status: 'OCCUPIED' };
      mockPrisma.parkingSlot.update.mockResolvedValue(mockUpdated);

      const result = await slotRepo.updateSlotStatus('A1', 'OCCUPIED' as any);

      expect(result).toEqual(mockUpdated);
      expect(mockPrisma.parkingSlot.update).toHaveBeenCalledWith({
        where: { slot_id: 'A1' },
        data: { status: 'OCCUPIED' },
      });
    });

    it('should update slot status to FREE', async () => {
      const mockUpdated = { slot_id: 'A1', status: 'FREE' };
      mockPrisma.parkingSlot.update.mockResolvedValue(mockUpdated);

      const result = await slotRepo.updateSlotStatus('A1', 'FREE' as any);

      expect(result).toEqual(mockUpdated);
      expect(mockPrisma.parkingSlot.update).toHaveBeenCalledWith({
        where: { slot_id: 'A1' },
        data: { status: 'FREE' },
      });
    });

    it('should update slot status to ASSIGNED', async () => {
      const mockUpdated = { slot_id: 'A1', status: 'ASSIGNED' };
      mockPrisma.parkingSlot.update.mockResolvedValue(mockUpdated);

      const result = await slotRepo.updateSlotStatus('A1', 'ASSIGNED' as any);

      expect(result).toEqual(mockUpdated);
      expect(mockPrisma.parkingSlot.update).toHaveBeenCalledWith({
        where: { slot_id: 'A1' },
        data: { status: 'ASSIGNED' },
      });
    });
  });
});
