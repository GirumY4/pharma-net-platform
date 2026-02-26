# Pharma-Net — Database Schema Reference

| Field        | Details                              |
|--------------|--------------------------------------|
| **Version**  | 1.0                                  |
| **Date**     | 2026-02-26                           |
| **Authors**  | Intern Development Team (Web & Backend) |
| **Database** | MongoDB (via Mongoose ODM v6+)       |

> **Alignment:** This schema is derived from the SRS (v1.0), SDS, and Project Context documents. It enforces ALCOA+ and 21 CFR Part 11 data integrity principles throughout.

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

Pharma-Net is a shared-backend pharmaceutical logistics platform. All data is stored in a single **MongoDB** instance managed through the **Mongoose ODM**. The schema is designed around these core principles:

| Principle | Implementation |
|-----------|---------------|
| **Attributable** | Every write operation references the `userId` of the actor. |
| **Contemporaneous** | All `createdAt` / `updatedAt` / `timestamp` fields are server-generated via Mongoose's `timestamps` option or explicit `Date.now()` — never supplied by the client. |
| **Immutable Audit Trail** | The `auditLogs` collection is append-only. No `PUT`/`DELETE` endpoints exist for it. |
| **Soft Deletes** | Sensitive records (users, medicines) are never hard-deleted. An `isDeleted: Boolean` flag is set instead. All default queries filter `{ isDeleted: false }`. |
| **Atomic Operations** | Critical multi-document changes (order approval + stock decrement) use MongoDB sessions/transactions via the `$inc` operator to prevent race conditions. |
| **Referential Integrity** | Cross-collection links use `ObjectId` references with Mongoose `ref` for `.populate()` support. |

### Collections at a Glance

| # | Collection | Purpose |
|---|-----------|---------|
| 1 | `users` | Stores all platform users (Admin, Warehouse Manager, Pharmacy). |
| 2 | `medicines` | Master catalog of medicines with embedded batch/lot records. |
| 3 | `inventoryTransactions` | Goods Received Notes (GRN) and Goods Issued Notes (GIN) ledger. |
| 4 | `orders` | Pharmacy-initiated purchase orders with full status lifecycle. |
| 5 | `payments` | Payment transactions recorded against approved orders. |
| 6 | `auditLogs` | Immutable, append-only log of all data-modifying actions. |

---

## 2. Entity Relationship (ER) Summary

```
users ──────────────────────────────────────────────────────────────────┐
  │ (pharmacyId)        │ (approvedBy / rejectedBy)   │ (recordedBy)  │ (userId)
  ▼                     ▼                              ▼               ▼
orders ──────────► payments                       payments         auditLogs
  │ (items[].medicineId)
  ▼
medicines ──► batches[] (embedded)
  │
  ▼
inventoryTransactions (createdBy → users)
```

### Cardinality

| Relationship | Type | Description |
|---|---|---|
| `users` → `orders` | 1 : N | One pharmacy user can place many orders. |
| `users` → `payments` | 1 : N | One warehouse user records many payments. |
| `users` → `auditLogs` | 1 : N | One user generates many audit log entries. |
| `medicines` → `batches[]` | 1 : N | One medicine record contains many embedded batch objects. |
| `orders` → `items[]` | 1 : N | One order contains many line items (embedded). |
| `orders` → `payments` | 1 : N | One order can have multiple partial payment records. |
| `medicines` → `inventoryTransactions` | 1 : N | One medicine has many GRN/GIN movements. |
| `users` → `inventoryTransactions` | 1 : N | One warehouse user creates many stock adjustments. |

---

## 3. Collection: `users`

Stores all authenticated platform users. Soft delete is used instead of hard removal to preserve audit history.

### Fields

