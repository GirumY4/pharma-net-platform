<div align="center">

<h1>💊 Pharma-Net Platform</h1>

<p><strong>A centralized, web-based pharmaceutical logistics platform connecting pharmacies and warehouses through automated ordering, inventory management, and payment tracking.</strong></p>

<p>
  <img src="https://img.shields.io/badge/Node.js-Express.js-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="MIT License" />
</p>

</div>

---

## 📋 Table of Contents

1. [Project Overview](#-project-overview)
2. [System Architecture](#-system-architecture)
3. [Features](#-features)
4. [Tech Stack](#-tech-stack)
5. [Project Structure](#-project-structure)
6. [Getting Started](#-getting-started)
7. [Environment Variables](#-environment-variables)
8. [API Overview](#-api-overview)
9. [User Roles & Access Control](#-user-roles--access-control)
10. [Database Schema](#-database-schema)
11. [Compliance & Data Integrity](#-compliance--data-integrity)
12. [Documentation](#-documentation)
13. [Branch Strategy & Commit Style](#-branch-strategy--commit-style)
14. [License](#-license)

---

## 🎯 Project Overview

Pharma-Net is a **centralized digital ecosystem** designed to modernize the pharmaceutical supply chain. In the current landscape, manual communication — phone calls and spreadsheets — leads to stock invisibility and critical medicine shortages.

Pharma-Net replaces these error-prone processes with:

- ✅ **Real-time inventory visibility** across connected warehouses
- ✅ **Automated order lifecycle management** (Pending → Approved → Dispatched → Delivered)
- ✅ **Role-based access control** (Admin, Warehouse Manager, Pharmacy)
- ✅ **Immutable audit logging** simulating ALCOA+ and 21 CFR Part 11 compliance
- ✅ **Comprehensive reporting** with low-stock alerts and expiry forecasting

> **Architecture:** A shared MERN-stack backend serves both the internal React web dashboard (in scope) and an external mobile app for pharmacy users (API consumer, out of scope).

---

## 🏗 System Architecture

```
┌──────────────────────────┐        ┌──────────────────────────┐
│  React Internal Web App  │        │   Mobile Pharmacy App    │
│  (Admin / Warehouse)     │        │   (External — Mobile     │
│      [In Scope]          │        │    Team) [API Consumer]  │
└────────────┬─────────────┘        └────────────┬─────────────┘
             │                                   │
             └──────────────┬────────────────────┘
                            │  RESTful JSON / HTTPS
             ┌──────────────▼─────────────┐
             │  Node.js + Express.js API  │
             │  (Business Logic, Auth,    │
             │   Validation, Audit Logs)  │
             └──────────────┬─────────────┘
                            │  Mongoose ODM
             ┌──────────────▼─────────────┐
             │  MongoDB (Single Source    │
             │  of Truth — Atlas) │
             └────────────────────────────┘
```

### Key Architectural Principles

| Principle                      | Implementation                                                                    |
| ------------------------------ | --------------------------------------------------------------------------------- |
| **Stateless API**              | JWT-based authentication — no server-side sessions                                |
| **Single Source of Truth**     | One MongoDB database shared by all clients                                        |
| **Centralized Business Logic** | All validation, stock checks, and RBAC enforced at the API layer                  |
| **Atomic Operations**          | MongoDB transactions ensure order approval and stock deduction are all-or-nothing |
| **Data Integrity**             | Soft deletes + immutable append-only audit logs                                   |

---

## ✨ Features

### 🔐 Identity & Access Management

- User registration and secure login (`bcrypt` password hashing, JWT session tokens)
- Role-Based Access Control — Admin, Warehouse Manager, Pharmacy
- Authorization middleware enforcing role permissions per route
- JWT expiration (configurable, default: 8 hours)

### 📦 Medicine & Inventory Management

- Full CRUD for medicine records (name, SKU, category, price, stock)
- **Batch/Lot tracking** with expiry dates and warehouse shelf locations
- **GRN (Goods Received Notes)** for incoming stock and **GIN (Goods Issued Notes)** for manual adjustments
- Low-stock alerts and near-expiry flags (auto-flagged within 90 days)
- Inventory search & filter by name, SKU, or category

### 🛒 Order Lifecycle Management

- Pharmacy-initiated orders validated against real-time stock levels
- Warehouse approval/rejection workflow with reason capture
- Full status lifecycle: **Pending → Approved → Processing → Dispatched → Delivered**
- Atomic stock deduction on order approval
- Complete order history with per-state timestamps

### 💳 Payment Recording

- Record payments against orders (bank transfer, cash, credit)
- Payment status mapping: **Unpaid → Partially Paid → Paid**
- Full payment audit trail (amount, method, timestamp, recorded-by)

### 📊 Reporting & Analytics

- Inventory reports with batch details, expiry info, and valuations
- Sales/volume summaries (daily/monthly)
- Expiration forecasts with configurable date ranges
- Exportable reports (CSV / PDF)
- Real-time dashboards for low-stock and near-expiry alerts

### 🔍 Audit & Compliance

- Immutable `AuditLog` collection: records _before_ and _after_ state for all data changes
- Soft-delete pattern: records are never permanently removed (`isDeleted: true`)
- Server-generated timestamps (contemporaneous, not client-supplied)
- Every action attributable to a specific User ID

---

## 🛠 Tech Stack

| Layer                | Technology                | Version           |
| -------------------- | ------------------------- | ----------------- |
| **Frontend**         | React + TypeScript (Vite) | React 19, TS ~5.9 |
| **UI Library**       | Material UI (MUI)         | v5                |
| **Backend**          | Node.js + Express.js      | Express ^5.2      |
| **Language**         | TypeScript                | ^5.9              |
| **Database**         | MongoDB + Mongoose ODM    | Mongoose ^9.2     |
| **Authentication**   | JSON Web Tokens (JWT)     | jsonwebtoken ^9   |
| **Password Hashing** | bcrypt                    | ^6.0              |
| **HTTP Security**    | Helmet, CORS              | Latest            |
| **Logging**          | Morgan                    | ^1.10             |
| **Dev Runtime**      | tsx (watch mode)          | ^4.21             |

---

## 📁 Project Structure

```
pharma-net-platform/
├── README.md
├── LICENSE
├── docs/
│   ├── Project_Context.md          # Architecture, team responsibilities, vision
│   ├── SRS.md                      # Software Requirements Specification (IEEE 29148)
│   ├── SDS.md                      # Software Design Specification
│   ├── API_Documentation.md        # Full REST API reference
│   └── Database_Schema.md          # Mongoose schema definitions
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.ts               # MongoDB / Mongoose connection
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.ts  # JWT validation
│   │   │   ├── rbac.middleware.ts  # Role-Based Access Control
│   │   │   ├── error.middleware.ts # Global error handler
│   │   │   └── notFound.middleware.ts
│   │   ├── modules/
│   │   │   ├── auth/               # Registration & login
│   │   │   ├── users/              # User CRUD (Admin only)
│   │   │   ├── inventory/          # Medicine schema, GRN/GIN, stock logic
│   │   │   ├── orders/             # Order lifecycle & stock validation
│   │   │   ├── payments/           # Payment recording & history
│   │   │   ├── reports/            # MongoDB aggregation pipelines
│   │   │   └── auditLogs/          # Immutable audit trail
│   │   ├── utils/                  # ALCOA+ helpers, bcrypt utilities
│   │   ├── app.ts                  # Express app initialization & route assembly
│   │   └── server.ts               # Entry point (http.listen + graceful shutdown)
│   ├── .env
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/
    ├── src/
    │   ├── app/                    # App-level initialization
    │   ├── components/             # Shared UI (common, layout, ui wrappers)
    │   ├── contexts/               # Global state (Auth, Theme)
    │   ├── features/               # Feature-based modules
    │   │   ├── admin/              # User governance
    │   │   ├── audit/              # ALCOA+ audit log viewer
    │   │   ├── auth/               # Login & JWT handling
    │   │   ├── dashboard/          # KPIs & alert center
    │   │   ├── inventory/          # Medicine CRUD, GRN/GIN, batch tracking
    │   │   ├── orders/             # Order approval workflows
    │   │   ├── payments/           # Financial tracking
    │   │   └── reports/            # Charts, exports, forecasts
    │   ├── hooks/                  # Global hooks
    │   ├── routes/                 # Route guards (ProtectedRoute, RoleRoute)
    │   ├── services/               # Axios global config & interceptors
    │   ├── styles/                 # Global CSS
    │   ├── types/                  # Global TypeScript definitions
    │   ├── utils/                  # Date formatters, token parsers
    │   ├── App.tsx
    │   └── main.tsx
    ├── index.html
    └── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+ (LTS)
- [MongoDB](https://www.mongodb.com/) (local instance or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- npm v9+

### 1. Clone the Repository

```bash
git clone https://github.com/GirumY4/pharma-net-platform.git
cd pharma-net-platform
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file (see [Environment Variables](#-environment-variables) below), then start the dev server:

```bash
npm run dev
```

The API will start at `http://localhost:5000` by default.

### 3. Frontend Setup

```bash
cd ../frontend
npm install
npm run dev
```

The React app will start at `http://localhost:5173` by default.

---

## 🔑 Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Server
NODE_ENV=development
PORT=5000

# Database
MONGO_URI=mongodb://localhost:27017/pharma-net
# or for Atlas:
# MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/pharma-net

# Authentication
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRATION=8h

# Security
PASSWORD_SALT_ROUNDS=12

# Alerts
ALERT_THRESHOLD=20        # Low-stock warning level (units)
EXPIRY_DAYS_THRESHOLD=90  # Near-expiry warning window (days)
```

> ⚠️ **Never commit your `.env` file.** It is already listed in `.gitignore`.

---

## 📡 API Overview

All endpoints respond with **JSON** over **HTTPS**. Authentication is via `Authorization: Bearer <token>` header.

### Authentication

| Method | Endpoint             | Description           | Role   |
| ------ | -------------------- | --------------------- | ------ |
| `POST` | `/api/auth/register` | Register a new user   | Public |
| `POST` | `/api/auth/login`    | Login and receive JWT | Public |

### Inventory / Medicines

| Method   | Endpoint             | Description                                      | Role      |
| -------- | -------------------- | ------------------------------------------------ | --------- |
| `GET`    | `/api/medicines`     | List all medicines (supports `?name=&category=`) | All       |
| `POST`   | `/api/medicines`     | Add new medicine                                 | Warehouse |
| `PUT`    | `/api/medicines/:id` | Update medicine details                          | Warehouse |
| `DELETE` | `/api/medicines/:id` | Soft-delete medicine                             | Warehouse |

### Orders

| Method  | Endpoint          | Description                      | Role      |
| ------- | ----------------- | -------------------------------- | --------- |
| `POST`  | `/api/orders`     | Submit a new order               | Pharmacy  |
| `GET`   | `/api/orders`     | List orders (scoped by role)     | All       |
| `GET`   | `/api/orders/:id` | Get order detail                 | All       |
| `PATCH` | `/api/orders/:id` | Approve / reject / update status | Warehouse |

### Payments

| Method | Endpoint        | Description                   | Role              |
| ------ | --------------- | ----------------------------- | ----------------- |
| `POST` | `/api/payments` | Record a payment for an order | Warehouse         |
| `GET`  | `/api/payments` | List payment records          | Warehouse / Admin |

### Reports

| Method | Endpoint                 | Description                              | Role              |
| ------ | ------------------------ | ---------------------------------------- | ----------------- |
| `GET`  | `/api/reports/inventory` | Full inventory summary                   | Warehouse / Admin |
| `GET`  | `/api/reports/sales`     | Sales stats (`?startDate=&endDate=`)     | Warehouse / Admin |
| `GET`  | `/api/reports/expiring`  | Near-expiry stock (`?before=YYYY-MM-DD`) | Warehouse / Admin |
| `GET`  | `/api/logs`              | Global audit trail                       | Admin only        |

> 📄 For the full API specification including request/response schemas, see [`docs/API_Documentation.md`](./docs/API_Documentation.md).

---

## 👥 User Roles & Access Control

| Role                     | Interface                                  | Permissions                                                                               |
| ------------------------ | ------------------------------------------ | ----------------------------------------------------------------------------------------- |
| **System Administrator** | Web App                                    | Full system access: manage users, assign roles, view all audit logs, global configuration |
| **Warehouse Manager**    | Web App                                    | Manage inventory (GRN/GIN), approve/reject orders, generate reports, record payments      |
| **Pharmacy User**        | Mobile App _(API Consumer — out of scope)_ | Search inventory, place orders, view order & payment history                              |

RBAC is enforced at the **API middleware layer** — a pharmacy user attempting to access a warehouse-only endpoint receives `403 Forbidden`.

---

## 🗄 Database Schema

### Collections Overview

| Collection  | Purpose                                                              |
| ----------- | -------------------------------------------------------------------- |
| `users`     | User accounts with roles, hashed passwords, and soft-delete support  |
| `medicines` | Drug records with batch/lot tracking, expiry dates, and stock counts |
| `orders`    | Order lifecycle records with status history and atomic stock linkage |
| `payments`  | Payment entries linked to orders with full audit trail               |
| `auditLogs` | Immutable append-only log of all data-modifying actions              |

### Key Schema Highlights

```js
// Medicine — with batch tracking
{
  name: String, sku: String (unique), category: String,
  price: Number, stockCount: Number,
  batches: [{ batchNumber, quantity, expiryDate, location }],
  isDeleted: Boolean, createdAt: Date, updatedAt: Date
}

// Order — with full lifecycle support
{
  pharmacyId: ObjectId, items: [{ medicineId, qty, price }],
  totalAmount: Number,
  status: 'pending' | 'approved' | 'processing' | 'dispatched' | 'delivered' | 'rejected',
  paymentStatus: 'Unpaid' | 'Partially Paid' | 'Paid',
  approvedBy: ObjectId, approvedAt: Date
}

// AuditLog — immutable
{
  userId: ObjectId, actionType: 'Create' | 'Update' | 'Delete',
  resource: String, resourceId: ObjectId,
  before: Object, after: Object, timestamp: Date  // server-generated
}
```

> 📄 For complete schema definitions, see [`docs/Database_Schema.md`](./docs/Database_Schema.md).

---

## 🛡 Compliance & Data Integrity

Pharma-Net simulates a professional, audit-ready pharmaceutical environment by implementing **ALCOA+** principles and **21 CFR Part 11** data integrity standards:

| Principle               | Implementation                                                          |
| ----------------------- | ----------------------------------------------------------------------- |
| **Attributable**        | Every write action links a `userId` to the record change                |
| **Contemporaneous**     | All timestamps are server-generated — clients cannot supply their own   |
| **Original & Accurate** | Records are never altered without a logged `before`/`after` diff        |
| **Legible & Complete**  | Audit logs are append-only with no delete or edit API endpoints         |
| **Soft Deletes**        | Records marked `isDeleted: true` — historical data is always preserved  |
| **Atomic Transactions** | Order approval triggers stock deduction in a single MongoDB transaction |

---

## 📚 Documentation

All detailed project documents are located in the [`docs/`](./docs/) folder:

| Document                                              | Description                                            |
| ----------------------------------------------------- | ------------------------------------------------------ |
| [`Project_Context.md`](./docs/Project_Context.md)     | Architecture overview, team scope, vision              |
| [`SRS.md`](./docs/SRS.md)                             | Software Requirements Specification (IEEE 29148)       |
| [`SDS.md`](./docs/SDS.md)                             | Software Design Specification                          |
| [`API_Documentation.md`](./docs/API_Documentation.md) | Full REST API reference with request/response examples |
| [`Database_Schema.md`](./docs/Database_Schema.md)     | MongoDB collections and Mongoose schema definitions    |

---

## 🌿 Branch Strategy & Commit Style

### Branches

| Branch           | Purpose                                                        |
| ---------------- | -------------------------------------------------------------- |
| `main`           | Stable / production-ready releases                             |
| `develop`        | Active integration branch                                      |
| `feature/<name>` | Individual features (e.g. `feature/auth`, `feature/inventory`) |

### Conventional Commits

This project follows [Conventional Commits](https://www.conventionalcommits.org/) format:

```
feat: add order approval workflow
fix: validate stock before order placement
docs: update API documentation for payments
refactor: extract JWT helper to utils
test: add integration tests for auth module
```

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](./LICENSE) file for details.

Copyright © 2026 Girum Y.

---

<div align="center">

**Built with ❤️ by the Pharma-Net Web & Backend Team**

[Repository](https://github.com/GirumY4/pharma-net-platform) · [API Docs](./docs/API_Documentation.md) · [SRS](./docs/SRS.md)

</div>
