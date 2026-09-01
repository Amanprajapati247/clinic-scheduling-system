import { Router } from 'express';
import { VisitNoteController } from '../controllers/visitNoteController';
import { authenticateJwt, requireProvider } from '../middleware/authMiddleware';
import { validateBody } from '../middleware/validatorMiddleware';
import { createVisitNoteSchema, updateVisitNoteSchema } from '../validators/visitNoteValidators';

const router = Router();

router.use(authenticateJwt);

router.post(
  '/appointment/:appointmentId',
  requireProvider,
  validateBody(createVisitNoteSchema),
  VisitNoteController.createNote
);

router.patch(
  '/:noteId',
  requireProvider,
  validateBody(updateVisitNoteSchema),
  VisitNoteController.updateNote
);

router.get(
  '/appointment/:appointmentId',
  VisitNoteController.getNotesForAppointment
);

export default router;