| Field | Mongoose Type | Constraints | Description |
|-------|--------------|-------------|-------------|
| `_id` | `ObjectId` | Auto-generated | Primary key. |
| `name` | `String` | `required`, `trim` | Full display name of the user. |
| `email` | `String` | `required`, `unique`, `lowercase`, `trim` | Login identifier. Must be unique across all users. |
| `passwordHash` | `String` | `required` | bcrypt hash of the user's password. **Never stored in plaintext.** |
| `role` | `String` | `required`, `enum: ['admin', 'warehouse_manager', 'pharmacy']` | Determines RBAC permissions. `admin` has global access; `warehouse_manager` manages stock and orders; `pharmacy` is an API consumer (mobile). |
| `isActive` | `Boolean` | `default: true` | `false` if the account is suspended by an admin. Suspended users cannot log in. |
| `isDeleted` | `Boolean` | `default: false` | Soft-delete flag. `true` when the admin "deletes" an account. Excluded from default queries. |
| `deletedAt` | `Date` | `default: null` | Server timestamp of when the soft delete was performed. |
| `createdAt` | `Date` | Auto (Mongoose `timestamps`) | Server-generated record creation time. |
| `updatedAt` | `Date` | Auto (Mongoose `timestamps`) | Server-generated time of the last update. |

### Indexes

| Field(s) | Type | Reason |
|---------|------|--------|
| `email` | Unique | Enforced uniqueness + fast login lookups. NFR-1.4 / FR-1.1 |
| `role` | Standard | Efficient RBAC filtering. |
| `isDeleted` | Standard | Fast exclusion of soft-deleted records in all default queries. |

### Mongoose Schema (Pseudocode)

```js
const userSchema = new Schema({
  name:         { type: String, required: true, trim: true },
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role:         { type: String, required: true, enum: ['admin', 'warehouse_manager', 'pharmacy'] },
  isActive:     { type: Boolean, default: true },
  isDeleted:    { type: Boolean, default: false },
  deletedAt:    { type: Date, default: null },
}, { timestamps: true });
```

> **Pre-save Hook:** A Mongoose `pre('save')` hook hashes the plain password with `bcrypt` before persisting, satisfying FR-1.2.

---

## 4. Collection: `medicines`

Master catalog of all pharmaceutical products managed by the warehouse. Uses embedded subdocuments for batch records, keeping related data co-located for fast reads.

### Parent Document Fields

| Field | Mongoose Type | Constraints | Description |
|-------|--------------|-------------|-------------|
| `_id` | `ObjectId` | Auto-generated | Primary key. |
| `name` | `String` | `required`, `trim`, `index` | Commercial or generic medicine name. |
| `sku` | `String` | `required`, `unique`, `uppercase`, `trim` | Stock-Keeping Unit. Unique business identifier for each medicine. |
| `genericName` | `String` | `trim` | Generic/INN name of the drug (optional but recommended). |
| `category` | `String` | `required`, `trim` | Drug category (e.g., `Antibiotic`, `Analgesic`, `Antihypertensive`). |
| `description` | `String` | `trim` | Short clinical or dispensing notes. |
| `unitPrice` | `Number` | `required`, `min: 0` | Current selling price per unit. |
| `unitOfMeasure` | `String` | `required`, `enum: ['tablet', 'capsule', 'vial', 'bottle', 'sachet', 'unit']` | Base dispensing unit. |
| `totalStock` | `Number` | `required`, `default: 0`, `min: 0` | Denormalized total stock count across all batches. Updated atomically on GRN/GIN/order events. |
| `reorderThreshold` | `Number` | `required`, `min: 0`, `default: 50` | Minimum stock level below which a low-stock dashboard alert is triggered (FR-2.5). |
| `batches` | `[BatchSchema]` | (see below) | Embedded array of batch/lot records for this medicine. |
| `isDeleted` | `Boolean` | `default: false` | Soft-delete flag. Satisfies NFR-4.2 and ALCOA+ retention requirements. |
| `deletedAt` | `Date` | `default: null` | Timestamp of soft deletion. |
| `createdBy` | `ObjectId` | `ref: 'User'`, `required` | The warehouse manager who created this medicine record. |
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
| `supplierName` | `String` | `trim` | Name of the supplier for this shipment. |
| `shelfLocation` | `String` | `trim` | Physical warehouse shelf or bin location (e.g., `Aisle-B, Shelf-3`). |
| `receivedAt` | `Date` | `default: Date.now` | Server timestamp when this batch was added. |

