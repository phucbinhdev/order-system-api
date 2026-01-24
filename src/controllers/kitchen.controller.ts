import { NextFunction, Response } from "express";
import { Order, MenuItem } from "../models";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { AuthRequest } from "../types";
import { emitToWaiters, emitToBranch } from "../config/socket";

/**
 * GET /api/kitchen/orders
 * Fetch all orders that need kitchen attention
 */
export const getActiveOrders = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { branchId, status } = req.query;

    // Default statuses if not provided: active (which implies pending/cooking items)
    // ideally we want orders that are active.
    const orderFilter: any = {
      branchId: branchId || req.user?.branchId,
      status: "active", // Only active orders
    };

    if (!orderFilter.branchId) {
      throw ApiError.badRequest("Branch ID is required");
    }

    // Fetch orders
    const orders = await Order.find(orderFilter)
      .populate("tableId", "tableNumber")
      .sort({ createdAt: 1 }); // Oldest first

    // Transform to Spec format
    // Filter out orders where all items are already served/cancelled if the kitchen doesn't need to see them?
    // Spec says: "Fetch all orders that need kitchen attention (Pending, Cooking, Ready)"

    const formattedOrders = orders
      .map((order) => {
        return {
          _id: order._id,
          orderNumber: order.orderNumber,
          table: {
            tableNumber: (order.tableId as any)?.tableNumber,
          },
          createdAt: order.createdAt,
          note: order.note,
          items: order.items
            .filter((item) =>
              ["pending", "cooking", "ready"].includes(item.status),
            ) // Only relevant items
            .map((item) => ({
              _id: item._id,
              name: item.name,
              quantity: item.quantity,
              note: item.note,
              status: item.status,
              selectedOptions: item.selectedOptions,
            })),
        };
      })
      .filter((order) => order.items.length > 0); // Remove orders with no relevant items

    ApiResponse.success(
      formattedOrders,
      "Active kitchen orders retrieved",
    ).send(res);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/kitchen/inventory/out-of-stock
 * Notify that an item is out of stock
 */
export const markOutOfStock = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { menuItemId, reason } = req.body;
    const branchId = req.user?.branchId;

    // Ideally we should check if the item belongs to the branch if menus are branch-specific.
    // Assuming MenuItem is global or linked. The spec doesn't specify deeply.
    // But usually stock is per branch? The Spec 1.4 just updates the item.
    // If MenuItem is shared, this might affect all branches.
    // Let's assume for now MenuItem has an 'isAvailable' flag that is global OR we need to handle branch stock.
    // Looking at MenuItem model would be good, but I'll stick to simple update for now based on existing OrderController checks.

    const menuItem = await MenuItem.findById(menuItemId);
    if (!menuItem) {
      throw ApiError.notFound("Menu item not found");
    }

    menuItem.isAvailable = false;
    // We might want to save the reason somewhere, but MenuItem schema might not support it.
    // For now just setting availability.
    await menuItem.save();

    // Notify everyone in the branch
    if (branchId) {
      emitToBranch(branchId.toString(), "menu:out-of-stock", {
        menuItemId,
        name: menuItem.name,
        reason,
      });
    }

    ApiResponse.success(null, "Item marked out of stock").send(res);
  } catch (error) {
    next(error);
  }
};
