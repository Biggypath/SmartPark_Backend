import type { Response } from 'express';
import type { AuthRequest } from '../types/index.js';
import * as adminService from '../services/adminService.js';

export const getSessions = async (req: AuthRequest, res: Response) => {
  try {
    const { status, registration } = req.query;
    const filters: { status?: 'active' | 'completed'; registration?: string } = {};
    if (status === 'active' || status === 'completed') filters.status = status;
    if (typeof registration === 'string') filters.registration = registration;
    const sessions = await adminService.getSessions(filters);
    res.status(200).json(sessions);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch sessions.';
    res.status(500).json({ error: message });
  }
};

export const getSensorLogs = async (req: AuthRequest, res: Response) => {
  try {
    const { slot_id, event_type } = req.query;
    const filters: { slot_id?: string; event_type?: string } = {};
    if (typeof slot_id === 'string') filters.slot_id = slot_id;
    if (typeof event_type === 'string') filters.event_type = event_type;
    const logs = await adminService.getSensorLogs(filters);
    res.status(200).json(logs);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch sensor logs.';
    res.status(500).json({ error: message });
  }
};
