# Pharma-Net — Project Context (Web & Backend Team)

**Project Title:** Pharma-Net — B2B2C Multi-Tenant SaaS Pharmaceutical Logistics Platform

**Repository:** [https://github.com/GirumY4/pharma-net-platform](https://github.com/GirumY4/pharma-net-platform)

**Context:** Multi-Tenant SaaS, Shared Backend, and Data Handling

---

## Table of Contents

1. [Project Objective](#1-project-objective)
2. [System Architecture](#2-system-architecture)
3. [Team Responsibilities](#3-team-responsibilities)
4. [Target Users & Interface Assignment](#4-target-users--interface-assignment)
5. [Core Features & Functional Modules](#5-core-features--functional-modules)
6. [Audit & Compliance (ALCOA+ / 21 CFR Part 11)](#6-audit--compliance-alcoa--21-cfr-part-11)
7. [Technology Stack](#7-technology-stack)
8. [Core System Modules](#8-core-system-modules)
9. [Database Collections](#9-database-collections)
10. [Current Development Stage & Next Steps](#10-current-development-stage--next-steps)
11. [Development Workflow & Repo Structure](#11-development-workflow--repo-structure)
12. [Project Vision](#12-project-vision)

---

## 1. Project Objective

Pharma-Net is a B2B2C Multi-Tenant SaaS platform designed to modernize the pharmaceutical supply chain by connecting local Pharmacies directly with Public Users (Patients). In the current landscape, manual communication and lack of visibility mean patients struggle to find out which local pharmacies have their required medications in stock. The project aims to eliminate this barrier by providing a unified digital marketplace where Pharmacy Managers manage their specialized inventory, and Public Users can search and order life-saving medicine directly from their mobile devices.

### Primary Objectives

- **Multi-Tenant SaaS Source of Truth:** Establish a robust database architecture that safely isolates data for individual Pharmacy tenants (via `pharmacyId` foreign keys) while allowing aggregated search by public users.
- **Consumer-Centric Marketplace:** Transition from manual searching to a transparent, automated RESTful marketplace, allowing public users to instantly locate and order required medicine across all onboarded pharmacies.
- **Real-Time Visibility:** Provide real-time visibility into local pharmacy inventories for mobile app consumers via a global marketplace search API.
- **Tenant Governance:** Provide the web tools necessary for Pharmacy Managers to manage their local stock, process GRN/GIN adjustments, and fulfill incoming public orders — all within their `pharmacyId` boundary.
- **Role-Based Security:** Implement three-tier role-based access (`admin`, `pharmacy_manager`, `public_user`) to protect sensitive operations — a public user cannot alter stock, and Pharmacy A cannot access Pharmacy B's data.
- **Reporting & Alerts:** Provide tenant-scoped reporting and alerts to prevent shortages, identify near-expiry stock, and track sales analytics.
- **Regulatory Simulation:** Implement high-level data integrity standards (ALCOA+ and 21 CFR Part 11) to simulate a real-world, audit-ready pharmaceutical environment, including immutable audit logs and inventory transaction ledgers.

---

## 2. System Architecture

Pharma-Net follows a **Shared Backend Architecture** built for Multi-Tenancy. The Web & Backend team is responsible for the API "Engine" and the Tenant "Control Center."

| Component | Scope | Description |
|-----------|-------|-------------|
| **Shared Backend API** | In-Scope | A robust Node.js + Express.js v5 API that acts as the gatekeeper for all business logic, multi-tenancy enforcement, data validation, and security. Exposes RESTful endpoints consumed by both the SaaS web dashboard and the mobile consumer app. |
| **Database** | In-Scope | A MongoDB instance (using Mongoose v9) — the single source of truth. Tenant data is segregated via `pharmacyId` foreign keys on all scoped collections. |
| **Web Application** | In-Scope | A React.js v19 + TypeScript SaaS dashboard used for tenant management — Pharmacy Managers manage local inventory and fulfill orders; System Admins govern the platform. |
| **Mobile Application** | External Scope / API Consumer | A dedicated app for Public Users (Patients) built by the mobile team. The web team does **not** build the mobile UI, but **must** build the multi-tenant APIs for global marketplace search, order placement, and status tracking. |

### High-Level Data Flow

```
[React SaaS Dashboard (Pharmacy/Admin)] & [Mobile Consumer App (Public)]  ⇄  [Shared Node.js/Express API + Tenant Gate]  ⇄  [MongoDB (pharmacyId-scoped)]
```

### Key Architectural Principles

- Multi-tenant data segregation implicitly handled by the API using JWT context (`pharmacyId` extracted from JWT payload — never from client request bodies)
- Centralized business logic and validation (no duplicated logic across clients)
- Stateless API design (JWT authentication) for horizontal scaling
- Atomic stock deductions within MongoDB sessions/transactions for GRN/GIN and order fulfillment
- Immutable audit trails and inventory transaction ledgers (schema-level enforcement via Mongoose pre-hooks)
- Centralized audit logging and soft-delete patterns for traceability

---

## 3. Team Responsibilities

As members of the Web & Backend team, responsibilities are centered on the multi-tenant SaaS infrastructure and tenant management interfaces:

1. **Architecture Design:** Defining the RESTful structure emphasizing Multi-Tenant logic and ensuring the API is stateless (using JWT with `pharmacyId` embedding).
2. **API Development:** Implementing all endpoints for authentication, tenant-isolated inventory CRUD, global marketplace search (public medicine discovery), consumer-to-pharmacy order placement, payment recording, and reporting aggregation.
3. **Database Modeling:** Designing Mongoose schemas that enforce tenancy via `pharmacyId` foreign keys, batch/lot tracking, soft deletes, and immutability hooks on audit-critical collections.
4. **Tenant Management UI:** Building the React SaaS dashboards for Pharmacy Managers (inventory/order fulfillment) and the Admin Console (tenant lifecycle, platform health).
5. **Security & RBAC:** Implementing three-tier Role-Based Access Control to ensure a Public User cannot alter stock, a Pharmacy Manager cannot access another tenant's data, and only Admins can govern the platform.
6. **Data Integrity:** Implementing the logic for immutable Audit Logs, immutable Inventory Transactions, and Soft Deletes to satisfy ALCOA+ standards.
7. **Documentation:** Structuring the GitHub repository and maintaining documentation (SRS, SDS, API docs, Database Schema).

---

## 4. Target Users & Interface Assignment

To maintain focus, interfaces are strictly divided by the user's role in the multi-tenant ecosystem:

| User Role | Primary Interface | Responsibilities |
|-----------|-------------------|------------------|
| **System Administrator** | SaaS Web Admin Console | Platform governance: managing pharmacy tenant accounts (create, activate, deactivate), role assignment, viewing cross-tenant audit logs, and monitoring platform health metrics. |
| **Pharmacy Manager** | SaaS Web Tenant Dashboard | Operational management: updating their local stock levels (GRN/GIN), managing their medicine catalog, approving/processing/fulfilling incoming consumer orders, recording payments, and generating tenant-scoped reports. All operations strictly bounded by `pharmacyId`. |
| **Public User / Patient** | Mobile Application *(API Consumer — out of scope)* | End-user interaction: searching for medicine across all pharmacies via the global marketplace, viewing availability and pricing, placing purchase orders targeting a specific pharmacy, and tracking order status via the mobile UI. |

> **Note:** Although APIs support mobile clients, all internal SaaS interactions for this project scope are via the web application. The Public User mobile UI is the responsibility of the mobile team. The web team builds the shared multi-tenant APIs that power it.

---

## 5. Core Features & Functional Modules

### 5.1 Identity & Access Management

- User registration and secure login (bcrypt for password hashing, JWT for session tokens)
- JWT authentication with embedded `pharmacyId` for automatic tenant scoping
- Three-tier role-based access control: `admin`, `pharmacy_manager`, `public_user`
- Authorization middleware that checks a user's role before allowing access to specific API routes (e.g., `verifyRole('pharmacy_manager')`)
- Tenant context injection: the API middleware extracts `pharmacyId` from the JWT and injects it into all downstream queries — the client never passes `pharmacyId` in the request body

### 5.2 Multi-Tenant Medicine & Inventory Management

- Tenant-isolated CRUD for medicines (implicit `pharmacyId` assignment from JWT)
- Batch/lot tracking with GTIN barcodes, expiry dates, manufacture dates, supplier names, and shelf locations
- Stock counts and stock adjustments via **Goods Received Notes (GRN)** and **Goods Issued Notes (GIN)**, each creating an immutable `InventoryTransaction` record
- Automated low-stock alerts via configurable `reorderThreshold` and Mongoose virtual `isLowStock`
- Soft deletes (`isDeleted: true`, `deletedAt`) to preserve historical data for compliance

### 5.3 Global Marketplace Search (Consumer-Facing)

- Cross-tenant medicine discovery: Public Users query a global search API that returns results aggregated across all active pharmacy tenants
- Results include pharmacy name, unit price, availability (stock count), and category
- Sensitive tenant data (supplier names, batch-level details, shelf locations) excluded from public responses

### 5.4 Consumer Order & Transaction Lifecycle

- Public-initiated orders specifying a target `pharmacyId` — the system stamps the order with both `customerId` and `pharmacyId`
- Atomic stock validation within MongoDB transactions before finalizing orders
- Pharmacy Manager review & approval workflow (tenant-scoped — managers only see orders for their pharmacy)
- Status-based lifecycle: **Pending → Approved/Rejected → Processing → Ready for Pickup → Delivered**
- Each transition timestamped and attributed to the acting user in the audit trail

### 5.5 Payment Recording

- Tenant-scoped payment recording against fulfilled orders
- Payment method support (bank transfer, cash, mobile money)
- Payment status mapping: **Unpaid / Partially Paid / Paid**
- Payment audit trail (timestamp, amount, method, `customerId`, `pharmacyId`, recorded-by user)

### 5.6 Reporting & Analytics

- Tenant-scoped dashboards for Pharmacy Managers (sales, volume, top-selling medicines, expiring items, low-stock alerts)
- Platform-wide analytics for System Administrators (total GMV, active tenants, order volume, compliance summaries)
- Exportable reports (CSV/PDF)
- Real-time dashboards visualizing low-stock and near-expiry medications

---

## 6. Audit & Compliance (ALCOA+ / 21 CFR Part 11)

Since this project simulates a professional, multi-tenant pharmaceutical system, the backend must enforce the following data integrity principles:

- **Attributable:** Every action (creating an order, changing stock, processing a payment) must be linked to a specific User ID. Audit logs additionally capture `ipAddress` and `userAgent` for forensic-level attribution.
- **Contemporaneous:** Timestamps must be automatically generated by the server (`Date.now`), not the client, ensuring they reflect the actual time of the event.
- **Immutable Audit Logs:** A dedicated `AuditLog` collection records the "Before" and "After" state of all data changes. Mongoose schema-level pre-hooks actively block `update`, `delete`, `findOneAndUpdate`, and `replaceOne` operations — no API endpoints exist to edit or delete log entries.
- **Immutable Inventory Transactions:** The `InventoryTransaction` collection uses the same immutability pattern, ensuring the stock movement ledger (`stockBefore`, `stockAfter`, `quantityChanged`) is tamper-proof.
- **Soft Deletes:** Records (like medicines or users) are never fully removed; they are marked `isDeleted: true` with a `deletedAt` timestamp to preserve historical integrity for audits and sales analysis.
- **Tenant-Scoped Compliance:** Audit data is attributable not only to a specific user but to a specific pharmacy tenant, enabling per-tenant regulatory review.

---

## 7. Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend (SaaS Dashboard)** | React.js v19 with TypeScript, Vite v7 |
| **Backend (Shared API)** | Node.js + Express.js v5 with TypeScript |
| **Database** | MongoDB with Mongoose v9 ODM |
| **Auth & Security** | JWT (stateless, with `pharmacyId` embedding), bcrypt v6, Helmet.js, CORS |
| **Communication** | RESTful JSON endpoints over HTTPS/TLS |
| **Dev Tooling** | tsx (hot-reload), ESLint, Morgan (HTTP logging) |

---

## 8. Core System Modules

| Module | Responsibilities |
|--------|-----------------|
| **Authentication** | Registration, login, JWT issuance with `pharmacyId` embedding, token validation |
| **User Management** | User CRUD, role management, tenant account lifecycle (Admin creates pharmacy accounts), soft deletes |
| **Medicine & Inventory** | Tenant-scoped medicine catalog CRUD, batch/lot tracking, GRN/GIN stock transactions (immutable ledger), low-stock alerting, global marketplace search API |
| **Order Management** | Cross-tenant order placement (Public User → Pharmacy), stock validation, pharmacy fulfillment workflow (approve/reject/process/deliver), status lifecycle |
| **Payment Management** | Tenant-scoped payment recording against orders, payment status mapping, financial audit trail |
| **Reporting & Analytics** | Tenant-scoped dashboards and aggregation pipelines, admin platform metrics, exportable analytics |
| **AuditLog & Compliance** | Append-only immutable audit records with before/after state capture, IP/User-Agent tracking, `isDeleted` flags for data retention |

---

## 9. Database Collections

> **Note:** All schemas are implemented via Mongoose with validation rules and indexes (e.g., `users.email`, `medicines.sku`, `medicines.name`, `medicines.pharmacyId`). Collections marked with 🔒 are tenant-scoped via `pharmacyId`. Collections marked with 🔐 are schema-level immutable.

### `users`

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Primary key |
| `name` | String | User/pharmacy name |
| `email` | String | Unique email |
| `passwordHash` | String | Hashed password (bcrypt) |
| `role` | String | `admin` / `pharmacy_manager` / `public_user` |
| `isActive` | Boolean | Active status (admin can deactivate tenants) |
| `isDeleted` | Boolean | Soft delete flag |
| `deletedAt` | Date | Soft deletion timestamp |
| `createdAt` | Date | Creation timestamp |
| `updatedAt` | Date | Last update timestamp |

### `medicines` 🔒

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Primary key |
| `pharmacyId` | ObjectId | Reference to `users` (tenant owner — FK) |
| `name` | String | Medicine name |
| `sku` | String | Unique SKU (uppercase) |
| `genericName` | String | INN / generic drug name |
| `category` | String | Therapeutic category |
| `description` | String | Medicine description |
| `unitPrice` | Number | Unit price set by the pharmacy |
| `unitOfMeasure` | String | `tablet` / `capsule` / `vial` / `bottle` / `sachet` / `unit` |
| `totalStock` | Number | Aggregate stock count across all batches |
| `reorderThreshold` | Number | Low-stock alert trigger point (default: 50) |
| `batches` | Array | Array of batch sub-documents (see below) |
| `isDeleted` | Boolean | Soft delete flag |
| `deletedAt` | Date | Soft deletion timestamp |
| `createdBy` | ObjectId | Reference to user who created this record |
| `createdAt` | Date | Creation timestamp |
| `updatedAt` | Date | Last update timestamp |

**`batches` array structure:**

```javascript
{
  batchNumber:     String,    // Manufacturer's batch/lot number
  gtin:            String,    // GS1 Global Trade Item Number (barcode)
  quantity:        Number,    // Units in this batch
  expiryDate:      Date,      // Batch expiration date
  manufactureDate: Date,      // Manufacturing date
  supplierName:    String,    // Upstream supplier
  shelfLocation:   String,    // Physical storage location
  receivedAt:      Date       // Date this batch entered inventory
}
```

**Virtual:** `isLowStock` → `true` when `totalStock < reorderThreshold`

### `inventoryTransactions` 🔒 🔐

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Primary key |
| `pharmacyId` | ObjectId | Reference to `users` (tenant owner — FK) |
| `transactionType` | String | `GRN` (Goods Received) / `GIN` (Goods Issued) |
| `medicineId` | ObjectId | Reference to `medicines` |
| `batchNumber` | String | Batch involved in the transaction |
| `quantityChanged` | Number | Positive for GRN, negative for GIN |
| `stockBefore` | Number | `totalStock` before this mutation |
| `stockAfter` | Number | `totalStock` after this mutation |
| `reason` | String | Reason/justification for the transaction |
| `referenceNumber` | String | External reference (PO number, etc.) |
| `expiryDate` | Date | Expiry date of the affected batch |
| `createdBy` | ObjectId | User who initiated the transaction |
| `createdAt` | Date | Transaction timestamp |

### `orders` 🔒

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Primary key |
| `customerId` | ObjectId | Reference to `users` (the Public User buying) |
| `pharmacyId` | ObjectId | Reference to `users` (the Pharmacy selling — FK) |
| `items` | Array | `[{ medicineId, quantity, unitPrice }]` |
| `totalAmount` | Number | Order total |
| `status` | String | `pending` / `approved` / `rejected` / `processing` / `ready` / `delivered` |
| `isDeleted` | Boolean | Soft delete flag |
| `deletedAt` | Date | Soft deletion timestamp |
| `createdAt` | Date | Order placement timestamp |
| `updatedAt` | Date | Last status update timestamp |

### `payments` 🔒

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Primary key |
| `orderId` | ObjectId | Reference to `orders` |
| `pharmacyId` | ObjectId | Reference to `users` (pharmacy tenant — FK) |
| `customerId` | ObjectId | Reference to `users` (public user) |
| `amount` | Number | Payment amount |
| `paymentMethod` | String | Payment method (bank transfer / cash / mobile money) |
| `status` | String | `pending` / `completed` / `failed` / `refunded` |
| `createdAt` | Date | Payment timestamp |

### `auditLogs` 🔐

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Primary key |
| `userId` | ObjectId | User who performed the action |
| `actionType` | String | `CREATE` / `UPDATE` / `DELETE` / `LOGIN` / `LOGOUT` / `APPROVE` / `REJECT` / `PAYMENT_RECORDED` / `GRN` / `GIN` |
| `resource` | String | `User` / `Medicine` / `Order` / `Payment` / `InventoryTransaction` |
| `resourceId` | ObjectId | Affected resource ID |
| `before` | Mixed | State before action (JSON snapshot) |
| `after` | Mixed | State after action (JSON snapshot) |
| `ipAddress` | String | Client IP address |
| `userAgent` | String | Client User-Agent header |
| `timestamp` | Date | Action timestamp (server-generated) |

---

## 10. Current Development Stage & Next Steps

### Completed

- [x] Project title finalized
- [x] GitHub repository created: `pharma-net-platform`
- [x] Technology stack confirmed (React v19 + Vite + Node/Express v5 + MongoDB/Mongoose v9 + TypeScript)
- [x] Backend foundation: Express v5 app scaffolding, MongoDB connection, environment config, middleware pipeline (Helmet, CORS, Morgan, error handling, 404 handler)
- [x] Authentication module: user registration, login, JWT issuance (`auth.controller.ts`, `auth.service.ts`, `auth.routes.ts`)
- [x] User management module: CRUD operations, role management, soft deletes (`user.model.ts`, `users.controller.ts`, `users.service.ts`, `users.routes.ts`)
- [x] Inventory module — Medicines: tenant-scoped medicine CRUD, batch management, low-stock virtual (`medicine.model.ts`, `medicine.controller.ts`, `medicine.routes.ts`)
- [x] Inventory module — Transactions: GRN/GIN stock operations, immutable transaction ledger (`inventoryTransaction.model.ts`, `inventoryTransaction.controller.ts`, `inventory.service.ts`, `inventoryTransaction.routes.ts`)
- [x] Audit logging utility: centralized `auditLogger.ts` with before/after capture, IP/User-Agent tracking
- [x] Audit log model: immutable schema with pre-hook enforcement (`auditLogs.model.ts`)
- [x] RBAC middleware: role-based route protection (`auth.middleware.ts`, `rbac.middleware.ts`)
- [x] Frontend scaffolding: Vite + React 19 + TypeScript project with feature-based folder structure
- [x] Documentation: SRS, SDS, Project Context, API Documentation, Database Schema

### Next / In Progress

- [ ] Multi-tenant scoping migration: add `pharmacyId` FK to medicines and transactions (currently uses `createdBy` — needs migration to explicit tenancy)
- [ ] Orders module: consumer order placement, pharmacy fulfillment workflow, atomic stock deduction (`orders.model.ts`, `orders.controller.ts`, `orders.service.ts`, `orders.routes.ts`)
- [ ] Payments module: payment recording against fulfilled orders (`payments.model.ts`, `payments.controller.ts`, `payments.service.ts`, `payments.routes.ts`)
- [ ] Global marketplace search API: public endpoint aggregating medicines across all pharmacies
- [ ] Reports module: tenant-scoped aggregation pipelines, admin platform metrics (`reports.model.ts`, `reports.controller.ts`, `reports.service.ts`, `reports.routes.ts`)
- [ ] Audit logs read API: admin/manager query endpoints (`auditlogs.controller.ts`, `auditlogs.service.ts`, `auditlogs.routes.ts`)
- [ ] Frontend SaaS dashboard: auth pages, inventory UI, order fulfillment UI, admin console
- [ ] Tests: unit, integration, tenant isolation verification, basic performance checks

### Recommended Development Order

```
multi-tenant scoping migration → orders module → payments module → global marketplace search API → reports module → audit logs API → frontend auth pages → frontend inventory dashboard → frontend orders dashboard → frontend admin console
```

---

## 11. Development Workflow & Repo Structure

### Recommended Repository Structure

```
pharma-net-platform/
├── README.md
├── LICENSE
├── .gitignore
├── docs/
│   ├── Project_Context.md
│   ├── SRS.md
│   ├── SDS.md
│   ├── API_Documentation.md
│   └── Database_Schema.md
├── backend/
│   ├── .env                            # Environment variables (not committed)
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── server.ts                   # Entry point — HTTP server bootstrap
│       ├── app.ts                      # Express app config, middleware, route mounting
│       ├── config/                     # Environment variables, DB connection
│       │   └── db.ts                   # MongoDB connection via Mongoose
│       ├── middlewares/                # Global middlewares
│       │   ├── auth.middleware.ts      # JWT verification & tenant context injection
│       │   ├── rbac.middleware.ts      # Role-Based Access Control guard
│       │   ├── error.middleware.ts     # Global error handler
│       │   └── notFound.middleware.ts  # 404 route handler
│       ├── utils/                      # Helpers (ALCOA+ log generators)
│       │   └── auditLogger.ts          # Centralized audit log creation utility
│       ├── types/
│       │   └── express/                # Express.d.ts augmentation (req.user typing)
│       └── modules/                    # 🌟 CORE BACKEND FEATURES (Matches frontend)
│           ├── auth/                            # Authentication Module
│           │   ├── auth.controller.ts           # Registration, login, JWT issuance
│           │   ├── auth.service.ts              # Password hashing, token generation
│           │   └── auth.routes.ts               # POST /api/auth/register, /api/auth/login
│           ├── users/                           # User Management Module
│           │   ├── user.model.ts                # IUser interface & Mongoose schema
│           │   ├── users.controller.ts          # User CRUD, role management
│           │   ├── users.service.ts             # User query & mutation logic
│           │   └── users.routes.ts              # /api/users/* endpoints
│           ├── inventory/                       # Inventory & Medicine Module
│           │   ├── medicine.model.ts            # IMedicine, IBatch & schemas
│           │   ├── medicine.controller.ts       # Tenant-scoped medicine CRUD
│           │   ├── medicine.routes.ts           # /api/medicines/* endpoints
│           │   ├── inventoryTransaction.model.ts # IInventoryTransaction & immutable schema
│           │   ├── inventoryTransaction.controller.ts # GRN/GIN stock operations
│           │   ├── inventoryTransaction.routes.ts     # /api/inventory-transactions/*
│           │   └── inventory.service.ts         # Atomic stock mutation logic ($inc)
│           ├── orders/                          # Order Lifecycle Module
│           │   ├── orders.model.ts              # IOrder interface & schema
│           │   ├── orders.controller.ts         # Order placement & fulfillment
│           │   ├── orders.service.ts            # Order orchestration & stock validation
│           │   └── orders.routes.ts             # /api/orders/* endpoints
│           ├── payments/                        # Payment Module
│           │   ├── payments.model.ts            # IPayment interface & schema
│           │   ├── payments.controller.ts       # Payment recording
│           │   ├── payments.service.ts          # Payment processing logic
│           │   └── payments.routes.ts           # /api/payments/* endpoints
│           ├── reports/                         # Reporting & Analytics Module
│           │   ├── reports.model.ts             # Report aggregation types
│           │   ├── reports.controller.ts        # Report generation endpoints
│           │   ├── reports.service.ts           # Aggregation pipeline logic
│           │   └── reports.routes.ts            # /api/reports/* endpoints
│           └── auditLogs/                       # Audit & Compliance Module
│               ├── auditLogs.model.ts           # IAuditLog & immutable schema
│               ├── auditlogs.controller.ts      # Read-only audit log queries
│               ├── auditlogs.service.ts         # Audit log retrieval logic
│               └── auditlogs.routes.ts          # /api/logs/* endpoints (admin only)
├── frontend/
│   ├── .gitignore
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   ├── tsconfig.node.json
│   ├── vite.config.ts
│   ├── eslint.config.js
│   ├── index.html                      # Vite HTML entry point
│   ├── public/                         # Static assets
│   └── src/
│       ├── main.tsx                    # React entry point
│       ├── index.css                   # Global styles
│       ├── App.css                     # App-level styles
│       ├── vite-env.d.ts               # Vite type declarations
│       ├── app/                        # App-level initialization
│       │   └── App.tsx                 # Root App component, Router setup
│       ├── components/                 # GLOBAL / SHARED UI Components ONLY
│       ├── contexts/                   # Global state (e.g., AuthContext, ThemeContext)
│       ├── features/                   # 🌟 CORE DOMAIN LOGIC (Feature-based)
│       │   ├── auth/                   # Login, Registration pages & logic
│       │   ├── admin/                  # System Admin console views
│       │   ├── dashboard/              # Pharmacy Manager overview (KPIs, Alerts)
│       │   ├── inventory/              # Medicine CRUD, GRN/GIN, Batch & Expiry Tracking
│       │   │   ├── components/         # Specific UI (e.g., StockAdjustmentModal.tsx)
│       │   │   ├── hooks/              # Specific logic (e.g., useInventorySearch.ts)
│       │   │   ├── pages/              # Routed pages (e.g., InventoryGridPage.tsx)
│       │   │   ├── services/           # API calls (e.g., inventoryApi.ts)
│       │   │   ├── index.ts            # Public API (Exports)
│       │   │   └── types.ts            # Interfaces (e.g., IMedicine, IBatch)
│       │   ├── orders/                 # Incoming Orders, Fulfillment Workflows, History
│       │   ├── payments/               # Financial Tracking & Records
│       │   ├── reports/                # Sales, Inventory Valuations, Expiration Forecasts
│       │   └── audit/                  # ALCOA+ 21 CFR Part 11 Audit Log Viewer
│       ├── hooks/                      # Global hooks (e.g., useWindowSize, useDebounce)
│       ├── routes/                     # Route guards (e.g., ProtectedRoute, RoleRoute)
│       ├── services/                   # Global API config (Axios instances, Interceptors)
│       ├── styles/                     # Global CSS and structural styles
│       ├── types/                      # Global TypeScript definitions
│       └── utils/                      # Global helpers (date formatters, token parsers)
```

### Branch Strategy(optional)

| Branch | Purpose |
|--------|---------|
| `main` | Stable / release — protected, requires PR approval |
| `develop` | Integration branch for feature merges |
| `feature/<name>` | Each feature (e.g., `feature/orders-fulfillment`, `feature/marketplace-search`) |
| `bugfix/<name>` | Bug fix branches |

### Commit Style

Use **Conventional Commits** format, for example:

- `feat: add tenant-scoped order model`
- `fix: validate stock at target pharmacy on order`
- `docs: update SRS with marketplace search requirements`

---

## 12. Project Vision

Pharma-Net aims to be a professionally structured, high-performance, multi-tenant SaaS pharmaceutical marketplace that finally bridges the critical information gap between localized pharmacy supplies and the urgent needs of public consumers. The Web & Backend Team serves as the backbone of the entire operation — by building a shared API, business rules remain consistent across all platforms, while the SaaS web dashboard provides each Pharmacy Manager with enterprise-grade inventory management and order fulfillment tooling they could never afford to build independently.

The shared backend and single MongoDB database are the system's backbone — ensuring consistent business rules, tenant-isolated state changes, and a single source of truth for inventory and transactions across all onboarded pharmacies. This architecture simplifies maintenance, supports scalability, and enables future expansion (for example, adding new consumer clients, delivery integrations, or regulatory reporting modules) without duplicating core logic. By onboarding independent pharmacies as SaaS tenants and exposing a unified global marketplace to public consumers, Pharma-Net transforms a fragmented, manual pharmaceutical supply chain into a transparent, searchable, and transactional digital ecosystem.