import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import config from '../config/env';

interface MongoError extends Error {
    code?: number;
    keyValue?: Record<string, any>;
    path?: string;
    value?: any;
    errors?: Record<string, { message: string }>;
}

export const errorHandler = (
    err: MongoError | ApiError | Error,
    req: Request,
    res: Response,
    _next: NextFunction
): void => {
    let error = err;

    // Mongoose bad ObjectId
    if ((err as MongoError).name === 'CastError') {
        const mongoErr = err as MongoError;
        error = ApiError.badRequest(`Invalid ${mongoErr.path}: ${mongoErr.value}`);
    }

    // Mongoose duplicate key
    if ((err as MongoError).code === 11000) {
        const mongoErr = err as MongoError;
        const field = Object.keys(mongoErr.keyValue || {})[0];
        error = ApiError.conflict(`${field} already exists`);
    }

    // Mongoose validation error
    if ((err as MongoError).name === 'ValidationError') {
        const mongoErr = err as MongoError;
        const messages = Object.values(mongoErr.errors || {}).map((e) => e.message);
        error = ApiError.badRequest(messages.join(', '));
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        error = ApiError.unauthorized('Invalid token');
    }

    if (err.name === 'TokenExpiredError') {
        error = ApiError.unauthorized('Token expired');
    }

    const statusCode = (error as ApiError).statusCode || 500;
    const message = error.message || 'Internal Server Error';

    res.status(statusCode).json({
        success: false,
        message,
        ...(config.nodeEnv === 'development' && {
            stack: err.stack,
        }),
    });
};

export default errorHandler;
