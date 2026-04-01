# Pharma-Net — REST API Documentation

| Field       | Details                              |
|-------------|--------------------------------------|
| **Version** | 2.0                                  |
| **Date**    | 2026-03-31                           |
| **Authors** | Intern Development Team (Web & Backend) |
| **Base URL**| `https://<host>/api`                 |
| **Protocol**| HTTPS / TLS 1.2+                     |
| **Format**  | JSON (`Content-Type: application/json`) |

> **Alignment:** This documentation is derived from the SRS (v2.0), SDS, Database_Schema.md, and Project_Context.md.  
> All business logic, multi-tenant isolation, stock validation, and data integrity (ALCOA+) are enforced at the API level. Tenant scoping is handled via `pharmacyId` extracted from the JWT — never from client input.

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

Every endpoint **except** `POST /api/auth/register`, `POST /api/auth/login`, and `GET /api/medicines/marketplace` requires a valid JWT passed in the `Authorization` header:

```
Authorization: Bearer <token>
```

Requests without a valid token return `401 Unauthorized`. Requests with a token but insufficient role return `403 Forbidden`.

### 1.3 Role-Based Access Control (RBAC)

Three roles exist. The table below shows the shorthand used throughout this document:

| Role Symbol | Role Value in JWT | Description |
|-------------|-------------------|-------------|
| 🔓 Public | — | No token required. |
| 🟢 `public_user` | `public_user` | Consumer/Patient; searches the global marketplace, places orders, tracks order status. |
| 🟡 `pharmacy_manager` | `pharmacy_manager` | SaaS tenant operator; manages local inventory, fulfills incoming orders, records payments. **All operations scoped by `pharmacyId` from JWT.** |
| 🔴 `admin` | `admin` | Platform governance; manages tenant accounts, views cross-tenant audit logs, monitors platform health. |

### 1.4 Multi-Tenant Scoping

For `pharmacy_manager` users, the JWT payload includes a `pharmacyId` field. The API middleware automatically extracts this value and injects it into all downstream database queries. The `pharmacyId` is **never** accepted from the client request body — preventing tenant-hopping attacks. All tenant-scoped endpoints (medicines, inventory transactions, orders, payments, reports) are automatically filtered by this value.

### 1.5 Date Format

All dates use **ISO 8601** format: `YYYY-MM-DDTHH:mm:ssZ`  
All timestamps are **server-generated** — never accepted from the client body.

### 1.6 Pagination

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

### 1.7 Soft Delete Behaviour

Records marked `isDeleted: true` are **excluded from all default list/get responses**. To include them, pass `?includeDeleted=true` (admin only).

---

## 2. Authentication

### `POST /api/auth/register`

Register a new user account. In production, `pharmacy_manager` accounts are created by an admin (tenant onboarding). `public_user` accounts are self-registered via the mobile app. This endpoint is open for initial setup.

**Access:** 🔓 Public  
**FR:** FR-1.1, FR-1.2

#### Request Body

```json
{
  "name": "Dr. Abebe Pharmacy",
  "email": "abebe@pharma.com",
  "password": "SecurePass123!",
  "role": "pharmacy_manager",
  "phoneNumber": "+251911234567",
  "address": "Bole, Addis Ababa",
  "city": "Addis Ababa",
  "location": { "lat": 9.0054, "lng": 38.7636 }
}
```

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `name` | String | ✅ | 2–100 chars |
| `email` | String | ✅ | Valid email; must be unique |
| `password` | String | ✅ | Min 8 chars |
| `role` | String | ✅ | `admin` / `pharmacy_manager` / `public_user` |
| `phoneNumber` | String | ✅ for `pharmacy_manager`, recommended for `public_user` | Contact phone number. Displayed in marketplace results for pharmacies; used for delivery coordination for patients. |
| `address` | String | ✅ for `pharmacy_manager`, recommended for `public_user` | Human-readable location (e.g., `"Bole, Addis Ababa"`). Shown in marketplace results for pharmacies; used as default delivery address for patients. |
| `city` | String | ✅ for `pharmacy_manager`, recommended for `public_user` | City name for geographic filtering. |
| `location` | Object | ❌ | `{ lat: Number, lng: Number }`. GPS coordinates for Google Maps integration on the mobile app. |

#### Response `201 Created`

