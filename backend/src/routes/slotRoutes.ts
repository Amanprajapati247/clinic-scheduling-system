import { Router } from 'express';
import { SlotController } from '../controllers/slotController';
import { authenticateJwt } from '../middleware/authMiddleware';
import { validateBody } from '../middleware/validatorMiddleware';
import { createSlotSchema, updateSlotSchema } from '../validators/slotValidators';

const router = Router();

router.use(authenticateJwt);

router.post('/', validateBody(createSlotSchema), SlotController.createSlot);
router.get('/', SlotController.getSlots);
router.patch('/:id', validateBody(updateSlotSchema), SlotController.updateSlot);
router.patch('/:id/archive', SlotController.archiveSlot);
router.patch('/:id/restore', SlotController.restoreSlot);

export default router;
