import type { Request, Response } from 'express';
import * as parkingService from '../services/parkingService.js';

export const getDashboard = async (_req: Request, res: Response) => {
  try {
    const slots = await parkingService.getDashboardData();
    res.status(200).json(slots);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch dashboard data.';
    res.status(500).json({ error: message });
  }
};

export const checkSession = async (req: Request, res: Response) => {
  try {
    const { registration, province } = req.query;

    if (!registration || !province) {
      res.status(400).json({ error: 'registration and province query parameters are required.' });
      return;
    }

    const session = await parkingService.checkSession(
      registration as string,
      province as string
    );

    if (!session) {
      res.status(404).json({ error: 'No active parking session found for this vehicle.' });
      return;
    }

    res.status(200).json(session);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to check session.';
    res.status(500).json({ error: message });
  }
};
