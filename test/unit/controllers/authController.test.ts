jest.mock('../../../src/services/authService.js', () => ({
  register: jest.fn(),
  login: jest.fn(),
}));

import * as authController from '../../../src/controllers/authController.js';
import * as authService from '../../../src/services/authService.js';
import type { AuthRequest } from '../../../src/types/index.js';

const mockAuthService = authService as jest.Mocked<typeof authService>;

const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('authController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should return 201 with user and token', async () => {
      const req = { body: { email: 'a@b.com', password: 'pass', name: 'Test' } } as AuthRequest;
      const res = mockRes();
      const payload = { user: { user_id: 'u1', email: 'a@b.com', name: 'Test' }, token: 'jwt' };
      mockAuthService.register.mockResolvedValue(payload as any);

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(payload);
    });

    it('should return 400 if fields are missing', async () => {
      const req = { body: { email: 'a@b.com' } } as AuthRequest;
      const res = mockRes();

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 409 on duplicate email', async () => {
      const req = { body: { email: 'a@b.com', password: 'pass', name: 'T' } } as AuthRequest;
      const res = mockRes();
      mockAuthService.register.mockRejectedValue(new Error('Email is already registered.'));

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ error: 'Email is already registered.' });
    });
  });

  describe('login', () => {
    it('should return 200 with token', async () => {
      const req = { body: { email: 'a@b.com', password: 'pass' } } as AuthRequest;
      const res = mockRes();
      const payload = { user: { user_id: 'u1' }, token: 'jwt' };
      mockAuthService.login.mockResolvedValue(payload as any);

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(payload);
    });

    it('should return 400 if fields are missing', async () => {
      const req = { body: { email: 'a@b.com' } } as AuthRequest;
      const res = mockRes();

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 401 on invalid credentials', async () => {
      const req = { body: { email: 'a@b.com', password: 'wrong' } } as AuthRequest;
      const res = mockRes();
      mockAuthService.login.mockRejectedValue(new Error('Invalid email or password.'));

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid email or password.' });
    });
  });
});
