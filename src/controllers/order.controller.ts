import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { Order, Table, MenuItem, Promotion } from "../models";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { AuthRequest, IOrderItem } from "../types";
import {
  emitToKitchen,
  emitToWaiters,
  emitToCashiers,
  emitToBranch,
} from "../config/socket";
import generateOrderNumber from "../utils/generateOrderNumber";

/**
 * GET /api/orders
 */
export const getAll = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { branchId, status, tableId, page = 1, limit = 20 } = req.query;
    const filter: any = {};

    if (branchId) filter.branchId = branchId;
    if (status) filter.status = status;
    if (tableId) filter.tableId = tableId;

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("tableId", "tableNumber")
        .populate("branchId", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Order.countDocuments(filter),
    ]);

    ApiResponse.success(
      {
        orders,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
      "Orders retrieved",
    ).send(res);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/orders/:id
 */
export const getById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("tableId", "tableNumber")
      .populate("branchId", "name")
      .populate("promotionId");

    if (!order) {
      throw ApiError.notFound("Order not found");
    }

    ApiResponse.success(order, "Order retrieved").send(res);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/orders - Manual order creation (Staff)
 */
export const create = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { tableId, items, note } = req.body;
    const branchId = req.user?.branchId; // Staff creates order for their branch

    if (!branchId) {
      throw ApiError.badRequest("User does not belong to any branch");
    }

    // Validate table
    const table = await Table.findOne({ _id: tableId, branchId });
    if (!table) {
      throw ApiError.notFound("Table not found in this branch");
    }

    if (table.currentOrderId) {
      throw ApiError.badRequest(
        "Table already has an active order. Please add items to existing order.",
      );
    }

    // Get menu items and validate
    const menuItemIds = items.map((i: any) => i.menuItemId);
    const menuItems = await MenuItem.find({ _id: { $in: menuItemIds } });

    if (menuItems.length !== menuItemIds.length) {
      throw ApiError.badRequest("Some menu items not found");
    }

    // Check availability
    const unavailable = menuItems.filter((m) => !m.isAvailable);
    if (unavailable.length > 0) {
      throw ApiError.badRequest(
        `Items not available: ${unavailable.map((m) => m.name).join(", ")}`,
      );
    }

    // Build order items
    const orderItems: Partial<IOrderItem>[] = items.map((item: any) => {
      const menuItem = menuItems.find(
        (m) => m._id.toString() === item.menuItemId,
      );
      return {
        menuItemId: new mongoose.Types.ObjectId(item.menuItemId),
        name: menuItem!.name,
        price: menuItem!.price,
        quantity: item.quantity,
        note: item.note || "",
        status: "pending",
        priority: 5,
      };
    });

    // Generate order number
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const orderCount = await Order.countDocuments({
      branchId,
      createdAt: { $gte: today },
    });

    const order = new Order({
      orderNumber: generateOrderNumber(orderCount + 1),
      branchId,
      tableId: table._id,
      items: orderItems,
      note: note || "",
      createdBy: req.user?._id, // Track who created the order
    });

    order.calculateTotals();
    await order.save();

    // Update table
    table.status = "occupied";
    table.currentOrderId = order._id as mongoose.Types.ObjectId;
    await table.save();

    // Notify kitchen
    emitToKitchen(branchId.toString(), "order:new", {
      order,
      table: { tableNumber: table.tableNumber },
    });

    ApiResponse.created(order, "Order created successfully").send(res);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/tables/:qrCode/orders - Public: Create order from QR
 */
export const createFromQR = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { qrCode } = req.params;
    const { items, note } = req.body;

    // Find table by QR code
    const table = await Table.findOne({ qrCode });
    if (!table) {
      throw ApiError.notFound("Invalid QR code");
    }

    // Check if table has an active order
    if (table.currentOrderId) {
      throw ApiError.badRequest(
        "Table already has an active order. Please add items to existing order.",
      );
    }

    // Get menu items and validate
    const menuItemIds = items.map((i: any) => i.menuItemId);
    const menuItems = await MenuItem.find({ _id: { $in: menuItemIds } });

    if (menuItems.length !== menuItemIds.length) {
      throw ApiError.badRequest("Some menu items not found");
    }

    // Check availability
    const unavailable = menuItems.filter((m) => !m.isAvailable);
    if (unavailable.length > 0) {
      throw ApiError.badRequest(
        `Items not available: ${unavailable.map((m) => m.name).join(", ")}`,
      );
    }

    // Build order items with snapshot data
    const orderItems: Partial<IOrderItem>[] = items.map((item: any) => {
      const menuItem = menuItems.find(
        (m) => m._id.toString() === item.menuItemId,
      );
      return {
        menuItemId: new mongoose.Types.ObjectId(item.menuItemId),
        name: menuItem!.name,
        price: menuItem!.price,
        quantity: item.quantity,
        note: item.note || "",
        status: "pending",
        priority: 5,
      };
    });

    // Generate order number
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const orderCount = await Order.countDocuments({
      branchId: table.branchId,
      createdAt: { $gte: today },
    });

    const order = new Order({
      orderNumber: generateOrderNumber(orderCount + 1),
      branchId: table.branchId,
      tableId: table._id,
      items: orderItems,
      note: note || "",
    });

    order.calculateTotals();
    await order.save();

    // Update table
    table.status = "occupied";
    table.currentOrderId = order._id as mongoose.Types.ObjectId;
    await table.save();

    // Notify kitchen
    emitToKitchen(table.branchId.toString(), "order:new", {
      order,
      table: { tableNumber: table.tableNumber },
    });

    ApiResponse.created(order, "Order created").send(res);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/orders/:id/items - Add items to existing order
 */
export const addItems = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { items } = req.body;

    const order = await Order.findById(req.params.id).populate(
      "tableId",
      "tableNumber branchId",
    );

    if (!order) {
      throw ApiError.notFound("Order not found");
    }

    if (order.status !== "active") {
      throw ApiError.badRequest(
        "Cannot add items to completed/cancelled order",
      );
    }

    // Get menu items
    const menuItemIds = items.map((i: any) => i.menuItemId);
    const menuItems = await MenuItem.find({ _id: { $in: menuItemIds } });

    if (menuItems.length !== menuItemIds.length) {
      throw ApiError.badRequest("Some menu items not found");
    }

    // Check availability
    const unavailable = menuItems.filter((m) => !m.isAvailable);
    if (unavailable.length > 0) {
      throw ApiError.badRequest(
        `Items not available: ${unavailable.map((m) => m.name).join(", ")}`,
      );
    }

    // Add new items
    const newItems: Partial<IOrderItem>[] = items.map((item: any) => {
      const menuItem = menuItems.find(
        (m) => m._id.toString() === item.menuItemId,
      );
      return {
        menuItemId: new mongoose.Types.ObjectId(item.menuItemId),
        name: menuItem!.name,
        price: menuItem!.price,
        quantity: item.quantity,
        note: item.note || "",
        status: "pending",
        priority: 5,
        createdAt: new Date(),
      };
    });

    order.items.push(...(newItems as IOrderItem[]));
    order.calculateTotals();
    await order.save();

    // Notify kitchen about new items
    emitToKitchen(order.branchId.toString(), "order:items-added", {
      orderId: order._id,
      orderNumber: order.orderNumber,
      newItems,
      tableNumber: (order.tableId as any).tableNumber,
    });

    ApiResponse.success(order, "Items added to order").send(res);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/orders/:id/status
 * Update order status (Move Ticket)
 */
export const updateOrderStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findById(id);

    if (!order) {
      throw ApiError.notFound("Order not found");
    }

    // Update status
    order.status = status;

    // If completed/served, free up table (optional, depending on flow)
    // Usually 'completed' means payment done. 'served' might just mean food delivered.
    // Spec says: status: "cooking" // active | completed | cancelled

    await order.save();

    // Notify
    emitToBranch(order.branchId.toString(), "order:updated", {
      orderId: order._id,
      status,
      updatedAt: new Date(),
    });

    ApiResponse.success(order, "Order status updated").send(res);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/orders/:id/items/:itemId/status
 * Kitchen updates item status
 */
export const updateItemStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id, itemId } = req.params;
    const { status } = req.body;

    const order = await Order.findById(id);

    if (!order) {
      throw ApiError.notFound("Order not found");
    }

    const item = order.items.find((i) => i._id?.toString() === itemId);

    if (!item) {
      throw ApiError.notFound("Item not found in order");
    }

    item.status = status;

    // Auto-update order status logic (Optional from spec)
    // If all items are 'ready', maybe notify.
    // For now just update item.

    await order.save();

    // Notify appropriate staff
    const eventData = {
      orderId: order._id,
      orderNumber: order.orderNumber,
      itemId,
      itemName: item.name,
      status,
    };

    if (status === "ready") {
      // Notify waiters that item is ready to serve
      emitToWaiters(order.branchId.toString(), "item:ready", eventData);
    }

    // Notify kitchen (Sync other screens)
    // Spec: order.item_updated
    emitToKitchen(order.branchId.toString(), "order.item_updated", eventData);
    // Also keeping legacy/existing event if needed, but Spec specifically asked for order.item_updated
    // The existing code used 'item:status-changed'. I will keep both or switch to new one?
    // Spec 2.2 says: order.item_updated.
    // I will emit the Spec compliant event as well or instead.
    // Let's emit what the Spec requested.

    emitToWaiters(order.branchId.toString(), "order.item_updated", eventData); // Waiters also need to know

    ApiResponse.success(order, `Item status updated to ${status}`).send(res);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/orders/:id/items/:itemId/priority
 * Kitchen sets item priority
 */
