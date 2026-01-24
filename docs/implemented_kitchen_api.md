# Implemented Kitchen API Reference

This document details the API endpoints implemented for the Kitchen Display System (KDS).

## Base URL

`/api`

## Authentication

All endpoints require a valid Bearer Token in the `Authorization` header.
`Authorization: Bearer <token>`

---

## 1. Kitchen Endpoints

### 1.1 Get Active Kitchen Orders

Retrieves a list of orders that have active items (pending, cooking, ready) for the kitchen to process.

- **Endpoint:** `GET /kitchen/orders`
- **Access:** Cook, Admin, Superadmin, Waiter, Cashier
- **Query Parameters:**
  - `branchId` (optional): Filter by branch. Defaults to user's branch.
- **Response:**
  ```json
  {
    "success": true,
    "message": "Active kitchen orders retrieved",
    "data": [
      {
        "_id": "67936...",
        "orderNumber": "001",
        "table": {
          "tableNumber": "T01"
        },
        "createdAt": "2024-01-24T10:00:00.000Z",
        "note": "No spicy",
        "items": [
          {
            "_id": "item_1",
            "name": "Fried Rice",
            "quantity": 2,
            "note": "Extra egg",
            "status": "cooking",
            "selectedOptions": []
          }
        ]
      }
    ]
  }
  ```

### 1.2 Mark Item Out of Stock

Mark a menu item as unavailable (isAvailable = false).

- **Endpoint:** `POST /kitchen/inventory/out-of-stock`
- **Access:** Cook, Admin, Superadmin
- **Body:**
  ```json
  {
    "menuItemId": "67936...",
    "reason": "Out of ingredients"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Item marked out of stock",
    "data": null
  }
  ```

---

## 2. Order Updates (Kitchen specific)

### 2.1 Update Order Status

Update the status of an entire order (e.g., used for moving tickets on a Kanban board).

- **Endpoint:** `PATCH /orders/:id/status`
- **Access:** Cook, Waiter, Admin, Superadmin
- **Body:**
  ```json
  {
    "status": "cooking" // 'active', 'completed', 'cancelled'
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Order status updated",
    "data": { ...order object... }
  }
  ```

### 2.2 Update Item Status

Update the status of a specific item within an order.

- **Endpoint:** `PATCH /orders/:id/items/:itemId/status`
- **Access:** Cook, Waiter, Admin, Superadmin
- **Body:**
  ```json
  {
    "status": "ready" // 'pending', 'cooking', 'ready', 'served', 'cancelled'
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Item status updated to ready",
    "data": { ...order object... }
  }
  ```
