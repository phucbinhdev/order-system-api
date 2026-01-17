import mongoose, { Schema, Document } from 'mongoose';

interface ITopItem {
    menuItemId: mongoose.Types.ObjectId;
    name: string;
    quantity: number;
    revenue: number;
}

export interface IDailyReport extends Document {
    branchId: mongoose.Types.ObjectId;
    date: Date;
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    totalRevenue: number;
    totalDiscount: number;
    netRevenue: number;
    topItems: ITopItem[];
}

const topItemSchema = new Schema<ITopItem>({
    menuItemId: {
        type: Schema.Types.ObjectId,
        ref: 'MenuItem',
    },
    name: String,
    quantity: Number,
    revenue: Number,
});

const dailyReportSchema = new Schema<IDailyReport>(
    {
        branchId: {
            type: Schema.Types.ObjectId,
            ref: 'Branch',
            required: true,
        },
        date: {
            type: Date,
            required: true,
        },
        totalOrders: {
            type: Number,
            default: 0,
        },
        completedOrders: {
            type: Number,
            default: 0,
        },
        cancelledOrders: {
            type: Number,
            default: 0,
        },
        totalRevenue: {
            type: Number,
            default: 0,
        },
        totalDiscount: {
            type: Number,
            default: 0,
        },
        netRevenue: {
            type: Number,
            default: 0,
        },
        topItems: [topItemSchema],
    },
    {
        timestamps: true,
    }
);

dailyReportSchema.index({ branchId: 1, date: 1 }, { unique: true });
dailyReportSchema.index({ date: -1 });

export default mongoose.model<IDailyReport>('DailyReport', dailyReportSchema);
