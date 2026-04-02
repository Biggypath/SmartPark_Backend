import type { Request, Response } from 'express';
import type { AuthRequest } from '../types/index.js';
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

export const getLots = async (_req: Request, res: Response) => {
  try {
    const lots = await parkingService.getLots();
    res.status(200).json(lots);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch lots.';
    res.status(500).json({ error: message });
  }
};

export const getLotDashboard = async (req: Request<{ lotId: string }>, res: Response) => {
  try {
    const { lotId } = req.params;
    const slots = await parkingService.getDashboardByLot(lotId);
    res.status(200).json(slots);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch lot dashboard.';
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

export const getParkingHistory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.user_id;
    const history = await parkingService.getParkingHistory(userId);
    res.status(200).json(history);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch parking history.';
    res.status(500).json({ error: message });
  }
};