### Computed / Alert Logic (Application Layer)

| Condition | Alert Type | Trigger |
|-----------|-----------|---------|
| `totalStock < reorderThreshold` | 🔴 Low Stock Alert | Checked after every order approval or GIN. |
| `batches[i].expiryDate <= now + 90 days` | 🟡 Near Expiry Warning | Evaluated on dashboard load and report generation (FR-2.3, FR-5.3). |

### Mongoose Schema (Pseudocode)

```js
const batchSchema = new Schema({
  batchNumber:   { type: String, required: true, trim: true },
  gtin:          { type: String, trim: true },
  quantity:      { type: Number, required: true, min: 0 },
  expiryDate:    { type: Date, required: true },
  manufactureDate: { type: Date },
  supplierName:  { type: String, trim: true },
  shelfLocation: { type: String, trim: true },
  receivedAt:    { type: Date, default: Date.now },
});

const medicineSchema = new Schema({
  name:             { type: String, required: true, trim: true },
  sku:              { type: String, required: true, unique: true, uppercase: true, trim: true },
  genericName:      { type: String, trim: true },
  category:         { type: String, required: true, trim: true },
  description:      { type: String, trim: true },
  unitPrice:        { type: Number, required: true, min: 0 },
  unitOfMeasure:    { type: String, required: true, enum: ['tablet','capsule','vial','bottle','sachet','unit'] },
  totalStock:       { type: Number, required: true, default: 0, min: 0 },
  reorderThreshold: { type: Number, required: true, default: 50, min: 0 },
  batches:          [batchSchema],
  isDeleted:        { type: Boolean, default: false },
  deletedAt:        { type: Date, default: null },
  createdBy:        { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });
```

---

## 5. Collection: `inventoryTransactions` (GRN / GIN)

A persistent ledger of every stock movement—both increases (GRN — Goods Received Notes) and decreases (GIN — Goods Issued Notes). This satisfies FR-2.7 and provides a fully traceable stock audit trail independent of orders.

> **Why a separate collection?** The SRS (FR-2.7) and SDS require that stock adjustments (not related to orders) are formally recorded. Separating GRN/GIN from the `medicines` document (rather than embedding) keeps the medicine document lean and provides a clean, queryable ledger for reporting and auditing.

### Fields

| Field | Mongoose Type | Constraints | Description |
|-------|--------------|-------------|-------------|
| `_id` | `ObjectId` | Auto-generated | Primary key. |
| `transactionType` | `String` | `required`, `enum: ['GRN', 'GIN']` | GRN = stock received (positive adjustment). GIN = stock issued/written off (negative adjustment). |
| `medicineId` | `ObjectId` | `ref: 'Medicine'`, `required` | The medicine whose stock is being adjusted. |
| `batchNumber` | `String` | `required` | The specific batch being adjusted. |
| `quantityChanged` | `Number` | `required` | **Signed value:** positive for GRN, negative for GIN. Used in `Snew = Sold + quantityChanged` formula (SDS §Technical Logic). |
| `stockBefore` | `Number` | `required` | `totalStock` of the medicine **before** this transaction (for audit reconciliation). |
| `stockAfter` | `Number` | `required` | `totalStock` of the medicine **after** this transaction. |
| `reason` | `String` | `trim` | Free-text reason for the adjustment (e.g., "Received from Addis supplier", "Expired goods write-off"). Required for GIN. |
| `referenceNumber` | `String` | `trim` | External document reference (e.g., purchase order number, waybill, or write-off form number). |
| `expiryDate` | `Date` | — | Expiry date of the batch (mirrored from batch record for quick reporting). |
| `createdBy` | `ObjectId` | `ref: 'User'`, `required` | Warehouse manager who recorded this transaction (ALCOA+ Attributable). |
| `createdAt` | `Date` | Auto (Mongoose `timestamps`) | Server-generated timestamp — NOT client-provided (ALCOA+ Contemporaneous). |

