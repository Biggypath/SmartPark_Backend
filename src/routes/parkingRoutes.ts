import { Router } from 'express';
import * as parkingController from '../controllers/parkingController.js';

const router = Router();

// Public: get all slot statuses for the 3D Digital Twin dashboard
router.get('/dashboard', parkingController.getDashboard);

// Public: check active parking session by license plate (guest + registered)
router.get('/session', parkingController.checkSession);

export default router;
