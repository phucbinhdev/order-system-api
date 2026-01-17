import Joi from 'joi';

export const login = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Invalid email format',
        'any.required': 'Email is required',
    }),
    password: Joi.string().required().messages({
        'any.required': 'Password is required',
    }),
});

export const register = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    name: Joi.string().required(),
    phone: Joi.string().optional().allow(''),
    role: Joi.string()
        .valid('cook', 'waiter', 'cashier', 'admin')
        .default('waiter'),
    branchId: Joi.string().hex().length(24).required(),
});

export const updateUser = Joi.object({
    email: Joi.string().email().optional(),
    name: Joi.string().optional(),
    phone: Joi.string().optional().allow(''),
    role: Joi.string().valid('cook', 'waiter', 'cashier', 'admin').optional(),
    isActive: Joi.boolean().optional(),
});

export const refreshToken = Joi.object({
    refreshToken: Joi.string().required(),
});
