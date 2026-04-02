jest.mock('../../../src/services/profileService.js', () => ({
  getProfile: jest.fn(),
  updateProfile: jest.fn(),
}));

import * as profileController from '../../../src/controllers/profileController.js';
import * as profileService from '../../../src/services/profileService.js';
import type { AuthRequest } from '../../../src/types/index.js';

const mockProfileService = profileService as jest.Mocked<typeof profileService>;

const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('profileController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should return 200 with profile', async () => {
      const req = { user: { user_id: 'u1' } } as AuthRequest;
      const res = mockRes();
      const profile = { user_id: 'u1', name: 'Test', email: 'a@b.com' };
      mockProfileService.getProfile.mockResolvedValue(profile as any);

      await profileController.getProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(profile);
    });

    it('should return 404 when user not found', async () => {
      const req = { user: { user_id: 'u1' } } as AuthRequest;
      const res = mockRes();
      mockProfileService.getProfile.mockRejectedValue(new Error('User not found.'));

      await profileController.getProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 400 on generic error', async () => {
      const req = { user: { user_id: 'u1' } } as AuthRequest;
      const res = mockRes();
      mockProfileService.getProfile.mockRejectedValue(new Error('Something failed'));

      await profileController.getProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('updateProfile', () => {
    it('should return 200 with updated profile', async () => {
      const req = { user: { user_id: 'u1' }, body: { name: 'New Name' } } as AuthRequest;
      const res = mockRes();
      const profile = { user_id: 'u1', name: 'New Name' };
      mockProfileService.updateProfile.mockResolvedValue(profile as any);

      await profileController.updateProfile(req, res);

      expect(mockProfileService.updateProfile).toHaveBeenCalledWith('u1', { name: 'New Name' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(profile);
    });

    it('should return 404 when user not found', async () => {
      const req = { user: { user_id: 'u1' }, body: {} } as AuthRequest;
      const res = mockRes();
      mockProfileService.updateProfile.mockRejectedValue(new Error('User not found.'));

      await profileController.updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
