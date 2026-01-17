import { Router } from 'express';
import * as branchController from '../controllers/branch.controller';
import auth from '../middlewares/auth.middleware';
import authorize from '../middlewares/role.middleware';
import validate from '../middlewares/validate.middleware';
import * as crudValidation from '../validations/crud.validation';

const router = Router();

// SuperAdmin only
router.use(auth, authorize('superadmin'));

router.get('/', branchController.getAll);
router.get('/:id', branchController.getById);
router.post('/', validate(crudValidation.createBranch), branchController.create);
router.put('/:id', validate(crudValidation.updateBranch), branchController.update);
router.delete('/:id', branchController.remove);

export default router;
