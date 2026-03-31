import * as cardRepo from '../repositories/cardRepository.js';

export const getCards = async (userId: string) => {
  return cardRepo.findCardsByUserId(userId);
};

export const addCard = async (userId: string, programId: string) => {
  return cardRepo.createCard({ user_id: userId, program_id: programId });
};

export const updateCard = async (userId: string, cardId: string, data: { is_active?: boolean }) => {
  const card = await cardRepo.findCardById(cardId);
  if (!card) {
    throw new Error('Card not found.');
  }
  if (card.user_id !== userId) {
    throw new Error('You do not own this card.');
  }
  return cardRepo.updateCard(cardId, data);
};

export const deleteCard = async (userId: string, cardId: string) => {
  const card = await cardRepo.findCardById(cardId);
  if (!card) {
    throw new Error('Card not found.');
  }
  if (card.user_id !== userId) {
    throw new Error('You do not own this card.');
  }
  return cardRepo.deleteCard(cardId);
};
