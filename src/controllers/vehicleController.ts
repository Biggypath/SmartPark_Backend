import type { Response } from 'express';
import type { AuthRequest } from '../types/index.js';
import * as vehicleService from '../services/vehicleService.js';

export const getVehicles = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.user_id;
    const vehicles = await vehicleService.getVehicles(userId);
    res.status(200).json(vehicles);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to get vehicles.';
    res.status(400).json({ error: message });
  }
};

export const registerVehicle = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.user_id;
    const { registration, province, card_id } = req.body;
    if (!registration || !province || !card_id) {
      res.status(400).json({ error: 'registration, province, and card_id are required.' });
      return;
    }
    const vehicle = await vehicleService.registerVehicle(userId, registration, province, card_id);
    res.status(201).json(vehicle);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to register vehicle.';
    const status = message.includes('not found') ? 404 : message.includes('own') ? 403 : 400;
    res.status(status).json({ error: message });
  }
};

export const updateVehicle = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.user_id;
    const vehicle_id = req.params.vehicle_id as string;
    const vehicle = await vehicleService.updateVehicle(userId, vehicle_id, req.body);
    res.status(200).json(vehicle);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update vehicle.';
    const status = message.includes('not found') ? 404 : message.includes('access') ? 403 : 400;
    res.status(status).json({ error: message });
  }
};

export const deleteVehicle = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.user_id;
    const vehicle_id = req.params.vehicle_id as string;
    await vehicleService.deleteVehicle(userId, vehicle_id);
    res.status(204).send();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete vehicle.';
    const status = message.includes('not found') ? 404 : message.includes('access') ? 403 : 400;
    res.status(status).json({ error: message });
  }
};
