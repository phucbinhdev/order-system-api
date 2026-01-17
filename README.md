# Order System API

Hệ thống API đặt món tại nhà hàng cho chuỗi đa chi nhánh với Express.js + MongoDB + TypeScript.

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your MongoDB connection
```

### Development

```bash
# Seed database with test data
npm run seed

# Start development server
npm run dev
```

Server will start at `http://localhost:3000`

### Production

```bash
# Build
npm run build

# Start
npm start
```

## 📁 Project Structure

```
src/
├── config/         # Configuration (env, database, socket)
├── controllers/    # Route handlers
├── middlewares/    # Auth, validation, error handling
├── models/         # Mongoose schemas
├── routes/         # API route definitions
├── services/       # Business logic
├── types/          # TypeScript interfaces
├── utils/          # Helper functions
└── validations/    # Joi schemas
```

## 🔐 Authentication

JWT-based authentication with access + refresh tokens.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | Login |
| `/api/auth/refresh` | POST | Refresh token |
| `/api/auth/logout` | POST | Logout |
| `/api/auth/me` | GET | Get profile |

## 👥 Roles

| Role | Permissions |
|------|-------------|
| **superadmin** | Full access, manage all branches |
| **admin** | Manage branch, menu, staff, reports |
| **cook** | View orders, update item status, mark items unavailable |
| **waiter** | Add items, update status, cancel items |
| **cashier** | View orders, process payments |

## 🔑 Test Accounts

```
superadmin@restaurant.com / Admin@123
admin@restaurant.com / Admin@123
cook@restaurant.com / Cook@123
waiter@restaurant.com / Waiter@123
cashier@restaurant.com / Cashier@123
```

## 📡 API Endpoints

### Public (QR Ordering)
- `GET /api/tables/:qrCode/menu` - Get menu by QR code
- `POST /api/tables/:qrCode/orders` - Create order

### Orders
- `GET /api/orders` - List orders
- `GET /api/orders/kitchen` - Kitchen queue (sorted by priority)
- `POST /api/orders/:id/items` - Add items
- `PATCH /api/orders/:id/items/:itemId/status` - Update item status
- `PATCH /api/orders/:id/items/:itemId/priority` - Set priority
- `PATCH /api/orders/:id/payment` - Complete payment

### Menu
- `GET /api/menu-items` - List items
- `PATCH /api/menu-items/:id/availability` - Toggle availability

### Statistics
- `GET /api/stats/dashboard` - Dashboard stats
- `GET /api/stats/revenue` - Revenue report
- `GET /api/stats/top-items` - Best sellers

## 🔌 WebSocket Events

### Kitchen Events
| Event | Direction | Description |
|-------|-----------|-------------|
| `kitchen:join` | Client → Server | Join kitchen room |
| `order:new` | Server → Client | New order received |
| `item:ready` | Server → Client | Item ready to serve |
| `item:status-changed` | Server → Client | Item status updated |

## 📝 License

ISC
