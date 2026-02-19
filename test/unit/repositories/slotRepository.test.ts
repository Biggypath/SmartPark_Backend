const mockPrisma = {
  parkingSlot: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

jest.mock('../../../src/config/db', () => ({
  prisma: mockPrisma,
}));

import * as slotRepo from '../../../src/repositories/slotRepository';

describe('slotRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllSlots', () => {
    it('should return all slots ordered by slot_id', async () => {
      const mockSlots = [
        { slot_id: 'A1', status: 'FREE' },
        { slot_id: 'A2', status: 'OCCUPIED' },
      ];
      mockPrisma.parkingSlot.findMany.mockResolvedValue(mockSlots);

      const result = await slotRepo.getAllSlots();

      expect(result).toEqual(mockSlots);
      expect(mockPrisma.parkingSlot.findMany).toHaveBeenCalledWith({
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
  });
});
