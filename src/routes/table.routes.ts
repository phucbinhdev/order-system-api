import { Router } from 'express';
import * as tableController from '../controllers/table.controller';
import * as orderController from '../controllers/order.controller';
import auth from '../middlewares/auth.middleware';
import authorize from '../middlewares/role.middleware';
import branchScope from '../middlewares/branch.middleware';
import validate from '../middlewares/validate.middleware';
import * as crudValidation from '../validations/crud.validation';
import * as orderValidation from '../validations/order.validation';

const router = Router();

// Public: QR code menu
router.get('/:qrCode/menu', tableController.getMenuByQR);

// Public: Create order from QR
router.post(
    '/:qrCode/orders',
    validate(orderValidation.createOrder),
    orderController.createFromQR
);

// Admin routes
router.use(auth, authorize('admin', 'superadmin'), branchScope);

router.get('/', tableController.getAll);
router.get('/:id', tableController.getById);
router.post('/', validate(crudValidation.createTable), tableController.create);
router.put('/:id', validate(crudValidation.updateTable), tableController.update);
router.delete('/:id', tableController.remove);
router.post('/:id/regenerate-qr', tableController.regenerateQR);

export default router;
