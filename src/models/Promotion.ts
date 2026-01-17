import mongoose, { Schema, Model, Types } from 'mongoose';
import { IPromotion } from '../types';

interface IPromotionMethods {
    isValid(orderSubtotal: number, branchId?: Types.ObjectId): { valid: boolean; reason?: string };
    calculateDiscount(subtotal: number): number;
}

type PromotionModel = Model<IPromotion, {}, IPromotionMethods>;

const promotionSchema = new Schema<IPromotion, PromotionModel, IPromotionMethods>(
    {
        branchId: {
            type: Schema.Types.ObjectId,
            ref: 'Branch',
            default: null,
        },
        name: {
            type: String,
            required: [true, 'Promotion name is required'],
            trim: true,
        },
        code: {
            type: String,
            required: [true, 'Promotion code is required'],
            uppercase: true,
            trim: true,
            unique: true,
        },
        type: {
            type: String,
            enum: ['percentage', 'fixed'],
            required: [true, 'Promotion type is required'],
        },
        value: {
            type: Number,
            required: [true, 'Promotion value is required'],
            min: 0,
        },
        minOrderValue: {
            type: Number,
            default: 0,
        },
        maxDiscount: {
            type: Number,
            default: null,
        },
        startDate: {
            type: Date,
            required: [true, 'Start date is required'],
        },
        endDate: {
            type: Date,
            required: [true, 'End date is required'],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        usageLimit: {
            type: Number,
            default: null,
        },
        usedCount: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
promotionSchema.index({ code: 1 });
promotionSchema.index({ branchId: 1, isActive: 1 });
promotionSchema.index({ startDate: 1, endDate: 1 });

// Method: Check if promotion is valid
promotionSchema.methods.isValid = function (
    orderSubtotal: number,
    branchId?: Types.ObjectId
): { valid: boolean; reason?: string } {
    const now = new Date();

    if (!this.isActive) return { valid: false, reason: 'Promotion is inactive' };
    if (now < this.startDate) return { valid: false, reason: 'Promotion has not started' };
    if (now > this.endDate) return { valid: false, reason: 'Promotion has expired' };

    if (this.usageLimit !== null && this.usedCount >= this.usageLimit) {
        return { valid: false, reason: 'Promotion usage limit reached' };
    }

    if (orderSubtotal < this.minOrderValue) {
        return { valid: false, reason: `Minimum order value is ${this.minOrderValue}` };
    }

    if (this.branchId && branchId && this.branchId.toString() !== branchId.toString()) {
        return { valid: false, reason: 'Promotion not valid for this branch' };
    }

    return { valid: true };
};

// Method: Calculate discount
promotionSchema.methods.calculateDiscount = function (subtotal: number): number {
    let discount = 0;

    if (this.type === 'percentage') {
        discount = (subtotal * this.value) / 100;
    } else {
        discount = this.value;
    }

    if (this.maxDiscount !== null && discount > this.maxDiscount) {
        discount = this.maxDiscount;
    }

    return Math.round(discount);
};

export default mongoose.model<IPromotion, PromotionModel>('Promotion', promotionSchema);