### Indexes

| Field(s) | Type | Reason |
|---------|------|--------|
| `medicineId` | Standard | Fast lookup of all movements for a specific medicine. |
| `createdAt` | Standard | Efficient date-range queries for reporting. |
| `transactionType` | Standard | Filter GRN vs GIN reports. |
| `createdBy` | Standard | Attribution queries. |

### Mongoose Schema (Pseudocode)

```js
const inventoryTransactionSchema = new Schema({
  transactionType:  { type: String, required: true, enum: ['GRN', 'GIN'] },
  medicineId:       { type: Schema.Types.ObjectId, ref: 'Medicine', required: true },
  batchNumber:      { type: String, required: true },
  quantityChanged:  { type: Number, required: true },
  stockBefore:      { type: Number, required: true },
  stockAfter:       { type: Number, required: true },
  reason:           { type: String, trim: true },
  referenceNumber:  { type: String, trim: true },
  expiryDate:       { type: Date },
  createdBy:        { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });
```

---

## 6. Collection: `orders`

Represents a purchase order submitted by a pharmacy user (via mobile API). Tracks the full status lifecycle from placement to delivery, along with the financial summary and approval chain.

### Fields

| Field | Mongoose Type | Constraints | Description |
|-------|--------------|-------------|-------------|
| `_id` | `ObjectId` | Auto-generated | Primary key. |
| `pharmacyId` | `ObjectId` | `ref: 'User'`, `required` | The pharmacy user who placed the order. |
| `items` | `[OrderItemSchema]` | `required`, non-empty | Array of line items. See embedded schema below. |
| `totalAmount` | `Number` | `required`, `min: 0` | Pre-calculated order total (sum of `items[i].quantity * items[i].unitPrice`). |
| `status` | `String` | `required`, `enum: ['pending', 'approved', 'processing', 'dispatched', 'delivered', 'rejected']`, `default: 'pending'` | Current order status. Lifecycle: `pending → approved → processing → dispatched → delivered` or `pending → rejected`. |
| `statusHistory` | `[StatusEventSchema]` | — | Append-only log of every status transition. Satisfies FR-3.4 (Order Status Tracking). |
| `paymentStatus` | `String` | `required`, `enum: ['unpaid', 'partially_paid', 'paid']`, `default: 'unpaid'` | Aggregate payment state for the order. Updated whenever a new payment is recorded. |
| `approvedBy` | `ObjectId` | `ref: 'User'`, `default: null` | Warehouse manager who approved the order. Populated during `pending → approved` transition. |
| `approvedAt` | `Date` | `default: null` | Server timestamp of the approval event (ALCOA+ Contemporaneous + NFR-4.3). |
| `rejectedBy` | `ObjectId` | `ref: 'User'`, `default: null` | Warehouse manager who rejected the order. |
| `rejectedAt` | `Date` | `default: null` | Server timestamp of the rejection. |
| `rejectionReason` | `String` | `trim` | Required narrative when an order is rejected (FR-3.3). |
| `notes` | `String` | `trim` | Optional internal notes from the warehouse on this order. |
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
| `quantity` | `Number` | `required`, `min: 1` | Quantity requested by the pharmacy. |
| `unitPrice` | `Number` | `required`, `min: 0` | Snapshot of the unit price at the time of order (price lock). |
| `lineTotal` | `Number` | `required` | `quantity × unitPrice`, pre-calculated for fast subtotal reads. |

### Embedded Subdocument: `statusHistory[]`

Each element records a discrete status transition, forming an immutable chain-of-custody log.

