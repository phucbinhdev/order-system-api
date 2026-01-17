import mongoose, { Schema, Document } from 'mongoose';

export interface IOptionDoc {
    _id?: mongoose.Types.ObjectId;
    name: string;
    price: number;
    isDefault: boolean;
    isAvailable: boolean;
}

export interface IOptionGroupDoc extends Document {
    branchId: mongoose.Types.ObjectId | null;
    name: string;
    options: IOptionDoc[];
    isRequired: boolean;
    maxSelect: number;
    minSelect: number;
    isActive: boolean;
    sortOrder: number;
}

const optionSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, 'Option name is required'],
            trim: true,
        },
        price: {
            type: Number,
            default: 0,
            min: [0, 'Price cannot be negative'],
        },
        isDefault: {
            type: Boolean,
            default: false,
        },
        isAvailable: {
            type: Boolean,
            default: true,
        },
    },
    { _id: true }
);

const optionGroupSchema = new Schema(
    {
        branchId: {
            type: Schema.Types.ObjectId,
            ref: 'Branch',
            default: null,
        },
        name: {
            type: String,
            required: [true, 'Option group name is required'],
            trim: true,
        },
        options: [optionSchema],
        isRequired: {
            type: Boolean,
            default: false,
        },
        maxSelect: {
            type: Number,
            default: 0, // 0 = unlimited
            min: 0,
        },
        minSelect: {
            type: Number,
            default: 0,
            min: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        sortOrder: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

optionGroupSchema.index({ branchId: 1, isActive: 1 });
optionGroupSchema.index({ sortOrder: 1 });

export default mongoose.model<IOptionGroupDoc>('OptionGroup', optionGroupSchema);
