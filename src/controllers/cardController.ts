import type { Response } from 'express';
import type { AuthRequest } from '../types/index.js';
import * as cardService from '../services/cardService.js';

export const addCard = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.user_id;
    const { program_id } = req.body;
    if (!program_id) {
      res.status(400).json({ error: 'program_id is required.' });
      return;
    }
    const card = await cardService.addCard(userId, program_id);
    res.status(201).json(card);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to add card.';
    res.status(400).json({ error: message });
  }
};

export const updateCard = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.user_id;
    const card_id = req.params.card_id as string;
    const card = await cardService.updateCard(userId, card_id, req.body);
    res.status(200).json(card);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update card.';
    const status = message.includes('not found') ? 404 : message.includes('own') ? 403 : 400;
    res.status(status).json({ error: message });
  }
};

export const deleteCard = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.user_id;
    const card_id = req.params.card_id as string;
    await cardService.deleteCard(userId, card_id);
    res.status(204).send();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete card.';
    const status = message.includes('not found') ? 404 : message.includes('own') ? 403 : 400;
    res.status(status).json({ error: message });
  }
};
