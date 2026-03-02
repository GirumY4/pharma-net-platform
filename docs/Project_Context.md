# Pharma-Net — Project Context (Web & Backend Team)

**Project Title:** Pharma-Net — Web-Based Pharmaceutical Logistics Platform

**Repository:** [https://github.com/GirumY4/pharma-net-platform](https://github.com/GirumY4/pharma-net-platform)

**Context:** Internal Management, Shared Backend, and Data Handling

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

Pharma-Net is a centralized digital ecosystem designed to modernize the pharmaceutical supply chain by connecting local pharmacies and central medicine warehouses. In the current landscape, manual communication (phone calls/spreadsheets) leads to stock invisibility and medical shortages. The project aims to eliminate manual, error-prone processes and provide automated, transparent workflows for inventory and order management.

### Primary Objectives

- **Centralized Source of Truth:** Establish a single, authoritative database for all medicine inventory and transaction history.
- **Automated Logistics:** Transition from manual ordering to automated RESTful workflows, ensuring real-time stock deductions and order fulfillment.
- **Real-Time Visibility:** Provide real-time visibility into warehouse inventories for pharmacy users via the web client.
- **Internal Governance:** Provide the administrative tools necessary for warehouse staff to manage the life-saving medicine supply chain.
- **Role-Based Security:** Implement role-based access to protect sensitive operations and data.
- **Reporting & Alerts:** Provide reporting and alerts to prevent shortages and identify near-expiry stock.
- **Regulatory Simulation:** Implement high-level data integrity standards (ALCOA+ and 21 CFR Part 11) to simulate a real-world, audit-ready pharmaceutical environment.

---

## 2. System Architecture

Pharma-Net follows a **Shared Backend Architecture**. The Web & Backend team is responsible for the "Engine" and the "Control Center."

| Component | Scope | Description |
|-----------|-------|-------------|
| **Shared Backend API** | In-Scope | A robust Node.js + Express.js API that acts as the gatekeeper for all business logic, data validation, and security. Exposes RESTful endpoints consumed by both web and mobile clients. |
| **Database** | In-Scope | A MongoDB instance (using Mongoose) — the single source of truth for users, inventory, orders, and payments. This is the only place where data lives. |
| **Web Application** | In-Scope | A React.js-based dashboard used exclusively for internal management — complex data handling, reporting, and warehouse operations. |
| **Mobile Application** | External Scope / API Consumer | A dedicated app for pharmacy end-users built by the mobile team. The web team does **not** build the mobile UI, but **must** build the API endpoints that the mobile team calls to place orders and view stock. |

### High-Level Data Flow

```
[React Internal Web App] & [Mobile Pharmacy App]  ⇄  [Shared Node.js/Express API]  ⇄  [MongoDB (Mongoose)]
```

### Key Architectural Principles

- Centralized business logic and validation (no duplicated logic across clients)
- Stateless API design (JWT authentication) for horizontal scaling
- Atomic updates for critical flows (MongoDB transactions or atomic operations)
- Centralized audit logging and soft-delete patterns for traceability

---

## 3. Team Responsibilities

As members of the Web & Backend team, responsibilities are centered on the core infrastructure and management interfaces:

1. **Architecture Design:** Defining the RESTful structure and ensuring the API is stateless (using JWT).
2. **API Development:** Implementing all endpoints for authentication, inventory CRUD, order placement, and payment tracking.
3. **Database Modeling:** Designing Mongoose schemas that enforce strict data types and relationships.
4. **Internal Management UI:** Building the React dashboards for Admins (user management) and Warehouse Managers (inventory/order fulfillment).
5. **Security & RBAC:** Implementing Role-Based Access Control to ensure a Pharmacy user cannot access Warehouse management functions.
6. **Data Integrity:** Implementing the logic for Audit Logs and Soft Deletes to satisfy ALCOA+ standards.
7. **Documentation:** Structuring the GitHub repository and maintaining documentation (SRS, API docs/Swagger).

---

## 4. Target Users & Interface Assignment

To maintain focus, interfaces are strictly divided by the user's role in the supply chain:

| User Role | Primary Interface | Responsibilities |
|-----------|-------------------|------------------|
| **System Administrator** | Web Application | Global oversight: managing user accounts, assigning roles, and reviewing system-wide audit logs. |
| **Warehouse Manager** | Web Application | Operational management: updating stock levels (GRN/GIN), approving/rejecting pharmacy orders, and generating reports. |
| **Pharmacy User** | Mobile Application *(API Consumer — out of scope)* | End-user interaction: searching for medicine, viewing availability, and placing purchase orders via the mobile UI. |

> **Note:** Although APIs support other clients, all internal user interactions for this project scope are via the web application. The Pharmacy mobile UI is the responsibility of the mobile team.

---

## 5. Core Features & Functional Modules

### 5.1 Identity & Access Management

- User registration and secure login (bcrypt for password hashing, JWT for session tokens)
- JWT authentication and role-based access control (Admin, Warehouse Manager, Pharmacy)
- Authorization middleware that checks a user's role before allowing access to specific API routes (e.g., `verifyRole('warehouse_manager')`)

### 5.2 Medicine & Inventory Management

- Add / edit / delete medicines (CRUD)
- Batch/lot tracking and expiry dates; warehouse shelf locations
- Stock counts and stock adjustments via **Goods Received Notes (GRN)** and **Goods Issued Notes (GIN)**
- Low-stock alerts and near-expiry flags (automated dashboard alerts)

### 5.3 Order & Transaction Lifecycle

- Pharmacy-initiated orders: the API handles incoming requests, validating stock availability before creating an Order record
- Stock validation before order placement (pre-flight check)
- Warehouse review, approval/rejection workflow with reason capture
- Status-based lifecycle: **Pending → Approved/Rejected → Processing → Dispatched → Delivered**
- Atomic stock deduction on order approval
- Order lifecycle tracking and history

### 5.4 Payment Recording

- Record and associate payment transactions to orders
- Payment method support (bank transfer, cash, credit)
- Payment status mapping: **Unpaid / Partially Paid / Paid**
- Payment audit trail (timestamp, amount, recorded-by user)

### 5.5 Reporting & Analytics

- Inventory reports (including batch & expiry details, valuations)
- Sales/volume reports (daily/monthly order summaries)
- Expiration forecasts and near-expiry alerts
- Exportable reports (CSV/PDF)
- Real-time dashboards visualizing low-stock and near-expiry medications

---

## 6. Audit & Compliance (ALCOA+ / 21 CFR Part 11)

Since this project simulates a professional pharmaceutical system, the backend must enforce the following data integrity principles:

- **Attributable:** Every action (creating an order, changing stock) must be linked to a specific User ID.
- **Contemporaneous:** Timestamps must be automatically generated by the server, not the client, ensuring they reflect the actual time of the event.
- **Immutable Audit Logs:** A dedicated `AuditLog` collection records the "Before" and "After" state of all data changes. No API endpoints exist to edit or delete log entries.
- **Soft Deletes:** Records (like medicines or users) are never fully removed; they are marked `isDeleted: true` to preserve historical integrity for audits and sales analysis.

---

## 7. Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend (Internal Management)** | React.js with TypeScript, Material UI (MUI) |
| **Backend (Shared API)** | Node.js + Express.js |
| **Database** | MongoDB with Mongoose ODM |
| **Auth & Security** | JWT (stateless), bcrypt (password hashing) |
| **Communication** | RESTful JSON endpoints over HTTPS/TLS |

---

## 8. Core System Modules

| Module | Responsibilities |
|--------|-----------------|
| **User Management** | Registration, login, role assignment, profile management |
| **Medicine Management** | CRUD operations, batch records, expiry and location metadata |
| **Order Management** | Order creation, stock validation, approval workflow, status transitions |
| **Payment Management** | Payment recording, status updates, auditability |
| **Reporting & Monitoring** | Dashboards, low-stock and expiry alerts, exportable analytics |
| **AuditLog & Soft Delete** | Append-only audit records and `isDeleted` flags for data retention |

---

## 9. Database Collections

> **Note:** All schemas are implemented via Mongoose with validation rules and indexes (e.g., `users.email`, `medicines.sku`, `medicines.name`).

### `users`

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Primary key |
| `name` | String | User name |
| `email` | String | Unique email |
| `passwordHash` | String | Hashed password (bcrypt) |
| `role` | String | `admin` / `warehouse` / `pharmacy` |
| `isActive` | Boolean | Active status |
| `createdAt` | Date | Creation timestamp |
| `updatedAt` | Date | Last update timestamp |

### `medicines`

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Primary key |
| `name` | String | Medicine name |
| `sku` | String | Unique SKU |
| `category` | String | Medicine category |
| `price` | Number | Unit price |
| `stockCount` | Number | Total stock count |
| `batches` | Array | Array of batch objects (see below) |
| `isDeleted` | Boolean | Soft delete flag |
| `createdAt` | Date | Creation timestamp |
| `updatedAt` | Date | Last update timestamp |

**`batches` array structure:**

```javascript
{
  batchNumber: String,
  quantity:    Number,
  expiryDate:  Date,
  location:    String
}
```

### `orders`

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Primary key |
| `pharmacyId` | ObjectId | Reference to `users` |
| `items` | Array | `[{ medicineId, qty, price }]` |
| `totalAmount` | Number | Order total |
| `status` | String | `pending` / `approved` / `dispatched` / `delivered` / `rejected` |
| `paymentStatus` | String | `Unpaid` / `Partially Paid` / `Paid` |
| `approvedBy` | ObjectId | Reference to approving user |
| `approvedAt` | Date | Approval timestamp |
| `createdAt` | Date | Creation timestamp |
| `updatedAt` | Date | Last update timestamp |

### `payments`

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Primary key |
| `orderId` | ObjectId | Reference to `orders` |
| `amount` | Number | Payment amount |
| `method` | String | Payment method (bank transfer / cash / credit) |
| `transactionId` | String | Transaction identifier |
| `status` | String | Payment status |
| `recordedBy` | ObjectId | Reference to user who recorded |
| `timestamp` | Date | Payment timestamp |

### `auditLogs`

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Primary key |
| `userId` | ObjectId | User who performed the action |
| `actionType` | String | `Update` / `Delete` / `Create` |
| `resource` | String | `Medicine` / `Order` / `User` |
| `resourceId` | ObjectId | Affected resource ID |
| `before` | Object | State before action (`oldData`) |
| `after` | Object | State after action (`newData`) |
| `timestamp` | Date | Action timestamp (server-generated) |

---

## 10. Current Development Stage & Next Steps

### Completed

- [x] Project title finalized
- [x] GitHub repository created: `pharma-net-platform`
- [x] Technology stack confirmed (React + Node + MongoDB)

### Next / In Progress

- [ ] Finalize folder structure (`backend/`, `web/`, `docs/`)
- [ ] Backend setup and MongoDB connection (Atlas)
- [ ] Implement User model and authentication (JWT + bcrypt)
- [ ] Role middleware and RBAC enforcement
- [ ] Medicine module CRUD and batch/expiry handling
- [ ] Order module with atomic stock validation & approval flow
- [ ] Payment recording and association to orders
- [ ] Frontend (React) integration and dashboard pages
- [ ] Documentation: SRS, API docs (OpenAPI/Swagger), Mongoose schema appendix
- [ ] Tests: unit, integration, basic performance checks

### Recommended Development Order

```
backend foundations → authentication → medicine module → order module (with transactions) → payment module → frontend integration → reporting & testing
```

---

## 11. Development Workflow & Repo Structure

### Recommended Repository Structure

```
pharma-net-platform/
├── README.md
├── docs/
│   ├── Project_Context.md
│   ├── SRS.md
│   ├── SDS.md
│   ├── API_Documentation.md
│   └── Database_Schema.md
├── backend/
│   ├── src/
│   │   ├── config/                     # Environment variables, DB connection
│   │   ├── middlewares/                # Global middlewares
│   │   │   ├── auth.middleware.ts      # JWT Validation
│   │   │   ├── rbac.middleware.ts      # Role-Based Access Control
│   │   │   └── error.middleware.ts     # Global Error Handling
│   │   ├── modules/                    # 🌟 CORE BACKEND FEATURES (Matches frontend)
│   │   │   ├── auth/
│   │   │   ├── users/                  # User schema, user CRUD (Admin only)
│   │   │   ├── inventory/              # Medicine schema, stock adjustment logic, GRN/GIN
│   │   │   │   ├── inventory.controller.ts
│   │   │   │   ├── inventory.routes.ts
│   │   │   │   ├── inventory.service.ts  # Atomic updates ($inc) happen here
│   │   │   │   └── medicine.model.ts     # Mongoose Schema
│   │   │   ├── orders/                 # Order schema, Stock Validation, Status Lifecycle
│   │   │   ├── payments/               # Payment schema, Financial histories
│   │   │   ├── reports/                # Complex MongoDB Aggregations
│   │   │   └── auditLogs/              # Immutable AuditLog schema and logic
│   │   ├── utils/                      # Helpers (ALCOA+ log generators, bcrypt hashing)
│   │   ├── app.ts                      # Express app initialization & route assembly
│   │   └── server.ts                   # Entry point (App.listen)
│   ├── .env
│   ├── package.json
│   └── tsconfig.json
├── frontend/
   ├── src/
   └── package.json
```

### Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Stable / release |
| `develop` | Integration branch |
| `feature/<name>` | Each feature (e.g., `feature/auth`, `feature/medicines`, `feature/orders`) |

### Commit Style

Use **Conventional Commits** format, for example:

- `feat: add order model`
- `fix: validate stock on order`
- `docs: update SRS with acceptance criteria`

---

## 12. Project Vision

Pharma-Net aims to be a professionally structured, high-performance, web-first pharmaceutical logistics system that demonstrates industry best practices in API design, data integrity, and auditability. The Web & Backend Team serves as the backbone of the entire operation — by building a shared API, business rules remain consistent across all platforms, while internal web tools provide the management oversight necessary for a secure medical supply chain.

The shared backend and single MongoDB database are the system's backbone — ensuring consistent business rules, atomic state changes, and a single source of truth for inventory and transactions. This architecture simplifies maintenance, supports scalability, and enables future expansion (for example, adding clients that consume the same APIs) without duplicating core logic.