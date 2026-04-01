import bcrypt from 'bcrypt';
import * as userRepo from '../repositories/userRepository.js';
import { generateToken } from '../middleware/authMiddleware.js';

const SALT_ROUNDS = 10;

export const register = async (email: string, password: string, name: string) => {
  const existing = await userRepo.findUserByEmail(email);
  if (existing) {
    throw new Error('Email is already registered.');
  }

  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await userRepo.createUser({ email, password_hash, name });

  const token = generateToken(user.user_id, user.role);

  const { password_hash: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, token };
};

export const login = async (email: string, password: string) => {
  const user = await userRepo.findUserByEmail(email);
  if (!user) {
    throw new Error('Invalid email or password.');
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    throw new Error('Invalid email or password.');
  }

  const token = generateToken(user.user_id, user.role);

  const { password_hash: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, token };
};