| Field | Mongoose Type | Constraints | Description |
|-------|--------------|-------------|-------------|
| `status` | `String` | `required`, `enum: ['pending','approved','processing','dispatched','delivered','rejected']` | The status the order transitioned **to**. |
| `changedBy` | `ObjectId` | `ref: 'User'`, `required` | User who triggered this transition. |
| `changedAt` | `Date` | `default: Date.now` | Server timestamp of the transition (ALCOA+ Contemporaneous). |
| `note` | `String` | `trim` | Optional note for this specific transition (e.g., rejection reason). |

### Order Status Lifecycle

```
                  ┌──────────────────────────────────────────────────────┐
[Order Placed]    │                                                      │
      │           │  Atomic Stock Deduction occurs here (MongoDB Txn)   │
      ▼           │                                                      │
  [pending] ──── approve ──► [approved] ──► [processing] ──► [dispatched] ──► [delivered]
      │
      └──── reject ──► [rejected]
```

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
  status:    { type: String, required: true, enum: ['pending','approved','processing','dispatched','delivered','rejected'] },
  changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  changedAt: { type: Date, default: Date.now },
  note:      { type: String, trim: true },
});

const orderSchema = new Schema({
  pharmacyId:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
  items:           { type: [orderItemSchema], required: true },
  totalAmount:     { type: Number, required: true, min: 0 },
  status:          { type: String, required: true, enum: ['pending','approved','processing','dispatched','delivered','rejected'], default: 'pending' },
  statusHistory:   [statusEventSchema],
  paymentStatus:   { type: String, required: true, enum: ['unpaid','partially_paid','paid'], default: 'unpaid' },
  approvedBy:      { type: Schema.Types.ObjectId, ref: 'User', default: null },
  approvedAt:      { type: Date, default: null },
  rejectedBy:      { type: Schema.Types.ObjectId, ref: 'User', default: null },
  rejectedAt:      { type: Date, default: null },
  rejectionReason: { type: String, trim: true },
  notes:           { type: String, trim: true },
  isDeleted:       { type: Boolean, default: false },
  deletedAt:       { type: Date, default: null },
}, { timestamps: true });
```

### Indexes

| Field(s) | Type | Reason |
|---------|------|--------|
| `pharmacyId` | Standard | Fetch all orders for a specific pharmacy (FR-3.5). |
| `status` | Standard | Filter pending/approved orders on the warehouse dashboard. |
| `paymentStatus` | Standard | Financial reporting queries. |
| `createdAt` | Standard | Date-range sorting and reporting (FR-5.2). |

---

## 7. Collection: `payments`

Records individual payment transactions linked to orders. A single order may have multiple payment records to handle partial payments. The order's `paymentStatus` is updated after each new payment entry.

### Fields

| Field | Mongoose Type | Constraints | Description |
|-------|--------------|-------------|-------------|
| `_id` | `ObjectId` | Auto-generated | Primary key. |
| `orderId` | `ObjectId` | `ref: 'Order'`, `required` | The order this payment is applied to. |
| `pharmacyId` | `ObjectId` | `ref: 'User'`, `required` | Denormalized reference to the pharmacy for direct financial history queries (FR-4.3). |
| `amount` | `Number` | `required`, `min: 0.01` | Amount paid in this transaction. |
| `method` | `String` | `required`, `enum: ['bank_transfer', 'cash', 'credit']` | Payment method used (FR-4.1). |
| `transactionId` | `String` | `trim` | External bank/payment reference number. Optional for cash payments. |
| `status` | `String` | `required`, `enum: ['confirmed', 'pending_verification', 'rejected']`, `default: 'confirmed'` | Payment confirmation status. Useful for bank transfers that may require verification. |
| `note` | `String` | `trim` | Free-text note (e.g., "Partial payment. Remaining balance due next week."). |
| `recordedBy` | `ObjectId` | `ref: 'User'`, `required` | Warehouse user who entered this payment. Required for FR-4.4 (Payment Audit Trail). |
| `timestamp` | `Date` | `default: Date.now` | Server-generated time of payment recording. Never client-provided (ALCOA+). |

### Indexes

| Field(s) | Type | Reason |
|---------|------|--------|
| `orderId` | Standard | Fast lookup of all payments for an order. |
| `pharmacyId` | Standard | Financial history queries per pharmacy (FR-4.3). |
| `timestamp` | Standard | Date-range reporting. |

### Mongoose Schema (Pseudocode)

```js
const paymentSchema = new Schema({
  orderId:       { type: Schema.Types.ObjectId, ref: 'Order', required: true },
  pharmacyId:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amount:        { type: Number, required: true, min: 0.01 },
  method:        { type: String, required: true, enum: ['bank_transfer', 'cash', 'credit'] },
  transactionId: { type: String, trim: true },
  status:        { type: String, required: true, enum: ['confirmed', 'pending_verification', 'rejected'], default: 'confirmed' },
  note:          { type: String, trim: true },
  recordedBy:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
  timestamp:     { type: Date, default: Date.now },
});
```

> **Business Logic Note:** After each payment is saved, a post-save hook (or service layer) re-calculates the total amount paid against the order's `totalAmount` and updates `orders.paymentStatus` accordingly (`unpaid` → `partially_paid` → `paid`), satisfying FR-4.2.

---

## 8. Collection: `auditLogs`

The central immutable activity ledger for the entire platform. Every data-modifying operation (Create, Update, Delete/Soft-Delete) on any core collection must generate an entry here. This satisfies NFR-4.1, ALCOA+, and simulates FDA 21 CFR Part 11 electronic record requirements.

> **Immutability Rule:** There are NO `PUT`, `PATCH`, or `DELETE` API endpoints for this collection. It is append-only by architectural design.

### Fields

| Field | Mongoose Type | Constraints | Description |
|-------|--------------|-------------|-------------|
| `_id` | `ObjectId` | Auto-generated | Primary key. |
| `userId` | `ObjectId` | `ref: 'User'`, `required` | The user who performed the action (ALCOA+ Attributable). Never null — system actions use a designated system user ID. |
| `actionType` | `String` | `required`, `enum: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'APPROVE', 'REJECT', 'PAYMENT_RECORDED', 'GRN', 'GIN']` | Categorized action type for filtering and reporting (FR-5.4). |
| `resource` | `String` | `required`, `enum: ['User', 'Medicine', 'Order', 'Payment', 'InventoryTransaction']` | The collection/entity type that was affected. |
| `resourceId` | `ObjectId` | `required` | The `_id` of the specific document that was changed. |
| `before` | `Mixed` | `default: null` | A snapshot of the document **before** the change (for UPDATE and DELETE actions). Null for CREATE. |
| `after` | `Mixed` | `default: null` | A snapshot of the document **after** the change. Null for DELETE. |
| `ipAddress` | `String` | `trim` | IP address of the client making the request (for security audits). |
| `userAgent` | `String` | `trim` | HTTP User-Agent header of the client. |
| `timestamp` | `Date` | `required`, `default: Date.now` | Server-generated time of the event (ALCOA+ Contemporaneous). **Never provided by the client.** |

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
```

