import { Router } from 'express';
import * as optionGroupController from '../controllers/optionGroup.controller';
import auth from '../middlewares/auth.middleware';
import authorize from '../middlewares/role.middleware';
import validate from '../middlewares/validate.middleware';
import * as optionGroupValidation from '../validations/optionGroup.validation';

const router = Router();

// Public: Get option groups
router.get('/', optionGroupController.getAll);
router.get('/:id', optionGroupController.getById);

// Admin routes
router.use(auth);

// Create option group
router.post(
    '/',
    authorize('admin', 'superadmin'),
    validate(optionGroupValidation.createOptionGroup),
    optionGroupController.create
);

// Update option group
router.put(
    '/:id',
    authorize('admin', 'superadmin'),
    validate(optionGroupValidation.updateOptionGroup),
    optionGroupController.update
);

// Delete option group
router.delete('/:id', authorize('admin', 'superadmin'), optionGroupController.remove);

// Option management within a group
router.post(
    '/:id/options',
    authorize('admin', 'superadmin'),
    validate(optionGroupValidation.addOption),
    optionGroupController.addOption
);

router.put(
    '/:id/options/:optionId',
    authorize('admin', 'superadmin'),
    validate(optionGroupValidation.updateOption),
    optionGroupController.updateOption
);

router.delete(
    '/:id/options/:optionId',
    authorize('admin', 'superadmin'),
    optionGroupController.removeOption
);

export default router;
