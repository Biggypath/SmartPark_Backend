import { Router } from 'express';
import * as parkingController from '../controllers/parkingController.js';

const router = Router();

// Public: list all parking lots
router.get('/lots', parkingController.getLots);

// Public: get slots for a specific lot (3D Digital Twin per-lot dashboard)
router.get('/lots/:lotId/slots', parkingController.getLotDashboard);

// Public: get all slot statuses for the 3D Digital Twin dashboard
router.get('/dashboard', parkingController.getDashboard);

// Public: check active parking session by license plate (guest + registered)
router.get('/session', parkingController.checkSession);

export default router;
