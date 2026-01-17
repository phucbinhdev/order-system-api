# 📚 Order System API Documentation

**Base URL:** `http://localhost:8017/api`

---

## 🔐 Authentication

### Login
```http
POST /auth/login
Content-Type: application/json
```

**Request:**
```json
{
  "email": "admin@restaurant.com",
  "password": "Admin@123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "...",
      "email": "admin@restaurant.com",
      "name": "Admin Chi nhánh Q1",
      "role": "admin",
      "branchId": "...",
      "isActive": true
    },
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG..."
  }
}
```

### Refresh Token
```http
POST /auth/refresh
Content-Type: application/json
```

**Request:**
```json
{
  "refreshToken": "eyJhbG..."
}
```

### Get Current User
```http
GET /auth/me
Authorization: Bearer <accessToken>
```

---

## 📱 Public APIs (Khách quét QR - Không cần auth)

### Lấy Menu từ QR Code
```http
GET /tables/:qrCode/menu
```

**Response:**
```json
{
  "success": true,
  "data": {
    "table": {
      "_id": "...",
      "tableNumber": "A01",
      "capacity": 4,
      "status": "available",
      "currentOrderId": null
    },
    "branch": {
      "_id": "...",
      "name": "Chi nhánh Quận 1",
      "address": "123 Nguyễn Huệ...",
      "phone": "028-1234-5678"
    },
    "menu": [
      {
        "category": {
          "_id": "...",
          "name": "Món khai vị",
          "slug": "mon-khai-vi"
        },
        "items": [
          {
            "_id": "...",
            "name": "Gỏi cuốn tôm thịt",
            "price": 45000,
            "description": "",
            "image": null,
            "isAvailable": true,
            "preparationTime": 10
          }
        ]
      }
    ]
  }
}
```

### Tạo Đơn Hàng Mới (Khách đặt món)
```http
POST /tables/:qrCode/orders
Content-Type: application/json
```

**Request:**
```json
{
  "items": [
    {
      "menuItemId": "64abc123...",
      "quantity": 2,
      "note": "Không hành"
    },
    {
      "menuItemId": "64abc456...",
      "quantity": 1,
      "note": ""
    }
  ],
  "note": "Bàn có trẻ em"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order created",
  "data": {
    "_id": "...",
    "orderNumber": "ORD-20260117-001",
    "tableId": "...",
    "branchId": "...",
    "items": [...],
    "status": "active",
    "subtotal": 155000,
    "discount": 0,
    "total": 155000,
    "paymentStatus": "unpaid"
  }
}
```

### Thêm Món Vào Đơn Đang Có
```http
POST /orders/:orderId/items
Content-Type: application/json
```

**Request:**
```json
{
  "items": [
    {
      "menuItemId": "64abc789...",
      "quantity": 1,
      "note": "Ít đá"
    }
  ]
}
```

### Áp Dụng Mã Khuyến Mãi
```http
POST /orders/:orderId/promotion
Content-Type: application/json
```

**Request:**
```json
{
  "code": "WEEKEND10"
}
```

### Validate Mã Khuyến Mãi
```http
POST /promotions/validate
Content-Type: application/json
```

**Request:**
```json
{
  "code": "WEEKEND10",
  "subtotal": 200000,
  "branchId": "64abc..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "promotion": {
      "_id": "...",
      "name": "Giảm 10% cuối tuần",
      "code": "WEEKEND10",
      "type": "percentage",
      "value": 10
    },
    "discount": 20000
  }
}
```

---

## 🍳 Kitchen APIs (Bếp - Cần auth với role: cook)

### Lấy Danh Sách Món Cần Nấu (Queue)
```http
GET /orders/kitchen?branchId=...
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "orderId": "...",
      "orderNumber": "ORD-20260117-001",
      "tableNumber": "A01",
      "itemId": "...",
      "name": "Phở bò tái",
      "quantity": 2,
      "note": "Không hành",
      "status": "pending",
      "priority": 5,
      "createdAt": "2026-01-17T04:50:00.000Z"
    }
  ]
}
```

### Cập Nhật Trạng Thái Món
```http
PATCH /orders/:orderId/items/:itemId/status
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request:**
```json
{
  "status": "cooking"  // pending | cooking | ready | served | cancelled
}
```

### Sắp Xếp Thứ Tự Ưu Tiên Món
```http
PATCH /orders/:orderId/items/:itemId/priority
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request:**
```json
{
  "priority": 1  // 1-10, số nhỏ = ưu tiên cao
}
```

### Cập Nhật Ghi Chú Món
```http
PATCH /orders/:orderId/items/:itemId/note
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request:**
```json
{
  "note": "Thêm rau"
}
```

### Báo Hết Món
```http
PATCH /menu-items/:menuItemId/availability
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request:**
```json
{
  "isAvailable": false
}
```

---

## 💰 Cashier APIs (Thu ngân - Cần auth với role: cashier)

### Lấy Danh Sách Đơn Hàng
```http
GET /orders?branchId=...&status=active
Authorization: Bearer <accessToken>
```

**Query params:**
- `branchId`: Filter theo chi nhánh
- `status`: `active` | `completed` | `cancelled`
- `tableId`: Filter theo bàn
- `page`: Trang (default: 1)
- `limit`: Số items/trang (default: 20)

