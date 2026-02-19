import type { Request, Response } from 'express';
import * as parkingService from '../services/parkingService.js';

export const getSlots = async (req: Request, res: Response) => {
  try {
    const data = await parkingService.getDashboardData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const reserve = async (req: Request, res: Response) => {
  try {
    const { slotId, licensePlate } = req.body;
    const result = await parkingService.reserveParkingSlot(slotId, licensePlate);
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    // Return 400 for logic errors (e.g., Slot Taken)
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getParkingDetails = async (req: Request, res: Response) => {
  try {
    const { licensePlate } = req.query;
    if (typeof licensePlate !== 'string') {
      return res.status(400).json({ error: 'licensePlate query parameter is required and must be a string.' });
    }
    const details = await parkingService.getParkingDetails(licensePlate);
    res.json(details);
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
};