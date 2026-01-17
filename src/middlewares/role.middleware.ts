import { Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { AuthRequest, UserRole } from '../types';

/**
 * Role-based access control middleware
 */
export const authorize = (...roles: UserRole[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            return next(ApiError.unauthorized('Authentication required'));
        }

        if (!roles.includes(req.user.role as UserRole)) {
            return next(
                ApiError.forbidden(`Role '${req.user.role}' is not authorized`)
            );
        }

        next();
    };
};

export default authorize;
