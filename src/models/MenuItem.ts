import mongoose, { Schema, Document } from 'mongoose';

export interface IMenuItemDoc extends Document {
    categoryId: mongoose.Types.ObjectId;
    branchId: mongoose.Types.ObjectId | null;
    name: string;
    slug: string;
    description: string;
    price: number;
    image: string | null;
    isAvailable: boolean;
    preparationTime: number;
    sortOrder: number;
}

const menuItemSchema = new Schema(
    {
        categoryId: {
            type: Schema.Types.ObjectId,
            ref: 'Category',
            required: [true, 'Category is required'],
        },
        branchId: {
            type: Schema.Types.ObjectId,
            ref: 'Branch',
            default: null,
        },
        name: {
            type: String,
            required: [true, 'Menu item name is required'],
            trim: true,
        },
        slug: {
            type: String,
            lowercase: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
            default: '',
        },
        price: {
            type: Number,
            required: [true, 'Price is required'],
            min: [0, 'Price cannot be negative'],
        },
        image: {
            type: String,
            default: null,
        },
        isAvailable: {
            type: Boolean,
            default: true,
        },
        preparationTime: {
            type: Number,
            default: 15,
            min: 1,
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

menuItemSchema.index({ categoryId: 1, isAvailable: 1 });
menuItemSchema.index({ branchId: 1, isAvailable: 1 });
menuItemSchema.index({ sortOrder: 1 });

// Pre-save middleware for slug generation
menuItemSchema.pre('save', { document: true, query: false }, function () {
    if (this.isModified('name') && this.name) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
    }
});

export default mongoose.model<IMenuItemDoc>('MenuItem', menuItemSchema);
