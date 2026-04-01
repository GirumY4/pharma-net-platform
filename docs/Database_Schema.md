# Pharma-Net — Database Schema Reference

| Field        | Details                              |
|--------------|--------------------------------------|
| **Version**  | 2.0                                  |
| **Date**     | 2026-03-31                           |
| **Authors**  | Intern Development Team (Web & Backend) |
| **Database** | MongoDB (via Mongoose ODM v9+)       |

> **Alignment:** This schema is derived from the SRS (v2.0), SDS, and Project Context documents. It enforces multi-tenant data isolation via `pharmacyId` foreign keys, ALCOA+ and 21 CFR Part 11 data integrity principles, and schema-level immutability on compliance-critical collections.

---

## Table of Contents

1. [Overview & Design Principles](#1-overview--design-principles)
2. [Entity Relationship (ER) Summary](#2-entity-relationship-er-summary)
3. [Collection: `users`](#3-collection-users)
4. [Collection: `medicines`](#4-collection-medicines)
5. [Collection: `inventoryTransactions` (GRN/GIN)](#5-collection-inventorytransactions-grn--gin)
6. [Collection: `orders`](#6-collection-orders)
7. [Collection: `payments`](#7-collection-payments)
8. [Collection: `auditLogs`](#8-collection-auditlogs)
9. [Indexes](#9-indexes)
10. [Mongoose Schema Code Reference](#10-mongoose-schema-code-reference)

---

## 1. Overview & Design Principles

Pharma-Net is a B2B2C multi-tenant SaaS pharmaceutical logistics platform. All data is stored in a single **MongoDB** instance managed through the **Mongoose ODM**. The database follows a **Shared Database, Shared Schema** multi-tenancy model — tenant isolation is enforced at the application layer via `pharmacyId` foreign keys on all scoped collections, extracted from the authenticated user's JWT context. The schema is designed around these core principles:

| Principle | Implementation |
|-----------|---------------|
| **Multi-Tenant Isolation** | Scoped collections include a `pharmacyId` foreign key. The API automatically injects this value from the JWT — never from client input — ensuring Pharmacy A cannot access Pharmacy B's data. |
| **Attributable** | Every write operation references the `userId` of the actor. Audit logs additionally capture `ipAddress` and `userAgent` for forensic-level attribution. |
| **Contemporaneous** | All `createdAt` / `updatedAt` / `timestamp` fields are server-generated via Mongoose's `timestamps` option or explicit `Date.now()` — never supplied by the client. |
| **Immutable Audit Trail** | The `auditLogs` and `inventoryTransactions` collections are append-only. Mongoose schema-level pre-hooks actively block `update`, `delete`, `findOneAndUpdate`, and `replaceOne` operations. |
| **Soft Deletes** | Sensitive records (users, medicines, orders) are never hard-deleted. An `isDeleted: Boolean` flag and `deletedAt: Date` timestamp are set instead. All default queries filter `{ isDeleted: false }`. |
| **Atomic Operations** | Critical multi-document changes (order fulfillment + stock decrement + transaction ledger entry) use MongoDB sessions/transactions via the `$inc` operator to prevent race conditions. |
| **Referential Integrity** | Cross-collection links use `ObjectId` references with Mongoose `ref` for `.populate()` support. |

### Collections at a Glance

| # | Collection | Tenant-Scoped | Immutable | Purpose |
|---|-----------|:---:|:---:|---------|
| 1 | `users` | — | — | Stores all platform users (Admin, Pharmacy Manager, Public User). A pharmacy manager's `_id` serves as the `pharmacyId` for tenant-scoped collections. |
| 2 | `medicines` | 🔒 | — | Tenant-scoped medicine catalog with embedded batch/lot records. |
| 3 | `inventoryTransactions` | 🔒 | 🔐 | Immutable GRN/GIN stock movement ledger, scoped per pharmacy tenant. |
| 4 | `orders` | 🔒 | — | Cross-tenant consumer-to-pharmacy purchase orders with full status lifecycle. |
| 5 | `payments` | 🔒 | — | Tenant-scoped payment transactions recorded against fulfilled orders. |
| 6 | `auditLogs` | — | 🔐 | Immutable, append-only log of all data-modifying actions across the platform. |

> **Legend:** 🔒 = Tenant-scoped via `pharmacyId` FK. 🔐 = Schema-level immutable (update/delete blocked by Mongoose pre-hooks).

---

## 2. Entity Relationship (ER) Summary

```
users ──────────────────────────────────────────────────────────────────────────┐
  │ (pharmacyId)     │ (customerId)     │ (createdBy)     │ (recordedBy)     │ (userId)
  ▼                  ▼                  ▼                  ▼                  ▼
medicines          orders            inventoryTxns       payments          auditLogs
  │                  │ (pharmacyId)                        │ (pharmacyId)
  │                  │ (customerId)                        │ (orderId)
  ▼                  ▼                                     ▼
batches[]          items[]                              (cross-ref)
(embedded)         (embedded)
```

### Cardinality

| Relationship | Type | Description |
|---|---|---|
| `users` (pharmacy_manager) → `medicines` | 1 : N | One pharmacy tenant owns many medicine records (scoped by `pharmacyId`). |
| `users` (public_user) → `orders` | 1 : N | One public user can place many orders across different pharmacies. |
| `users` (pharmacy_manager) → `orders` | 1 : N | One pharmacy tenant receives many incoming consumer orders (scoped by `pharmacyId`). |
| `users` → `auditLogs` | 1 : N | One user generates many audit log entries. |
| `medicines` → `batches[]` | 1 : N | One medicine record contains many embedded batch sub-documents. |
| `orders` → `items[]` | 1 : N | One order contains many line items (embedded). |
| `orders` → `payments` | 1 : N | One order can have multiple partial payment records. |
| `medicines` → `inventoryTransactions` | 1 : N | One medicine has many GRN/GIN movement records. |
| `users` (pharmacy_manager) → `inventoryTransactions` | 1 : N | One pharmacy manager creates many stock adjustments (scoped by `pharmacyId`). |
| `users` (pharmacy_manager) → `payments` | 1 : N | One pharmacy manager records many payments (scoped by `pharmacyId`). |

---

## 3. Collection: `users`

Stores all authenticated platform users across all three tiers: System Administrators, Pharmacy Managers (SaaS tenants), and Public Users (Patients). Soft delete is used instead of hard removal to preserve audit history. For `pharmacy_manager` users, the user's `_id` doubles as the `pharmacyId` used to scope all downstream tenant collections.

> **B2C Contact & Location Fields:** The `phoneNumber`, `address`, `city`, and `location` fields enable the marketplace-to-pickup user journey. When a Public User discovers "Amoxicillin at Dr. Abebe Pharmacy" via the marketplace search, these fields tell them *where* the pharmacy is located and *how* to contact them. For `public_user` accounts, `phoneNumber` and `address` serve as patient contact information for delivery coordination.

### Fields

| Field | Mongoose Type | Constraints | Description |
|-------|--------------|-------------|-------------|
| `_id` | `ObjectId` | Auto-generated | Primary key. For `pharmacy_manager` users, this value is also used as the `pharmacyId` foreign key on tenant-scoped collections. |
| `name` | `String` | `required`, `trim` | Full display name of the user or pharmacy. |
| `email` | `String` | `required`, `unique`, `lowercase`, `trim` | Login identifier. Must be unique across all users. |
| `passwordHash` | `String` | `required` | bcrypt hash of the user's password. **Never stored in plaintext.** |
| `role` | `String` | `required`, `enum: ['admin', 'pharmacy_manager', 'public_user']` | Determines RBAC permissions and tenant scoping. `admin` has platform-wide access; `pharmacy_manager` manages a tenant-isolated pharmacy; `public_user` searches the global marketplace and places orders. |
| `phoneNumber` | `String` | `trim` | Contact phone number. Required for `pharmacy_manager` (so patients can call the pharmacy) and recommended for `public_user` (for delivery coordination). |
| `address` | `String` | `trim` | Human-readable street or area address (e.g., `"Bole, Addis Ababa"`, `"Kebele 04, Bahir Dar"`). Required for `pharmacy_manager` (displayed in marketplace results so patients know where to go); recommended for `public_user` (used as default delivery address). |
| `city` | `String` | `trim`, `index` | City name (e.g., `"Addis Ababa"`, `"Bahir Dar"`, `"Hawassa"`). Enables city-based marketplace filtering. Required for `pharmacy_manager`; recommended for `public_user`. |
| `location` | `Object` | `{ lat: Number, lng: Number }` | GPS coordinates for map-based discovery. Optional — used for Google Maps integration on the mobile app. When present, enables proximity-based search ("pharmacies near me"). |
| `isActive` | `Boolean` | `default: true` | `false` if the account is suspended/deactivated by an admin. Suspended users cannot log in. |
| `isDeleted` | `Boolean` | `default: false` | Soft-delete flag. `true` when the admin "deletes" an account. Excluded from default queries. |
| `deletedAt` | `Date` | `default: null` | Server timestamp of when the soft delete was performed. |
| `createdAt` | `Date` | Auto (Mongoose `timestamps`) | Server-generated record creation time. |
| `updatedAt` | `Date` | Auto (Mongoose `timestamps`) | Server-generated time of the last update. |

### Indexes

| Field(s) | Type | Reason |
|---------|------|--------|
| `email` | Unique | Enforced uniqueness + fast login lookups. NFR-1.4 / FR-1.1 |
| `role` | Standard | Efficient RBAC filtering. |
| `city` | Standard | City-based marketplace filtering (e.g., "Show pharmacies in Bahir Dar"). |
| `isDeleted` | Standard | Fast exclusion of soft-deleted records in all default queries. |

### Mongoose Schema (Pseudocode)

```js
const locationSchema = new Schema({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
}, { _id: false });

const userSchema = new Schema({
  name:         { type: String, required: true, trim: true },
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role:         { type: String, required: true, enum: ['admin', 'pharmacy_manager', 'public_user'] },
  phoneNumber:  { type: String, trim: true },
  address:      { type: String, trim: true },
  city:         { type: String, trim: true, index: true },
  location:     { type: locationSchema, default: null },
  isActive:     { type: Boolean, default: true },
  isDeleted:    { type: Boolean, default: false },
  deletedAt:    { type: Date, default: null },
}, { timestamps: true });
```

> **Note:** Password hashing is handled explicitly in the controller/service layer (not via a Mongoose `pre('save')` hook) to avoid issues with Mongoose update operations. The password is hashed with bcrypt before being stored as `passwordHash`, satisfying FR-1.2.

---

## 4. Collection: `medicines` 🔒

Tenant-scoped medicine catalog for each pharmacy. Each Pharmacy Manager manages their own local medicine records, automatically stamped with their `pharmacyId`. Uses embedded subdocuments for batch records, keeping related data co-located for fast reads. Public Users can discover medicines across all tenants via the global marketplace search API, but sensitive tenant data (supplier names, shelf locations, batch-level details) is excluded from public responses.

### Parent Document Fields

| Field | Mongoose Type | Constraints | Description |
|-------|--------------|-------------|-------------|
| `_id` | `ObjectId` | Auto-generated | Primary key. |
| `pharmacyId` | `ObjectId` | `ref: 'User'`, `required`, **FK** | The owning pharmacy tenant. Auto-injected from JWT — never from client request body. This is the primary tenant isolation key. |
| `name` | `String` | `required`, `trim`, `index` | Commercial or generic medicine name. |
| `sku` | `String` | `required`, `unique`, `uppercase`, `trim` | Stock-Keeping Unit. Unique business identifier for each medicine. |
| `genericName` | `String` | `trim` | Generic/INN name of the drug (optional but recommended). |
| `category` | `String` | `required`, `trim`, `index` | Drug category (e.g., `Antibiotic`, `Analgesic`, `Antihypertensive`). |
| `description` | `String` | `trim` | Short clinical or dispensing notes. |
| `unitPrice` | `Number` | `required`, `min: 0` | Current selling price per unit, set by the pharmacy. |
| `unitOfMeasure` | `String` | `required`, `enum: ['tablet', 'capsule', 'vial', 'bottle', 'sachet', 'unit']` | Base dispensing unit. |
| `totalStock` | `Number` | `required`, `default: 0`, `min: 0` | Denormalized total stock count across all batches. Updated atomically on GRN/GIN/order events. |
| `reorderThreshold` | `Number` | `required`, `min: 0`, `default: 50` | Minimum stock level below which a low-stock dashboard alert is triggered (FR-2.5). |
| `batches` | `[BatchSchema]` | (see below) | Embedded array of batch/lot records for this medicine. |
| `isDeleted` | `Boolean` | `default: false`, `index` | Soft-delete flag. Satisfies NFR-4.2 and ALCOA+ retention requirements. |
| `deletedAt` | `Date` | `default: null` | Timestamp of soft deletion. |
| `createdBy` | `ObjectId` | `ref: 'User'`, `required` | The pharmacy manager who created this medicine record. |
| `createdAt` | `Date` | Auto (Mongoose `timestamps`) | Server-generated creation timestamp. |
| `updatedAt` | `Date` | Auto (Mongoose `timestamps`) | Server-generated last-update timestamp. |

### Embedded Subdocument: `batches[]`

Each element in the `batches` array represents a distinct lot/shipment of the medicine, enabling full batch and expiry tracking (FR-2.2, FR-2.3).

| Field | Mongoose Type | Constraints | Description |
|-------|--------------|-------------|-------------|
| `_id` | `ObjectId` | Auto-generated | Subdocument ID. |
| `batchNumber` | `String` | `required`, `trim` | Manufacturer lot/batch number. Must be recorded per EFDA traceability standards. |
| `gtin` | `String` | `trim` | GS1 Global Trade Item Number for unit-level barcode traceability (EFDA Traceability Directive). |
| `quantity` | `Number` | `required`, `min: 0` | Quantity in stock from this specific batch. |
| `expiryDate` | `Date` | `required` | Expiration date. The system flags batches where `expiryDate <= now + 90 days` as "Near Expiry" (FR-2.3). |
| `manufactureDate` | `Date` | — | Optional manufacture date of this batch. |
| `supplierName` | `String` | `trim` | Name of the supplier for this shipment. **Excluded from public marketplace responses.** |
| `shelfLocation` | `String` | `trim` | Physical pharmacy shelf or bin location (e.g., `Aisle-B, Shelf-3`). **Excluded from public marketplace responses.** |
| `receivedAt` | `Date` | `default: Date.now` | Server timestamp when this batch was added. |

### Virtual Properties (Application Layer)

| Virtual | Type | Trigger |
|---------|------|---------|
| `isLowStock` | `Boolean` | Returns `true` when `totalStock < reorderThreshold`. Implemented as a Mongoose virtual `.get()` function. |

### Computed / Alert Logic

| Condition | Alert Type | Trigger |
|-----------|-----------|---------|
| `totalStock < reorderThreshold` | 🔴 Low Stock Alert | Checked after every order fulfillment or GIN adjustment. |
| `batches[i].expiryDate <= now + 90 days` | 🟡 Near Expiry Warning | Evaluated on tenant dashboard load and report generation (FR-2.3, FR-5.3). |

### Mongoose Schema (Pseudocode)

```js
const batchSchema = new Schema({
  batchNumber:     { type: String, required: true, trim: true },
  gtin:            { type: String, trim: true },
  quantity:        { type: Number, required: true, min: 0 },
  expiryDate:      { type: Date, required: true },
  manufactureDate: { type: Date },
  supplierName:    { type: String, trim: true },
  shelfLocation:   { type: String, trim: true },
  receivedAt:      { type: Date, default: Date.now },
});

const medicineSchema = new Schema({
  pharmacyId:       { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name:             { type: String, required: true, trim: true, index: true },
  sku:              { type: String, required: true, unique: true, uppercase: true, trim: true },
  genericName:      { type: String, trim: true },
  category:         { type: String, required: true, trim: true, index: true },
  description:      { type: String, trim: true },
  unitPrice:        { type: Number, required: true, min: 0 },
  unitOfMeasure:    { type: String, required: true, enum: ['tablet','capsule','vial','bottle','sachet','unit'] },
  totalStock:       { type: Number, required: true, default: 0, min: 0 },
  reorderThreshold: { type: Number, required: true, default: 50, min: 0 },
  batches:          [batchSchema],
  isDeleted:        { type: Boolean, default: false, index: true },
  deletedAt:        { type: Date, default: null },
  createdBy:        { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

// Virtual: low-stock detection (used in frontend dashboards)
medicineSchema.virtual('isLowStock').get(function () {
  return this.totalStock < this.reorderThreshold;
});
```

---

## 5. Collection: `inventoryTransactions` (GRN / GIN) 🔒 🔐

A persistent, immutable ledger of every stock movement — both increases (GRN — Goods Received Notes) and decreases (GIN — Goods Issued Notes) — scoped to the pharmacy tenant. This satisfies FR-2.7 and provides a fully traceable stock audit trail independent of orders.

> **Why a separate collection?** The SRS (FR-2.7) and SDS require that stock adjustments (not related to orders) are formally recorded. Separating GRN/GIN from the `medicines` document (rather than embedding) keeps the medicine document lean and provides a clean, queryable ledger for reporting and auditing.

> **Immutability:** This collection uses Mongoose schema-level pre-hooks to block all `update`, `delete`, `findOneAndUpdate`, and `replaceOne` operations. Once a transaction record is created, it can never be modified or removed. This ensures the stock movement ledger is tamper-proof.

### Fields

| Field | Mongoose Type | Constraints | Description |
|-------|--------------|-------------|-------------|
| `_id` | `ObjectId` | Auto-generated | Primary key. |
| `pharmacyId` | `ObjectId` | `ref: 'User'`, `required`, **FK** | The owning pharmacy tenant. Auto-injected from JWT for tenant isolation. |
| `transactionType` | `String` | `required`, `enum: ['GRN', 'GIN']` | GRN = stock received (positive adjustment). GIN = stock issued/written off (negative adjustment). |
| `medicineId` | `ObjectId` | `ref: 'Medicine'`, `required`, `index` | The medicine whose stock is being adjusted. |
| `batchNumber` | `String` | `required` | The specific batch being adjusted. |
| `quantityChanged` | `Number` | `required` | **Signed value:** positive for GRN, negative for GIN. Used in `Snew = Sold + quantityChanged` formula (SDS §Technical Logic). |
| `stockBefore` | `Number` | `required` | `totalStock` of the medicine **before** this transaction (for audit reconciliation). |
| `stockAfter` | `Number` | `required` | `totalStock` of the medicine **after** this transaction. |
| `reason` | `String` | `trim` | Free-text reason for the adjustment (e.g., "Received from supplier", "Expired goods write-off"). |
| `referenceNumber` | `String` | `trim` | External document reference (e.g., purchase order number, waybill, or write-off form number). |
| `expiryDate` | `Date` | — | Expiry date of the batch (mirrored from batch record for quick reporting). |
| `createdBy` | `ObjectId` | `ref: 'User'`, `required`, `index` | Pharmacy manager who recorded this transaction (ALCOA+ Attributable). |
| `createdAt` | `Date` | Auto (Mongoose `timestamps`) | Server-generated timestamp — NOT client-provided (ALCOA+ Contemporaneous). |

### Immutability Enforcement

```js
const immutableError = new Error('Inventory transactions are immutable – updates and deletes are forbidden');

schema.pre(/^findOneAnd/, { document: true, query: true }, (next) => next(immutableError));
schema.pre(/^delete/,     { document: true, query: true }, (next) => next(immutableError));
schema.pre('updateOne',   { document: true, query: true }, (next) => next(immutableError));
schema.pre(/^replaceOn/,  { document: true, query: true }, (next) => next(immutableError));
```

### Indexes

| Field(s) | Type | Reason |
|---------|------|--------|
| `pharmacyId` | Standard | Tenant-scoped queries. |
| `medicineId` | Standard | Fast lookup of all movements for a specific medicine. |
| `createdAt` | Standard | Efficient date-range queries for reporting. |
| `transactionType` | Standard | Filter GRN vs GIN reports. |
| `createdBy` | Standard | Attribution queries. |

### Mongoose Schema (Pseudocode)

```js
const inventoryTransactionSchema = new Schema({
  pharmacyId:       { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  transactionType:  { type: String, required: true, enum: ['GRN', 'GIN'] },
  medicineId:       { type: Schema.Types.ObjectId, ref: 'Medicine', required: true, index: true },
  batchNumber:      { type: String, required: true },
  quantityChanged:  { type: Number, required: true },
  stockBefore:      { type: Number, required: true },
  stockAfter:       { type: Number, required: true },
  reason:           { type: String, trim: true },
  referenceNumber:  { type: String, trim: true },
  expiryDate:       { type: Date },
  createdBy:        { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
}, { timestamps: true });

// Immutability enforcement (pre-hooks block all update/delete operations)
```

---

## 6. Collection: `orders` 🔒

Represents a purchase order submitted by a **Public User (Patient)** via the mobile API, targeting a specific **Pharmacy tenant**. This is a cross-tenant entity — it bridges the consumer (`customerId`) and the pharmacy (`pharmacyId`). The Pharmacy Manager reviews and fulfills orders exclusively within their `pharmacyId` boundary. Tracks the full status lifecycle from placement to delivery/rejection.

> **Fulfillment Model:** Each order specifies how the patient receives their medicines via `fulfillmentMethod`. `pickup` means the patient walks into the pharmacy (default); `delivery` means the pharmacy dispatches the order to the patient's `deliveryAddress`. This distinction drives downstream UX (e.g., "Your order is ready for pickup" vs. "Your order is out for delivery").

### Fields

| Field | Mongoose Type | Constraints | Description |
|-------|--------------|-------------|-------------|
| `_id` | `ObjectId` | Auto-generated | Primary key. |
| `customerId` | `ObjectId` | `ref: 'User'`, `required` | The Public User (Patient) who placed the order. |
| `pharmacyId` | `ObjectId` | `ref: 'User'`, `required`, **FK** | The pharmacy tenant who fulfills the order. Stamped at order placement time based on the consumer's pharmacy selection. |
| `items` | `[OrderItemSchema]` | `required`, non-empty | Array of line items. See embedded schema below. |
| `totalAmount` | `Number` | `required`, `min: 0` | Pre-calculated order total (sum of `items[i].quantity * items[i].unitPrice`). |
| `status` | `String` | `required`, `enum: ['pending', 'approved', 'processing', 'ready', 'delivered', 'rejected']`, `default: 'pending'` | Current order status. Lifecycle: `pending → approved → processing → ready → delivered` or `pending → rejected`. |
| `fulfillmentMethod` | `String` | `required`, `enum: ['pickup', 'delivery']`, `default: 'pickup'` | How the patient receives the order. `pickup` = patient walks into the pharmacy; `delivery` = pharmacy dispatches to the patient's address. Set at order placement time by the consumer. |
| `deliveryAddress` | `String` | `trim`, conditional: required when `fulfillmentMethod = 'delivery'` | The patient's delivery destination. Only required and meaningful when `fulfillmentMethod` is `delivery`. Falls back to the patient's `users.address` if not explicitly provided. |
| `statusHistory` | `[StatusEventSchema]` | — | Append-only log of every status transition. Satisfies FR-3.4 (Order Status Tracking). |
| `paymentStatus` | `String` | `required`, `enum: ['unpaid', 'partially_paid', 'paid']`, `default: 'unpaid'` | Aggregate payment state for the order. Updated whenever a new payment is recorded. |
| `approvedBy` | `ObjectId` | `ref: 'User'`, `default: null` | Pharmacy Manager who approved the order. Populated during `pending → approved` transition. |
| `approvedAt` | `Date` | `default: null` | Server timestamp of the approval event (ALCOA+ Contemporaneous + NFR-4.3). |
| `rejectedBy` | `ObjectId` | `ref: 'User'`, `default: null` | Pharmacy Manager who rejected the order. |
| `rejectedAt` | `Date` | `default: null` | Server timestamp of the rejection. |
| `rejectionReason` | `String` | `trim` | Required narrative when an order is rejected (FR-3.3). |
| `notes` | `String` | `trim` | Optional internal notes from the pharmacy on this order. |
| `isDeleted` | `Boolean` | `default: false` | Soft-delete flag for historic preservation (NFR-4.2). |
| `deletedAt` | `Date` | `default: null` | Timestamp of soft deletion. |
| `createdAt` | `Date` | Auto (Mongoose `timestamps`) | Order placement time — server-generated. |
| `updatedAt` | `Date` | Auto (Mongoose `timestamps`) | Last update timestamp. |

### Embedded Subdocument: `items[]`

| Field | Mongoose Type | Constraints | Description |
|-------|--------------|-------------|-------------|
| `_id` | `ObjectId` | Auto-generated | Subdocument ID. |
| `medicineId` | `ObjectId` | `ref: 'Medicine'`, `required` | The medicine being ordered. |
| `medicineName` | `String` | `required` | Denormalized medicine name — preserved even if the medicine record is soft-deleted. |
| `sku` | `String` | `required` | Denormalized SKU for historic reporting accuracy. |
| `quantity` | `Number` | `required`, `min: 1` | Quantity requested by the consumer. |
| `unitPrice` | `Number` | `required`, `min: 0` | Snapshot of the unit price at the time of order (price lock from the pharmacy's catalog). |
| `lineTotal` | `Number` | `required` | `quantity × unitPrice`, pre-calculated for fast subtotal reads. |

### Embedded Subdocument: `statusHistory[]`

Each element records a discrete status transition, forming an immutable chain-of-custody log.

| Field | Mongoose Type | Constraints | Description |
|-------|--------------|-------------|-------------|
| `status` | `String` | `required`, `enum: ['pending','approved','processing','ready','delivered','rejected']` | The status the order transitioned **to**. |
| `changedBy` | `ObjectId` | `ref: 'User'`, `required` | User who triggered this transition (Pharmacy Manager for fulfillment actions, system for automated transitions). |
| `changedAt` | `Date` | `default: Date.now` | Server timestamp of the transition (ALCOA+ Contemporaneous). |
| `note` | `String` | `trim` | Optional note for this specific transition (e.g., rejection reason). |

### Order Status Lifecycle

```
                    ┌──────────────────────────────────────────────────────────────┐
[Consumer Places    │                                                              │
 Order via Mobile]  │  Atomic Stock Deduction occurs here (MongoDB Transaction)    │
      │             │                                                              │
      ▼             │                                                              │
  [pending] ──── approve ──► [approved] ──► [processing] ──► [ready] ──► [delivered]
      │
      └──── reject ──► [rejected]
```

> **Cross-Tenant Flow:** The Public User (consumer) places the order with a `fulfillmentMethod` of `pickup` or `delivery`; the system stamps it with `customerId`, `pharmacyId`, and the chosen fulfillment method. The Pharmacy Manager at that pharmacy then processes the order through the lifecycle. The consumer tracks status in their mobile app.

> **Fulfillment Semantics:** When `fulfillmentMethod = 'pickup'`, the `ready` status means "your order is ready for collection at the pharmacy." When `fulfillmentMethod = 'delivery'`, the `ready` status means "your order is packed and awaiting dispatch," and `delivered` means "handed off to the patient at their address."

### Mongoose Schema (Pseudocode)

```js
const orderItemSchema = new Schema({
  medicineId:   { type: Schema.Types.ObjectId, ref: 'Medicine', required: true },
  medicineName: { type: String, required: true },
  sku:          { type: String, required: true },
  quantity:     { type: Number, required: true, min: 1 },
  unitPrice:    { type: Number, required: true, min: 0 },
  lineTotal:    { type: Number, required: true },
});

const statusEventSchema = new Schema({
  status:    { type: String, required: true, enum: ['pending','approved','processing','ready','delivered','rejected'] },
  changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  changedAt: { type: Date, default: Date.now },
  note:      { type: String, trim: true },
});

const orderSchema = new Schema({
  customerId:        { type: Schema.Types.ObjectId, ref: 'User', required: true },
  pharmacyId:        { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  items:             { type: [orderItemSchema], required: true },
  totalAmount:       { type: Number, required: true, min: 0 },
  status:            { type: String, required: true, enum: ['pending','approved','processing','ready','delivered','rejected'], default: 'pending' },
  fulfillmentMethod: { type: String, required: true, enum: ['pickup', 'delivery'], default: 'pickup' },
  deliveryAddress:   { type: String, trim: true },
  statusHistory:     [statusEventSchema],
  paymentStatus:     { type: String, required: true, enum: ['unpaid','partially_paid','paid'], default: 'unpaid' },
  approvedBy:        { type: Schema.Types.ObjectId, ref: 'User', default: null },
  approvedAt:        { type: Date, default: null },
  rejectedBy:        { type: Schema.Types.ObjectId, ref: 'User', default: null },
  rejectedAt:        { type: Date, default: null },
  rejectionReason:   { type: String, trim: true },
  notes:             { type: String, trim: true },
  isDeleted:       { type: Boolean, default: false },
  deletedAt:       { type: Date, default: null },
}, { timestamps: true });
```

### Indexes

| Field(s) | Type | Reason |
|---------|------|--------|
| `pharmacyId` | Standard | Fetch all orders for a specific pharmacy tenant (FR-3.5). |
| `customerId` | Standard | Fetch all orders placed by a specific public user. |
| `status` | Standard | Filter pending/approved orders on the pharmacy tenant dashboard. |
| `fulfillmentMethod` | Standard | Filter orders by pickup vs delivery for logistics planning. |
| `paymentStatus` | Standard | Financial reporting queries. |
| `createdAt` | Standard | Date-range sorting and reporting (FR-5.2). |

---

## 7. Collection: `payments` 🔒

Records individual payment transactions linked to orders, scoped to the pharmacy tenant. A single order may have multiple payment records to handle partial payments. The order's `paymentStatus` is updated after each new payment entry.

### Fields

| Field | Mongoose Type | Constraints | Description |
|-------|--------------|-------------|-------------|
| `_id` | `ObjectId` | Auto-generated | Primary key. |
| `orderId` | `ObjectId` | `ref: 'Order'`, `required` | The order this payment is applied to. |
| `pharmacyId` | `ObjectId` | `ref: 'User'`, `required`, **FK** | The pharmacy tenant receiving the payment. Auto-injected from JWT for tenant isolation. |
| `customerId` | `ObjectId` | `ref: 'User'`, `required` | The Public User making the payment. |
| `amount` | `Number` | `required`, `min: 0.01` | Amount paid in this transaction. |
| `paymentMethod` | `String` | `required`, `enum: ['bank_transfer', 'cash', 'mobile_money']` | Payment method used (FR-4.1). |
| `transactionId` | `String` | `trim` | External bank/payment reference number. Optional for cash payments. |
| `status` | `String` | `required`, `enum: ['pending', 'completed', 'failed', 'refunded']`, `default: 'completed'` | Payment confirmation status. |
| `note` | `String` | `trim` | Free-text note (e.g., "Partial payment. Remaining balance due next week."). |
| `recordedBy` | `ObjectId` | `ref: 'User'`, `required` | Pharmacy Manager who entered this payment. Required for FR-4.4 (Payment Audit Trail). |
| `createdAt` | `Date` | Auto (Mongoose `timestamps`) | Server-generated time of payment recording. Never client-provided (ALCOA+). |

### Indexes

| Field(s) | Type | Reason |
|---------|------|--------|
| `orderId` | Standard | Fast lookup of all payments for an order. |
| `pharmacyId` | Standard | Tenant-scoped financial history queries (FR-4.3). |
| `customerId` | Standard | Public user payment history. |
| `createdAt` | Standard | Date-range reporting. |

### Mongoose Schema (Pseudocode)

```js
const paymentSchema = new Schema({
  orderId:        { type: Schema.Types.ObjectId, ref: 'Order', required: true },
  pharmacyId:     { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  customerId:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amount:         { type: Number, required: true, min: 0.01 },
  paymentMethod:  { type: String, required: true, enum: ['bank_transfer', 'cash', 'mobile_money'] },
  transactionId:  { type: String, trim: true },
  status:         { type: String, required: true, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'completed' },
  note:           { type: String, trim: true },
  recordedBy:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });
```

> **Business Logic Note:** After each payment is saved, a post-save hook (or service layer) re-calculates the total amount paid against the order's `totalAmount` and updates `orders.paymentStatus` accordingly (`unpaid` → `partially_paid` → `paid`), satisfying FR-4.2.

---

## 8. Collection: `auditLogs` 🔐

The central immutable activity ledger for the entire platform. Every data-modifying operation (Create, Update, Delete/Soft-Delete, Login, Logout, Approve, Reject, GRN, GIN, Payment) on any core collection must generate an entry here. This satisfies NFR-4.1, ALCOA+, and simulates FDA 21 CFR Part 11 electronic record requirements.

> **Immutability Rule:** There are NO `PUT`, `PATCH`, or `DELETE` API endpoints for this collection. It is append-only by architectural design. Mongoose schema-level pre-hooks actively block `update`, `delete`, `findOneAndUpdate`, and `replaceOne` operations at the database driver level.

### Fields

| Field | Mongoose Type | Constraints | Description |
|-------|--------------|-------------|-------------|
| `_id` | `ObjectId` | Auto-generated | Primary key. |
| `userId` | `ObjectId` | `ref: 'User'`, `required` | The user who performed the action (ALCOA+ Attributable). Never null — system actions use a designated system user ID. |
| `actionType` | `String` | `required`, `enum: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'APPROVE', 'REJECT', 'PAYMENT_RECORDED', 'GRN', 'GIN']` | Categorized action type for filtering and reporting (FR-5.4). |
| `resource` | `String` | `required`, `enum: ['User', 'Medicine', 'Order', 'Payment', 'InventoryTransaction']` | The collection/entity type that was affected. |
| `resourceId` | `ObjectId` | `required` | The `_id` of the specific document that was changed. |
| `before` | `Mixed` | `default: null` | A JSON snapshot of the document **before** the change (for UPDATE and DELETE actions). Null for CREATE. |
| `after` | `Mixed` | `default: null` | A JSON snapshot of the document **after** the change. Null for DELETE. |
| `ipAddress` | `String` | `trim` | IP address of the client making the request (for security audits and forensic attribution). |
| `userAgent` | `String` | `trim` | HTTP User-Agent header of the client. |
| `timestamp` | `Date` | `required`, `default: Date.now` | Server-generated time of the event (ALCOA+ Contemporaneous). **Never provided by the client.** |

### Immutability Enforcement

```js
const immutableError = new Error('Audit logs are immutable – no updates or deletes allowed');

schema.pre(/^findOneAnd/, { document: true, query: true }, (next) => next(immutableError));
schema.pre(/^delete/,     { document: true, query: true }, (next) => next(immutableError));
schema.pre('updateOne',   { document: true, query: true }, (next) => next(immutableError));
```

### Indexes

| Field(s) | Type | Reason |
|---------|------|--------|
| `userId` | Standard | Filter all actions by a specific user. |
| `resource` | Standard | Filter logs by entity type. |
| `resourceId` | Standard | Retrieve full history for a specific record. |
| `actionType` | Standard | Filter by action category. |
| `timestamp` | Standard | Chronological ordering; date-range queries (FR-5.4). |
| `(resource, resourceId)` | Compound | Efficient history lookup for a specific document. |

### Mongoose Schema (Pseudocode)

```js
const auditLogSchema = new Schema({
  userId:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
  actionType: {
    type: String, required: true,
    enum: ['CREATE','UPDATE','DELETE','LOGIN','LOGOUT','APPROVE','REJECT','PAYMENT_RECORDED','GRN','GIN']
  },
  resource:   { type: String, required: true, enum: ['User','Medicine','Order','Payment','InventoryTransaction'] },
  resourceId: { type: Schema.Types.ObjectId, required: true },
  before:     { type: Schema.Types.Mixed, default: null },
  after:      { type: Schema.Types.Mixed, default: null },
  ipAddress:  { type: String, trim: true },
  userAgent:  { type: String, trim: true },
  timestamp:  { type: Date, required: true, default: Date.now },
});

// Immutability enforcement (pre-hooks block all update/delete operations)
```

---

## 9. Indexes

A consolidated view of all indexes across all collections (NFR-1.4).

| Collection | Field(s) | Index Type | Notes |
|-----------|---------|-----------|-------|
| `users` | `email` | Unique | Fast login lookups; enforces uniqueness (FR-1.1). |
| `users` | `role` | Standard | RBAC filtering. |
| `users` | `city` | Standard | City-based marketplace filtering. |
| `users` | `isDeleted` | Standard | Default query filter. |
| `medicines` | `pharmacyId` | Standard | **Tenant isolation.** All tenant-scoped queries filter on this field. |
| `medicines` | `sku` | Unique | Business key uniqueness; fast SKU lookups (NFR-1.4). |
| `medicines` | `name` | Standard | Search by name — used in both tenant-scoped and global marketplace queries (FR-2.6, NFR-1.4). |
| `medicines` | `category` | Standard | Category filtering (FR-2.6). |
| `medicines` | `isDeleted` | Standard | Default query filter. |
| `medicines` | `totalStock` | Standard | Low-stock alert queries. |
| `medicines` | `batches.expiryDate` | Standard | Near-expiry report queries (FR-2.3, FR-5.3). |
| `inventoryTransactions` | `pharmacyId` | Standard | **Tenant isolation.** |
| `inventoryTransactions` | `medicineId` | Standard | Stock ledger per medicine. |
| `inventoryTransactions` | `createdBy` | Standard | Attribution queries. |
| `inventoryTransactions` | `createdAt` | Standard | Date-range reporting. |
| `inventoryTransactions` | `transactionType` | Standard | GRN vs GIN report filtering. |
| `orders` | `pharmacyId` | Standard | **Tenant isolation.** Orders per pharmacy (FR-3.5). |
| `orders` | `customerId` | Standard | Orders per public user. |
| `orders` | `status` | Standard | Pending orders queue on pharmacy tenant dashboard. |
| `orders` | `fulfillmentMethod` | Standard | Filter orders by pickup vs delivery. |
| `orders` | `paymentStatus` | Standard | Financial reporting. |
| `orders` | `createdAt` | Standard | Chronological sort; date-range reports (FR-5.2). |
| `payments` | `orderId` | Standard | Payments per order. |
| `payments` | `pharmacyId` | Standard | **Tenant isolation.** Financial history per pharmacy (FR-4.3). |
| `payments` | `customerId` | Standard | Public user payment history. |
| `payments` | `createdAt` | Standard | Date-range reporting. |
| `auditLogs` | `userId` | Standard | Actions per user (FR-5.4). |
| `auditLogs` | `resource` | Standard | Filter by entity type. |
| `auditLogs` | `resourceId` | Standard | Full history of a specific document. |
| `auditLogs` | `actionType` | Standard | Action category filtering. |
| `auditLogs` | `timestamp` | Standard | Chronological ordering. |
| `auditLogs` | `(resource, resourceId)` | Compound | Efficient per-record history lookup. |

---

## 10. Mongoose Schema Code Reference

A summary of how each model maps to a filename in the backend project structure:

```
backend/
└── src/
    └── modules/
        ├── users/
        │   └── user.model.ts                 → Collection: users
        ├── inventory/
        │   ├── medicine.model.ts             → Collection: medicines (includes BatchSchema)
        │   └── inventoryTransaction.model.ts → Collection: inventoryTransactions (immutable)
        ├── orders/
        │   └── orders.model.ts               → Collection: orders (includes OrderItemSchema, StatusEventSchema)
        ├── payments/
        │   └── payments.model.ts             → Collection: payments
        └── auditLogs/
            └── auditLogs.model.ts            → Collection: auditLogs (immutable)
```

> **Note:** Audit log *creation* is handled by the centralized utility at `backend/src/utils/auditLogger.ts`, not by the auditLogs module's service layer. The auditLogs module provides read-only query endpoints for admin/manager consumption.

### Requirement Traceability

| Schema Feature | Source Requirement(s) |
|---|---|
| `users.passwordHash` + explicit bcrypt hashing in controller | FR-1.2 |
| `users.role` enum (`admin`/`pharmacy_manager`/`public_user`) | FR-1.4, NFR-2.1 |
| `users.phoneNumber` + `address` + `city` (contact/location) | FR-2.6 (marketplace discoverability), FR-3.1 (delivery coordination) |
| `users.location` (GPS coordinates) | FR-2.6 (proximity-based marketplace search) |
| `users.isDeleted` + `deletedAt` | NFR-4.2, ALCOA+ |
| `medicines.pharmacyId` FK (tenant isolation) | FR-1.6, NFR-2.2 |
| `medicines.sku` unique index | NFR-1.4, FR-2.1 |
| `medicines.batches[].batchNumber` | FR-2.2 |
| `medicines.batches[].expiryDate` + 90-day flag logic | FR-2.3, FR-5.3 |
| `medicines.totalStock` atomic `$inc` update | FR-2.4, NFR-2.5 |
| `medicines.reorderThreshold` + `isLowStock` virtual | FR-2.5 |
| `medicines.batches[].gtin` | SDS — EFDA Traceability Directive |
| `inventoryTransactions` (GRN/GIN) + `pharmacyId` scoping | FR-2.7, FR-1.6 |
| `inventoryTransactions.stockBefore`/`stockAfter` | ALCOA+ Accurate + SDS §Technical Logic |
| `inventoryTransactions` immutability pre-hooks | NFR-4.4 |
| `orders.customerId` + `orders.pharmacyId` (cross-tenant) | FR-3.1 |
| `orders.items[].unitPrice` (price snapshot) | FR-3.1, FR-5.2 |
| `orders.items[].medicineName`/`sku` (denormalized) | FR-3.5, FR-5.1 (data preserved post-soft-delete) |
| `orders.status` enum + lifecycle | FR-3.4 |
| `orders.fulfillmentMethod` enum (`pickup`/`delivery`) | FR-3.1 (order fulfillment logistics) |
| `orders.deliveryAddress` (conditional on delivery method) | FR-3.1 (delivery coordination) |
| `orders.statusHistory[]` (append-only embedded log) | FR-3.4 |
| `orders.approvedBy` + `approvedAt` | NFR-4.3, FR-3.3 |
| `orders.rejectionReason` | FR-3.3 |
| `orders.paymentStatus` enum | FR-4.2 |
| `payments.paymentMethod` enum | FR-4.1 |
| `payments.recordedBy` + `createdAt` | FR-4.4, ALCOA+ |
| `payments.pharmacyId` (tenant scoping) | FR-4.3, FR-1.6 |
| `payments.customerId` (consumer attribution) | FR-4.3 |
| `auditLogs.userId` + `timestamp` (server-generated) | NFR-4.1, ALCOA+ Attributable + Contemporaneous |
| `auditLogs.before` + `auditLogs.after` snapshots | NFR-4.1, SDS §Data Integrity |
| `auditLogs.ipAddress` + `auditLogs.userAgent` | ALCOA+ Attributable (forensic) |
| `auditLogs` — immutability pre-hooks (no DELETE/PUT) | NFR-4.1, 21 CFR Part 11 Immutability |
| Global marketplace search (cross-tenant `medicines` query) | FR-2.6 |
| Indexes on `email`, `sku`, `name`, `pharmacyId`, `city` | NFR-1.4 |

---

*End of Database Schema Reference — Pharma-Net v2.0*
