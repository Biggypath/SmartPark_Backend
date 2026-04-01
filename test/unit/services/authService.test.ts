jest.mock('../../../src/repositories/userRepository.js', () => ({
  createUser: jest.fn(),
  findUserByEmail: jest.fn(),
}));

jest.mock('../../../src/middleware/authMiddleware.js', () => ({
  generateToken: jest.fn().mockReturnValue('mock-jwt-token'),
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn(),
}));

import * as authService from '../../../src/services/authService.js';
import * as userRepo from '../../../src/repositories/userRepository.js';
import bcrypt from 'bcrypt';

const mockUserRepo = userRepo as jest.Mocked<typeof userRepo>;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user and return token', async () => {
      mockUserRepo.findUserByEmail.mockResolvedValue(null);
      mockUserRepo.createUser.mockResolvedValue({
        user_id: 'u1',
        email: 'a@b.com',
        password_hash: 'hashed-password',
        name: 'Test',
        role: 'USER',
        created_at: new Date(),
      });

      const result = await authService.register('a@b.com', 'pass123', 'Test');

      expect(result.token).toBe('mock-jwt-token');
      expect(result.user).toEqual(expect.objectContaining({ email: 'a@b.com', name: 'Test' }));
      expect(result.user).not.toHaveProperty('password_hash');
      expect(mockUserRepo.createUser).toHaveBeenCalledWith({
        email: 'a@b.com',
        password_hash: 'hashed-password',
        name: 'Test',
      });
    });

    it('should throw if email already exists', async () => {
      mockUserRepo.findUserByEmail.mockResolvedValue({
        user_id: 'u1',
        email: 'a@b.com',
        password_hash: 'h',
        name: 'T',
        role: 'USER',
        created_at: new Date(),
      });

      await expect(authService.register('a@b.com', 'pass', 'T'))
        .rejects.toThrow('Email is already registered.');
    });
  });

  describe('login', () => {
    it('should login and return token', async () => {
      mockUserRepo.findUserByEmail.mockResolvedValue({
        user_id: 'u1',
        email: 'a@b.com',
        password_hash: 'hashed',
        name: 'Test',
        role: 'USER',
        created_at: new Date(),
      });
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.login('a@b.com', 'pass123');

      expect(result.token).toBe('mock-jwt-token');
      expect(result.user).not.toHaveProperty('password_hash');
    });

    it('should throw if email not found', async () => {
      mockUserRepo.findUserByEmail.mockResolvedValue(null);

      await expect(authService.login('none@b.com', 'pass'))
        .rejects.toThrow('Invalid email or password.');
    });

    it('should throw if password is wrong', async () => {
      mockUserRepo.findUserByEmail.mockResolvedValue({
        user_id: 'u1',
        email: 'a@b.com',
        password_hash: 'hashed',
        name: 'Test',
        role: 'USER',
        created_at: new Date(),
      });
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.login('a@b.com', 'wrong'))
        .rejects.toThrow('Invalid email or password.');
    });
  });
});
