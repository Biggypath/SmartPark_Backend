import type { Response } from 'express';
import type { AuthRequest } from '../types/index.js';
import * as profileService from '../services/profileService.js';

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.user_id;
    const profile = await profileService.getProfile(userId);
    res.status(200).json(profile);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to get profile.';
    const status = message.includes('not found') ? 404 : 400;
    res.status(status).json({ error: message });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.user_id;
    const profile = await profileService.updateProfile(userId, req.body);
    res.status(200).json(profile);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update profile.';
    const status = message.includes('not found') ? 404 : 400;
    res.status(status).json({ error: message });
  }
};
