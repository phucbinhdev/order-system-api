import { Router } from 'express';
import * as categoryController from '../controllers/category.controller';
import auth from '../middlewares/auth.middleware';
import authorize from '../middlewares/role.middleware';
import validate from '../middlewares/validate.middleware';
import * as crudValidation from '../validations/crud.validation';

const router = Router();

// Public: Get categories
router.get('/', categoryController.getAll);
router.get('/:id', categoryController.getById);

// Admin routes
router.use(auth, authorize('admin', 'superadmin'));

router.post('/', validate(crudValidation.createCategory), categoryController.create);
router.put('/:id', validate(crudValidation.updateCategory), categoryController.update);
router.delete('/:id', categoryController.remove);

export default router;
