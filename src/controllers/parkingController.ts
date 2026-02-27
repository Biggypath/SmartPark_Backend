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
  console.log("Request Body received:", req.body);
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

export const cancelReserve = async (req: Request, res: Response) => {
  try {
    const { reservationId } = req.params;
    if (typeof reservationId !== 'string') {
      return res.status(400).json({ error: 'reservationId parameter is required and must be a string.' });
    }
    const result = await parkingService.cancelReservation(reservationId);
    res.json({ success: true, message: 'Reservation cancelled successfully.', data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};