import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { registerSchema, loginSchema, updatePreferencesSchema } from '../schemas/authSchemas';

const router = Router();
const authController = new AuthController();

// Public routes
router.post('/register', validateRequest(registerSchema), authController.register.bind(authController));
router.post('/login', validateRequest(loginSchema), authController.login.bind(authController));

// Protected routes
router.get('/profile', authenticateToken, authController.getProfile.bind(authController));
router.put('/preferences', authenticateToken, validateRequest(updatePreferencesSchema), authController.updatePreferences.bind(authController));
router.delete('/account', authenticateToken, authController.deleteAccount.bind(authController));

export default router;

