import { Router } from 'express';
import { TimelineController } from '../controllers/timelineController';
import { authenticateJwt } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateJwt);

router.get('/:appointmentId', TimelineController.getTimeline);

export default router;
