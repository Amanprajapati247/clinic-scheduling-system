import { Router } from 'express';
import { DashboardController } from '../controllers/dashboardController';
import { authenticateJwt } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateJwt);

router.get('/metrics', DashboardController.getMetrics);

export default router;
