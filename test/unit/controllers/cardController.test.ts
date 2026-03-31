jest.mock('../../../src/services/cardService.js', () => ({
  getCards: jest.fn(),
  addCard: jest.fn(),
  updateCard: jest.fn(),
  deleteCard: jest.fn(),
}));

import * as cardController from '../../../src/controllers/cardController.js';
import * as cardService from '../../../src/services/cardService.js';
import type { AuthRequest } from '../../../src/types/index.js';

const mockCardService = cardService as jest.Mocked<typeof cardService>;

const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

describe('cardController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCards', () => {
    it('should return 200 with cards list', async () => {
      const req = { user: { user_id: 'u1' } } as AuthRequest;
      const res = mockRes();
      const cards = [{ card_id: 'c1' }, { card_id: 'c2' }];
      mockCardService.getCards.mockResolvedValue(cards as any);

      await cardController.getCards(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(cards);
    });

    it('should return 400 on error', async () => {
      const req = { user: { user_id: 'u1' } } as AuthRequest;
      const res = mockRes();
      mockCardService.getCards.mockRejectedValue(new Error('Failed'));

      await cardController.getCards(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('addCard', () => {
    it('should return 201 with created card', async () => {
      const req = { user: { user_id: 'u1' }, body: { program_id: 'p1' } } as AuthRequest;
      const res = mockRes();
      const card = { card_id: 'c1', user_id: 'u1', program_id: 'p1' };
      mockCardService.addCard.mockResolvedValue(card as any);

      await cardController.addCard(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(card);
    });

    it('should return 400 if program_id missing', async () => {
      const req = { user: { user_id: 'u1' }, body: {} } as AuthRequest;
      const res = mockRes();

      await cardController.addCard(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 on service error', async () => {
      const req = { user: { user_id: 'u1' }, body: { program_id: 'p1' } } as AuthRequest;
      const res = mockRes();
      mockCardService.addCard.mockRejectedValue(new Error('Failed'));

      await cardController.addCard(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('updateCard', () => {
    it('should return 200 with updated card', async () => {
      const req = {
        user: { user_id: 'u1' },
        params: { card_id: 'c1' },
        body: { is_active: false },
      } as unknown as AuthRequest;
      const res = mockRes();
      mockCardService.updateCard.mockResolvedValue({ card_id: 'c1', is_active: false } as any);

      await cardController.updateCard(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 when card not found', async () => {
      const req = {
        user: { user_id: 'u1' },
        params: { card_id: 'c1' },
        body: {},
      } as unknown as AuthRequest;
      const res = mockRes();
      mockCardService.updateCard.mockRejectedValue(new Error('Card not found.'));

      await cardController.updateCard(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 403 when card not owned', async () => {
      const req = {
        user: { user_id: 'u1' },
        params: { card_id: 'c1' },
        body: {},
      } as unknown as AuthRequest;
      const res = mockRes();
      mockCardService.updateCard.mockRejectedValue(new Error('You do not own this card.'));

      await cardController.updateCard(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('deleteCard', () => {
    it('should return 204 on success', async () => {
      const req = {
        user: { user_id: 'u1' },
        params: { card_id: 'c1' },
      } as unknown as AuthRequest;
      const res = mockRes();
      mockCardService.deleteCard.mockResolvedValue(undefined as any);

      await cardController.deleteCard(req, res);

      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it('should return 404 when card not found', async () => {
      const req = {
        user: { user_id: 'u1' },
        params: { card_id: 'c1' },
      } as unknown as AuthRequest;
      const res = mockRes();
      mockCardService.deleteCard.mockRejectedValue(new Error('Card not found.'));

      await cardController.deleteCard(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
