import { prisma } from '../config/db.js';

export const createUser = async (data: {
  email: string;
  password_hash: string;
  name: string;
}) => {
  return prisma.user.create({ data });
};

export const findUserByEmail = async (email: string) => {
  return prisma.user.findUnique({ where: { email } });
};

export const findUserById = async (userId: string) => {
  return prisma.user.findUnique({ where: { user_id: userId } });
};
