import { Router } from 'express';
import { AlertController } from '../controllers/alertController';
import { authenticateJwt, requireFrontDesk } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateJwt);
router.use(requireFrontDesk); // Alerts are managed by Front Desk

router.get('/', AlertController.getActiveAlerts);
router.post('/dismiss', AlertController.dismissAlert);

export default router;
