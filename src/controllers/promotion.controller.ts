import { Request, Response, NextFunction } from 'express';
import { Promotion } from '../models';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { AuthRequest } from '../types';

/**
 * GET /api/promotions
 */
export const getAll = async (
    req: AuthRequest,
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

        const promotions = await Promotion.find(filter).sort({ createdAt: -1 });
        ApiResponse.success(promotions, 'Promotions retrieved').send(res);
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/promotions/:id
 */
export const getById = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const promotion = await Promotion.findById(req.params.id);

        if (!promotion) {
            throw ApiError.notFound('Promotion not found');
        }

        ApiResponse.success(promotion, 'Promotion retrieved').send(res);
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/promotions
 */
export const create = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const promotion = await Promotion.create(req.body);
        ApiResponse.created(promotion, 'Promotion created').send(res);
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/promotions/:id
 */
export const update = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // Cannot change promotion code
        delete req.body.code;

        const promotion = await Promotion.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!promotion) {
            throw ApiError.notFound('Promotion not found');
        }

        ApiResponse.success(promotion, 'Promotion updated').send(res);
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/promotions/:id
 */
export const remove = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const promotion = await Promotion.findByIdAndDelete(req.params.id);

        if (!promotion) {
            throw ApiError.notFound('Promotion not found');
        }

        ApiResponse.success(null, 'Promotion deleted').send(res);
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/promotions/validate
 * Public: Validate promotion code
 */
export const validateCode = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { code, subtotal, branchId } = req.body;

        const promotion = await Promotion.findOne({ code: code.toUpperCase() });

        if (!promotion) {
            throw ApiError.notFound('Promotion code not found');
        }

        const validation = promotion.isValid(subtotal || 0, branchId);

        if (!validation.valid) {
            throw ApiError.badRequest(validation.reason || 'Invalid promotion');
        }

        const discount = promotion.calculateDiscount(subtotal || 0);

        ApiResponse.success(
            {
                promotion: {
                    _id: promotion._id,
                    name: promotion.name,
                    code: promotion.code,
                    type: promotion.type,
                    value: promotion.value,
                },
                discount,
            },
            'Promotion is valid'
        ).send(res);
    } catch (error) {
        next(error);
    }
};