```json
{
  "success": true,
  "message": "User registered successfully.",
  "data": {
    "_id": "64a1f2b3c4d5e6f7a8b9c0d1",
    "name": "Dr. Abebe Pharmacy",
    "email": "abebe@pharma.com",
    "role": "pharmacy_manager",
    "phoneNumber": "+251911234567",
    "address": "Bole, Addis Ababa",
    "city": "Addis Ababa",
    "location": { "lat": 9.0054, "lng": 38.7636 },
    "isActive": true,
    "createdAt": "2026-03-31T12:00:00Z"
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

Authenticate a user and receive a signed JWT. For `pharmacy_manager` users, the JWT includes their `pharmacyId` for automatic tenant scoping.

**Access:** 🔓 Public  
**FR:** FR-1.3, FR-1.5, FR-1.6

#### Request Body

```json
{
  "email": "abebe@pharma.com",
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
      "name": "Dr. Abebe Pharmacy",
      "role": "pharmacy_manager"
    }
  }
}
```

> **Token Payload:** `{ userId, role, pharmacyId, iat, exp }`. For `pharmacy_manager` users, `pharmacyId` equals their `userId` (the user's `_id` doubles as the tenant identity). The `exp` is set to 8 hours from issue time, configurable via `JWT_EXPIRATION` env var (FR-1.5).

#### Error Responses

| Status | Code | Reason |
|--------|------|--------|
| `400` | `VALIDATION_ERROR` | Missing email or password. |
| `401` | `INVALID_CREDENTIALS` | Email not found or password incorrect. |
| `403` | `ACCOUNT_INACTIVE` | Account has been deactivated by an admin. |

---

## 3. Users (Admin)

All user management endpoints are restricted to the `admin` role. Admins create and manage pharmacy tenant accounts (onboarding/offboarding).

### `GET /api/users`

Retrieve a paginated list of all users across the platform.

**Access:** 🔴 `admin`  
**FR:** FR-1.4

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `role` | String | Filter by role (`admin`, `pharmacy_manager`, `public_user`). |
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
      "name": "Dr. Abebe Pharmacy",
      "email": "abebe@pharma.com",
      "role": "pharmacy_manager",
      "phoneNumber": "+251911234567",
      "address": "Bole, Addis Ababa",
      "city": "Addis Ababa",
      "isActive": true,
      "createdAt": "2026-03-31T12:00:00Z"
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
    "name": "Dr. Abebe Pharmacy",
    "email": "abebe@pharma.com",
    "role": "pharmacy_manager",
    "phoneNumber": "+251911234567",
    "address": "Bole, Addis Ababa",
    "city": "Addis Ababa",
    "location": { "lat": 9.0054, "lng": 38.7636 },
    "isActive": true,
    "isDeleted": false,
    "createdAt": "2026-03-31T12:00:00Z",
    "updatedAt": "2026-03-31T12:00:00Z"
  }
}
```

---

### `PATCH /api/users/:id`

Update a user's name, role, or active status. Cannot change `email` or `passwordHash` through this endpoint. Used by admins to activate/deactivate pharmacy tenant accounts.

**Access:** 🔴 `admin`  
**FR:** FR-1.4

#### Request Body (all fields optional)

```json
{
  "name": "Dr. Abebe G. Pharmacy",
  "role": "pharmacy_manager",
  "isActive": false
}
```

#### Response `200 OK`

Returns the updated user object.

---

### `DELETE /api/users/:id`

**Soft-delete** a user account. Sets `isDeleted: true` and `deletedAt` to server timestamp. The account cannot log in after this. For pharmacy tenants, deactivation effectively disables the entire tenant — their medicines remain in the database but are excluded from marketplace search.

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

**Access:** 🟢 `public_user` | 🟡 `pharmacy_manager` | 🔴 `admin`

#### Response `200 OK`

Returns the calling user's document (excluding `passwordHash`).

---

## 4. Medicines & Inventory

### `GET /api/medicines`

Retrieve all medicines **scoped to the authenticated pharmacy tenant**. Excludes soft-deleted records by default. This is the tenant-scoped endpoint — Pharmacy Managers see only their own catalog.

**Access:** 🟡 `pharmacy_manager` | 🔴 `admin`  
**FR:** FR-2.5, FR-2.6

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

> **Tenant Scoping:** The API automatically filters by `pharmacyId` from the JWT. A Pharmacy Manager at Pharmacy A will never see Pharmacy B's medicines through this endpoint.

