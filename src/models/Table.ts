import mongoose, { Schema } from 'mongoose';
import { ITable } from '../types';

const tableSchema = new Schema<ITable>(
    {
        branchId: {
            type: Schema.Types.ObjectId,
            ref: 'Branch',
            required: [true, 'Branch is required'],
        },
        tableNumber: {
            type: String,
            required: [true, 'Table number is required'],
            trim: true,
        },
        qrCode: {
            type: String,
            required: true,
            unique: true,
        },
        capacity: {
            type: Number,
            default: 4,
            min: 1,
        },
        status: {
            type: String,
            enum: ['available', 'occupied', 'reserved'],
            default: 'available',
        },
        currentOrderId: {
            type: Schema.Types.ObjectId,
            ref: 'Order',
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

tableSchema.index({ branchId: 1, tableNumber: 1 }, { unique: true });
tableSchema.index({ qrCode: 1 });
tableSchema.index({ status: 1, branchId: 1 });

export default mongoose.model<ITable>('Table', tableSchema);
