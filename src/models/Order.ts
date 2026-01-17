import mongoose, { Schema, Model } from 'mongoose';
import { IOrder, IOrderItem } from '../types';

const orderItemSchema = new Schema<IOrderItem>({
    menuItemId: {
        type: Schema.Types.ObjectId,
        ref: 'MenuItem',
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
    },
    note: {
        type: String,
        trim: true,
        default: '',
    },
    status: {
        type: String,
        enum: ['pending', 'cooking', 'ready', 'served', 'cancelled'],
        default: 'pending',
    },
    priority: {
        type: Number,
        default: 5, // 1-10, lower = higher priority
        min: 1,
        max: 10,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

interface IOrderMethods {
    calculateTotals(): IOrder;
}

type OrderModel = Model<IOrder, {}, IOrderMethods>;

const orderSchema = new Schema<IOrder, OrderModel, IOrderMethods>(
    {
        orderNumber: {
            type: String,
            required: true,
            unique: true,
        },
        branchId: {
            type: Schema.Types.ObjectId,
            ref: 'Branch',
            required: [true, 'Branch is required'],
        },
        tableId: {
            type: Schema.Types.ObjectId,
            ref: 'Table',
            required: [true, 'Table is required'],
        },
        items: [orderItemSchema],
        status: {
            type: String,
            enum: ['active', 'completed', 'cancelled'],
            default: 'active',
        },
        subtotal: {
            type: Number,
            default: 0,
        },
        discount: {
            type: Number,
            default: 0,
        },
        total: {
            type: Number,
            default: 0,
        },
        promotionId: {
            type: Schema.Types.ObjectId,
            ref: 'Promotion',
            default: null,
        },
        paymentStatus: {
            type: String,
            enum: ['unpaid', 'paid'],
            default: 'unpaid',
        },
        paymentMethod: {
            type: String,
            enum: ['cash'],
            default: 'cash',
        },
        note: {
            type: String,
            trim: true,
            default: '',
        },
        cancelReason: {
            type: String,
            trim: true,
            default: '',
        },
        completedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
orderSchema.index({ branchId: 1, status: 1 });
orderSchema.index({ tableId: 1, status: 1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ branchId: 1, createdAt: -1 });

// Method: Calculate totals
orderSchema.methods.calculateTotals = function (): IOrder {
    this.subtotal = this.items
        .filter((item: IOrderItem) => item.status !== 'cancelled')
        .reduce((sum: number, item: IOrderItem) => {
            return sum + item.price * item.quantity;
        }, 0);
    this.total = this.subtotal - this.discount;
    if (this.total < 0) this.total = 0;
    return this;
};

export default mongoose.model<IOrder, OrderModel>('Order', orderSchema);
