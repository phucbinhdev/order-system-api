import { Router } from 'express';
import * as statsController from '../controllers/stats.controller';
import auth from '../middlewares/auth.middleware';
import authorize from '../middlewares/role.middleware';
import branchScope from '../middlewares/branch.middleware';

const router = Router();

router.use(auth);

// Dashboard - all staff can view
router.get(
    '/dashboard',
    authorize('cashier', 'admin', 'superadmin'),
    branchScope,
    statsController.getDashboard
);

// Revenue - admin only
router.get(
    '/revenue',
    authorize('admin', 'superadmin'),
    branchScope,
    statsController.getRevenue
);

// Top items - admin only
router.get(
    '/top-items',
    authorize('admin', 'superadmin'),
    branchScope,
    statsController.getTopItems
);

// Orders by hour - admin only
router.get(
    '/orders-by-hour',
    authorize('admin', 'superadmin'),
    branchScope,
    statsController.getOrdersByHour
);

// Compare branches - superadmin only
router.get(
    '/branches',
    authorize('superadmin'),
    statsController.compareBranches
);

export default router;
