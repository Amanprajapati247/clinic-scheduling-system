import { Router } from 'express';
import { AppointmentController } from '../controllers/appointmentController';
import { authenticateJwt, requireFrontDesk } from '../middleware/authMiddleware';
import { validateBody, validateQuery } from '../middleware/validatorMiddleware';
import {
  createAppointmentSchema,
  updateStatusSchema,
  cancelAppointmentSchema,
  reassignProviderSchema,
  supportingProviderSchema,
  searchAppointmentsSchema,
} from '../validators/appointmentValidators';

const router = Router();

router.use(authenticateJwt);

router.post('/', validateBody(createAppointmentSchema), AppointmentController.createAppointment);
router.get('/', validateQuery(searchAppointmentsSchema), AppointmentController.searchAppointments);
router.get('/:id', AppointmentController.getAppointmentById);
router.patch('/:id/status', validateBody(updateStatusSchema), AppointmentController.updateStatus);
router.post('/:id/cancel', validateBody(cancelAppointmentSchema), AppointmentController.cancelAppointment);
router.post(
  '/:id/reassign',
  requireFrontDesk,
  validateBody(reassignProviderSchema),
  AppointmentController.reassignProvider
);
router.post(
  '/:id/supporting-providers',
  validateBody(supportingProviderSchema),
  AppointmentController.addSupportingProvider
);
router.delete(
  '/:id/supporting-providers/:providerId',
  AppointmentController.removeSupportingProvider
);

export default router;
