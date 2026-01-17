import { Router } from 'express';
import authRoutes from './auth.routes';
import branchRoutes from './branch.routes';
import tableRoutes from './table.routes';
import categoryRoutes from './category.routes';
import menuItemRoutes from './menuItem.routes';
import orderRoutes from './order.routes';
import promotionRoutes from './promotion.routes';
import statsRoutes from './stats.routes';
import userRoutes from './user.routes';
import optionGroupRoutes from './optionGroup.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/branches', branchRoutes);
router.use('/tables', tableRoutes);
router.use('/categories', categoryRoutes);
router.use('/menu-items', menuItemRoutes);
router.use('/orders', orderRoutes);
router.use('/promotions', promotionRoutes);
router.use('/stats', statsRoutes);
router.use('/users', userRoutes);
router.use('/option-groups', optionGroupRoutes);

// Health check
router.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
