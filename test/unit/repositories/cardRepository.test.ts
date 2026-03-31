const mockPrisma = {
  userCard: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
  },
};

jest.mock('../../../src/config/db.js', () => ({
  prisma: mockPrisma,
}));

import * as cardRepo from '../../../src/repositories/cardRepository.js';

describe('cardRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCard', () => {
    it('should create a card with program info', async () => {
      const data = { user_id: 'u1', program_id: 'p1' };
      const mockCard = { card_id: 'c1', ...data, program: { provider_name: 'SCB' } };
      mockPrisma.userCard.create.mockResolvedValue(mockCard);

      const result = await cardRepo.createCard(data);

      expect(result).toEqual(mockCard);
      expect(mockPrisma.userCard.create).toHaveBeenCalledWith({
        data,
        include: { program: true },
      });
    });
  });

  describe('findCardById', () => {
    it('should return a card', async () => {
      const mockCard = { card_id: 'c1', user_id: 'u1' };
      mockPrisma.userCard.findUnique.mockResolvedValue(mockCard);

      const result = await cardRepo.findCardById('c1');

      expect(result).toEqual(mockCard);
      expect(mockPrisma.userCard.findUnique).toHaveBeenCalledWith({ where: { card_id: 'c1' } });
    });

    it('should return null when not found', async () => {
      mockPrisma.userCard.findUnique.mockResolvedValue(null);
      const result = await cardRepo.findCardById('none');
      expect(result).toBeNull();
    });
  });

  describe('updateCard', () => {
    it('should update a card', async () => {
      const mockCard = { card_id: 'c1', is_active: false };
      mockPrisma.userCard.update.mockResolvedValue(mockCard);

      const result = await cardRepo.updateCard('c1', { is_active: false });

      expect(result).toEqual(mockCard);
      expect(mockPrisma.userCard.update).toHaveBeenCalledWith({
        where: { card_id: 'c1' },
        data: { is_active: false },
        include: { program: true },
      });
    });
  });

  describe('deleteCard', () => {
    it('should delete a card', async () => {
      mockPrisma.userCard.delete.mockResolvedValue({ card_id: 'c1' });

      const result = await cardRepo.deleteCard('c1');

      expect(result).toEqual({ card_id: 'c1' });
      expect(mockPrisma.userCard.delete).toHaveBeenCalledWith({ where: { card_id: 'c1' } });
    });
  });

  describe('findCardsByUserId', () => {
    it('should return all cards for a user', async () => {
      const mockCards = [{ card_id: 'c1' }, { card_id: 'c2' }];
      mockPrisma.userCard.findMany.mockResolvedValue(mockCards);

      const result = await cardRepo.findCardsByUserId('u1');

      expect(result).toEqual(mockCards);
      expect(mockPrisma.userCard.findMany).toHaveBeenCalledWith({
        where: { user_id: 'u1' },
        include: { program: true },
      });
    });
  });
});
