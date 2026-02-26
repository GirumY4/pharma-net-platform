# Pharma-Net — REST API Documentation

| Field       | Details                              |
|-------------|--------------------------------------|
| **Version** | 1.0                                  |
| **Date**    | 2026-02-26                           |
| **Authors** | Intern Development Team (Web & Backend) |
| **Base URL**| `https://<host>/api`                 |
| **Protocol**| HTTPS / TLS 1.2+                     |
| **Format**  | JSON (`Content-Type: application/json`) |

> **Alignment:** This documentation is derived from the SRS (v1.0), SDS, Database_Schema.md, and Project_Context.md.  
> All business logic, stock validation, and data integrity (ALCOA+) are enforced at the API level.

---

## Table of Contents

1. [Global Conventions](#1-global-conventions)
2. [Authentication](#2-authentication)
3. [Users (Admin)](#3-users-admin)
4. [Medicines & Inventory](#4-medicines--inventory)
5. [Inventory Transactions — GRN / GIN](#5-inventory-transactions--grn--gin)
6. [Orders](#6-orders)
7. [Payments](#7-payments)
8. [Reports & Analytics](#8-reports--analytics)
9. [Audit Logs](#9-audit-logs)
10. [Error Reference](#10-error-reference)
11. [Requirement Traceability](#11-requirement-traceability)

---

## 1. Global Conventions

### 1.1 Base URL

```
https://<host>/api
```

All endpoints are prefixed with `/api`. In development, the host is typically `localhost:5000`.

### 1.2 Authentication

Every endpoint **except** `POST /api/auth/register` and `POST /api/auth/login` requires a valid JWT passed in the `Authorization` header:

```
Authorization: Bearer <token>
```

Requests without a valid token return `401 Unauthorized`. Requests with a token but insufficient role return `403 Forbidden`.

### 1.3 Role-Based Access Control (RBAC)

Three roles exist. The table below shows the shorthand used throughout this document:

| Role Symbol | Role Value in JWT | Description |
|-------------|-------------------|-------------|
| 🔓 Public | — | No token required. |
| 🟢 `pharmacy` | `pharmacy` | Mobile API consumer; can browse inventory and manage own orders. |
| 🟡 `warehouse_manager` | `warehouse_manager` | Manages inventory, approves orders, records payments. |
| 🔴 `admin` | `admin` | Full access; manages users and sees all audit logs. |

### 1.4 Date Format

All dates use **ISO 8601** format: `YYYY-MM-DDTHH:mm:ssZ`  
All timestamps are **server-generated** — never accepted from the client body.

### 1.5 Pagination

List endpoints that may return large datasets support cursor-based pagination via query parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | Integer | `1` | Page number (1-indexed). |
| `limit` | Integer | `20` | Records per page (max `100`). |

Paginated responses include a `pagination` object:

```json
{
  "data": [...],
  "pagination": {
    "total": 245,
    "page": 1,
    "limit": 20,
    "totalPages": 13
  }
}
```

### 1.6 Soft Delete Behaviour

Records marked `isDeleted: true` are **excluded from all default list/get responses**. To include them, pass `?includeDeleted=true` (admin only).

---

## 2. Authentication

### `POST /api/auth/register`

Register a new user account. In production, `pharmacy` and `warehouse_manager` accounts are created by an admin. This endpoint is open for initial setup.

**Access:** 🔓 Public  
**FR:** FR-1.1, FR-1.2

#### Request Body

```json
{
  "name": "Abebe Girma",
  "email": "abebe.girma@pharma.com",
  "password": "SecurePass123!",
  "role": "warehouse_manager"
}
```

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `name` | String | ✅ | 2–100 chars |
| `email` | String | ✅ | Valid email; must be unique |
| `password` | String | ✅ | Min 8 chars |
| `role` | String | ✅ | `admin` / `warehouse_manager` / `pharmacy` |

#### Response `201 Created`

```json
{
  "success": true,
  "message": "User registered successfully.",
  "data": {
    "_id": "64a1f2b3c4d5e6f7a8b9c0d1",
    "name": "Abebe Girma",
    "email": "abebe.girma@pharma.com",
    "role": "warehouse_manager",
    "isActive": true,
    "createdAt": "2026-02-26T12:00:00Z"
  }
}
```

#### Error Responses

| Status | Code | Reason |
|--------|------|--------|
| `400` | `VALIDATION_ERROR` | Missing or invalid fields. |
| `409` | `EMAIL_EXISTS` | Email is already registered. |

---

### `POST /api/auth/login`

Authenticate a user and receive a signed JWT.

**Access:** 🔓 Public  
**FR:** FR-1.3

#### Request Body

```json
{
  "email": "abebe.girma@pharma.com",
  "password": "SecurePass123!"
}
```

#### Response `200 OK`

```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "8h",
    "user": {
      "_id": "64a1f2b3c4d5e6f7a8b9c0d1",
      "name": "Abebe Girma",
      "role": "warehouse_manager"
    }
  }
}
```

> **Token Payload:** `{ userId, role, iat, exp }`. The `exp` is set to 8 hours from issue time, configurable via `JWT_EXPIRATION` env var (FR-1.5).

#### Error Responses

| Status | Code | Reason |
|--------|------|--------|
| `400` | `VALIDATION_ERROR` | Missing email or password. |
| `401` | `INVALID_CREDENTIALS` | Email not found or password incorrect. |
| `403` | `ACCOUNT_INACTIVE` | Account has been deactivated by an admin. |

---

## 3. Users (Admin)

All user management endpoints are restricted to the `admin` role.

### `GET /api/users`

Retrieve a paginated list of all users.

**Access:** 🔴 `admin`  
**FR:** FR-1.4

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `role` | String | Filter by role (`admin`, `warehouse_manager`, `pharmacy`). |
| `isActive` | Boolean | Filter by active status. |
| `page` | Integer | Page number. |
| `limit` | Integer | Results per page. |
| `includeDeleted` | Boolean | Include soft-deleted accounts (default `false`). |

#### Response `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "_id": "64a1f2b3c4d5e6f7a8b9c0d1",
      "name": "Abebe Girma",
      "email": "abebe.girma@pharma.com",
      "role": "warehouse_manager",
      "isActive": true,
      "createdAt": "2026-02-26T12:00:00Z"
    }
  ],
  "pagination": { "total": 12, "page": 1, "limit": 20, "totalPages": 1 }
}
```

---

### `GET /api/users/:id`

Retrieve a single user by ID.

**Access:** 🔴 `admin`

#### Response `200 OK`

```json
{
  "success": true,
  "data": {
    "_id": "64a1f2b3c4d5e6f7a8b9c0d1",
    "name": "Abebe Girma",
    "email": "abebe.girma@pharma.com",
    "role": "warehouse_manager",
    "isActive": true,
    "isDeleted": false,
    "createdAt": "2026-02-26T12:00:00Z",
    "updatedAt": "2026-02-26T12:00:00Z"
  }
}
```

---

### `PATCH /api/users/:id`

Update a user's name, role, or active status. Cannot change `email` or `passwordHash` through this endpoint.

**Access:** 🔴 `admin`  
**FR:** FR-1.4

#### Request Body (all fields optional)

```json
{
  "name": "Abebe G. Bekele",
  "role": "admin",
  "isActive": false
}
```

#### Response `200 OK`

Returns the updated user object.

---

### `DELETE /api/users/:id`

**Soft-delete** a user account. Sets `isDeleted: true` and `deletedAt` to server timestamp. The account cannot log in after this.

**Access:** 🔴 `admin`  
**NFR:** NFR-4.2

#### Response `200 OK`

```json
{
  "success": true,
  "message": "User account has been deactivated and soft-deleted."
}
```

---

### `GET /api/users/me`

Returns the profile of the currently authenticated user (any role).

**Access:** 🟢 `pharmacy` | 🟡 `warehouse_manager` | 🔴 `admin`

#### Response `200 OK`

Returns the calling user's document (excluding `passwordHash`).

---

## 4. Medicines & Inventory

### `GET /api/medicines`

Retrieve all medicines. Excludes soft-deleted records by default.

**Access:** 🟢 `pharmacy` | 🟡 `warehouse_manager` | 🔴 `admin`  
**FR:** FR-2.6

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | String | Case-insensitive partial name search. |
| `sku` | String | Exact SKU match. |
| `category` | String | Filter by category. |
| `lowStock` | Boolean | If `true`, returns only medicines where `totalStock < reorderThreshold`. |
| `nearExpiry` | Boolean | If `true`, returns medicines with any batch expiring within 90 days. |
| `page` | Integer | Page number. |
| `limit` | Integer | Results per page. |

#### Response `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "_id": "64b2a3c4d5e6f7a8b9c0d2e3",
      "name": "Amoxicillin 250mg",
      "sku": "AMX250",
      "genericName": "Amoxicillin",
      "category": "Antibiotic",
      "unitPrice": 12.75,
      "unitOfMeasure": "capsule",
      "totalStock": 480,
      "reorderThreshold": 50,
      "batches": [
        {
          "_id": "64b2a3c4d5e6f7a8b9c0d2e4",
          "batchNumber": "BATCH-AMX-2025-01",
          "quantity": 480,
          "expiryDate": "2027-06-30T00:00:00Z",
          "shelfLocation": "Aisle-B, Shelf-3",
          "receivedAt": "2026-01-15T08:30:00Z"
        }
      ],
      "createdBy": "64a1f2b3c4d5e6f7a8b9c0d1",
      "createdAt": "2026-01-15T08:30:00Z",
      "updatedAt": "2026-02-10T14:22:00Z"
    }
  ],
  "pagination": { "total": 87, "page": 1, "limit": 20, "totalPages": 5 }
}
```

---

### `POST /api/medicines`

Add a new medicine to the catalog. The first batch may be included in the request body.

**Access:** 🟡 `warehouse_manager` | 🔴 `admin`  
**FR:** FR-2.1, FR-2.2, FR-2.3

#### Request Body

```json
{
  "name": "Amoxicillin 250mg",
  "sku": "AMX250",
  "genericName": "Amoxicillin",
  "category": "Antibiotic",
  "description": "Broad-spectrum penicillin antibiotic.",
  "unitPrice": 12.75,
  "unitOfMeasure": "capsule",
  "reorderThreshold": 100,
  "initialBatch": {
    "batchNumber": "BATCH-AMX-2025-01",
    "gtin": "00614141000418",
    "quantity": 500,
    "expiryDate": "2027-06-30",
    "supplierName": "Addis Pharma Distributors",
    "shelfLocation": "Aisle-B, Shelf-3"
  }
}
```

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `name` | String | ✅ | Unique per category recommended |
| `sku` | String | ✅ | Must be globally unique |
| `category` | String | ✅ | |
| `unitPrice` | Number | ✅ | `>= 0` |
| `unitOfMeasure` | String | ✅ | Enum: `tablet`, `capsule`, `vial`, `bottle`, `sachet`, `unit` |
| `reorderThreshold` | Number | ❌ | Default `50` |
| `initialBatch` | Object | ❌ | If provided, `batchNumber`, `quantity`, `expiryDate` are required inside. |

#### Response `201 Created`

```json
{
  "success": true,
  "message": "Medicine added successfully.",
  "data": { /* full medicine document */ }
}
```

#### Error Responses

| Status | Code | Reason |
|--------|------|--------|
| `400` | `VALIDATION_ERROR` | Missing required fields or invalid types. |
| `409` | `SKU_EXISTS` | Provided SKU is already in use. |

---

### `GET /api/medicines/:id`

Retrieve a single medicine record with all batch details.

**Access:** 🟢 `pharmacy` | 🟡 `warehouse_manager` | 🔴 `admin`

#### Response `200 OK`

Returns the full medicine document including the `batches` array.

---

### `PATCH /api/medicines/:id`

Update medicine metadata (name, category, price, reorder threshold). Does **not** adjust stock — use the GRN/GIN endpoint for that.

**Access:** 🟡 `warehouse_manager` | 🔴 `admin`  
**FR:** FR-2.1

#### Request Body (all fields optional)

```json
{
  "unitPrice": 14.00,
  "reorderThreshold": 150,
  "description": "Updated dispensing notes."
}
```

#### Response `200 OK`

Returns the updated medicine document.

---

### `DELETE /api/medicines/:id`

**Soft-delete** a medicine. Sets `isDeleted: true`, `deletedAt` to server time. The medicine is hidden from default queries but preserved for historic order and audit records.

**Access:** 🟡 `warehouse_manager` | 🔴 `admin`  
**NFR:** NFR-4.2

#### Response `200 OK`

```json
{
  "success": true,
  "message": "Medicine soft-deleted. Historical records are preserved."
}
```

---

### `POST /api/medicines/:id/batches`

Add a **new batch** to an existing medicine. Also increases `totalStock` atomically via a GRN transaction.

**Access:** 🟡 `warehouse_manager` | 🔴 `admin`  
**FR:** FR-2.2, FR-2.7

#### Request Body

```json
{
  "batchNumber": "BATCH-AMX-2026-01",
  "gtin": "00614141000418",
  "quantity": 200,
  "expiryDate": "2028-03-15",
  "supplierName": "Addis Pharma Distributors",
  "shelfLocation": "Aisle-B, Shelf-4"
}
```

#### Response `201 Created`

```json
{
  "success": true,
  "message": "Batch added and stock updated.",
  "data": {
    "newBatch": { /* batch subdocument */ },
    "totalStock": 680
  }
}
```

---

## 5. Inventory Transactions — GRN / GIN

A strict stock movement ledger. Every stock change (outside of order fulfillment) is recorded here.

### `GET /api/inventory-transactions`

List all GRN/GIN transactions.

**Access:** 🟡 `warehouse_manager` | 🔴 `admin`  
**FR:** FR-2.7

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `medicineId` | ObjectId | Filter by medicine. |
| `type` | String | `GRN` or `GIN`. |
| `createdBy` | ObjectId | Filter by the warehouse user who recorded it. |
| `startDate` | Date | Filter from this date (ISO 8601). |
| `endDate` | Date | Filter to this date. |
| `page` / `limit` | Integer | Pagination. |

#### Response `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "_id": "64c3b4d5e6f7a8b9c0d3e4f5",
      "transactionType": "GRN",
      "medicineId": { "_id": "...", "name": "Amoxicillin 250mg", "sku": "AMX250" },
      "batchNumber": "BATCH-AMX-2026-01",
      "quantityChanged": 200,
      "stockBefore": 480,
      "stockAfter": 680,
      "reason": "Received from supplier.",
      "referenceNumber": "PO-2026-0041",
      "createdBy": { "_id": "...", "name": "Abebe Girma" },
      "createdAt": "2026-02-26T09:00:00Z"
    }
  ],
  "pagination": { "total": 34, "page": 1, "limit": 20, "totalPages": 2 }
}
```

---

### `POST /api/inventory-transactions`

Record a GRN (stock in) or GIN (stock out / write-off). Updates `medicines.totalStock` atomically.

**Access:** 🟡 `warehouse_manager` | 🔴 `admin`  
**FR:** FR-2.7  
**SDS:** §Technical Logic — `Snew = Sold + Qadjustment`

#### Request Body

```json
{
  "transactionType": "GIN",
  "medicineId": "64b2a3c4d5e6f7a8b9c0d2e3",
  "batchNumber": "BATCH-AMX-2025-01",
  "quantityChanged": -30,
  "reason": "Expired goods write-off.",
  "referenceNumber": "WO-2026-0005",
  "expiryDate": "2025-12-31"
}
```

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `transactionType` | String | ✅ | `GRN` or `GIN` |
| `medicineId` | ObjectId | ✅ | Must reference an active medicine |
| `batchNumber` | String | ✅ | Must exist on the medicine's batches |
| `quantityChanged` | Number | ✅ | Positive for GRN, negative for GIN |
| `reason` | String | Required for GIN | Mandatory justification for removals |
| `referenceNumber` | String | ❌ | External document reference |

#### Response `201 Created`

```json
{
  "success": true,
  "message": "Inventory transaction recorded.",
  "data": {
    "transaction": { /* full transaction document */ },
    "updatedStock": 450
  }
}
```

#### Error Responses

| Status | Code | Reason |
|--------|------|--------|
| `400` | `INSUFFICIENT_STOCK` | GIN would bring stock below zero. |
| `404` | `BATCH_NOT_FOUND` | Batch number not found on the medicine. |

---

## 6. Orders

### `GET /api/orders`

List orders. Pharmacy users see only their own orders. Warehouse managers and admins see all.

**Access:** 🟢 `pharmacy` | 🟡 `warehouse_manager` | 🔴 `admin`  
**FR:** FR-3.5

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | String | Filter by order status (e.g., `pending`, `approved`). |
| `paymentStatus` | String | Filter by `unpaid`, `partially_paid`, `paid`. |
| `pharmacyId` | ObjectId | Admin/Warehouse only — filter by pharmacy. |
| `startDate` | Date | Created from date. |
| `endDate` | Date | Created to date. |
| `page` / `limit` | Integer | Pagination. |

#### Response `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "_id": "64d4c5e6f7a8b9c0d4e5f601",
      "pharmacyId": { "_id": "...", "name": "Selam Pharmacy" },
      "items": [
        {
          "medicineId": "64b2a3c4d5e6f7a8b9c0d2e3",
          "medicineName": "Amoxicillin 250mg",
          "sku": "AMX250",
          "quantity": 50,
          "unitPrice": 12.75,
          "lineTotal": 637.50
        }
      ],
      "totalAmount": 637.50,
      "status": "pending",
      "paymentStatus": "unpaid",
      "createdAt": "2026-02-26T10:00:00Z"
    }
  ],
  "pagination": { "total": 58, "page": 1, "limit": 20, "totalPages": 3 }
}
```

---

### `POST /api/orders`

Submit a new purchase order. The API validates stock availability before creating the order (pre-flight check).

**Access:** 🟢 `pharmacy`  
**FR:** FR-3.1, FR-3.2

#### Request Body

```json
{
  "items": [
    { "medicineId": "64b2a3c4d5e6f7a8b9c0d2e3", "quantity": 50 },
    { "medicineId": "64b2a3c4d5e6f7a8b9c0d2e9", "quantity": 20 }
  ]
}
```

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `items` | Array | ✅ | At least 1 item |
| `items[].medicineId` | ObjectId | ✅ | Must be an active, non-deleted medicine |
| `items[].quantity` | Number | ✅ | `>= 1`; must not exceed `totalStock` |

> **Stock Pre-flight:** The backend checks `totalStock >= requestedQty` for **all** items. If any item fails, the entire order is rejected with a `400` listing which medicines are under-stocked.

#### Response `201 Created`

```json
{
  "success": true,
  "message": "Order placed successfully.",
  "data": {
    "_id": "64d4c5e6f7a8b9c0d4e5f601",
    "status": "pending",
    "totalAmount": 637.50,
    "items": [ /* line items with snapshot prices */ ],
    "createdAt": "2026-02-26T10:00:00Z"
  }
}
```

#### Error Responses

| Status | Code | Reason |
|--------|------|--------|
| `400` | `INSUFFICIENT_STOCK` | One or more items exceed available stock. |
| `400` | `VALIDATION_ERROR` | Missing fields or invalid medicine IDs. |

---

### `GET /api/orders/:id`

Retrieve a single order with full details including status history.

**Access:** 🟢 `pharmacy` (own orders only) | 🟡 `warehouse_manager` | 🔴 `admin`  
**FR:** FR-3.5

#### Response `200 OK`

```json
{
  "success": true,
  "data": {
    "_id": "64d4c5e6f7a8b9c0d4e5f601",
    "pharmacyId": { "_id": "...", "name": "Selam Pharmacy" },
    "items": [ /* ... */ ],
    "totalAmount": 637.50,
    "status": "approved",
    "paymentStatus": "unpaid",
    "approvedBy": { "_id": "...", "name": "Abebe Girma" },
    "approvedAt": "2026-02-26T11:30:00Z",
    "statusHistory": [
      { "status": "pending",  "changedBy": "...", "changedAt": "2026-02-26T10:00:00Z", "note": null },
      { "status": "approved", "changedBy": "...", "changedAt": "2026-02-26T11:30:00Z", "note": null }
    ],
    "createdAt": "2026-02-26T10:00:00Z"
  }
}
```

---

### `PATCH /api/orders/:id/status`

Update the status of an order. This is the primary workflow action endpoint for warehouse managers.

**Access:** 🟡 `warehouse_manager` | 🔴 `admin`  
**FR:** FR-3.3, FR-3.4  
**NFR:** NFR-2.4 (Atomic transactions on approval)

#### Allowed Status Transitions

| From | To | Actor | Side Effects |
|------|----|-------|-------------|
| `pending` | `approved` | Warehouse Manager | **Atomically decrements** `medicines.totalStock` for all items. |
| `pending` | `rejected` | Warehouse Manager | Requires `rejectionReason` in body. No stock change. |
| `approved` | `processing` | Warehouse Manager | No stock change. |
| `processing` | `dispatched` | Warehouse Manager | No stock change. |
| `dispatched` | `delivered` | Warehouse Manager | No stock change. |

#### Request Body

```json
{
  "status": "approved",
  "note": "All items verified in stock."
}
```

For `rejected` status:

```json
{
  "status": "rejected",
  "rejectionReason": "Requested quantity of AMX250 is no longer available."
}
```

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `status` | String | ✅ | Must be a valid next-state per lifecycle |
| `rejectionReason` | String | Required when `status = rejected` | |
| `note` | String | ❌ | Optional note for this transition |

#### Response `200 OK`

```json
{
  "success": true,
  "message": "Order status updated to 'approved'.",
  "data": {
    "_id": "64d4c5e6f7a8b9c0d4e5f601",
    "status": "approved",
    "approvedBy": "64a1f2b3c4d5e6f7a8b9c0d1",
    "approvedAt": "2026-02-26T11:30:00Z",
    "statusHistory": [ /* updated */ ]
  }
}
```

#### Error Responses

| Status | Code | Reason |
|--------|------|--------|
| `400` | `INVALID_TRANSITION` | Requested status change is not a valid lifecycle step. |
| `400` | `REJECTION_REASON_REQUIRED` | `rejectionReason` missing when rejecting. |
| `409` | `INSUFFICIENT_STOCK` | Stock levels changed since order was placed; approval blocked. |

---

## 7. Payments

### `GET /api/payments`

List payment records. Pharmacy users see only payments linked to their orders.

**Access:** 🟢 `pharmacy` | 🟡 `warehouse_manager` | 🔴 `admin`  
**FR:** FR-4.3

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `orderId` | ObjectId | Filter by order. |
| `pharmacyId` | ObjectId | Filter by pharmacy (admin/warehouse only). |
| `method` | String | `bank_transfer`, `cash`, `credit`. |
| `startDate` | Date | Filter from timestamp. |
| `endDate` | Date | Filter to timestamp. |

#### Response `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "_id": "64e5d6f7a8b9c0d5e6f7a801",
      "orderId": "64d4c5e6f7a8b9c0d4e5f601",
      "pharmacyId": { "_id": "...", "name": "Selam Pharmacy" },
      "amount": 300.00,
      "method": "bank_transfer",
      "transactionId": "TXN-ETB-20260226-001",
      "status": "confirmed",
      "recordedBy": { "_id": "...", "name": "Abebe Girma" },
      "timestamp": "2026-02-26T13:00:00Z"
    }
  ],
  "pagination": { "total": 22, "page": 1, "limit": 20, "totalPages": 2 }
}
```

---

### `POST /api/payments`

Record a payment transaction against an order. After saving, the system recalculates `orders.paymentStatus`.

**Access:** 🟡 `warehouse_manager` | 🔴 `admin`  
**FR:** FR-4.1, FR-4.2, FR-4.4

#### Request Body

```json
{
  "orderId": "64d4c5e6f7a8b9c0d4e5f601",
  "amount": 300.00,
  "method": "bank_transfer",
  "transactionId": "TXN-ETB-20260226-001",
  "note": "Partial payment. Balance due by end of month."
}
```

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `orderId` | ObjectId | ✅ | Must reference a non-rejected order |
| `amount` | Number | ✅ | `> 0`; cannot exceed remaining balance |
| `method` | String | ✅ | `bank_transfer` / `cash` / `credit` |
| `transactionId` | String | ❌ | Required for bank transfers |
| `note` | String | ❌ | Free-text note |

#### Response `201 Created`

```json
{
  "success": true,
  "message": "Payment recorded successfully.",
  "data": {
    "payment": { /* full payment document */ },
    "orderPaymentStatus": "partially_paid",
    "totalPaid": 300.00,
    "remainingBalance": 337.50
  }
}
```

#### Error Responses

| Status | Code | Reason |
|--------|------|--------|
| `400` | `VALIDATION_ERROR` | Missing fields or amount ≤ 0. |
| `400` | `OVERPAYMENT` | Amount exceeds remaining order balance. |
| `404` | `ORDER_NOT_FOUND` | Referenced order does not exist. |
| `409` | `ORDER_ALREADY_PAID` | Order `paymentStatus` is already `paid`. |

---

### `GET /api/payments/:id`

Retrieve a single payment record.

**Access:** 🟡 `warehouse_manager` | 🔴 `admin`

#### Response `200 OK`

Returns the full payment document populated with `orderId` and `recordedBy` references.

---

## 8. Reports & Analytics

All report endpoints require at minimum `warehouse_manager` role. They are read-only and never modify data.

### `GET /api/reports/inventory`

Generate a full inventory report including batch details and stock valuations.

**Access:** 🟡 `warehouse_manager` | 🔴 `admin`  
**FR:** FR-5.1

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `category` | String | Filter by category. |
| `lowStock` | Boolean | Only items below reorder threshold. |
| `export` | String | `csv` or `pdf` — triggers file download. |

#### Response `200 OK`

```json
{
  "success": true,
  "data": {
    "generatedAt": "2026-02-26T15:00:00Z",
    "totalMedicines": 87,
    "totalStockValue": 245780.50,
    "lowStockItems": 4,
    "nearExpiryItems": 7,
    "medicines": [
      {
        "name": "Amoxicillin 250mg",
        "sku": "AMX250",
        "category": "Antibiotic",
        "totalStock": 480,
        "reorderThreshold": 100,
        "unitPrice": 12.75,
        "stockValue": 6120.00,
        "batches": [ /* ... */ ]
      }
    ]
  }
}
```

---

### `GET /api/reports/sales`

Generate daily or monthly sales statistics.

**Access:** 🟡 `warehouse_manager` | 🔴 `admin`  
**FR:** FR-5.2

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `startDate` | Date | ✅ | Report window start (ISO 8601). |
| `endDate` | Date | ✅ | Report window end. |
| `groupBy` | String | ❌ | `day` (default) or `month`. |
| `export` | String | ❌ | `csv` or `pdf`. |

#### Response `200 OK`

```json
{
  "success": true,
  "data": {
    "startDate": "2026-02-01T00:00:00Z",
    "endDate": "2026-02-26T23:59:59Z",
    "totalRevenue": 128450.25,
    "totalOrders": 62,
    "deliveredOrders": 54,
    "topMedicines": [
      { "name": "Amoxicillin 250mg", "sku": "AMX250", "qtySold": 1200, "revenue": 15300.00 }
    ],
    "timeline": [
      { "date": "2026-02-01", "orderCount": 4, "revenue": 5100.00 }
    ]
  }
}
```

---

### `GET /api/reports/expiring`

List all stock batches expiring on or before a given date.

**Access:** 🟡 `warehouse_manager` | 🔴 `admin`  
**FR:** FR-5.3

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `before` | Date | ✅ | Return batches with `expiryDate <= before`. |
| `export` | String | ❌ | `csv` or `pdf`. |

#### Response `200 OK`

```json
{
  "success": true,
  "data": {
    "generatedAt": "2026-02-26T15:00:00Z",
    "cutoffDate": "2026-05-26T00:00:00Z",
    "items": [
      {
        "medicineId": "64b2a3c4d5e6f7a8b9c0d2e3",
        "medicineName": "Paracetamol 500mg",
        "sku": "PCM500",
        "batchNumber": "BATCH-PCM-2024-03",
        "quantity": 120,
        "expiryDate": "2026-04-15T00:00:00Z",
        "shelfLocation": "Aisle-A, Shelf-1",
        "daysUntilExpiry": 48
      }
    ]
  }
}
```

---

## 9. Audit Logs

### `GET /api/logs`

Retrieve the global, immutable audit log. **Read-only — no create, update, or delete endpoints exist for this collection.**

**Access:** 🔴 `admin`  
**FR:** FR-5.4, NFR-4.1

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `userId` | ObjectId | Filter by the user who performed the action. |
| `actionType` | String | e.g., `CREATE`, `UPDATE`, `APPROVE`, `GRN`. |
| `resource` | String | e.g., `Medicine`, `Order`, `Payment`. |
| `resourceId` | ObjectId | All log entries for a specific document. |
| `startDate` | Date | Filter from timestamp. |
| `endDate` | Date | Filter to timestamp. |
| `page` / `limit` | Integer | Pagination. |

#### Response `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "_id": "64f6e7f8a9b0c1d6e7f8a902",
      "userId": { "_id": "...", "name": "Abebe Girma", "role": "warehouse_manager" },
      "actionType": "APPROVE",
      "resource": "Order",
      "resourceId": "64d4c5e6f7a8b9c0d4e5f601",
      "before": { "status": "pending" },
      "after":  { "status": "approved", "approvedBy": "...", "approvedAt": "..." },
      "ipAddress": "196.188.45.10",
      "timestamp": "2026-02-26T11:30:00Z"
    }
  ],
  "pagination": { "total": 1204, "page": 1, "limit": 20, "totalPages": 61 }
}
```

> **Immutability Note:** The API exposes no `POST`, `PATCH`, or `DELETE` endpoint for `/api/logs`. New entries are created automatically by the backend service layer on every data-modifying operation (NFR-4.1, 21 CFR Part 11).

---

## 10. Error Reference

All error responses follow a consistent envelope:

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Requested quantity for AMX250 exceeds available stock (480 available, 600 requested).",
    "details": [ /* optional: array of field-level validation errors */ ]
  }
}
```