---

## 9. Indexes

A consolidated view of all indexes across all collections (NFR-1.4).

| Collection | Field(s) | Index Type | Notes |
|-----------|---------|-----------|-------|
| `users` | `email` | Unique | Fast login lookups; enforces uniqueness (FR-1.1). |
| `users` | `role` | Standard | RBAC filtering. |
| `users` | `isDeleted` | Standard | Default query filter. |
| `medicines` | `sku` | Unique | Business key uniqueness; fast SKU lookups (NFR-1.4). |
| `medicines` | `name` | Standard | Search by name (FR-2.6, NFR-1.4). |
| `medicines` | `category` | Standard | Category filtering (FR-2.6). |
| `medicines` | `isDeleted` | Standard | Default query filter. |
| `medicines` | `totalStock` | Standard | Low-stock alert queries. |
| `medicines` | `batches.expiryDate` | Standard | Near-expiry report queries (FR-2.3, FR-5.3). |
| `inventoryTransactions` | `medicineId` | Standard | Stock ledger per medicine. |
| `inventoryTransactions` | `createdBy` | Standard | Attribution queries. |
| `inventoryTransactions` | `createdAt` | Standard | Date-range reporting. |
| `inventoryTransactions` | `transactionType` | Standard | GRN vs GIN report filtering. |
| `orders` | `pharmacyId` | Standard | Orders per pharmacy (FR-3.5). |
| `orders` | `status` | Standard | Pending orders queue on warehouse dashboard. |
| `orders` | `paymentStatus` | Standard | Financial reporting. |
| `orders` | `createdAt` | Standard | Chronological sort; date-range reports (FR-5.2). |
| `payments` | `orderId` | Standard | Payments per order. |
| `payments` | `pharmacyId` | Standard | Financial history per pharmacy (FR-4.3). |
| `payments` | `timestamp` | Standard | Date-range reporting. |
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
    └── models/
        ├── User.model.js               → Collection: users
        ├── Medicine.model.js           → Collection: medicines (includes batchSchema)
        ├── InventoryTransaction.model.js → Collection: inventoryTransactions
        ├── Order.model.js              → Collection: orders (includes orderItemSchema, statusEventSchema)
        ├── Payment.model.js            → Collection: payments
        └── AuditLog.model.js           → Collection: auditLogs
