import type { Response } from 'express';
import type { AuthRequest } from '../types/index.js';
import * as adminService from '../services/adminService.js';

export const createLot = async (req: AuthRequest, res: Response) => {
  try {
    const { name, mall_id, program_id, location, rate_per_hour, slots, roads } = req.body;

    if (!name || !mall_id || !program_id || !Array.isArray(slots) || slots.length === 0) {
      res.status(400).json({ error: 'name, mall_id, program_id, and a non-empty slots array are required.' });
      return;
    }

    for (const slot of slots) {
      if (!slot.slot_id || !slot.location_coordinates || slot.rotation === undefined) {
        res.status(400).json({ error: 'Each slot must have slot_id, location_coordinates, and rotation.' });
        return;
      }
    }

    if (roads && Array.isArray(roads)) {
      for (const road of roads) {
        if (road.cx === undefined || road.cy === undefined || road.w === undefined || road.d === undefined || road.horizontal === undefined) {
          res.status(400).json({ error: 'Each road must have cx, cy, w, d, and horizontal.' });
          return;
        }
      }
    }

    const lot = await adminService.createLotWithSlots({
      name,
      mall_id,
      program_id,
      location,
      rate_per_hour,
      slots,
      ...(Array.isArray(roads) ? { roads } : {}),
    });

    res.status(201).json(lot);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create parking lot.';
    res.status(500).json({ error: message });
  }
};

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

// ---------------------------------------------------------
// Mall endpoints
// ---------------------------------------------------------

export const getMalls = async (_req: AuthRequest, res: Response) => {
  try {
    const malls = await adminService.getAllMalls();
    res.status(200).json(malls);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch malls.';
    res.status(500).json({ error: message });
  }
};

export const createMall = async (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string') {
      res.status(400).json({ error: 'name is required.' });
      return;
    }
    const mall = await adminService.createMall(name);
    res.status(201).json(mall);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create mall.';
    res.status(500).json({ error: message });
  }
};

export const updateMall = async (req: AuthRequest, res: Response) => {
  try {
    const mall_id = req.params.mall_id as string;
    const { name } = req.body;
    if (!name || typeof name !== 'string') {
      res.status(400).json({ error: 'name is required.' });
      return;
    }
    const mall = await adminService.updateMall(mall_id, name);
    res.status(200).json(mall);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update mall.';
    res.status(500).json({ error: message });
  }
};

export const deleteMall = async (req: AuthRequest, res: Response) => {
  try {
    const mall_id = req.params.mall_id as string;
    await adminService.deleteMall(mall_id);
    res.status(204).send();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete mall.';
    res.status(500).json({ error: message });
  }
};

// ---------------------------------------------------------
// Programs endpoint
// ---------------------------------------------------------

export const getPrograms = async (_req: AuthRequest, res: Response) => {
  try {
    const programs = await adminService.getAllPrograms();
    res.status(200).json(programs);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch programs.';
    res.status(500).json({ error: message });
  }
};

// ---------------------------------------------------------
// Lot management endpoints
// ---------------------------------------------------------

export const updateLot = async (req: AuthRequest, res: Response) => {
  try {
    const lot_id = req.params.lot_id as string;
    const { name, program_id } = req.body;
    if (!name && !program_id) {
      res.status(400).json({ error: 'At least one of name or program_id is required.' });
      return;
    }
    const data: { name?: string; program_id?: string } = {};
    if (name) data.name = name;
    if (program_id) data.program_id = program_id;
    const lot = await adminService.updateLot(lot_id, data);
    res.status(200).json(lot);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update lot.';
    res.status(500).json({ error: message });
  }
};

export const deleteLot = async (req: AuthRequest, res: Response) => {
  try {
    const lot_id = req.params.lot_id as string;
    await adminService.deleteLot(lot_id);
    res.status(204).send();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete lot.';
    res.status(500).json({ error: message });
  }
};

// ---------------------------------------------------------
// Slot management endpoints
// ---------------------------------------------------------

export const toggleSlotActive = async (req: AuthRequest, res: Response) => {
  try {
    const slot_id = req.params.slot_id as string;
    const slot = await adminService.toggleSlotActive(slot_id);
    res.status(200).json(slot);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to toggle slot.';
    res.status(500).json({ error: message });
  }
};

export const deleteSlot = async (req: AuthRequest, res: Response) => {
  try {
    const slot_id = req.params.slot_id as string;
    await adminService.deleteSlot(slot_id);
    res.status(204).send();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete slot.';
    res.status(500).json({ error: message });
  }
};
