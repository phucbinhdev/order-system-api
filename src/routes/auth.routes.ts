import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import auth from '../middlewares/auth.middleware';
import validate from '../middlewares/validate.middleware';
import * as authValidation from '../validations/auth.validation';

const router = Router();

router.post('/login', validate(authValidation.login), authController.login);
router.post('/refresh', validate(authValidation.refreshToken), authController.refresh);
router.post('/logout', auth, authController.logout);
router.get('/me', auth, authController.getMe);

export default router;
