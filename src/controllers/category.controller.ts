import { Request, Response, NextFunction } from 'express';
import { Category } from '../models';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { AuthRequest } from '../types';

/**
 * GET /api/categories
 */
export const getAll = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { branchId, isActive } = req.query;
        const filter: any = {};

        if (branchId) {
            filter.$or = [{ branchId }, { branchId: null }];
        }
        if (isActive !== undefined) {
            filter.isActive = isActive === 'true';
        }

        const categories = await Category.find(filter).sort({ sortOrder: 1 });
        ApiResponse.success(categories, 'Categories retrieved').send(res);
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/categories/:id
 */
export const getById = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            throw ApiError.notFound('Category not found');
        }

        ApiResponse.success(category, 'Category retrieved').send(res);
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/categories
 */
export const create = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const category = await Category.create(req.body);
        ApiResponse.created(category, 'Category created').send(res);
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/categories/:id
 */
export const update = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const category = await Category.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!category) {
            throw ApiError.notFound('Category not found');
        }

        ApiResponse.success(category, 'Category updated').send(res);
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/categories/:id
 */
export const remove = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);

        if (!category) {
            throw ApiError.notFound('Category not found');
        }

        ApiResponse.success(null, 'Category deleted').send(res);
    } catch (error) {
        next(error);
    }
};
