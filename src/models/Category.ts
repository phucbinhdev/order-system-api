import mongoose, { Schema, Document } from 'mongoose';

export interface ICategoryDoc extends Document {
    branchId: mongoose.Types.ObjectId | null;
    name: string;
    slug: string;
    image: string | null;
    sortOrder: number;
    isActive: boolean;
}

const categorySchema = new Schema(
    {
        branchId: {
            type: Schema.Types.ObjectId,
            ref: 'Branch',
            default: null,
        },
        name: {
            type: String,
            required: [true, 'Category name is required'],
            trim: true,
        },
        slug: {
            type: String,
            lowercase: true,
            trim: true,
        },
        image: {
            type: String,
            default: null,
        },
        sortOrder: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

categorySchema.index({ branchId: 1, isActive: 1 });
categorySchema.index({ sortOrder: 1 });

// Pre-save middleware for slug generation
categorySchema.pre('save', { document: true, query: false }, function () {
    if (this.isModified('name') && this.name) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
    }
});

export default mongoose.model<ICategoryDoc>('Category', categorySchema);
