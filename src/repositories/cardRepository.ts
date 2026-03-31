import { prisma } from '../config/db.js';

export const createCard = async (data: { user_id: string; program_id: string }) => {
  return prisma.userCard.create({
    data,
    include: { program: true }
  });
};

export const findCardById = async (cardId: string) => {
  return prisma.userCard.findUnique({ where: { card_id: cardId } });
};

export const updateCard = async (cardId: string, data: { is_active?: boolean }) => {
  return prisma.userCard.update({
    where: { card_id: cardId },
    data,
    include: { program: true }
  });
};

export const deleteCard = async (cardId: string) => {
  return prisma.userCard.delete({ where: { card_id: cardId } });
};

export const findCardsByUserId = async (userId: string) => {
  return prisma.userCard.findMany({
    where: { user_id: userId },
    include: { program: true }
  });
};
