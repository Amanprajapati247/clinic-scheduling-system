import { Router } from 'express';
import { ScheduleController } from '../controllers/scheduleController';
import { authenticateJwt } from '../middleware/authMiddleware';
import { validateBody } from '../middleware/validatorMiddleware';
import { bulkRecurringSlotsSchema } from '../validators/slotValidators';

const router = Router();

router.use(authenticateJwt);

router.post(
  '/bulk-generate',
  validateBody(bulkRecurringSlotsSchema),
  ScheduleController.generateBulkSlots
);

router.get('/export-csv', ScheduleController.exportDailyScheduleCSV);

export default router;
