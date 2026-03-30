const mockPrisma = {
  parkingSlot: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
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
        { slot_id: 'GEN-A1', status: 'FREE', slot_type: 'GENERAL' },
        { slot_id: 'VIP-A1', status: 'OCCUPIED', slot_type: 'VIP' },
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
      const mockSlot = { slot_id: 'VIP-A1', status: 'FREE', slot_type: 'VIP' };
      mockPrisma.parkingSlot.findUnique.mockResolvedValue(mockSlot);

      const result = await slotRepo.findSlotById('VIP-A1');

      expect(result).toEqual(mockSlot);
      expect(mockPrisma.parkingSlot.findUnique).toHaveBeenCalledWith({
        where: { slot_id: 'VIP-A1' },
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
      const mockUpdated = { slot_id: 'GEN-A1', status: 'OCCUPIED' };
      mockPrisma.parkingSlot.update.mockResolvedValue(mockUpdated);

      const result = await slotRepo.updateSlotStatus('GEN-A1', 'OCCUPIED' as any);

      expect(result).toEqual(mockUpdated);
      expect(mockPrisma.parkingSlot.update).toHaveBeenCalledWith({
        where: { slot_id: 'GEN-A1' },
        data: { status: 'OCCUPIED' },
      });
    });

    it('should update slot status to FREE', async () => {
      const mockUpdated = { slot_id: 'GEN-A1', status: 'FREE' };
      mockPrisma.parkingSlot.update.mockResolvedValue(mockUpdated);

      const result = await slotRepo.updateSlotStatus('GEN-A1', 'FREE' as any);

      expect(result).toEqual(mockUpdated);
      expect(mockPrisma.parkingSlot.update).toHaveBeenCalledWith({
        where: { slot_id: 'GEN-A1' },
        data: { status: 'FREE' },
      });
    });

    it('should update slot status to ASSIGNED', async () => {
      const mockUpdated = { slot_id: 'VIP-A1', status: 'ASSIGNED' };
      mockPrisma.parkingSlot.update.mockResolvedValue(mockUpdated);

      const result = await slotRepo.updateSlotStatus('VIP-A1', 'ASSIGNED' as any);

      expect(result).toEqual(mockUpdated);
      expect(mockPrisma.parkingSlot.update).toHaveBeenCalledWith({
        where: { slot_id: 'VIP-A1' },
        data: { status: 'ASSIGNED' },
      });
    });
  });

  describe('findFreeSlotByType', () => {
    it('should find a free VIP slot', async () => {
      const mockSlot = { slot_id: 'VIP-A1', status: 'FREE', slot_type: 'VIP', is_active: true };
      mockPrisma.parkingSlot.findFirst.mockResolvedValue(mockSlot);

      const result = await slotRepo.findFreeSlotByType('VIP' as any);

      expect(result).toEqual(mockSlot);
      expect(mockPrisma.parkingSlot.findFirst).toHaveBeenCalledWith({
        where: { status: 'FREE', slot_type: 'VIP', is_active: true },
        orderBy: { slot_id: 'asc' },
      });
    });

    it('should find a free GENERAL slot', async () => {
      const mockSlot = { slot_id: 'GEN-A1', status: 'FREE', slot_type: 'GENERAL', is_active: true };
      mockPrisma.parkingSlot.findFirst.mockResolvedValue(mockSlot);

      const result = await slotRepo.findFreeSlotByType('GENERAL' as any);

      expect(result).toEqual(mockSlot);
      expect(mockPrisma.parkingSlot.findFirst).toHaveBeenCalledWith({
        where: { status: 'FREE', slot_type: 'GENERAL', is_active: true },
        orderBy: { slot_id: 'asc' },
      });
    });

    it('should return null when no free slot of type available', async () => {
      mockPrisma.parkingSlot.findFirst.mockResolvedValue(null);

      const result = await slotRepo.findFreeSlotByType('VIP' as any);

      expect(result).toBeNull();
    });
  });
});
