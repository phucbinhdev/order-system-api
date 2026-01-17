import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUserDoc extends Document {
    branchId: mongoose.Types.ObjectId | null;
    email: string;
    password: string;
    name: string;
    phone: string;
    role: 'cook' | 'waiter' | 'cashier' | 'admin' | 'superadmin';
    isActive: boolean;
    lastLoginAt: Date | null;
    refreshToken: string | null;
    comparePassword(candidatePassword: string): Promise<boolean>;
    toSafeObject(): any;
}

const userSchema = new Schema(
    {
        branchId: {
            type: Schema.Types.ObjectId,
            ref: 'Branch',
            default: null,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters'],
            select: false,
        },
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
        },
        phone: {
            type: String,
            trim: true,
            default: '',
        },
        role: {
            type: String,
            enum: ['cook', 'waiter', 'cashier', 'admin', 'superadmin'],
            default: 'waiter',
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        lastLoginAt: {
            type: Date,
            default: null,
        },
        refreshToken: {
            type: String,
            default: null,
            select: false,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
userSchema.index({ branchId: 1, role: 1 });

// Pre-save middleware for password hashing
userSchema.pre('save', { document: true, query: false }, async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 12);
});

// Method: Compare password
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Method: Safe JSON
userSchema.methods.toSafeObject = function () {
    const obj = this.toObject();
    const { password, refreshToken, ...safeObj } = obj;
    return safeObj;
};

export default mongoose.model<IUserDoc>('User', userSchema);
