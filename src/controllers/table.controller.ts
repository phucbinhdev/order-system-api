import { Request, Response, NextFunction } from 'express';
import { Table, Category, MenuItem } from '../models';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import generateQRCode from '../utils/generateQRCode';
import { AuthRequest } from '../types';

/**
 * GET /api/tables
 */
export const getAll = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { branchId, status } = req.query;
        const filter: any = {};

        if (branchId) filter.branchId = branchId;
        if (status) filter.status = status;

        const tables = await Table.find(filter)
            .populate('currentOrderId')
            .sort({ tableNumber: 1 });

        ApiResponse.success(tables, 'Tables retrieved').send(res);
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/tables/:id
 */
export const getById = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const table = await Table.findById(req.params.id)
            .populate('branchId')
            .populate('currentOrderId');

        if (!table) {
            throw ApiError.notFound('Table not found');
        }

        ApiResponse.success(table, 'Table retrieved').send(res);
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/tables
 */
export const create = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const branchId = req.body.branchId || req.query.branchId;

        if (!branchId) {
            throw ApiError.badRequest('Branch ID is required');
        }

        const table = await Table.create({
            ...req.body,
            branchId,
            qrCode: generateQRCode(),
        });

        ApiResponse.created(table, 'Table created').send(res);
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/tables/:id
 */
export const update = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const table = await Table.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!table) {
            throw ApiError.notFound('Table not found');
        }

        ApiResponse.success(table, 'Table updated').send(res);
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/tables/:id
 */
export const remove = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const table = await Table.findByIdAndDelete(req.params.id);

        if (!table) {
            throw ApiError.notFound('Table not found');
        }

        ApiResponse.success(null, 'Table deleted').send(res);
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/tables/:qrCode/menu - Public: Get menu by QR code
 */
export const getMenuByQR = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { qrCode } = req.params;

        const table = await Table.findOne({ qrCode })
            .populate('branchId', 'name address phone openTime closeTime')
            .populate('currentOrderId');

        if (!table) {
            throw ApiError.notFound('Invalid QR code');
        }

        // Get categories and menu items for this branch
        const categories = await Category.find({
            $or: [{ branchId: table.branchId }, { branchId: null }],
            isActive: true,
        }).sort({ sortOrder: 1 });

        const menuItems = await MenuItem.find({
            $or: [{ branchId: table.branchId }, { branchId: null }],
            isAvailable: true,
        }).sort({ sortOrder: 1 });

        // Group items by category
        const menu = categories.map((cat) => ({
            category: cat,
            items: menuItems.filter(
                (item) => item.categoryIds.some(
                    (catId) => catId.toString() === cat._id.toString()
                )
            ),
        }));

        ApiResponse.success(
            {
                table: {
                    _id: table._id,
                    tableNumber: table.tableNumber,
                    capacity: table.capacity,
                    status: table.status,
                    currentOrderId: table.currentOrderId,
                },
                branch: table.branchId,
                menu,
            },
            'Menu retrieved'
        ).send(res);
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/tables/:id/regenerate-qr
 */
export const regenerateQR = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const table = await Table.findByIdAndUpdate(
            req.params.id,
            { qrCode: generateQRCode() },
            { new: true }
        );

        if (!table) {
            throw ApiError.notFound('Table not found');
        }

        ApiResponse.success(table, 'QR code regenerated').send(res);
    } catch (error) {
        next(error);
    }
};
