import mongoose, { Schema, Document } from 'mongoose';
import { IBranch } from '../types';

const branchSchema = new Schema<IBranch>(
    {
        name: {
            type: String,
            required: [true, 'Branch name is required'],
            trim: true,
        },
        address: {
            type: String,
            required: [true, 'Address is required'],
            trim: true,
        },
        phone: {
            type: String,
            trim: true,
            default: '',
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        openTime: {
            type: String,
            default: '08:00',
        },
        closeTime: {
            type: String,
            default: '22:00',
        },
    },
    {
        timestamps: true,
    }
);

branchSchema.index({ isActive: 1 });

export default mongoose.model<IBranch>('Branch', branchSchema);
