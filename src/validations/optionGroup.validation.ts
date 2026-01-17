import Joi from 'joi';

// Validation for creating an option group
export const createOptionGroup = Joi.object({
    branchId: Joi.string().hex().length(24).optional().allow(null),
    name: Joi.string().max(100).required(),
    options: Joi.array()
        .items(
            Joi.object({
                name: Joi.string().max(100).required(),
                price: Joi.number().min(0).default(0),
                isDefault: Joi.boolean().default(false),
                isAvailable: Joi.boolean().default(true),
            })
        )
        .optional(),
    isRequired: Joi.boolean().default(false),
    maxSelect: Joi.number().integer().min(0).default(0),
    minSelect: Joi.number().integer().min(0).default(0),
    isActive: Joi.boolean().default(true),
    sortOrder: Joi.number().integer().default(0),
});

// Validation for updating an option group
export const updateOptionGroup = Joi.object({
    branchId: Joi.string().hex().length(24).optional().allow(null),
    name: Joi.string().max(100).optional(),
    isRequired: Joi.boolean().optional(),
    maxSelect: Joi.number().integer().min(0).optional(),
    minSelect: Joi.number().integer().min(0).optional(),
    isActive: Joi.boolean().optional(),
    sortOrder: Joi.number().integer().optional(),
});

// Validation for adding an option to a group
export const addOption = Joi.object({
    name: Joi.string().max(100).required(),
    price: Joi.number().min(0).default(0),
    isDefault: Joi.boolean().default(false),
    isAvailable: Joi.boolean().default(true),
});

// Validation for updating an option
export const updateOption = Joi.object({
    name: Joi.string().max(100).optional(),
    price: Joi.number().min(0).optional(),
    isDefault: Joi.boolean().optional(),
    isAvailable: Joi.boolean().optional(),
});

// Query params for listing option groups
export const listOptionGroups = Joi.object({
    branchId: Joi.string().hex().length(24).optional(),
    isActive: Joi.boolean().optional(),
});
