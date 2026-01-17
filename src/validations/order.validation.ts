import Joi from 'joi';

export const createOrder = Joi.object({
    items: Joi.array()
        .items(
            Joi.object({
                menuItemId: Joi.string().hex().length(24).required(),
                quantity: Joi.number().integer().min(1).required(),
                note: Joi.string().max(200).optional().allow(''),
            })
        )
        .min(1)
        .required(),
    note: Joi.string().max(500).optional().allow(''),
});

export const createManualOrder = Joi.object({
    tableId: Joi.string().hex().length(24).required(),
    items: Joi.array()
        .items(
            Joi.object({
                menuItemId: Joi.string().hex().length(24).required(),
                quantity: Joi.number().integer().min(1).required(),
                note: Joi.string().max(200).optional().allow(''),
            })
        )
        .min(1)
        .required(),
    note: Joi.string().max(500).optional().allow(''),
});

export const addItems = Joi.object({
    items: Joi.array()
        .items(
            Joi.object({
                menuItemId: Joi.string().hex().length(24).required(),
                quantity: Joi.number().integer().min(1).required(),
                note: Joi.string().max(200).optional().allow(''),
            })
        )
        .min(1)
        .required(),
});

export const updateItemStatus = Joi.object({
    status: Joi.string()
        .valid('pending', 'cooking', 'ready', 'served', 'cancelled')
        .required(),
});

export const updateItemPriority = Joi.object({
    priority: Joi.number().integer().min(1).max(10).required(),
});

export const updateItemNote = Joi.object({
    note: Joi.string().max(200).required(),
});

export const applyPromotion = Joi.object({
    code: Joi.string().uppercase().required(),
});

export const completePayment = Joi.object({
    paymentMethod: Joi.string().valid('cash').default('cash'),
});

export const cancelOrder = Joi.object({
    reason: Joi.string().max(200).optional().allow(''),
});

export const cancelItem = Joi.object({
    reason: Joi.string().max(200).optional().allow(''),
});

// Query params for listing orders
export const listOrders = Joi.object({
    status: Joi.string().valid('active', 'completed', 'cancelled').optional(),
    tableId: Joi.string().hex().length(24).optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
});