### Standard HTTP Status Codes

| Status | Meaning | Common Causes |
|--------|---------|---------------|
| `200 OK` | Success | GET / PATCH operations completed. |
| `201 Created` | Resource created | POST operations completed. |
| `400 Bad Request` | Client error | Validation failure, invalid transition, insufficient stock. |
| `401 Unauthorized` | Auth missing/invalid | No token, expired token, invalid signature. |
| `403 Forbidden` | Insufficient role | User role does not permit the requested action. |
| `404 Not Found` | Resource absent | ID does not exist or is soft-deleted. |
| `409 Conflict` | Business rule conflict | Duplicate SKU/email, overpayment, already paid order. |
| `500 Internal Server Error` | Server-side failure | Unhandled exception; stack detail logged server-side only. |

### Application Error Codes

| Code | Endpoint(s) | Description |
|------|------------|-------------|
| `VALIDATION_ERROR` | All | Required fields missing or wrong type. |
| `EMAIL_EXISTS` | `POST /auth/register` | Email already in use. |
| `INVALID_CREDENTIALS` | `POST /auth/login` | Wrong email or password. |
| `ACCOUNT_INACTIVE` | `POST /auth/login` | Account is deactivated. |
| `SKU_EXISTS` | `POST /medicines` | SKU already registered. |
| `INSUFFICIENT_STOCK` | `POST /orders`, `PATCH /orders/:id/status` | Not enough stock to fulfill. |
| `INVALID_TRANSITION` | `PATCH /orders/:id/status` | Status change is not a valid lifecycle step. |
| `REJECTION_REASON_REQUIRED` | `PATCH /orders/:id/status` | Must provide reason when rejecting. |
| `BATCH_NOT_FOUND` | `POST /inventory-transactions` | Batch number not found on medicine. |
| `ORDER_NOT_FOUND` | `POST /payments` | Order ID does not exist. |
| `OVERPAYMENT` | `POST /payments` | Amount exceeds remaining balance. |
| `ORDER_ALREADY_PAID` | `POST /payments` | Order is already fully paid. |

