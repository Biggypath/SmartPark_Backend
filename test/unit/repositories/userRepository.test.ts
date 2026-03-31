const mockPrisma = {
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
  },
};

jest.mock('../../../src/config/db.js', () => ({
  prisma: mockPrisma,
}));

import * as userRepo from '../../../src/repositories/userRepository.js';

describe('userRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a user', async () => {
      const data = { email: 'a@b.com', password_hash: 'hashed', name: 'Test' };
      const mockUser = { user_id: 'u1', ...data, created_at: new Date() };
      mockPrisma.user.create.mockResolvedValue(mockUser);

      const result = await userRepo.createUser(data);

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({ data });
    });
  });

  describe('findUserByEmail', () => {
    it('should return user when found', async () => {
      const mockUser = { user_id: 'u1', email: 'a@b.com' };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await userRepo.findUserByEmail('a@b.com');

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'a@b.com' } });
    });

    it('should return null when not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await userRepo.findUserByEmail('none@b.com');

      expect(result).toBeNull();
    });
  });

  describe('findUserById', () => {
    it('should return user when found', async () => {
      const mockUser = { user_id: 'u1', email: 'a@b.com' };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await userRepo.findUserById('u1');

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { user_id: 'u1' } });
    });

    it('should return null when not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await userRepo.findUserById('nonexistent');

      expect(result).toBeNull();
    });
  });
});
