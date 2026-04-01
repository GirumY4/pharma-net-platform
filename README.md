<div align="center">

<h1> Pharma-Net Platform</h1>

<p><strong>A B2B2C multi-tenant SaaS pharmaceutical logistics platform connecting independent pharmacies with public consumers through a global medicine marketplace, tenant-isolated inventory management, and automated order fulfillment.</strong></p>

<p>
  <img src="https://img.shields.io/badge/Node.js-Express.js_v5-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/MongoDB-Mongoose_v9-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="MIT License" />
</p>

</div>

---

##  Table of Contents

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

##  Project Overview

Pharma-Net is a **B2B2C Multi-Tenant SaaS platform** designed to modernize the pharmaceutical last-mile supply chain by connecting independent pharmacies directly with public consumers (patients). In the current landscape, patients cannot easily locate which local pharmacy has their required medication in stock, and pharmacies manage inventory through fragmented spreadsheets and manual communication.

Pharma-Net replaces these error-prone processes with:

- ✅ **Global medicine marketplace** — Public Users search for medicines across all onboarded pharmacy tenants simultaneously
- ✅ **Multi-tenant data isolation** — Each pharmacy operates as an isolated SaaS tenant, scoped by `pharmacyId` foreign keys
- ✅ **Automated order lifecycle** (Pending → Approved → Processing → Ready → Delivered) with pickup/delivery fulfillment
- ✅ **Three-tier role-based access control** (Admin, Pharmacy Manager, Public User)
- ✅ **Immutable audit logging** simulating ALCOA+ and 21 CFR Part 11 compliance
- ✅ **Tenant-scoped reporting** with low-stock alerts, expiry forecasting, and sales analytics

> **Architecture:** A shared MERN-stack backend serves both the React SaaS web dashboard (for pharmacy tenant management and admin governance) and an external mobile app for public consumers (API consumer, out of scope). Multi-tenancy is enforced at the API layer via JWT-embedded `pharmacyId` — never from client input.

---

## 🏗 System Architecture

```
┌──────────────────────────────┐        ┌─────────────────────────────┐
│  React SaaS Web Dashboard    │        │   Mobile Consumer App       │
│  (Pharmacy Manager / Admin)  │        │   (Public User / Patient)   │
│        [In Scope]            │        │   [API Consumer — Mobile    │
│                              │        │    Team] [Out of Scope]     │
└──────────────┬───────────────┘        └──────────────┬──────────────┘
               │                                       │
               └───────────────┬───────────────────────┘
                               │  RESTful JSON / HTTPS
               ┌───────────────▼──────────────────┐
               │  Node.js + Express.js v5 API     │
               │  (Tenant Gate, RBAC, Business    │
               │   Logic, Audit Logging)          │
               │  pharmacyId extracted from JWT   │
               └───────────────┬──────────────────┘
                               │  Mongoose ODM v9
               ┌───────────────▼──────────────────┐
               │  MongoDB (Single Source of Truth  │
               │  — pharmacyId-scoped collections) │
               └──────────────────────────────────┘
```

### Key Architectural Principles

| Principle                      | Implementation                                                                                       |
| ------------------------------ | ---------------------------------------------------------------------------------------------------- |
| **Multi-Tenant Isolation**     | `pharmacyId` FK on scoped collections, auto-injected from JWT — never from client input              |
| **Stateless API**              | JWT-based authentication with embedded `pharmacyId` for tenant scoping — no server-side sessions     |
| **Single Source of Truth**     | One MongoDB database shared by all clients (SaaS dashboard + mobile consumer app)                    |
| **Centralized Business Logic** | All validation, stock checks, tenant scoping, and RBAC enforced at the API layer                     |
| **Atomic Operations**          | MongoDB sessions/transactions ensure order approval + stock deduction + ledger entry are all-or-nothing |
| **Data Integrity**             | Soft deletes, immutable append-only audit logs, and immutable inventory transaction ledger            |

---

##  Features

###  Identity & Access Management

- User registration and secure login (`bcrypt` password hashing, JWT session tokens)
- JWT payload includes `userId`, `role`, and `pharmacyId` for automatic tenant scoping
- Three-tier Role-Based Access Control — Admin, Pharmacy Manager, Public User
- Authorization middleware enforcing role permissions per route
- Tenant context injection: `pharmacyId` extracted from JWT and injected into all downstream queries

