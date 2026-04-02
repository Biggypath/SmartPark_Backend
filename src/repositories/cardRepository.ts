import { prisma } from '../config/db.js';
import type { CardNetwork } from '@prisma/client';

export const createCard = async (data: {
  user_id: string;
  program_id: string;
  cardholder_name?: string;
  label?: string;
  network: CardNetwork;
  bin: string;
  last_four: string;
  expiry_month: number;
  expiry_year: number;
}) => {
  return prisma.userCard.create({
    data,
    include: { program: true }
  });
};

export const findProgramByBin = async (bin: string) => {
  return prisma.privilegeProgram.findFirst({
    where: {
      is_active: true,
      eligible_bins: { has: bin }
    }
  });
};

export const findCardById = async (cardId: string) => {
  return prisma.userCard.findUnique({ where: { card_id: cardId } });
};

export const updateCard = async (cardId: string, data: { is_active?: boolean; label?: string; cardholder_name?: string }) => {
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
