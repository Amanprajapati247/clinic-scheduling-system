import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticateJwt } from '../middleware/authMiddleware';
import { validateBody } from '../middleware/validatorMiddleware';
import { registerSchema, loginSchema } from '../validators/authValidators';

const router = Router();

router.post('/register', validateBody(registerSchema), AuthController.register);
router.post('/login', validateBody(loginSchema), AuthController.login);
router.get('/me', authenticateJwt, AuthController.getMe);
router.get('/providers', authenticateJwt, AuthController.getAllProviders);

export default router;
