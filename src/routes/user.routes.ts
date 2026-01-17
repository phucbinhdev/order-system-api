import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import auth from '../middlewares/auth.middleware';
import authorize from '../middlewares/role.middleware';
import branchScope from '../middlewares/branch.middleware';
import validate from '../middlewares/validate.middleware';
import * as authValidation from '../validations/auth.validation';

const router = Router();

router.use(auth, authorize('admin', 'superadmin'), branchScope);

router.get('/', userController.getAll);
router.get('/:id', userController.getById);
router.post('/', validate(authValidation.register), userController.create);
router.put('/:id', validate(authValidation.updateUser), userController.update);
router.delete('/:id', userController.remove);
router.patch('/:id/password', userController.changePassword);

export default router;
