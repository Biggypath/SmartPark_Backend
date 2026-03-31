jest.mock('../../../src/repositories/cardRepository.js', () => ({
  createCard: jest.fn(),
  findCardById: jest.fn(),
  findCardsByUserId: jest.fn(),
  updateCard: jest.fn(),
  deleteCard: jest.fn(),
}));

import * as cardService from '../../../src/services/cardService.js';
import * as cardRepo from '../../../src/repositories/cardRepository.js';

const mockCardRepo = cardRepo as jest.Mocked<typeof cardRepo>;

describe('cardService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCards', () => {
    it('should return all cards for the user', async () => {
      const mockCards = [{ card_id: 'c1' }, { card_id: 'c2' }] as any;
      mockCardRepo.findCardsByUserId.mockResolvedValue(mockCards);

      const result = await cardService.getCards('u1');

      expect(result).toEqual(mockCards);
      expect(mockCardRepo.findCardsByUserId).toHaveBeenCalledWith('u1');
    });
  });

  describe('addCard', () => {
    it('should create a card', async () => {
      const mockCard = { card_id: 'c1', user_id: 'u1', program_id: 'p1' } as any;
      mockCardRepo.createCard.mockResolvedValue(mockCard);

      const result = await cardService.addCard('u1', 'p1');

      expect(result).toEqual(mockCard);
      expect(mockCardRepo.createCard).toHaveBeenCalledWith({ user_id: 'u1', program_id: 'p1' });
    });
  });

  describe('updateCard', () => {
    it('should update card when user owns it', async () => {
      mockCardRepo.findCardById.mockResolvedValue({ card_id: 'c1', user_id: 'u1' } as any);
      mockCardRepo.updateCard.mockResolvedValue({ card_id: 'c1', is_active: false } as any);

      const result = await cardService.updateCard('u1', 'c1', { is_active: false });

      expect(result).toEqual({ card_id: 'c1', is_active: false });
    });

    it('should throw if card not found', async () => {
      mockCardRepo.findCardById.mockResolvedValue(null);

      await expect(cardService.updateCard('u1', 'c1', {})).rejects.toThrow('Card not found.');
    });

    it('should throw if user does not own card', async () => {
      mockCardRepo.findCardById.mockResolvedValue({ card_id: 'c1', user_id: 'other' } as any);

      await expect(cardService.updateCard('u1', 'c1', {})).rejects.toThrow('You do not own this card.');
    });
  });

  describe('deleteCard', () => {
    it('should delete card when user owns it', async () => {
      mockCardRepo.findCardById.mockResolvedValue({ card_id: 'c1', user_id: 'u1' } as any);
      mockCardRepo.deleteCard.mockResolvedValue({ card_id: 'c1' } as any);

      await cardService.deleteCard('u1', 'c1');

      expect(mockCardRepo.deleteCard).toHaveBeenCalledWith('c1');
    });

    it('should throw if card not found', async () => {
      mockCardRepo.findCardById.mockResolvedValue(null);

      await expect(cardService.deleteCard('u1', 'c1')).rejects.toThrow('Card not found.');
    });

    it('should throw if user does not own card', async () => {
      mockCardRepo.findCardById.mockResolvedValue({ card_id: 'c1', user_id: 'other' } as any);

      await expect(cardService.deleteCard('u1', 'c1')).rejects.toThrow('You do not own this card.');
    });
  });
});
