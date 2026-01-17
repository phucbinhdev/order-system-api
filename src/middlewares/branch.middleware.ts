import { Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { AuthRequest } from '../types';

/**
 * Branch scope middleware - ensures user can only access their branch data
 * SuperAdmin can access all branches
 */
export const branchScope = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void => {
    if (!req.user) {
        return next(ApiError.unauthorized('Authentication required'));
    }

    // SuperAdmin can access all branches
    if (req.user.role === 'superadmin') {
        return next();
    }

    // Get branchId from params, query, or body
    const requestedBranchId =
        req.params.branchId ||
        (req.query.branchId as string) ||
        req.body?.branchId;

    // If branchId is specified, ensure it matches user's branch
    if (
        requestedBranchId &&
        requestedBranchId !== req.user.branchId?.toString()
    ) {
        return next(ApiError.forbidden('Access denied to this branch'));
    }

    // Auto-inject user's branchId into query/body if not specified
    if (!requestedBranchId && req.user.branchId) {
        req.query.branchId = req.user.branchId.toString();
        if (req.body && typeof req.body === 'object') {
            req.body.branchId = req.user.branchId;
        }
    }

    next();
};

export default branchScope;