---

## 11. Requirement Traceability

| Endpoint | Method | FR / NFR |
|----------|--------|----------|
| `/api/auth/register` | POST | FR-1.1, FR-1.2 |
| `/api/auth/login` | POST | FR-1.3, FR-1.5 |
| `/api/users` | GET / PATCH / DELETE | FR-1.4, NFR-4.2, NFR-4.3 |
| `/api/medicines` | GET | FR-2.6, NFR-1.4 |
| `/api/medicines` | POST | FR-2.1, FR-2.2, FR-2.3 |
| `/api/medicines/:id` | PATCH | FR-2.1 |
| `/api/medicines/:id` | DELETE | NFR-4.2 |
| `/api/medicines/:id/batches` | POST | FR-2.2, FR-2.7 |
| `/api/inventory-transactions` | GET / POST | FR-2.7, FR-2.4 |
| `/api/orders` | GET | FR-3.5 |
| `/api/orders` | POST | FR-3.1, FR-3.2 |
| `/api/orders/:id` | GET | FR-3.5 |
| `/api/orders/:id/status` | PATCH | FR-3.3, FR-3.4, NFR-2.4 |
| `/api/payments` | GET | FR-4.3 |
| `/api/payments` | POST | FR-4.1, FR-4.2, FR-4.4 |
| `/api/reports/inventory` | GET | FR-5.1 |
| `/api/reports/sales` | GET | FR-5.2 |
| `/api/reports/expiring` | GET | FR-5.3 |
| `/api/logs` | GET | FR-5.4, NFR-4.1 |

---

*End of API Documentation — Pharma-Net v1.0*
