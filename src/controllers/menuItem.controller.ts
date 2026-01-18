import { Request, Response, NextFunction } from 'express';
import { MenuItem } from '../models';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { AuthRequest } from '../types';
import { emitToBranch } from '../config/socket';

/**
 * GET /api/menu-items
 */
export const getAll = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { branchId, categoryId, isAvailable, search } = req.query;
        const filter: any = {};

        if (branchId) {
            filter.$or = [{ branchId }, { branchId: null }];
        }
        if (categoryId) {
            filter.categoryIds = { $in: [categoryId] };
        }
        if (isAvailable !== undefined) {
            filter.isAvailable = isAvailable === 'true';
        }
        // Search by name (case-insensitive)
        if (search && typeof search === 'string') {
            filter.name = { $regex: search, $options: 'i' };
        }

        const menuItems = await MenuItem.find(filter)
            .populate('categoryIds', 'name slug')
            .sort({ sortOrder: 1 });

        ApiResponse.success(menuItems, 'Menu items retrieved').send(res);
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/menu-items/:id
 */
export const getById = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const menuItem = await MenuItem.findById(req.params.id)
            .populate('categoryIds', 'name slug');

        if (!menuItem) {
            throw ApiError.notFound('Menu item not found');
        }

        ApiResponse.success(menuItem, 'Menu item retrieved').send(res);
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/menu-items
 */
export const create = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const menuItem = await MenuItem.create(req.body);
        ApiResponse.created(menuItem, 'Menu item created').send(res);
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/menu-items/:id
 */
export const update = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const menuItem = await MenuItem.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!menuItem) {
            throw ApiError.notFound('Menu item not found');
        }

        ApiResponse.success(menuItem, 'Menu item updated').send(res);
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/menu-items/:id
 */
export const remove = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const menuItem = await MenuItem.findByIdAndDelete(req.params.id);

        if (!menuItem) {
            throw ApiError.notFound('Menu item not found');
        }

        ApiResponse.success(null, 'Menu item deleted').send(res);
    } catch (error) {
        next(error);
    }
};

/**
 * PATCH /api/menu-items/:id/availability
 * Toggle item availability (Bếp báo hết món)
 */
export const toggleAvailability = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { isAvailable } = req.body;

        const menuItem = await MenuItem.findByIdAndUpdate(
            req.params.id,
            { isAvailable },
            { new: true }
        );

        if (!menuItem) {
            throw ApiError.notFound('Menu item not found');
        }

        // Notify all staff about item availability change
        if (menuItem.branchId) {
            emitToBranch(menuItem.branchId.toString(), 'menu:availability', {
                menuItemId: menuItem._id,
                name: menuItem.name,
                isAvailable: menuItem.isAvailable,
            });
        }

        ApiResponse.success(
            menuItem,
            isAvailable ? 'Menu item is now available' : 'Menu item marked as unavailable'
        ).send(res);
    } catch (error) {
        next(error);
    }
};
