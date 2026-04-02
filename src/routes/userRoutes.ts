import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import * as cardController from '../controllers/cardController.js';
import * as vehicleController from '../controllers/vehicleController.js';
import * as parkingController from '../controllers/parkingController.js';

const router = Router();

// All user routes require authentication
router.use(authMiddleware);

// Card management
router.get('/cards', cardController.getCards);
router.post('/cards', cardController.addCard);
router.put('/cards/:card_id', cardController.updateCard);
router.delete('/cards/:card_id', cardController.deleteCard);

// Vehicle management
router.get('/vehicles', vehicleController.getVehicles);
router.post('/vehicles', vehicleController.registerVehicle);
router.put('/vehicles/:vehicle_id', vehicleController.updateVehicle);
router.delete('/vehicles/:vehicle_id', vehicleController.deleteVehicle);

// Parking history
router.get('/parking/history', parkingController.getParkingHistory);

export default router;
