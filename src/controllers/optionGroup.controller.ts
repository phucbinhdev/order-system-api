import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { OptionGroup } from '../models';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';

/**
 * GET /api/option-groups
 * List all option groups, optionally filtered by branchId
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

        const optionGroups = await OptionGroup.find(filter).sort({ sortOrder: 1 });

        ApiResponse.success(optionGroups, 'Option groups retrieved').send(res);
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/option-groups/:id
 */
export const getById = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const optionGroup = await OptionGroup.findById(req.params.id);

        if (!optionGroup) {
            throw ApiError.notFound('Option group not found');
        }

        ApiResponse.success(optionGroup, 'Option group retrieved').send(res);
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/option-groups
 */
export const create = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const optionGroup = await OptionGroup.create(req.body);
        ApiResponse.created(optionGroup, 'Option group created').send(res);
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/option-groups/:id
 */
export const update = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const optionGroup = await OptionGroup.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!optionGroup) {
            throw ApiError.notFound('Option group not found');
        }

        ApiResponse.success(optionGroup, 'Option group updated').send(res);
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/option-groups/:id
 */
export const remove = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const optionGroup = await OptionGroup.findByIdAndDelete(req.params.id);

        if (!optionGroup) {
            throw ApiError.notFound('Option group not found');
        }

        ApiResponse.success(null, 'Option group deleted').send(res);
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/option-groups/:id/options
 * Add a new option to the group
 */
export const addOption = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const optionGroup = await OptionGroup.findById(req.params.id);

        if (!optionGroup) {
            throw ApiError.notFound('Option group not found');
        }

        optionGroup.options.push(req.body);
        await optionGroup.save();

        ApiResponse.success(optionGroup, 'Option added successfully').send(res);
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/option-groups/:id/options/:optionId
 * Update an option within the group
 */
export const updateOption = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { id, optionId } = req.params;
        const optionGroup = await OptionGroup.findById(id);

        if (!optionGroup) {
            throw ApiError.notFound('Option group not found');
        }

        const option = (optionGroup.options as mongoose.Types.DocumentArray<any>).id(optionId as string);
        if (!option) {
            throw ApiError.notFound('Option not found');
        }

        Object.assign(option, req.body);
        await optionGroup.save();

        ApiResponse.success(optionGroup, 'Option updated successfully').send(res);
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/option-groups/:id/options/:optionId
 * Remove an option from the group
 */
export const removeOption = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { id, optionId } = req.params;
        const optionGroup = await OptionGroup.findById(id);

        if (!optionGroup) {
            throw ApiError.notFound('Option group not found');
        }

        const option = (optionGroup.options as mongoose.Types.DocumentArray<any>).id(optionId as string);
        if (!option) {
            throw ApiError.notFound('Option not found');
        }

        option.deleteOne();
        await optionGroup.save();

        ApiResponse.success(optionGroup, 'Option removed successfully').send(res);
    } catch (error) {
        next(error);
    }
};
