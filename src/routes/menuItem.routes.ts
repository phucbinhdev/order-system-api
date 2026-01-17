import { Router } from 'express';
import * as menuItemController from '../controllers/menuItem.controller';
import auth from '../middlewares/auth.middleware';
import authorize from '../middlewares/role.middleware';
import validate from '../middlewares/validate.middleware';
import * as crudValidation from '../validations/crud.validation';

const router = Router();

// Public: Get menu items
router.get('/', menuItemController.getAll);
router.get('/:id', menuItemController.getById);

// Admin routes
router.use(auth);

// Cook can toggle availability (báo hết món)
router.patch(
    '/:id/availability',
    authorize('cook', 'admin', 'superadmin'),
    menuItemController.toggleAvailability
);

// Admin only for CRUD
router.post(
    '/',
    authorize('admin', 'superadmin'),
    validate(crudValidation.createMenuItem),
    menuItemController.create
);
router.put(
    '/:id',
    authorize('admin', 'superadmin'),
    validate(crudValidation.updateMenuItem),
    menuItemController.update
);
router.delete('/:id', authorize('admin', 'superadmin'), menuItemController.remove);

export default router;
