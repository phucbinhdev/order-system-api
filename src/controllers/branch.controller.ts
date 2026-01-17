import { Request, Response, NextFunction } from 'express';
import { Branch } from '../models';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';

/**
 * GET /api/branches
 */
export const getAll = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const branches = await Branch.find().sort({ createdAt: -1 });
        ApiResponse.success(branches, 'Branches retrieved').send(res);
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/branches/:id
 */
export const getById = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const branch = await Branch.findById(req.params.id);

        if (!branch) {
            throw ApiError.notFound('Branch not found');
        }

        ApiResponse.success(branch, 'Branch retrieved').send(res);
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/branches
 */
export const create = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const branch = await Branch.create(req.body);
        ApiResponse.created(branch, 'Branch created').send(res);
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/branches/:id
 */
export const update = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const branch = await Branch.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!branch) {
            throw ApiError.notFound('Branch not found');
        }

        ApiResponse.success(branch, 'Branch updated').send(res);
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/branches/:id
 */
export const remove = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const branch = await Branch.findByIdAndDelete(req.params.id);

        if (!branch) {
            throw ApiError.notFound('Branch not found');
        }

        ApiResponse.success(null, 'Branch deleted').send(res);
    } catch (error) {
        next(error);
    }
};
