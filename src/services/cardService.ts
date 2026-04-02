import * as cardRepo from '../repositories/cardRepository.js';
import type { CardNetwork } from '@prisma/client';

/**
 * Detect the card network from the card number using standard BIN ranges.
 */
const detectNetwork = (cardNumber: string): CardNetwork => {
  if (/^4/.test(cardNumber)) return 'VISA';
  if (/^5[1-5]/.test(cardNumber) || /^2[2-7]/.test(cardNumber)) return 'MASTERCARD';
  if (/^35(2[89]|[3-8])/.test(cardNumber)) return 'JCB';
  if (/^3[47]/.test(cardNumber)) return 'AMEX';
  if (/^62/.test(cardNumber)) return 'UNIONPAY';
  return 'OTHER';
};

export const getCards = async (userId: string) => {
  return cardRepo.findCardsByUserId(userId);
};

export const addCard = async (
  userId: string,
  cardNumber: string,
  expiryMonth: number,
  expiryYear: number
) => {
  const digits = cardNumber.replace(/\D/g, '');

  if (digits.length < 13 || digits.length > 19) {
    throw new Error('Invalid card number.');
  }

  const bin = digits.slice(0, 6);
  const lastFour = digits.slice(-4);
  const network = detectNetwork(digits);

  // Auto-match the privilege program by BIN
  const program = await cardRepo.findProgramByBin(bin);
  if (!program) {
    throw new Error('No privilege program found for this card.');
  }

  return cardRepo.createCard({
    user_id: userId,
    program_id: program.program_id,
    network,
    bin,
    last_four: lastFour,
    expiry_month: expiryMonth,
    expiry_year: expiryYear,
  });
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