###  Multi-Tenant Medicine & Inventory Management

- Tenant-isolated CRUD for medicines (implicit `pharmacyId` assignment from JWT)
- **Batch/lot tracking** with GTIN barcodes, expiry dates, supplier names, and shelf locations
- **GRN (Goods Received Notes)** and **GIN (Goods Issued Notes)** — each creating an immutable `InventoryTransaction` record
- Low-stock alerts via configurable `reorderThreshold` and Mongoose virtual `isLowStock`
- Soft deletes (`isDeleted: true`, `deletedAt`) to preserve historical data for compliance

###  Global Marketplace Search

- Cross-tenant medicine discovery: Public Users search all active pharmacy tenants simultaneously
- Results include pharmacy name, phone, address, city, GPS location, unit price, and availability
- Sensitive tenant data (supplier names, shelf locations, batch-level details) excluded from public responses
- City-based filtering for geographic marketplace search

###  Consumer Order & Fulfillment Lifecycle

- Public-initiated orders specifying a target `pharmacyId` — system stamps orders with `customerId` and `pharmacyId`
- **Fulfillment method selection**: `pickup` (patient walks into pharmacy) or `delivery` (dispatched to patient's address)
- Atomic stock validation within MongoDB transactions before finalizing orders
- Pharmacy Manager review & approval workflow (tenant-scoped — managers only see their pharmacy's orders)
- Full status lifecycle: **Pending → Approved → Processing → Ready → Delivered** (or Rejected)
- Each transition timestamped and attributed in the immutable audit trail

###  Payment Recording

- Tenant-scoped payment recording against fulfilled orders (bank transfer, cash, mobile money)
- Payment status mapping: **Unpaid → Partially Paid → Paid**
- Full payment audit trail (amount, method, timestamp, `customerId`, `pharmacyId`, recorded-by)

###  Reporting & Analytics

- **Pharmacy Managers:** Tenant-scoped dashboards — sales volume, top-selling medicines, inventory valuations, expiry forecasts
- **System Administrators:** Platform-wide metrics — total GMV, active tenants, order volume, compliance summaries
- Exportable reports (CSV / PDF)
- Real-time dashboards for low-stock and near-expiry alerts

###  Audit & Compliance

- Immutable `AuditLog` collection: records `before` and `after` state for all data changes
- Immutable `InventoryTransaction` ledger: tamper-proof GRN/GIN stock movement records
- Soft-delete pattern: records are never permanently removed (`isDeleted: true`)
- Server-generated timestamps (contemporaneous, not client-supplied)
- Every action attributable to a specific User ID with IP address and User-Agent tracking

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
│   ├── Project_Context.md          # Architecture, team responsibilities, multi-tenant vision
│   ├── SRS.md                      # Software Requirements Specification (IEEE 29148)
│   ├── SDS.md                      # Software Design Specification
│   ├── API_Documentation.md        # Full REST API reference with tenant scoping
│   └── Database_Schema.md          # Mongoose schema definitions (pharmacyId-scoped)
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.ts               # MongoDB / Mongoose connection
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.ts   # JWT verification & tenant context injection
│   │   │   ├── rbac.middleware.ts   # Role-Based Access Control guard
│   │   │   ├── error.middleware.ts  # Global error handler
│   │   │   └── notFound.middleware.ts
│   │   ├── modules/
│   │   │   ├── auth/               # Registration & login (JWT with pharmacyId)
│   │   │   ├── users/              # User CRUD, tenant account lifecycle (Admin)
│   │   │   ├── inventory/          # Tenant-scoped medicines, GRN/GIN, marketplace search
│   │   │   ├── orders/             # Cross-tenant order placement & pharmacy fulfillment
│   │   │   ├── payments/           # Tenant-scoped payment recording & history
│   │   │   ├── reports/            # Tenant-scoped & platform-wide analytics
│   │   │   └── auditLogs/          # Immutable audit trail (read-only endpoints)
│   │   ├── utils/                  # ALCOA+ helpers, centralized auditLogger.ts
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
    │   │   ├── admin/              # Tenant governance & platform health
    │   │   ├── audit/              # ALCOA+ audit log viewer
    │   │   ├── auth/               # Login & JWT handling
    │   │   ├── dashboard/          # Tenant-scoped KPIs & alert center
    │   │   ├── inventory/          # Medicine CRUD, GRN/GIN, batch tracking
    │   │   ├── orders/             # Incoming order fulfillment workflows
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

##  Getting Started

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

The React SaaS dashboard will start at `http://localhost:5173` by default.

---

##  Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Server
NODE_ENV=development
PORT=5000

# Database
MONGO_URI=mongodb://localhost:27017/pharma-net
# or for Atlas:
# MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/pharma-net

# Authentication (JWT payload includes userId, role, pharmacyId)
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

##  API Overview

All endpoints respond with **JSON** over **HTTPS**. Authentication is via `Authorization: Bearer <token>` header. The JWT payload includes `userId`, `role`, and `pharmacyId` for automatic multi-tenant scoping.

### Authentication

| Method | Endpoint             | Description                       | Access     |
| ------ | -------------------- | --------------------------------- | ---------- |
| `POST` | `/api/auth/register` | Register a new user               | 🔓 Public  |
| `POST` | `/api/auth/login`    | Login and receive JWT             | 🔓 Public  |

### Users (Admin)

| Method   | Endpoint         | Description                          | Access     |
| -------- | ---------------- | ------------------------------------ | ---------- |
| `GET`    | `/api/users`     | List all users (paginated, filtered) | 🔴 Admin   |
| `GET`    | `/api/users/:id` | Get single user                      | 🔴 Admin   |
| `PATCH`  | `/api/users/:id` | Update user name/role/status         | 🔴 Admin   |
| `DELETE` | `/api/users/:id` | Soft-delete user                     | 🔴 Admin   |
| `GET`    | `/api/users/me`  | Get current user's profile           | All Roles  |

### Medicines & Inventory

| Method   | Endpoint                      | Description                                          | Access            |
| -------- | ----------------------------- | ---------------------------------------------------- | ----------------- |
| `GET`    | `/api/medicines`              | List tenant-scoped medicines                         | 🟡 Manager / 🔴 Admin |
| `GET`    | `/api/medicines/marketplace`  | **Global marketplace search** (cross-tenant)         | 🔓 Public         |
| `POST`   | `/api/medicines`              | Add new medicine (auto-stamped with `pharmacyId`)    | 🟡 Manager        |
| `GET`    | `/api/medicines/:id`          | Get single medicine with batches                     | 🟡 Manager        |
| `PATCH`  | `/api/medicines/:id`          | Update medicine metadata                             | 🟡 Manager        |
| `DELETE` | `/api/medicines/:id`          | Soft-delete medicine                                 | 🟡 Manager        |
| `POST`   | `/api/medicines/:id/batches`  | Add new batch (auto-creates GRN)                     | 🟡 Manager        |

### Inventory Transactions (GRN / GIN)

| Method | Endpoint                      | Description                                 | Access     |
| ------ | ----------------------------- | ------------------------------------------- | ---------- |
| `GET`  | `/api/inventory-transactions` | List tenant-scoped GRN/GIN transactions     | 🟡 Manager |
| `POST` | `/api/inventory-transactions` | Record stock adjustment (immutable ledger)  | 🟡 Manager |

### Orders

| Method  | Endpoint                  | Description                                         | Access                  |
| ------- | ------------------------- | --------------------------------------------------- | ----------------------- |
| `GET`   | `/api/orders`             | List orders (scoped by role)                        | All Roles               |
| `POST`  | `/api/orders`             | Place order targeting a pharmacy (with fulfillment) | 🟢 Public User          |
| `GET`   | `/api/orders/:id`         | Get order detail with status history                | All Roles (scoped)      |
| `PATCH` | `/api/orders/:id/status`  | Update order status (approve/reject/fulfill)        | 🟡 Manager              |

### Payments

| Method | Endpoint           | Description                        | Access                    |
| ------ | ------------------ | ---------------------------------- | ------------------------- |
| `GET`  | `/api/payments`    | List payment records               | All Roles (scoped)        |
| `POST` | `/api/payments`    | Record payment against an order    | 🟡 Manager                |
| `GET`  | `/api/payments/:id`| Get single payment                 | 🟡 Manager / 🔴 Admin     |

### Reports & Analytics

| Method | Endpoint                 | Description                              | Access                    |
| ------ | ------------------------ | ---------------------------------------- | ------------------------- |
| `GET`  | `/api/reports/inventory` | Tenant-scoped inventory summary          | 🟡 Manager / 🔴 Admin     |
| `GET`  | `/api/reports/sales`     | Tenant-scoped sales stats                | 🟡 Manager / 🔴 Admin     |
| `GET`  | `/api/reports/expiring`  | Near-expiry stock report                 | 🟡 Manager / 🔴 Admin     |
| `GET`  | `/api/reports/platform`  | Platform-wide analytics                  | 🔴 Admin                  |

### Audit Logs

| Method | Endpoint     | Description                   | Access                    |
| ------ | ------------ | ----------------------------- | ------------------------- |
| `GET`  | `/api/logs`  | Immutable audit trail (read-only) | 🟡 Manager / 🔴 Admin |

> 📄 For the full API specification including request/response schemas, tenant scoping rules, and error codes, see [`docs/API_Documentation.md`](./docs/API_Documentation.md).

---

##  User Roles & Access Control

| Role                       | Interface                                    | Permissions                                                                                                         |
| -------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **System Administrator**   | SaaS Web Admin Console                       | Platform governance: manage pharmacy tenant accounts, activate/deactivate tenants, view cross-tenant audit logs, monitor platform health metrics |
| **Pharmacy Manager**       | SaaS Web Tenant Dashboard                    | Tenant-isolated operations: manage local medicine catalog & batches, process GRN/GIN adjustments, fulfill incoming consumer orders, record payments, generate tenant-scoped reports. **All operations scoped by `pharmacyId` from JWT.** |
| **Public User / Patient**  | Mobile App _(API Consumer — out of scope)_   | Consumer marketplace: search for medicine across all pharmacies, view pharmacy location & contact info, place orders (pickup or delivery), track order status & payment history |

RBAC is enforced at the **API middleware layer** — the JWT payload contains `userId`, `role`, and `pharmacyId`. A public user attempting to access a pharmacy-manager-only endpoint receives `403 Forbidden`. A pharmacy manager attempting to access another tenant's data receives `403 Tenant Mismatch`.

---

## 🗄 Database Schema

### Multi-Tenancy Model

Pharma-Net uses a **Shared Database, Shared Schema** multi-tenancy pattern. Tenant isolation is enforced at the application layer via `pharmacyId` foreign keys on all scoped collections, extracted from the authenticated user's JWT — never from client input.

### Collections Overview

| #  | Collection              | Tenant-Scoped | Immutable | Purpose                                                                        |
|----|------------------------|:---:|:---:|--------------------------------------------------------------------------------|
| 1  | `users`                | —   | —   | All platform users (Admin, Pharmacy Manager, Public User). A pharmacy manager's `_id` doubles as `pharmacyId`. Includes contact fields (`phoneNumber`, `address`, `city`, `location`) for marketplace discoverability. |
| 2  | `medicines`            | 🔒  | —   | Tenant-scoped medicine catalog with embedded batch/lot records.                |
| 3  | `inventoryTransactions`| 🔒  | 🔐  | Immutable GRN/GIN stock movement ledger, scoped per pharmacy tenant.           |
| 4  | `orders`               | 🔒  | —   | Cross-tenant consumer-to-pharmacy purchase orders with fulfillment method (pickup/delivery) and full status lifecycle. |
| 5  | `payments`             | 🔒  | —   | Tenant-scoped payment transactions recorded against fulfilled orders.          |
| 6  | `auditLogs`            | —   | 🔐  | Immutable, append-only log of all data-modifying actions across the platform.  |

> **Legend:** 🔒 = Tenant-scoped via `pharmacyId` FK. 🔐 = Schema-level immutable (update/delete blocked by Mongoose pre-hooks).

### Key Schema Highlights

```js
// User — with contact/location for marketplace discovery
{
  name: String, email: String (unique), passwordHash: String,
  role: 'admin' | 'pharmacy_manager' | 'public_user',
  phoneNumber: String, address: String, city: String,
  location: { lat: Number, lng: Number },  // GPS for Google Maps
  isActive: Boolean, isDeleted: Boolean, deletedAt: Date
}

// Medicine — tenant-scoped with batch tracking
{
  pharmacyId: ObjectId (FK), name: String, sku: String (unique),
  category: String, unitPrice: Number, totalStock: Number,
  reorderThreshold: Number,
  batches: [{ batchNumber, gtin, quantity, expiryDate, supplierName, shelfLocation }],
  isDeleted: Boolean, createdBy: ObjectId
}
// Virtual: isLowStock → true when totalStock < reorderThreshold

// Order — cross-tenant with fulfillment method
{
  customerId: ObjectId, pharmacyId: ObjectId,
  items: [{ medicineId, medicineName, sku, quantity, unitPrice, lineTotal }],
  totalAmount: Number,
  status: 'pending' | 'approved' | 'processing' | 'ready' | 'delivered' | 'rejected',
  fulfillmentMethod: 'pickup' | 'delivery',
  deliveryAddress: String,  // required only when fulfillmentMethod = 'delivery'
  paymentStatus: 'unpaid' | 'partially_paid' | 'paid',
  statusHistory: [{ status, changedBy, changedAt, note }],
  approvedBy: ObjectId, approvedAt: Date
}

// AuditLog — immutable
{
  userId: ObjectId, actionType: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | ...,
  resource: String, resourceId: ObjectId,
  before: Object, after: Object,
  ipAddress: String, userAgent: String,
  timestamp: Date  // server-generated, never client-supplied
}
```

> 📄 For complete schema definitions, indexes, and Mongoose pseudocode, see [`docs/Database_Schema.md`](./docs/Database_Schema.md).

---

## 🛡 Compliance & Data Integrity

Pharma-Net simulates a professional, audit-ready pharmaceutical environment by implementing **ALCOA+** principles and **21 CFR Part 11** data integrity standards:

| Principle               | Implementation                                                                                |
| ----------------------- | --------------------------------------------------------------------------------------------- |
| **Attributable**        | Every write action links a `userId`, `ipAddress`, and `userAgent` to the record change        |
| **Contemporaneous**     | All timestamps are server-generated — clients cannot supply their own                         |
| **Original & Accurate** | Records are never altered without a logged `before`/`after` diff in the immutable audit trail |
| **Legible & Complete**  | Audit logs and inventory transactions are append-only — no delete or edit API endpoints exist  |
| **Soft Deletes**        | Records marked `isDeleted: true` — historical data is always preserved for regulatory review  |
| **Atomic Transactions** | Order approval triggers stock deduction + ledger entry in a single MongoDB transaction        |
| **Tenant Isolation**    | Compliance data is attributable to a specific pharmacy tenant via `pharmacyId` scoping        |

---

##  Documentation

All detailed project documents are located in the [`docs/`](./docs/) folder:

| Document                                              | Description                                                        |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| [`Project_Context.md`](./docs/Project_Context.md)     | Multi-tenant architecture, team responsibilities, project vision   |
| [`SRS.md`](./docs/SRS.md)                             | Software Requirements Specification (IEEE 29148) — FR & NFR        |
| [`SDS.md`](./docs/SDS.md)                             | Software Design Specification — technical architecture & logic      |
| [`API_Documentation.md`](./docs/API_Documentation.md) | Full REST API reference with tenant scoping & request/response schemas |
| [`Database_Schema.md`](./docs/Database_Schema.md)     | MongoDB collections, Mongoose schemas, indexes & requirement traceability |

---

##  Branch Strategy & Commit Style(optional)

### Branches

| Branch           | Purpose                                                          |
| ---------------- | ---------------------------------------------------------------- |
| `main`           | Stable / production-ready releases                               |
| `develop`        | Active integration branch                                        |
| `feature/<name>` | Individual features (e.g. `feature/orders-fulfillment`, `feature/marketplace-search`) |
| `bugfix/<name>`  | Bug fix branches                                                 |

### Conventional Commits

This project follows [Conventional Commits](https://www.conventionalcommits.org/) format:

```
feat: add tenant-scoped order fulfillment workflow
fix: validate stock at target pharmacy on order placement
docs: update API documentation with marketplace search fields
refactor: extract JWT tenant-gate helper to middleware
test: add tenant isolation verification tests
```

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](./LICENSE) file for details.

Copyright © 2026 Girum Y.

---

<div align="center">

**Built with ❤️ by the Pharma-Net Web & Backend Team**

[Repository](https://github.com/GirumY4/pharma-net-platform) · [API Docs](./docs/API_Documentation.md) · [SRS](./docs/SRS.md) · [Database Schema](./docs/Database_Schema.md)

</div>