```

### Requirement Traceability

| Schema Feature | Source Requirement(s) |
|---|---|
| `users.passwordHash` + bcrypt pre-save hook | FR-1.2 |
| `users.role` enum (`admin`/`warehouse_manager`/`pharmacy`) | FR-1.4, NFR-2.1 |
| `users.isDeleted` + `deletedAt` | NFR-4.2, ALCOA+ |
| `medicines.sku` unique index | NFR-1.4, FR-2.1 |
| `medicines.batches[].batchNumber` | FR-2.2 |
| `medicines.batches[].expiryDate` + 90-day flag logic | FR-2.3, FR-5.3 |
| `medicines.totalStock` atomic `$inc` update | FR-2.4, NFR-2.4 |
| `medicines.reorderThreshold` + alert logic | FR-2.5 |
| `medicines.batches[].gtin` | SDS — EFDA Traceability Directive |
| `inventoryTransactions` (GRN/GIN) | FR-2.7 |
| `inventoryTransactions.stockBefore`/`stockAfter` | ALCOA+ Accurate + SDS §Technical Logic |
| `orders.items[].unitPrice` (price snapshot) | FR-3.1, FR-5.2 |
| `orders.items[].medicineName`/`sku` (denormalized) | FR-3.5, FR-5.1 (data preserved post-soft-delete) |
| `orders.status` enum + lifecycle | FR-3.4 |
| `orders.statusHistory[]` (append-only embedded log) | FR-3.4 |
| `orders.approvedBy` + `approvedAt` | NFR-4.3, FR-3.3 |
| `orders.rejectionReason` | FR-3.3 |
| `orders.paymentStatus` enum | FR-4.2 |
| `payments.method` enum | FR-4.1 |
| `payments.recordedBy` + `timestamp` | FR-4.4, ALCOA+ |
| `payments.pharmacyId` (denormalized) | FR-4.3 |
| `auditLogs.userId` + `timestamp` (server-generated) | NFR-4.1, ALCOA+ Attributable + Contemporaneous |
| `auditLogs.before` + `auditLogs.after` snapshots | NFR-4.1, SDS §Data Integrity |
| `auditLogs` — no DELETE/PUT endpoints | NFR-4.1, 21 CFR Part 11 Immutability |
| Indexes on `email`, `sku`, `name` | NFR-1.4 |

---

*End of Database Schema Reference — Pharma-Net v1.0*
