import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Order, DailyReport } from '../models';
import { ApiResponse } from '../utils/ApiResponse';
import { AuthRequest } from '../types';

/**
 * GET /api/stats/dashboard
 */
export const getDashboard = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const branchId = req.query.branchId || req.user?.branchId;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const filter: any = { createdAt: { $gte: today } };
        if (branchId) filter.branchId = branchId;

        const [todayOrders, activeOrders, completedOrders] = await Promise.all([
            Order.countDocuments(filter),
            Order.countDocuments({ ...filter, status: 'active' }),
            Order.find({ ...filter, status: 'completed' }),
        ]);

        const todayRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0);
        const todayDiscount = completedOrders.reduce((sum, o) => sum + o.discount, 0);

        ApiResponse.success(
            {
                todayOrders,
                activeOrders,
                completedOrders: completedOrders.length,
                todayRevenue,
                todayDiscount,
                netRevenue: todayRevenue,
            },
            'Dashboard stats retrieved'
        ).send(res);
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/stats/revenue
 */
export const getRevenue = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const branchId = req.query.branchId || req.user?.branchId;
        const { startDate, endDate, groupBy = 'day' } = req.query;

        const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate as string) : new Date();

        const matchStage: any = {
            status: 'completed',
            completedAt: { $gte: start, $lte: end },
        };

        if (branchId) {
            matchStage.branchId = new mongoose.Types.ObjectId(branchId as string);
        }

        let dateFormat: string;
        switch (groupBy) {
            case 'month':
                dateFormat = '%Y-%m';
                break;
            case 'week':
                dateFormat = '%Y-W%V';
                break;
            default:
                dateFormat = '%Y-%m-%d';
        }

        const revenue = await Order.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: { $dateToString: { format: dateFormat, date: '$completedAt' } },
                    orders: { $sum: 1 },
                    revenue: { $sum: '$total' },
                    discount: { $sum: '$discount' },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        ApiResponse.success(revenue, 'Revenue stats retrieved').send(res);
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/stats/top-items
 */
export const getTopItems = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const branchId = req.query.branchId || req.user?.branchId;
        const { startDate, endDate, limit = 10 } = req.query;

        const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate as string) : new Date();

        const matchStage: any = {
            status: 'completed',
            completedAt: { $gte: start, $lte: end },
        };

        if (branchId) {
            matchStage.branchId = new mongoose.Types.ObjectId(branchId as string);
        }

        const topItems = await Order.aggregate([
            { $match: matchStage },
            { $unwind: '$items' },
            { $match: { 'items.status': { $ne: 'cancelled' } } },
            {
                $group: {
                    _id: '$items.menuItemId',
                    name: { $first: '$items.name' },
                    quantity: { $sum: '$items.quantity' },
                    revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
                },
            },
            { $sort: { quantity: -1 } },
            { $limit: Number(limit) },
        ]);

        ApiResponse.success(topItems, 'Top items retrieved').send(res);
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/stats/orders-by-hour
 */
export const getOrdersByHour = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const branchId = req.query.branchId || req.user?.branchId;
        const { date } = req.query;

        const targetDate = date ? new Date(date as string) : new Date();
        targetDate.setHours(0, 0, 0, 0);

        const nextDate = new Date(targetDate);
        nextDate.setDate(nextDate.getDate() + 1);

        const matchStage: any = {
            createdAt: { $gte: targetDate, $lt: nextDate },
        };

        if (branchId) {
            matchStage.branchId = new mongoose.Types.ObjectId(branchId as string);
        }

        const ordersByHour = await Order.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: { $hour: '$createdAt' },
                    orders: { $sum: 1 },
                    revenue: { $sum: '$total' },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        // Fill missing hours with zeros
        const filledData = Array.from({ length: 24 }, (_, hour) => {
            const existing = ordersByHour.find((o) => o._id === hour);
            return {
                hour,
                orders: existing?.orders || 0,
                revenue: existing?.revenue || 0,
            };
        });

        ApiResponse.success(filledData, 'Orders by hour retrieved').send(res);
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/stats/branches
 * Compare branches (SuperAdmin only)
 */
export const compareBranches = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { startDate, endDate } = req.query;

        const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate as string) : new Date();

        const branchStats = await Order.aggregate([
            {
                $match: {
                    status: 'completed',
                    completedAt: { $gte: start, $lte: end },
                },
            },
            {
                $group: {
                    _id: '$branchId',
                    orders: { $sum: 1 },
                    revenue: { $sum: '$total' },
                    discount: { $sum: '$discount' },
                },
            },
            {
                $lookup: {
                    from: 'branches',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'branch',
                },
            },
            { $unwind: '$branch' },
            {
                $project: {
                    branchId: '$_id',
                    branchName: '$branch.name',
                    orders: 1,
                    revenue: 1,
                    discount: 1,
                },
            },
            { $sort: { revenue: -1 } },
        ]);

        ApiResponse.success(branchStats, 'Branch comparison retrieved').send(res);
    } catch (error) {
        next(error);
    }
};
