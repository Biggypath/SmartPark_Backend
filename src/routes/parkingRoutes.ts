import { Router } from 'express';
import { getSlots, reserve, getParkingDetails, cancelReserve } from '../controllers/parkingController.js';

const router = Router();

// Define endpoints
router.get('/slots', getSlots);        // For 3D Digital Twin
router.post('/reserve', reserve);      // For User App
router.get('/parking-details', getParkingDetails); // For User App - Get parking details by license plate
router.put('/cancel-reservation/:reservationId', cancelReserve); // For User App - Cancel reservation

export default router;