jest.mock('../../../src/repositories/userRepository.js', () => ({
  findUserById: jest.fn(),
  updateUser: jest.fn(),
}));

import * as profileService from '../../../src/services/profileService.js';
import * as userRepo from '../../../src/repositories/userRepository.js';

const mockUserRepo = userRepo as jest.Mocked<typeof userRepo>;

describe('profileService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should return user profile without password_hash', async () => {
      const mockUser = {
        user_id: 'u1',
        email: 'a@b.com',
        name: 'Test',
        password_hash: 'secret',
        birthday: null,
        gender: null,
      };
      mockUserRepo.findUserById.mockResolvedValue(mockUser as any);

      const result = await profileService.getProfile('u1');

      expect(result).toEqual({
        user_id: 'u1',
        email: 'a@b.com',
        name: 'Test',
        birthday: null,
        gender: null,
      });
      expect(result).not.toHaveProperty('password_hash');
    });

    it('should throw if user not found', async () => {
      mockUserRepo.findUserById.mockResolvedValue(null);

      await expect(profileService.getProfile('u1')).rejects.toThrow('User not found.');
    });
  });

  describe('updateProfile', () => {
    it('should update name', async () => {
      const mockUser = { user_id: 'u1', password_hash: 'h' };
      mockUserRepo.findUserById.mockResolvedValue(mockUser as any);
      const updated = { user_id: 'u1', name: 'New', password_hash: 'h' };
      mockUserRepo.updateUser.mockResolvedValue(updated as any);

      const result = await profileService.updateProfile('u1', { name: 'New' });

      expect(mockUserRepo.updateUser).toHaveBeenCalledWith('u1', { name: 'New' });
      expect(result).not.toHaveProperty('password_hash');
    });

    it('should update birthday and gender', async () => {
      const mockUser = { user_id: 'u1', password_hash: 'h' };
      mockUserRepo.findUserById.mockResolvedValue(mockUser as any);
      const updated = { user_id: 'u1', password_hash: 'h', birthday: new Date('1990-01-01'), gender: 'MALE' };
      mockUserRepo.updateUser.mockResolvedValue(updated as any);

      const result = await profileService.updateProfile('u1', { birthday: '1990-01-01', gender: 'MALE' });

      expect(mockUserRepo.updateUser).toHaveBeenCalledWith('u1', {
        birthday: new Date('1990-01-01'),
        gender: 'MALE',
      });
      expect(result).not.toHaveProperty('password_hash');
    });

    it('should set birthday to null when empty string', async () => {
      const mockUser = { user_id: 'u1', password_hash: 'h' };
      mockUserRepo.findUserById.mockResolvedValue(mockUser as any);
      mockUserRepo.updateUser.mockResolvedValue({ user_id: 'u1', password_hash: 'h', birthday: null } as any);

      await profileService.updateProfile('u1', { birthday: '' });

      expect(mockUserRepo.updateUser).toHaveBeenCalledWith('u1', { birthday: null });
    });

    it('should throw if user not found', async () => {
      mockUserRepo.findUserById.mockResolvedValue(null);

      await expect(profileService.updateProfile('u1', { name: 'New' })).rejects.toThrow('User not found.');
    });
  });
});