#### Response `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "_id": "64b2a3c4d5e6f7a8b9c0d2e3",
      "pharmacyId": "64a1f2b3c4d5e6f7a8b9c0d1",
      "name": "Amoxicillin 250mg",
      "sku": "AMX250",
      "genericName": "Amoxicillin",
      "category": "Antibiotic",
      "unitPrice": 12.75,
      "unitOfMeasure": "capsule",
      "totalStock": 480,
      "reorderThreshold": 50,
      "isLowStock": false,
      "batches": [
        {
          "_id": "64b2a3c4d5e6f7a8b9c0d2e4",
          "batchNumber": "BATCH-AMX-2025-01",
          "gtin": "00614141000418",
          "quantity": 480,
          "expiryDate": "2027-06-30T00:00:00Z",
          "supplierName": "Addis Pharma Distributors",
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

### `GET /api/medicines/marketplace`

**Global marketplace search** — aggregates medicines across **all active pharmacy tenants**. This is the primary consumer-facing discovery endpoint. Sensitive tenant data (supplier names, shelf locations, internal batch details) is excluded from responses.

**Access:** 🔓 Public (no authentication required)  
**FR:** FR-2.6

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | String | Case-insensitive partial name search. |
| `genericName` | String | Search by generic/INN drug name. |
| `category` | String | Filter by category. |
| `city` | String | Filter by pharmacy city (e.g., `"Addis Ababa"`, `"Bahir Dar"`). |
| `page` | Integer | Page number. |
| `limit` | Integer | Results per page. |

#### Response `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "medicineId": "64b2a3c4d5e6f7a8b9c0d2e3",
      "name": "Amoxicillin 250mg",
      "genericName": "Amoxicillin",
      "category": "Antibiotic",
      "unitPrice": 12.75,
      "unitOfMeasure": "capsule",
      "totalStock": 480,
      "pharmacyId": "64a1f2b3c4d5e6f7a8b9c0d1",
      "pharmacyName": "Dr. Abebe Pharmacy",
      "pharmacyPhone": "+251911234567",
      "pharmacyAddress": "Bole, Addis Ababa",
      "pharmacyCity": "Addis Ababa",
      "pharmacyLocation": { "lat": 9.0054, "lng": 38.7636 }
    },
    {
      "medicineId": "64b2a3c4d5e6f7a8b9c0d8f1",
      "name": "Amoxicillin 250mg",
      "genericName": "Amoxicillin",
      "category": "Antibiotic",
      "unitPrice": 11.50,
      "unitOfMeasure": "capsule",
      "totalStock": 320,
      "pharmacyId": "710f3a4b5c6d7e8f9a0b1c2d",
      "pharmacyName": "City Pharmacy",
      "pharmacyPhone": "+251922345678",
      "pharmacyAddress": "Kebele 04, Bahir Dar",
      "pharmacyCity": "Bahir Dar",
      "pharmacyLocation": { "lat": 11.5936, "lng": 37.3886 }
    }
  ],
  "pagination": { "total": 245, "page": 1, "limit": 20, "totalPages": 13 }
}
```

> **Public-Safe Fields Only:** No `supplierName`, `shelfLocation`, `batchNumber`, `gtin`, or `createdBy` data is exposed. The pharmacy's public profile (`pharmacyName`, `pharmacyPhone`, `pharmacyAddress`, `pharmacyCity`, `pharmacyLocation`) is included so patients know where to go and how to contact the pharmacy. `pharmacyLocation` is only present if the pharmacy has registered GPS coordinates.

---

### `POST /api/medicines`

Add a new medicine to the pharmacy's local catalog. The `pharmacyId` is automatically injected from the JWT — it is never accepted from the request body. The first batch may be included in the request.

**Access:** 🟡 `pharmacy_manager` | 🔴 `admin`  
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

> **Tenant Scoping:** The `pharmacyId` is automatically set from the JWT. Attempting to include `pharmacyId` in the request body has no effect.

#### Response `201 Created`

```json
{
  "success": true,
  "message": "Medicine added successfully.",
  "data": { /* full medicine document with pharmacyId */ }
}
```

#### Error Responses

| Status | Code | Reason |
|--------|------|--------|
| `400` | `VALIDATION_ERROR` | Missing required fields or invalid types. |
| `409` | `SKU_EXISTS` | Provided SKU is already in use. |

---

### `GET /api/medicines/:id`

Retrieve a single medicine record with all batch details. Pharmacy Managers can only access medicines within their own `pharmacyId` boundary.

**Access:** 🟡 `pharmacy_manager` | 🔴 `admin`

#### Response `200 OK`

Returns the full medicine document including the `batches` array.

---

### `PATCH /api/medicines/:id`

Update medicine metadata (name, category, price, reorder threshold). Does **not** adjust stock — use the GRN/GIN endpoint for that. Only the owning pharmacy tenant can modify their own medicines.

**Access:** 🟡 `pharmacy_manager` | 🔴 `admin`  
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

**Soft-delete** a medicine. Sets `isDeleted: true`, `deletedAt` to server time. The medicine is hidden from default queries and marketplace search but preserved for historic order and audit records. Only the owning pharmacy tenant can delete their own medicines.

**Access:** 🟡 `pharmacy_manager` | 🔴 `admin`  
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

Add a **new batch** to an existing medicine in the pharmacy's catalog. Also increases `totalStock` atomically via a GRN transaction.

**Access:** 🟡 `pharmacy_manager` | 🔴 `admin`  
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

A strict, tenant-scoped, **immutable** stock movement ledger. Every stock change (outside of order fulfillment) is recorded here. Once created, transaction records cannot be modified or deleted — schema-level Mongoose pre-hooks enforce immutability.

### `GET /api/inventory-transactions`

List all GRN/GIN transactions for the authenticated pharmacy tenant.

**Access:** 🟡 `pharmacy_manager` | 🔴 `admin`  
**FR:** FR-2.7

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `medicineId` | ObjectId | Filter by medicine. |
| `type` | String | `GRN` or `GIN`. |
| `createdBy` | ObjectId | Filter by the pharmacy user who recorded it. |
| `startDate` | Date | Filter from this date (ISO 8601). |
| `endDate` | Date | Filter to this date. |
| `page` / `limit` | Integer | Pagination. |

> **Tenant Scoping:** Results are automatically filtered by `pharmacyId` from the JWT. A pharmacy manager only sees their own transactions.

#### Response `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "_id": "64c3b4d5e6f7a8b9c0d3e4f5",
      "pharmacyId": "64a1f2b3c4d5e6f7a8b9c0d1",
      "transactionType": "GRN",
      "medicineId": { "_id": "...", "name": "Amoxicillin 250mg", "sku": "AMX250" },
      "batchNumber": "BATCH-AMX-2026-01",
      "quantityChanged": 200,
      "stockBefore": 480,
      "stockAfter": 680,
      "reason": "Received from supplier.",
      "referenceNumber": "PO-2026-0041",
      "createdBy": { "_id": "...", "name": "Dr. Abebe Pharmacy" },
      "createdAt": "2026-03-31T09:00:00Z"
    }
  ],
  "pagination": { "total": 34, "page": 1, "limit": 20, "totalPages": 2 }
}
```

---

### `POST /api/inventory-transactions`

Record a GRN (stock in) or GIN (stock out / write-off) within the pharmacy tenant's boundary. Updates `medicines.totalStock` atomically. Creates an **immutable** transaction record with `stockBefore` and `stockAfter` values.

**Access:** 🟡 `pharmacy_manager` | 🔴 `admin`  
**FR:** FR-2.7, NFR-4.4  
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
| `medicineId` | ObjectId | ✅ | Must reference a medicine owned by the authenticated pharmacy |
| `batchNumber` | String | ✅ | Must exist on the medicine's batches |
| `quantityChanged` | Number | ✅ | Positive for GRN, negative for GIN |
| `reason` | String | Required for GIN | Mandatory justification for removals |
| `referenceNumber` | String | ❌ | External document reference |

> **Tenant Scoping:** The `pharmacyId` is injected from JWT. The API validates that the referenced `medicineId` belongs to the authenticated tenant.

#### Response `201 Created`

```json
{
  "success": true,
  "message": "Inventory transaction recorded.",
  "data": {
    "transaction": { /* full immutable transaction document */ },
    "updatedStock": 450
  }
}
```

#### Error Responses

| Status | Code | Reason |
|--------|------|--------|
| `400` | `INSUFFICIENT_STOCK` | GIN would bring stock below zero. |
| `404` | `BATCH_NOT_FOUND` | Batch number not found on the medicine. |
| `404` | `MEDICINE_NOT_FOUND` | Medicine not found within the tenant's catalog. |

---

## 6. Orders

Orders are **cross-tenant entities** — they bridge a Public User (consumer) and a Pharmacy (tenant). The `customerId` identifies who placed the order; the `pharmacyId` identifies which pharmacy fulfills it.

### `GET /api/orders`

List orders. Public Users see only their own placed orders. Pharmacy Managers see only incoming orders for their pharmacy. Admins see all.

**Access:** 🟢 `public_user` | 🟡 `pharmacy_manager` | 🔴 `admin`  
**FR:** FR-3.5

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | String | Filter by order status (e.g., `pending`, `approved`). |
| `paymentStatus` | String | Filter by `unpaid`, `partially_paid`, `paid`. |
| `pharmacyId` | ObjectId | Admin only — filter by pharmacy tenant. |
| `startDate` | Date | Created from date. |
| `endDate` | Date | Created to date. |
| `page` / `limit` | Integer | Pagination. |

> **Scoping Rules:**
> - `public_user` → sees only orders where `customerId` matches their own userId.
> - `pharmacy_manager` → sees only orders where `pharmacyId` matches their JWT `pharmacyId`.
> - `admin` → sees all orders across all tenants.

#### Response `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "_id": "64d4c5e6f7a8b9c0d4e5f601",
      "customerId": { "_id": "...", "name": "Kebede Alemu" },
      "pharmacyId": { "_id": "...", "name": "Dr. Abebe Pharmacy" },
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
      "fulfillmentMethod": "pickup",
      "paymentStatus": "unpaid",
      "createdAt": "2026-03-31T10:00:00Z"
    }
  ],
  "pagination": { "total": 58, "page": 1, "limit": 20, "totalPages": 3 }
}
```

---

### `POST /api/orders`

Submit a new purchase order targeting a specific pharmacy. The API stamps the order with the consumer's `customerId` (from JWT) and the target `pharmacyId` (from request body). Stock availability at the target pharmacy is validated before creating the order.

**Access:** 🟢 `public_user`  
**FR:** FR-3.1, FR-3.2

#### Request Body

```json
{
  "pharmacyId": "64a1f2b3c4d5e6f7a8b9c0d1",
  "items": [
    { "medicineId": "64b2a3c4d5e6f7a8b9c0d2e3", "quantity": 50 },
    { "medicineId": "64b2a3c4d5e6f7a8b9c0d2e9", "quantity": 20 }
  ],
  "fulfillmentMethod": "pickup"
}
```

For delivery orders:

```json
{
  "pharmacyId": "64a1f2b3c4d5e6f7a8b9c0d1",
  "items": [
    { "medicineId": "64b2a3c4d5e6f7a8b9c0d2e3", "quantity": 50 }
  ],
  "fulfillmentMethod": "delivery",
  "deliveryAddress": "Kebele 14, Bole Sub-city, Addis Ababa"
}
```

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `pharmacyId` | ObjectId | ✅ | Must reference an active pharmacy tenant |
| `items` | Array | ✅ | At least 1 item |
| `items[].medicineId` | ObjectId | ✅ | Must be an active, non-deleted medicine **at the target pharmacy** |
| `items[].quantity` | Number | ✅ | `>= 1`; must not exceed `totalStock` at the target pharmacy |
| `fulfillmentMethod` | String | ❌ | `pickup` (default) or `delivery`. Determines how the patient receives the order. |
| `deliveryAddress` | String | Required when `fulfillmentMethod = 'delivery'` | Patient's delivery destination. Falls back to the patient's registered `address` if omitted. |

> **Cross-Tenant Logic:** The `customerId` is set automatically from the authenticated Public User's JWT. The `pharmacyId` must be provided in the request body — this is the **only** case where a `pharmacyId` is accepted from the client, because the consumer is specifying which pharmacy they want to order from (discovered via the marketplace search).

> **Stock Pre-flight:** The backend checks `totalStock >= requestedQty` for **all** items at the target pharmacy within a MongoDB transaction. If any item fails, the entire order is rejected with a `400` listing which medicines are under-stocked.

#### Response `201 Created`

```json
{
  "success": true,
  "message": "Order placed successfully.",
  "data": {
    "_id": "64d4c5e6f7a8b9c0d4e5f601",
    "customerId": "u5",
    "pharmacyId": "64a1f2b3c4d5e6f7a8b9c0d1",
    "status": "pending",
    "fulfillmentMethod": "pickup",
    "totalAmount": 637.50,
    "items": [ /* line items with snapshot prices from the pharmacy's catalog */ ],
    "createdAt": "2026-03-31T10:00:00Z"
  }
}
```

#### Error Responses

| Status | Code | Reason |
|--------|------|--------|
| `400` | `INSUFFICIENT_STOCK` | One or more items exceed available stock at the target pharmacy. |
| `400` | `VALIDATION_ERROR` | Missing fields or invalid medicine IDs. |
| `404` | `PHARMACY_NOT_FOUND` | Target pharmacy does not exist or is inactive. |

---

### `GET /api/orders/:id`

Retrieve a single order with full details including status history. Public Users can only access their own orders. Pharmacy Managers can only access orders within their `pharmacyId`.

**Access:** 🟢 `public_user` (own orders only) | 🟡 `pharmacy_manager` (own pharmacy's orders) | 🔴 `admin`  
**FR:** FR-3.5

#### Response `200 OK`

```json
{
  "success": true,
  "data": {
    "_id": "64d4c5e6f7a8b9c0d4e5f601",
    "customerId": { "_id": "...", "name": "Kebede Alemu" },
    "pharmacyId": { "_id": "...", "name": "Dr. Abebe Pharmacy" },
    "items": [ /* ... */ ],
    "totalAmount": 637.50,
    "status": "approved",
    "paymentStatus": "unpaid",
    "approvedBy": { "_id": "...", "name": "Dr. Abebe Pharmacy" },
    "approvedAt": "2026-03-31T11:30:00Z",
    "statusHistory": [
      { "status": "pending",  "changedBy": "...", "changedAt": "2026-03-31T10:00:00Z", "note": null },
      { "status": "approved", "changedBy": "...", "changedAt": "2026-03-31T11:30:00Z", "note": null }
    ],
    "createdAt": "2026-03-31T10:00:00Z"
  }
}
```

---

### `PATCH /api/orders/:id/status`

Update the status of an order. This is the primary workflow action endpoint for Pharmacy Managers to process incoming consumer orders. Only the owning pharmacy tenant can update their orders.

**Access:** 🟡 `pharmacy_manager` | 🔴 `admin`  
**FR:** FR-3.3, FR-3.4  
**NFR:** NFR-2.5 (Atomic transactions on approval)

#### Allowed Status Transitions

| From | To | Actor | Side Effects |
|------|----|-------|-------------|
| `pending` | `approved` | Pharmacy Manager | **Atomically decrements** `medicines.totalStock` for all items within a MongoDB transaction. Creates immutable `inventoryTransaction` records. |
| `pending` | `rejected` | Pharmacy Manager | Requires `rejectionReason` in body. No stock change. |
| `approved` | `processing` | Pharmacy Manager | No stock change. |
| `processing` | `ready` | Pharmacy Manager | No stock change. For `pickup` orders: "ready for collection at the pharmacy." For `delivery` orders: "packed and awaiting dispatch." |
| `ready` | `delivered` | Pharmacy Manager | No stock change. For `pickup`: patient collected the order. For `delivery`: order handed off at patient's address. |

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

> **Tenant Scoping:** The API verifies that `order.pharmacyId` matches the authenticated manager's `pharmacyId`. A Pharmacy Manager at Pharmacy A cannot process orders belonging to Pharmacy B.

#### Response `200 OK`

```json
{
  "success": true,
  "message": "Order status updated to 'approved'.",
  "data": {
    "_id": "64d4c5e6f7a8b9c0d4e5f601",
    "status": "approved",
    "approvedBy": "64a1f2b3c4d5e6f7a8b9c0d1",
    "approvedAt": "2026-03-31T11:30:00Z",
    "statusHistory": [ /* updated */ ]
  }
}
```

#### Error Responses

| Status | Code | Reason |
|--------|------|--------|
| `400` | `INVALID_TRANSITION` | Requested status change is not a valid lifecycle step. |
| `400` | `REJECTION_REASON_REQUIRED` | `rejectionReason` missing when rejecting. |
| `403` | `TENANT_MISMATCH` | Pharmacy Manager does not own this order. |
| `409` | `INSUFFICIENT_STOCK` | Stock levels changed since order was placed; approval blocked. |

---

## 7. Payments

### `GET /api/payments`

List payment records. Public Users see only payments linked to their own orders. Pharmacy Managers see only payments within their tenant boundary.

**Access:** 🟢 `public_user` | 🟡 `pharmacy_manager` | 🔴 `admin`  
**FR:** FR-4.3

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `orderId` | ObjectId | Filter by order. |
| `pharmacyId` | ObjectId | Filter by pharmacy (admin only). |
| `paymentMethod` | String | `bank_transfer`, `cash`, `mobile_money`. |
| `startDate` | Date | Filter from timestamp. |
| `endDate` | Date | Filter to timestamp. |

> **Scoping Rules:**
> - `public_user` → sees only payments where `customerId` matches their userId.
> - `pharmacy_manager` → sees only payments where `pharmacyId` matches their JWT `pharmacyId`.
> - `admin` → sees all payments across all tenants.

#### Response `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "_id": "64e5d6f7a8b9c0d5e6f7a801",
      "orderId": "64d4c5e6f7a8b9c0d4e5f601",
      "pharmacyId": { "_id": "...", "name": "Dr. Abebe Pharmacy" },
      "customerId": { "_id": "...", "name": "Kebede Alemu" },
      "amount": 300.00,
      "paymentMethod": "bank_transfer",
      "transactionId": "TXN-ETB-20260331-001",
      "status": "completed",
      "recordedBy": { "_id": "...", "name": "Dr. Abebe Pharmacy" },
      "createdAt": "2026-03-31T13:00:00Z"
    }
  ],
  "pagination": { "total": 22, "page": 1, "limit": 20, "totalPages": 2 }
}
```

---

### `POST /api/payments`

Record a payment transaction against an order within the pharmacy tenant's boundary. After saving, the system recalculates `orders.paymentStatus`.

**Access:** 🟡 `pharmacy_manager` | 🔴 `admin`  
**FR:** FR-4.1, FR-4.2, FR-4.4

#### Request Body

```json
{
  "orderId": "64d4c5e6f7a8b9c0d4e5f601",
  "amount": 300.00,
  "paymentMethod": "bank_transfer",
  "transactionId": "TXN-ETB-20260331-001",
  "note": "Partial payment. Balance due by end of month."
}
```

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `orderId` | ObjectId | ✅ | Must reference a non-rejected order within the manager's pharmacy |
| `amount` | Number | ✅ | `> 0`; cannot exceed remaining balance |
| `paymentMethod` | String | ✅ | `bank_transfer` / `cash` / `mobile_money` |
| `transactionId` | String | ❌ | Required for bank transfers |
| `note` | String | ❌ | Free-text note |

> **Tenant Scoping:** The `pharmacyId` and `customerId` are automatically derived from the order record. The API verifies that `order.pharmacyId` matches the authenticated manager's `pharmacyId`.

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
| `403` | `TENANT_MISMATCH` | Order does not belong to the authenticated pharmacy. |
| `404` | `ORDER_NOT_FOUND` | Referenced order does not exist. |
| `409` | `ORDER_ALREADY_PAID` | Order `paymentStatus` is already `paid`. |

---

### `GET /api/payments/:id`

Retrieve a single payment record. Access is scoped by role (Pharmacy Managers can only view their own tenant's payments).

**Access:** 🟡 `pharmacy_manager` | 🔴 `admin`

#### Response `200 OK`

Returns the full payment document populated with `orderId`, `customerId`, and `recordedBy` references.

---

## 8. Reports & Analytics

Report endpoints are read-only and never modify data. Pharmacy Managers see tenant-scoped metrics; Admins see platform-wide analytics.

### `GET /api/reports/inventory`

Generate an inventory report including batch details and stock valuations, **scoped to the authenticated pharmacy tenant**.

**Access:** 🟡 `pharmacy_manager` | 🔴 `admin`  
**FR:** FR-2.5, FR-5.1

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
    "pharmacyId": "64a1f2b3c4d5e6f7a8b9c0d1",
    "pharmacyName": "Dr. Abebe Pharmacy",
    "generatedAt": "2026-03-31T15:00:00Z",
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

Generate daily or monthly sales statistics, **scoped to the authenticated pharmacy tenant**.

**Access:** 🟡 `pharmacy_manager` | 🔴 `admin`  
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
    "pharmacyId": "64a1f2b3c4d5e6f7a8b9c0d1",
    "startDate": "2026-03-01T00:00:00Z",
    "endDate": "2026-03-31T23:59:59Z",
    "totalRevenue": 128450.25,
    "totalOrders": 62,
    "deliveredOrders": 54,
    "topMedicines": [
      { "name": "Amoxicillin 250mg", "sku": "AMX250", "qtySold": 1200, "revenue": 15300.00 }
    ],
    "timeline": [
      { "date": "2026-03-01", "orderCount": 4, "revenue": 5100.00 }
    ]
  }
}
```

