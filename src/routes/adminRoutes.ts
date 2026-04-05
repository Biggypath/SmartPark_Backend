import { Router } from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware.js';
import * as adminController from '../controllers/adminController.js';

const router = Router();

// All admin routes require authentication + ADMIN role
router.use(authMiddleware);
router.use(adminMiddleware);

// Create a new parking lot with slots
router.post('/lots', adminController.createLot);

// View all parking sessions (with optional filters)
router.get('/sessions', adminController.getSessions);

// View all sensor logs (with optional filters)
router.get('/logs', adminController.getSensorLogs);

export default router;
