import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/env';
import User from '../models/User';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { AuthRequest, IUser } from '../types';

interface JwtPayload {
    id: string;
}

/**
 * Generate access and refresh tokens
 */
const generateTokens = (userId: string) => {
    const accessToken = jwt.sign({ id: userId }, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'],
    });

    const refreshToken = jwt.sign({ id: userId }, config.jwt.refreshSecret, {
        expiresIn: config.jwt.refreshExpiresIn as jwt.SignOptions['expiresIn'],
    });

    return { accessToken, refreshToken };
};

/**
 * POST /api/auth/login
 */
export const login = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).select('+password') as IUser | null;

        if (!user) {
            throw ApiError.unauthorized('Invalid email or password');
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            throw ApiError.unauthorized('Invalid email or password');
        }

        if (!user.isActive) {
            throw ApiError.forbidden('Account is deactivated');
        }

        const { accessToken, refreshToken } = generateTokens(user._id.toString());

        user.refreshToken = refreshToken;
        user.lastLoginAt = new Date();
        await user.save();

        ApiResponse.success(
            {
                user: user.toSafeObject(),
                accessToken,
                refreshToken,
            },
            'Login successful'
        ).send(res);
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/auth/refresh
 */
export const refresh = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            throw ApiError.badRequest('Refresh token required');
        }

        const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as JwtPayload;

        const user = await User.findById(decoded.id).select('+refreshToken') as IUser | null;

        if (!user || user.refreshToken !== refreshToken) {
            throw ApiError.unauthorized('Invalid refresh token');
        }

        const tokens = generateTokens(user._id.toString());

        user.refreshToken = tokens.refreshToken;
        await user.save();

        ApiResponse.success(tokens, 'Token refreshed').send(res);
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/auth/logout
 */
export const logout = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (req.user) {
            req.user.refreshToken = null;
            await (req.user as any).save();
        }

        ApiResponse.success(null, 'Logout successful').send(res);
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/auth/me
 */
export const getMe = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const user = await User.findById(req.user?._id).populate('branchId', 'name address');

        if (!user) {
            throw ApiError.notFound('User not found');
        }

        ApiResponse.success(user.toSafeObject(), 'User profile').send(res);
    } catch (error) {
        next(error);
    }
};
