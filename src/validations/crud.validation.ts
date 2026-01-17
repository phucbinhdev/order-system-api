import Joi from 'joi';

export const createBranch = Joi.object({
    name: Joi.string().required(),
    address: Joi.string().required(),
    phone: Joi.string().optional().allow(''),
    openTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).default('08:00'),
    closeTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).default('22:00'),
});

export const updateBranch = Joi.object({
    name: Joi.string().optional(),
    address: Joi.string().optional(),
    phone: Joi.string().optional().allow(''),
    openTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
    closeTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
    isActive: Joi.boolean().optional(),
});

export const createTable = Joi.object({
    tableNumber: Joi.string().required(),
    capacity: Joi.number().integer().min(1).default(4),
});

export const updateTable = Joi.object({
    tableNumber: Joi.string().optional(),
    capacity: Joi.number().integer().min(1).optional(),
    status: Joi.string().valid('available', 'occupied', 'reserved').optional(),
});

export const createCategory = Joi.object({
    name: Joi.string().required(),
    image: Joi.string().uri().optional().allow(null, ''),
    sortOrder: Joi.number().integer().default(0),
    branchId: Joi.string().hex().length(24).optional().allow(null),
});

export const updateCategory = Joi.object({
    name: Joi.string().optional(),
    image: Joi.string().uri().optional().allow(null, ''),
    sortOrder: Joi.number().integer().optional(),
    isActive: Joi.boolean().optional(),
});

export const createMenuItem = Joi.object({
    categoryId: Joi.string().hex().length(24).required(),
    name: Joi.string().required(),
    description: Joi.string().optional().allow(''),
    price: Joi.number().min(0).required(),
    image: Joi.string().uri().optional().allow(null, ''),
    preparationTime: Joi.number().integer().min(1).default(15),
    sortOrder: Joi.number().integer().default(0),
    branchId: Joi.string().hex().length(24).optional().allow(null),
});

export const updateMenuItem = Joi.object({
    categoryId: Joi.string().hex().length(24).optional(),
    name: Joi.string().optional(),
    description: Joi.string().optional().allow(''),
    price: Joi.number().min(0).optional(),
    image: Joi.string().uri().optional().allow(null, ''),
    preparationTime: Joi.number().integer().min(1).optional(),
    sortOrder: Joi.number().integer().optional(),
    isAvailable: Joi.boolean().optional(),
});

export const createPromotion = Joi.object({
    name: Joi.string().required(),
    code: Joi.string().uppercase().required(),
    type: Joi.string().valid('percentage', 'fixed').required(),
    value: Joi.number().min(0).required(),
    minOrderValue: Joi.number().min(0).default(0),
    maxDiscount: Joi.number().min(0).optional().allow(null),
    startDate: Joi.date().required(),
    endDate: Joi.date().greater(Joi.ref('startDate')).required(),
    usageLimit: Joi.number().integer().min(1).optional().allow(null),
    branchId: Joi.string().hex().length(24).optional().allow(null),
});

export const updatePromotion = Joi.object({
    name: Joi.string().optional(),
    type: Joi.string().valid('percentage', 'fixed').optional(),
    value: Joi.number().min(0).optional(),
    minOrderValue: Joi.number().min(0).optional(),
    maxDiscount: Joi.number().min(0).optional().allow(null),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    usageLimit: Joi.number().integer().min(1).optional().allow(null),
    isActive: Joi.boolean().optional(),
});