---

### `GET /api/reports/expiring`

List all stock batches expiring on or before a given date, **scoped to the authenticated pharmacy tenant**.

**Access:** 🟡 `pharmacy_manager` | 🔴 `admin`  
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
    "pharmacyId": "64a1f2b3c4d5e6f7a8b9c0d1",
    "generatedAt": "2026-03-31T15:00:00Z",
    "cutoffDate": "2026-06-30T00:00:00Z",
    "items": [
      {
        "medicineId": "64b2a3c4d5e6f7a8b9c0d2e3",
        "medicineName": "Paracetamol 500mg",
        "sku": "PCM500",
        "batchNumber": "BATCH-PCM-2024-03",
        "quantity": 120,
        "expiryDate": "2026-04-15T00:00:00Z",
        "shelfLocation": "Aisle-A, Shelf-1",
        "daysUntilExpiry": 15
      }
    ]
  }
}
```

---

### `GET /api/reports/platform`

Platform-wide analytics for System Administrators. Aggregates metrics across all pharmacy tenants.

**Access:** 🔴 `admin`  
**FR:** FR-5.5

#### Response `200 OK`

```json
{
  "success": true,
  "data": {
    "generatedAt": "2026-03-31T15:00:00Z",
    "activeTenants": 42,
    "totalMedicines": 3650,
    "totalOrders": 8920,
    "totalGMV": 1245000.00,
    "ordersByStatus": {
      "pending": 120,
      "approved": 85,
      "processing": 40,
      "ready": 22,
      "delivered": 8500,
      "rejected": 153
    }
  }
}
```

---

## 9. Audit Logs

### `GET /api/logs`

Retrieve the immutable audit log. **Read-only — no create, update, or delete endpoints exist for this collection.** Admins see cross-tenant logs; Pharmacy Managers see only logs related to their `pharmacyId`.

**Access:** 🟡 `pharmacy_manager` | 🔴 `admin`  
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

> **Scoping Rules:**
> - `pharmacy_manager` → sees only audit logs where the affected resource belongs to their `pharmacyId`.
> - `admin` → sees all audit logs across all tenants for compliance investigations.

#### Response `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "_id": "64f6e7f8a9b0c1d6e7f8a902",
      "userId": { "_id": "...", "name": "Dr. Abebe Pharmacy", "role": "pharmacy_manager" },
      "actionType": "APPROVE",
      "resource": "Order",
      "resourceId": "64d4c5e6f7a8b9c0d4e5f601",
      "before": { "status": "pending" },
      "after":  { "status": "approved", "approvedBy": "...", "approvedAt": "..." },
      "ipAddress": "196.188.45.10",
      "userAgent": "Mozilla/5.0 ...",
      "timestamp": "2026-03-31T11:30:00Z"
    }
  ],
  "pagination": { "total": 1204, "page": 1, "limit": 20, "totalPages": 61 }
}
```

> **Immutability Note:** The API exposes no `POST`, `PATCH`, or `DELETE` endpoint for `/api/logs`. New entries are created automatically by the centralized `auditLogger.ts` utility on every data-modifying operation (NFR-4.1, 21 CFR Part 11). Mongoose schema pre-hooks block any attempt to modify or delete audit records at the database level.

---

## 10. Error Reference

All error responses follow a consistent envelope:

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Requested quantity for AMX250 exceeds available stock at this pharmacy (480 available, 600 requested).",
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
| `403 Forbidden` | Insufficient role or tenant mismatch | User role does not permit the action, or pharmacy manager attempting to access another tenant's data. |
| `404 Not Found` | Resource absent | ID does not exist, is soft-deleted, or does not belong to the authenticated tenant. |
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
| `INSUFFICIENT_STOCK` | `POST /orders`, `PATCH /orders/:id/status` | Not enough stock at the target pharmacy to fulfill. |
| `INVALID_TRANSITION` | `PATCH /orders/:id/status` | Status change is not a valid lifecycle step. |
| `REJECTION_REASON_REQUIRED` | `PATCH /orders/:id/status` | Must provide reason when rejecting. |
| `BATCH_NOT_FOUND` | `POST /inventory-transactions` | Batch number not found on medicine. |
| `MEDICINE_NOT_FOUND` | `POST /inventory-transactions` | Medicine not found within tenant's catalog. |
| `PHARMACY_NOT_FOUND` | `POST /orders` | Target pharmacy does not exist or is inactive. |
| `ORDER_NOT_FOUND` | `POST /payments` | Order ID does not exist. |
| `TENANT_MISMATCH` | Various | Resource does not belong to the authenticated pharmacy tenant. |
| `OVERPAYMENT` | `POST /payments` | Amount exceeds remaining order balance. |
| `ORDER_ALREADY_PAID` | `POST /payments` | Order is already fully paid. |

---

## 11. Requirement Traceability

| Endpoint | Method | FR / NFR |
|----------|--------|----------|
| `/api/auth/register` | POST | FR-1.1, FR-1.2 |
| `/api/auth/login` | POST | FR-1.3, FR-1.5, FR-1.6 |
| `/api/users` | GET / PATCH / DELETE | FR-1.4, NFR-4.2, NFR-4.3 |
| `/api/users/me` | GET | FR-1.4 |
| `/api/medicines` | GET | FR-2.5, FR-2.6, NFR-1.4, FR-1.6 |
| `/api/medicines/marketplace` | GET | FR-2.6, NFR-2.2 |
| `/api/medicines` | POST | FR-2.1, FR-2.2, FR-2.3, FR-1.6 |
| `/api/medicines/:id` | GET | FR-2.6, FR-1.6 |
| `/api/medicines/:id` | PATCH | FR-2.1, FR-1.6 |
| `/api/medicines/:id` | DELETE | NFR-4.2, FR-1.6 |
| `/api/medicines/:id/batches` | POST | FR-2.2, FR-2.7, FR-1.6 |
| `/api/inventory-transactions` | GET | FR-2.7, FR-1.6 |
| `/api/inventory-transactions` | POST | FR-2.7, FR-2.4, NFR-4.4, FR-1.6 |
| `/api/orders` | GET | FR-3.5 |
| `/api/orders` | POST | FR-3.1, FR-3.2 |
| `/api/orders/:id` | GET | FR-3.5 |
| `/api/orders/:id/status` | PATCH | FR-3.3, FR-3.4, NFR-2.5, NFR-4.3, FR-1.6 |
| `/api/payments` | GET | FR-4.3, FR-1.6 |
| `/api/payments` | POST | FR-4.1, FR-4.2, FR-4.4, FR-1.6 |
| `/api/payments/:id` | GET | FR-4.3, FR-1.6 |
| `/api/reports/inventory` | GET | FR-2.5, FR-5.1, FR-1.6 |
| `/api/reports/sales` | GET | FR-5.2, FR-1.6 |
| `/api/reports/expiring` | GET | FR-5.3, FR-1.6 |
| `/api/reports/platform` | GET | FR-5.5 |
| `/api/logs` | GET | FR-5.4, NFR-4.1 |

---

*End of API Documentation — Pharma-Net v2.0*
