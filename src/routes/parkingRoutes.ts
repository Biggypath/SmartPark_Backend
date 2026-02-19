import { Router } from 'express';
import { getSlots, reserve, getParkingDetails } from '../controllers/parkingController.js';

const router = Router();

// Define endpoints
router.get('/slots', getSlots);        // For 3D Digital Twin
router.post('/reserve', reserve);      // For User App
router.get('/parking-details', getParkingDetails); // For User App - Get parking details by license plate

export default router;