export const updateItemPriority = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id, itemId } = req.params;
    const { priority } = req.body;

    const order = await Order.findById(id);

    if (!order) {
      throw ApiError.notFound("Order not found");
    }

    const item = order.items.find((i) => i._id?.toString() === itemId);

    if (!item) {
      throw ApiError.notFound("Item not found in order");
    }

    item.priority = priority;
    await order.save();

    emitToKitchen(order.branchId.toString(), "item:priority-changed", {
      orderId: order._id,
      itemId,
      priority,
    });

    ApiResponse.success(order, "Item priority updated").send(res);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/orders/:id/items/:itemId/note
 * Update item note
 */
export const updateItemNote = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id, itemId } = req.params;
    const { note } = req.body;

    const order = await Order.findById(id);

    if (!order) {
      throw ApiError.notFound("Order not found");
    }

    const item = order.items.find((i) => i._id?.toString() === itemId);

    if (!item) {
      throw ApiError.notFound("Item not found in order");
    }

    item.note = note;
    await order.save();

    emitToKitchen(order.branchId.toString(), "item:note-changed", {
      orderId: order._id,
      itemId,
      note,
    });

    ApiResponse.success(order, "Item note updated").send(res);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/orders/:id/items/:itemId/cancel
 * Cancel a specific item
 */
