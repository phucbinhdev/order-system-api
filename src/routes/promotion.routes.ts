import { Router } from 'express';
import * as promotionController from '../controllers/promotion.controller';
import auth from '../middlewares/auth.middleware';
import authorize from '../middlewares/role.middleware';
import validate from '../middlewares/validate.middleware';
import * as crudValidation from '../validations/crud.validation';

const router = Router();

// Public: Validate promotion code
router.post('/validate', promotionController.validateCode);

// Admin routes
router.use(auth, authorize('admin', 'superadmin'));

router.get('/', promotionController.getAll);
router.get('/:id', promotionController.getById);
router.post('/', validate(crudValidation.createPromotion), promotionController.create);
router.put('/:id', validate(crudValidation.updatePromotion), promotionController.update);
router.delete('/:id', promotionController.remove);

export default router;
