import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import * as cardController from '../controllers/cardController.js';
import * as vehicleController from '../controllers/vehicleController.js';

const router = Router();

// All user routes require authentication
router.use(authMiddleware);

// Card management
router.post('/cards', cardController.addCard);
router.put('/cards/:card_id', cardController.updateCard);
router.delete('/cards/:card_id', cardController.deleteCard);

// Vehicle management
router.post('/vehicles', vehicleController.registerVehicle);
router.put('/vehicles/:vehicle_id', vehicleController.updateVehicle);
router.delete('/vehicles/:vehicle_id', vehicleController.deleteVehicle);

export default router;