export const cancelItem = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id, itemId } = req.params;
    const { reason } = req.body;

    const order = await Order.findById(id);

    if (!order) {
      throw ApiError.notFound("Order not found");
    }

    const item = order.items.find((i) => i._id?.toString() === itemId);

    if (!item) {
      throw ApiError.notFound("Item not found in order");
    }

    if (item.status === "served") {
      throw ApiError.badRequest("Cannot cancel served item");
    }

    item.status = "cancelled";
    item.note = reason ? `[Cancelled: ${reason}] ${item.note}` : item.note;
    order.calculateTotals();
    await order.save();

    emitToBranch(order.branchId.toString(), "item:cancelled", {
      orderId: order._id,
      orderNumber: order.orderNumber,
      itemId,
      itemName: item.name,
      reason,
    });

    ApiResponse.success(order, "Item cancelled").send(res);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/orders/:id/promotion
 * Apply promotion code
 */
export const applyPromotion = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { code } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      throw ApiError.notFound("Order not found");
    }

    if (order.promotionId) {
      throw ApiError.badRequest("Promotion already applied");
    }

    const promotion = await Promotion.findOne({ code: code.toUpperCase() });

    if (!promotion) {
      throw ApiError.notFound("Promotion code not found");
    }

    const validation = promotion.isValid(order.subtotal, order.branchId);

    if (!validation.valid) {
      throw ApiError.badRequest(validation.reason || "Invalid promotion");
    }

    order.promotionId = promotion._id as mongoose.Types.ObjectId;
    order.discount = promotion.calculateDiscount(order.subtotal);
    order.calculateTotals();
    await order.save();

    ApiResponse.success(order, "Promotion applied").send(res);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/orders/:id/payment
 * Complete payment (Cashier)
 */