### Chi Tiết Đơn Hàng
```http
GET /orders/:orderId
Authorization: Bearer <accessToken>
```

### Thanh Toán Đơn Hàng
```http
PATCH /orders/:orderId/payment
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request:**
```json
{
  "paymentMethod": "cash"
}
```

### Hủy Đơn Hàng (Admin only)
```http
PATCH /orders/:orderId/cancel
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request:**
```json
{
  "reason": "Khách yêu cầu hủy"
}
```

### Hủy Món Trong Đơn
```http
PATCH /orders/:orderId/items/:itemId/cancel
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request:**
```json
{
  "reason": "Hết nguyên liệu"
}
```

---

## 📊 Statistics APIs (Admin)

### Dashboard Tổng Quan
```http
GET /stats/dashboard?branchId=...
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "todayOrders": 45,
    "activeOrders": 8,
    "completedOrders": 35,
    "todayRevenue": 5250000,
    "todayDiscount": 125000,
    "netRevenue": 5250000
  }
}
```

### Doanh Thu Theo Thời Gian
```http
GET /stats/revenue?startDate=2026-01-01&endDate=2026-01-17&groupBy=day
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "success": true,
  "data": [
    { "_id": "2026-01-15", "orders": 42, "revenue": 4850000, "discount": 100000 },
    { "_id": "2026-01-16", "orders": 38, "revenue": 4200000, "discount": 80000 }
  ]
}
```

### Top Món Bán Chạy
```http
GET /stats/top-items?limit=10
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "success": true,
  "data": [
    { "_id": "...", "name": "Phở bò tái", "quantity": 120, "revenue": 7800000 },
    { "_id": "...", "name": "Cơm tấm sườn", "quantity": 95, "revenue": 5700000 }
  ]
}
```

---

## 🏢 CRUD APIs (Admin)

### Categories
```http
GET    /categories              # Danh sách
GET    /categories/:id          # Chi tiết
POST   /categories              # Tạo mới (auth required)
PUT    /categories/:id          # Cập nhật (auth required)
DELETE /categories/:id          # Xóa (auth required)
```

### Menu Items
```http
GET    /menu-items              # Danh sách
GET    /menu-items/:id          # Chi tiết
POST   /menu-items              # Tạo mới (auth required)
PUT    /menu-items/:id          # Cập nhật (auth required)
DELETE /menu-items/:id          # Xóa (auth required)
```

### Tables
```http
GET    /tables                  # Danh sách (auth required)
GET    /tables/:id              # Chi tiết (auth required)
POST   /tables                  # Tạo mới (admin)
PUT    /tables/:id              # Cập nhật (admin)
DELETE /tables/:id              # Xóa (admin)
POST   /tables/:id/regenerate-qr # Tạo QR mới (admin)
```

### Branches (SuperAdmin only)
```http
GET    /branches
POST   /branches
PUT    /branches/:id
DELETE /branches/:id
```

### Users (Admin)
```http
GET    /users
POST   /users
PUT    /users/:id
DELETE /users/:id
PATCH  /users/:id/password
```

### Promotions
```http
GET    /promotions              # Danh sách (admin)
POST   /promotions              # Tạo mới (admin)
PUT    /promotions/:id          # Cập nhật (admin)
DELETE /promotions/:id          # Xóa (admin)
POST   /promotions/validate     # Validate code (public)
```

---

## 🔌 WebSocket Events

**Connect:** `ws://localhost:8017`

### Client → Server
```javascript
// Bếp join room
socket.emit('kitchen:join', { branchId: '...' });

// Phục vụ join room
socket.emit('waiter:join', { branchId: '...' });

// Thu ngân join room
socket.emit('cashier:join', { branchId: '...' });
```

### Server → Client
```javascript
// Có đơn mới
socket.on('order:new', (data) => {
  // data: { order, table: { tableNumber } }
});

// Món đã sẵn sàng (cho waiter)
socket.on('item:ready', (data) => {
  // data: { orderId, orderNumber, itemId, itemName, status }
});

// Trạng thái món thay đổi
socket.on('item:status-changed', (data) => {
  // data: { orderId, orderNumber, itemId, itemName, status }
});

// Món hết hàng
socket.on('menu:availability', (data) => {
  // data: { menuItemId, name, isAvailable }
});

// Đơn hàng hoàn thành
socket.on('order:completed', (data) => {
  // data: { orderId, orderNumber, total }
});

// Đơn hàng bị hủy
socket.on('order:cancelled', (data) => {
  // data: { orderId, orderNumber, reason }
});
```

---

## 🔑 Test Data

### Accounts
| Email | Password | Role |
|-------|----------|------|
| superadmin@restaurant.com | Admin@123 | superadmin |
| admin@restaurant.com | Admin@123 | admin |
| cook@restaurant.com | Cook@123 | cook |
| waiter@restaurant.com | Waiter@123 | waiter |
| cashier@restaurant.com | Cashier@123 | cashier |

### Sample QR Codes
Lấy danh sách bàn và QR codes:
```http
GET /tables
Authorization: Bearer <admin_token>
```

---

## ⚠️ Error Response Format
```json
{
  "success": false,
  "message": "Error description here"
}
```

### Common Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate key)
- `500` - Internal Server Error
