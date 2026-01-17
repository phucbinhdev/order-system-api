import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ApiError } from '../utils/ApiError';

type ValidationProperty = 'body' | 'query' | 'params';

/**
 * Validation middleware factory
 */
export const validate = (schema: Joi.ObjectSchema, property: ValidationProperty = 'body') => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const { error, value } = schema.validate(req[property], {
            abortEarly: false,
            stripUnknown: true,
        });

        if (error) {
            const messages = error.details.map((detail) => detail.message).join(', ');
            return next(ApiError.badRequest(messages));
        }

        req[property] = value;
        next();
    };
};

export default validate;