export const completePayment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      throw ApiError.notFound("Order not found");
    }

    if (order.paymentStatus === "paid") {
      throw ApiError.badRequest("Order already paid");
    }

    order.paymentStatus = "paid";
    order.paymentMethod = "cash";
    order.status = "completed";
    order.completedAt = new Date();

    // Increment promotion usage if used
    if (order.promotionId) {
      await Promotion.findByIdAndUpdate(order.promotionId, {
        $inc: { usedCount: 1 },
      });
    }

    await order.save();

    // Free up the table
    await Table.findByIdAndUpdate(order.tableId, {
      status: "available",
      currentOrderId: null,
    });

    emitToBranch(order.branchId.toString(), "order:completed", {
      orderId: order._id,
      orderNumber: order.orderNumber,
      total: order.total,
    });

    ApiResponse.success(order, "Payment completed").send(res);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/orders/:id/cancel
 * Cancel entire order
 */
export const cancelOrder = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { reason } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      throw ApiError.notFound("Order not found");
    }

    if (order.status !== "active") {
      throw ApiError.badRequest("Cannot cancel completed order");
    }

    order.status = "cancelled";
    order.cancelReason = reason || "";
    await order.save();

    // Free up the table
    await Table.findByIdAndUpdate(order.tableId, {
      status: "available",
      currentOrderId: null,
    });

    emitToBranch(order.branchId.toString(), "order:cancelled", {
      orderId: order._id,
      orderNumber: order.orderNumber,
      reason,
    });

    ApiResponse.success(order, "Order cancelled").send(res);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/orders/kitchen
 * Get pending items for kitchen with priority sorting
 */
export const getKitchenQueue = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const branchId = req.query.branchId || req.user?.branchId;

    if (!branchId) {
      throw ApiError.badRequest("Branch ID required");
    }

    const orders = await Order.find({
      branchId,
      status: "active",
      "items.status": { $in: ["pending", "cooking"] },
    })
      .populate("tableId", "tableNumber")
      .sort({ createdAt: 1 });

    // Flatten and sort items by priority
    const queue = orders.flatMap((order) =>
      order.items
        .filter((item) => ["pending", "cooking"].includes(item.status))
        .map((item) => ({
          orderId: order._id,
          orderNumber: order.orderNumber,
          tableNumber: (order.tableId as any)?.tableNumber,
          itemId: item._id,
          name: item.name,
          quantity: item.quantity,
          note: item.note,
          status: item.status,
          priority: item.priority,
          createdAt: item.createdAt,
        })),
    );

    // Sort by priority (lower = higher priority), then by creation time
    queue.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    ApiResponse.success(queue, "Kitchen queue retrieved").send(res);
  } catch (error) {
    next(error);
  }
};
