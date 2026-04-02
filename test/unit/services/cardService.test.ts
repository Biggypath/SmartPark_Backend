jest.mock('../../../src/repositories/cardRepository.js', () => ({
  createCard: jest.fn(),
  findCardById: jest.fn(),
  findCardsByUserId: jest.fn(),
  findProgramByBin: jest.fn(),
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
    it('should derive fields from card number and create card', async () => {
      const program = { program_id: 'p1', eligible_bins: ['411111'] } as any;
      mockCardRepo.findProgramByBin.mockResolvedValue(program);
      const mockCard = { card_id: 'c1' } as any;
      mockCardRepo.createCard.mockResolvedValue(mockCard);

      const result = await cardService.addCard('u1', '4111111111111111', 12, 2028, 'JOHN DOE', 'Personal');

      expect(mockCardRepo.findProgramByBin).toHaveBeenCalledWith('411111');
      expect(mockCardRepo.createCard).toHaveBeenCalledWith({
        user_id: 'u1',
        program_id: 'p1',
        network: 'VISA',
        bin: '411111',
        last_four: '1111',
        expiry_month: 12,
        expiry_year: 2028,
        cardholder_name: 'JOHN DOE',
        label: 'Personal',
      });
      expect(result).toEqual(mockCard);
    });

    it('should throw if card number is invalid', async () => {
      await expect(cardService.addCard('u1', '123', 12, 2028)).rejects.toThrow('Invalid card number.');
    });

    it('should throw if no privilege program matches the BIN', async () => {
      mockCardRepo.findProgramByBin.mockResolvedValue(null);

      await expect(cardService.addCard('u1', '4111111111111111', 12, 2028))
        .rejects.toThrow('No privilege program found for this card.');
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
