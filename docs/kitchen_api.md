# Kitchen Display System (KDS) - API Specification

## Overview

This document outlines the API endpoints and WebSocket events required to support the Kitchen Display System (KDS). The system requires real-time synchronization and granular status updates for both full Orders and individual Order Items.

## 1. REST API Endpoints

### 1.1. Get Active Kitchen Orders

Fetch all orders that need kitchen attention (Pending, Cooking, Ready).

- **Endpoint**: `GET /api/kitchen/orders`
- **Query Params**:
  - `branchId`: string (Required)
  - `status`: string[] (Optional, e.g., `["active"]` - excludes completed/cancelled)
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "order_123",
        "orderNumber": "019",
        "table": { "tableNumber": "5" },
        "createdAt": "2024-01-24T10:00:00Z",
        "note": "No spicy",
        "items": [
          {
            "_id": "item_1",
            "name": "Fried Rice",
            "quantity": 2,
            "note": "Extra egg",
            "status": "cooking" // pending | cooking | ready
          }
        ]
      }
    ]
  }
  ```

### 1.2. Update Order Status (Move Ticket)

Update the overall status of an order (e.g., when dragging a ticket on Kanban).

- **Endpoint**: `PATCH /api/orders/:orderId/status`
- **Body**:
  ```json
  {
    "status": "cooking" // active | completed | cancelled (if mapped to FE columns)
  }
  ```
  _Note: If the Frontend moves a ticket to "Ready", the BE should ideally check if all items are ready. If not, this might be a bulk update operation._

### 1.3. Update Order Item Status (Checklist)

Update the status of a specific item within an order (e.g., Chef marks "Fried Rice" as Done).

- **Endpoint**: `PATCH /api/orders/:orderId/items/:itemId/status`
- **Body**:
  ```json
  {
    "status": "ready" // cooking | ready
  }
  ```

  - **Logic**:
    - If `status` -> `ready`: Item is crossed out on UI.
    - If `status` -> `cooking`: Item is un-crossed (Undo action).
    - **Auto-Update Logic (Optional but Recommended)**: If _all_ items in an order are marked `ready`, the BE should automatically update the parent Order's status to `ready` (or notify frontend to do so).

### 1.4. Mark Out of Stock (Inventory)

Notify that an item is out of stock.

- **Endpoint**: `POST /api/kitchen/inventory/out-of-stock`
- **Body**:
  ```json
  {
    "menuItemId": "menu_item_abc",
    "reason": "Out of ingredients"
  }
  ```

---

## 2. Real-time Events (WebSocket / SSE)

The KDS relies on real-time updates to show new orders immediately without refreshing.

### 2.1. Channel: `branch_{branchId}`

### 2.2. Events

#### `order.created` (New Order)

Triggered when a waiter submits a new order.

- **Payload**: Full Order Object (same as GET response).
- **Client Action**:
  - Play "Ding" sound.
  - Add ticket to "Waiting" column.

#### `order.updated` (Status Change)

Triggered when an order's status changes (e.g., updated by another screen or waiter).

- **Payload**:
  ```json
  {
    "orderId": "order_123",
    "status": "completed",
    "updatedAt": "..."
  }
  ```

#### `order.item_updated` (Item Status Change)

Triggered when an item status changes (e.g., multiple chefs working on same order).

- **Payload**:
  ```json
  {
    "orderId": "order_123",
    "itemId": "item_1",
    "status": "ready"
  }
  ```

## 3. Data Definitions (Enums)

### Kitchen Item Status

- `pending`: Order received, waiting to start.
- `cooking`: Chef is working on it.
- `ready`: Cooked, waiting for waiter to serve.
- `served`: Customer has received the food.
