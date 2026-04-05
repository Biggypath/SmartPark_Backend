import { Router } from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware.js';
import * as adminController from '../controllers/adminController.js';

const router = Router();

// All admin routes require authentication + ADMIN role
router.use(authMiddleware);
router.use(adminMiddleware);

// Malls
router.get('/malls', adminController.getMalls);
router.post('/malls', adminController.createMall);
router.patch('/malls/:mall_id', adminController.updateMall);
router.delete('/malls/:mall_id', adminController.deleteMall);

// Privilege programs
router.get('/programs', adminController.getPrograms);

// Parking lots
router.post('/lots', adminController.createLot);
router.patch('/lots/:lot_id', adminController.updateLot);
router.delete('/lots/:lot_id', adminController.deleteLot);

// Slots
router.patch('/lots/:lot_id/slots/:slot_id', adminController.toggleSlotActive);
router.delete('/lots/:lot_id/slots/:slot_id', adminController.deleteSlot);

// View all parking sessions (with optional filters)
router.get('/sessions', adminController.getSessions);

// View all sensor logs (with optional filters)
router.get('/logs', adminController.getSensorLogs);

export default router;
