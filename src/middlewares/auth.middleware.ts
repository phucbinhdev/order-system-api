import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/env';
import { ApiError } from '../utils/ApiError';
import User from '../models/User';
import { AuthRequest } from '../types';

interface JwtPayload {
    id: string;
}

export const auth = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw ApiError.unauthorized('Access token required');
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            throw ApiError.unauthorized('User not found');
        }

        if (!user.isActive) {
            throw ApiError.forbidden('User account is deactivated');
        }

        req.user = user;
        next();
    } catch (error) {
        next(error);
    }
};

export default auth;
