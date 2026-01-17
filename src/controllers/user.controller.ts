import { Request, Response, NextFunction } from 'express';
import { User } from '../models';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { AuthRequest } from '../types';

/**
 * GET /api/users
 */
export const getAll = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { branchId, role, isActive } = req.query;
        const filter: any = {};

        if (branchId) filter.branchId = branchId;
        if (role) filter.role = role;
        if (isActive !== undefined) filter.isActive = isActive === 'true';

        const users = await User.find(filter)
            .populate('branchId', 'name')
            .sort({ createdAt: -1 });

        const safeUsers = users.map((u) => u.toSafeObject());
        ApiResponse.success(safeUsers, 'Users retrieved').send(res);
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/users/:id
 */
export const getById = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const user = await User.findById(req.params.id).populate('branchId', 'name');

        if (!user) {
            throw ApiError.notFound('User not found');
        }

        ApiResponse.success(user.toSafeObject(), 'User retrieved').send(res);
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/users
 */
export const create = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // Only SuperAdmin can create SuperAdmin users
        if (req.body.role === 'superadmin' && req.user?.role !== 'superadmin') {
            throw ApiError.forbidden('Only SuperAdmin can create SuperAdmin users');
        }

        const user = await User.create(req.body);
        ApiResponse.created(user.toSafeObject(), 'User created').send(res);
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/users/:id
 */
export const update = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // Prevent role escalation
        if (req.body.role === 'superadmin' && req.user?.role !== 'superadmin') {
            throw ApiError.forbidden('Cannot assign SuperAdmin role');
        }

        // Remove password from update if present (use separate endpoint)
        delete req.body.password;

        const user = await User.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        if (!user) {
            throw ApiError.notFound('User not found');
        }

        ApiResponse.success(user.toSafeObject(), 'User updated').send(res);
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/users/:id
 */
export const remove = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            throw ApiError.notFound('User not found');
        }

        // Prevent deleting SuperAdmin
        if (user.role === 'superadmin' && req.user?.role !== 'superadmin') {
            throw ApiError.forbidden('Cannot delete SuperAdmin');
        }

        // Prevent self-deletion
        if (user._id.toString() === req.user?._id.toString()) {
            throw ApiError.badRequest('Cannot delete your own account');
        }

        await User.findByIdAndDelete(req.params.id);
        ApiResponse.success(null, 'User deleted').send(res);
    } catch (error) {
        next(error);
    }
};

/**
 * PATCH /api/users/:id/password
 */
export const changePassword = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            throw ApiError.badRequest('Password must be at least 6 characters');
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            throw ApiError.notFound('User not found');
        }

        user.password = newPassword;
        await user.save();

        ApiResponse.success(null, 'Password changed successfully').send(res);
    } catch (error) {
        next(error);
    }
};
