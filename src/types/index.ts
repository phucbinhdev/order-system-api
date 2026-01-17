import { Request, Response, NextFunction } from 'express';
import { Document, Types } from 'mongoose';

// User roles
export type UserRole = 'cook' | 'waiter' | 'cashier' | 'admin' | 'superadmin';

// Order item status
export type OrderItemStatus = 'pending' | 'cooking' | 'ready' | 'served' | 'cancelled';

// Order status
export type OrderStatus = 'active' | 'completed' | 'cancelled';

// Payment status
export type PaymentStatus = 'unpaid' | 'paid';

// Table status
export type TableStatus = 'available' | 'occupied' | 'reserved';

// Promotion type
export type PromotionType = 'percentage' | 'fixed';

// User document interface
export interface IUser extends Document {
    _id: Types.ObjectId;
    branchId: Types.ObjectId | null;
    email: string;
    password: string;
    name: string;
    phone: string;
    role: UserRole;
    isActive: boolean;
    lastLoginAt: Date | null;
    refreshToken: string | null;
    comparePassword(candidatePassword: string): Promise<boolean>;
    toSafeObject(): Omit<IUser, 'password' | 'refreshToken'>;
}

// Branch document interface
export interface IBranch extends Document {
    _id: Types.ObjectId;
    name: string;
    address: string;
    phone: string;
    isActive: boolean;
    openTime: string;
    closeTime: string;
}

// Table document interface
export interface ITable extends Document {
    _id: Types.ObjectId;
    branchId: Types.ObjectId;
    tableNumber: string;
    qrCode: string;
    capacity: number;
    status: TableStatus;
    currentOrderId: Types.ObjectId | null;
}

// Category document interface
export interface ICategory extends Document {
    _id: Types.ObjectId;
    branchId: Types.ObjectId | null;
    name: string;
    slug: string;
    image: string | null;
    sortOrder: number;
    isActive: boolean;
}

// MenuItem document interface
export interface IMenuItem extends Document {
    _id: Types.ObjectId;
    categoryId: Types.ObjectId;
    branchId: Types.ObjectId | null;
    name: string;
    slug: string;
    description: string;
    price: number;
    image: string | null;
    isAvailable: boolean;
    preparationTime: number;
    sortOrder: number;
}

// Order item interface
export interface IOrderItem {
    _id?: Types.ObjectId;
    menuItemId: Types.ObjectId;
    name: string;
    price: number;
    quantity: number;
    note: string;
    status: OrderItemStatus;
    priority: number;
    createdAt: Date;
}

// Order document interface
export interface IOrder extends Document {
    _id: Types.ObjectId;
    orderNumber: string;
    branchId: Types.ObjectId;
    tableId: Types.ObjectId;
    items: IOrderItem[];
    status: OrderStatus;
    subtotal: number;
    discount: number;
    total: number;
    promotionId: Types.ObjectId | null;
    paymentStatus: PaymentStatus;
    paymentMethod: string;
    note: string;
    cancelReason: string;
    completedAt: Date | null;
    calculateTotals(): IOrder;
}

// Promotion document interface
export interface IPromotion extends Document {
    _id: Types.ObjectId;
    branchId: Types.ObjectId | null;
    name: string;
    code: string;
    type: PromotionType;
    value: number;
    minOrderValue: number;
    maxDiscount: number | null;
    startDate: Date;
    endDate: Date;
    isActive: boolean;
    usageLimit: number | null;
    usedCount: number;
    isValid(orderSubtotal: number, branchId?: Types.ObjectId): { valid: boolean; reason?: string };
    calculateDiscount(subtotal: number): number;
}

// Extended Request with user
export interface AuthRequest extends Request {
    user?: IUser;
}

// Async handler type
export type AsyncHandler = (
    req: Request,
    res: Response,
    next: NextFunction
) => Promise<void>;

// API Response format
export interface ApiResponseFormat<T = any> {
    success: boolean;
    message: string;
    data: T;
}

// Pagination
export interface PaginationQuery {
    page?: number;
    limit?: number;
    sort?: string;
}

export interface PaginatedResult<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
