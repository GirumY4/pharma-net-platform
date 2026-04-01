# Software Design Specification: Pharma-Net B2B2C Multi-Tenant SaaS Pharmaceutical Logistics Platform

The Pharma-Net platform addresses systemic inefficiencies in medicine discovery and distribution by providing a robust, centralized digital marketplace. This Software Design Specification (SDS) delineates the technical framework for the multi-tenant SaaS application and the shared backend infrastructure. As the primary "engine room," the system securely isolates Pharmacy Tenant operators while allowing Public Consumers to search effectively, ensuring data integrity across a complex public-to-pharmacy workflow. The platform enforces rigorous adherence to international data integrity standards, simulating a real-world, audit-ready pharmaceutical environment through ALCOA+ principles and 21 CFR Part 11 compliance.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Functional Requirements and Scope](#functional-requirements-and-scope)
3. [System Architecture and Tech Stack](#system-architecture-and-tech-stack)
4. [Database Design](#database-design)
5. [User Flow and Wireframes](#user-flow-and-wireframes)
6. [Implementation Plan](#implementation-plan)
7. [Ethiopian Regulatory Context and EFDA Compliance](#ethiopian-regulatory-context-and-efda-compliance)
8. [Technical Logic: Stock Validation and Atomic Transactions](#technical-logic-stock-validation-and-atomic-transactions)

---

## Executive Summary

The pharmaceutical landscape in regional Ethiopian hubs has historically contended with a "visibility gap" that undermines the efficacy of life-saving medicine delivery. Patients seeking specific medications have no centralized means of determining which nearby pharmacy carries their required drugs in stock, leading to wasted time, delayed treatment, and in critical cases, adverse health outcomes. The Pharma-Net project is established to bridge this gap by transitioning from archaic, manual communication methods to a streamlined, multi-tenant SaaS marketplace that connects independent pharmacies directly with public consumers.

### Problem Statement

The traditional pharmaceutical distribution model in Ethiopia relies heavily on fragmented, manual processes often described as the "phone call and walk-in" model. This reliance creates significant pain points across two distinct stakeholder groups. For **patients and public consumers**, the absence of a centralized medicine availability index means that locating a required medication involves physically visiting or telephoning multiple pharmacies — a process that is time-consuming, unreliable, and potentially dangerous for patients in urgent need. For **independent pharmacy operators**, inventory is managed through localized spreadsheets or paper records, producing inaccurate stock counts, missed reorder windows, and expired batches remaining on shelves. The absence of a centralized digital platform means pharmacies have no mechanism to attract demand from consumers beyond their immediate foot traffic. Furthermore, the lack of a unified audit trail makes it difficult for individual pharmacies to comply with evolving regulatory standards such as those set by the Ethiopian Food and Drug Authority (EFDA), and makes it impossible for platform operators to perform cross-tenant compliance investigations.

### Proposed Solution

Pharma-Net is a **B2B2C Multi-Tenant SaaS platform** designed to modernize the pharmaceutical last-mile supply chain through a shared backend architecture. The solution utilizes the MERN stack (MongoDB, Express.js, React, Node.js) with TypeScript to provide a unified infrastructure where each independent pharmacy operates as an isolated SaaS tenant, managing its own local inventory, while public consumers access a global marketplace that aggregates medicine availability across all onboarded pharmacies. The "system of record" is a shared Node.js/Express API that serves two distinct client types: a React.js SaaS web dashboard for pharmacy tenant management and system administration, and a separate mobile application for public consumer end-users (patients). Tenant data isolation is enforced at the application layer through `pharmacyId` foreign keys on all scoped database documents, extracted from the authenticated user's JWT context. By centralizing the business logic and database, Pharma-Net ensures that every transaction — from a consumer discovering a medicine to a pharmacy fulfilling the order — is reflected in real-time across all interfaces. The platform integrates high-level data integrity standards, simulating real-world pharmaceutical environments by incorporating ALCOA+ principles and FDA 21 CFR Part 11 compliance, specifically through immutable audit logs and attributable action tracking.

### Target Audience

The primary users of the platform span three distinct tiers, each with dedicated interfaces and scoped permissions.

| User Category                | Description and Context                                                                                                                                  |
|------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------|
| **System Administrators**    | Platform governance users responsible for tenant lifecycle management (onboarding, activating, and deactivating pharmacy accounts), role assignment, monitoring cross-tenant audit logs, and ensuring global system health and regulatory compliance. |
| **Pharmacy Managers**        | Independent pharmacy operators (SaaS tenants) who manage their own local inventory (medicine CRUD, batch tracking, GRN/GIN stock adjustments), review and fulfill incoming consumer orders, record payments, and generate tenant-scoped analytical reports — all strictly isolated within their `pharmacyId` boundary. |
| **Public Users / Patients** | End consumers who search the global marketplace for medicine availability across all onboarded pharmacies, compare pricing, place purchase orders targeting a specific pharmacy, and track order fulfillment status. While not direct users of the web dashboard, the shared backend API must fully support their mobile application experience. |

---

## Functional Requirements and Scope

The functional scope of Pharma-Net is defined by its role as the authoritative engine for a multi-tenant pharmaceutical marketplace. Every module is designed to enforce business rules at the API level, ensuring that data integrity and tenant isolation are maintained regardless of whether the request originates from the SaaS web dashboard or the external mobile consumer app.

### Core Business Logic and Modules

The system's functionality is organized into modular components that address the full lifecycle of pharmaceutical logistics within a multi-tenant context, from identity management to financial reporting.

#### Identity and Access Management

The foundation of the platform is a secure authentication and authorization system that supports three distinct user tiers. Identity management utilizes stateless JSON Web Tokens (JWT) to manage sessions, ensuring that the backend can scale horizontally across multiple server instances without losing track of user state. The registration and login logic employ bcrypt for one-way password hashing, a critical security measure that protects user credentials even in the event of a database breach. Role-Based Access Control (RBAC) is enforced through backend middleware that inspects the JWT for user roles (`admin`, `pharmacy_manager`, or `public_user`) before granting access to specific API routes. Critically, for pharmacy tenant users, the JWT payload includes the user's `pharmacyId`, which is automatically injected into all downstream database queries — ensuring that a Pharmacy Manager at Tenant A can never access, query, or mutate data belonging to Tenant B. This implicit tenant scoping mechanism is the cornerstone of the platform's multi-tenancy model.

#### Multi-Tenant Medicine and Inventory Management

The inventory engine handles the complex metadata associated with pharmaceutical products within a strict tenant-isolation boundary. Each pharmacy tenant manages its own medicine catalog through standard CRUD operations — creating, reading, updating, and soft-deleting medicine records that are automatically stamped with the tenant's `pharmacyId`. Beyond basic catalog management, the system tracks medicine batches, stock-keeping units (SKUs), generic names, categories, units of measure, and per-batch metadata including GTIN barcodes, expiry dates, manufacture dates, supplier names, and shelf locations. A critical logical component is the "real-time stock update" mechanism: whenever a stock adjustment is made via GRN (Goods Received Note) or GIN (Goods Issue Note), or an order is fulfilled, the system atomically updates the `totalStock` field in MongoDB to prevent race conditions during high-concurrency periods. Automated low-stock alerts are triggered when stock levels fall below a configurable `reorderThreshold` (default: 50 units), implemented as a Mongoose virtual property (`isLowStock`) that fires when `totalStock < reorderThreshold`.

#### Global Marketplace Search (Consumer-Facing)

A defining feature of Pharma-Net is the global marketplace search API that enables Public Users to discover medicine availability across all onboarded pharmacy tenants simultaneously. Unlike tenant-scoped operations, marketplace search queries are **not** filtered by `pharmacyId` — they aggregate results across the entire platform, returning medicine names, categories, pricing, availability (stock counts), and the owning pharmacy's identity. This cross-tenant search is the primary mechanism through which the platform delivers its core value proposition: allowing a patient to instantly determine which nearby pharmacy has their required medication in stock. The API carefully restricts the fields exposed in public search responses, excluding sensitive tenant operational data (supplier names, internal batch details, shelf locations) from consumer-facing results.

#### Consumer Order and Transaction Lifecycle

The order management module facilitates the transition from consumer discovery to pharmacy fulfillment within a cross-tenant workflow. When a Public User identifies a medicine at a specific pharmacy through the global marketplace, they submit an order via the mobile API. The order is automatically stamped with both the consumer's `customerId` and the target pharmacy's `pharmacyId`, establishing the cross-tenant relationship. The backend performs a "pre-flight" stock validation within a MongoDB transaction: if the requested quantity exceeds the available stock at the target pharmacy, the request is rejected with a descriptive error message. Approved orders transition through a status-based lifecycle:

**Pending → Approved → Processing → Ready for Pickup → Delivered**
                └→ **Rejected** (with reason)

Each transition is timestamped and attributed to the user who performed the action (the Pharmacy Manager for approvals/rejections/fulfillment, the system for automated status updates), ensuring a clear chain of custody. The Pharmacy Manager reviews and processes incoming orders exclusively through their tenant-scoped SaaS dashboard — they see only orders where `pharmacyId` matches their own identity.

#### Payment and Financial Tracking

Financial accountability is integrated into the order lifecycle through the payment management module. Pharmacy Managers can record payments against specific orders within their tenant boundary, specifying the payment method (e.g., bank transfer, cash, mobile money) and the amount received. The order's payment status is dynamically updated to reflect Unpaid, Partially Paid, or Paid based on the recorded transactions. All payment records are scoped to the pharmacy tenant via `pharmacyId`, ensuring that each pharmacy's financial history is fully isolated from other tenants. This module ensures that financial records are transparent and retrievable for both the pharmacy operator and platform administrators.

#### Reporting and Analytics

The reporting engine translates raw transactional data into actionable insights, scoped to the appropriate user tier. For **Pharmacy Managers**, the SaaS dashboard visualizes tenant-specific metrics: sales volume, revenue, daily/monthly order volumes, top-selling medications, inventory valuations, and expiration forecasts — all computed exclusively from data within their `pharmacyId` boundary. For **System Administrators**, aggregated cross-tenant health metrics provide platform-level visibility: total GMV (Gross Merchandise Value), active tenant count, platform-wide order volume, and compliance audit summaries. Users can generate and export comprehensive reports in PDF or CSV formats for auditing purposes.

### User Roles and Permission Matrix

The backend enforces strict permissions to maintain the separation of duties required in a regulated, multi-tenant pharmaceutical environment.

| Role                     | Access Level          | Primary Functional Responsibilities                                                                          |
|--------------------------|-----------------------|--------------------------------------------------------------------------------------------------------------|
| **Admin**                | Platform (Global)     | Managing pharmacy tenant accounts, tenant lifecycle (activate/deactivate), role assignment, viewing cross-tenant audit logs, and monitoring platform health metrics. |
| **Pharmacy Manager**     | Tenant (Isolated)     | Managing local medicine catalog (CRUD), stock adjustments (GRN/GIN), incoming consumer order fulfillment (approve/reject/process/deliver), payment recording, and generating tenant-scoped financial/stock reports. All operations strictly bounded by `pharmacyId`. |
| **Public User / Patient**| Consumer (Marketplace) | Searching the global marketplace for medicine availability across all pharmacies, viewing pricing and stock levels, placing orders at a specific pharmacy, tracking order status, and viewing personal order/payment history. |

### Out of Scope Specifications

To ensure the web team's efforts are focused on the core SaaS infrastructure and tenant management tools, the following items are explicitly excluded from this phase of development:

- **Mobile User Interface:** The design and implementation of the public consumer-facing mobile app are the responsibility of the mobile team. The web team delivers the shared APIs that power it.
- **Real-time Payment Gateways:** Direct integration with banking APIs or mobile money platforms for automated fund transfers is not included; payments are recorded manually by pharmacy operators for tracking purposes.
- **Clinical Patient Records:** The system does not handle individual patient prescriptions or medical histories.
- **Insurance Claim Processing:** Automated handling of insurance reimbursements is excluded from the current scope.
- **Pharmacy Staff Management:** Sub-accounts within a pharmacy tenant (e.g., pharmacist assistants) are not supported in the initial release; each pharmacy tenant has a single Pharmacy Manager account.

---

## System Architecture and Tech Stack

Pharma-Net adopts a Shared Backend Architecture, a model where a single, robust server manages all business logic, security, and data persistence for multiple tenant clients and consumer applications. Multi-tenancy is implemented through a **Shared Database, Shared Schema** pattern, where tenant isolation is enforced at the application layer via `pharmacyId` scoping rather than through separate database instances.

### Technology Stack Justification

The selection of the MERN stack with TypeScript is driven by the need for a high-performance, type-safe, stateless system that can handle the real-time demands of a multi-tenant pharmaceutical marketplace.

- **Frontend (SaaS Web Dashboard):** React.js v19 with TypeScript and Vite. React's component-based architecture is ideal for building complex, data-heavy SaaS dashboards for pharmacy tenant management and system administration. TypeScript adds a layer of static typing that prevents common coding errors in large-scale applications, while Vite provides lightning-fast Hot Module Replacement (HMR) during development and optimized production builds. The feature-based folder structure (`features/auth`, `features/inventory`, `features/orders`, etc.) ensures modularity and maintainability as the dashboard grows.
- **Backend (Shared API):** Node.js and Express.js v5. This environment is highly efficient for handling concurrent requests, which is essential when dozens of pharmacy tenants and thousands of public consumers are interacting with the system simultaneously. Express.js v5 provides a robust routing framework for building the RESTful API endpoints consumed by both the SaaS web dashboard and the mobile consumer app. The modular architecture (`modules/auth`, `modules/inventory`, `modules/orders`, etc.) ensures clean separation of concerns.
- **Database:** MongoDB with Mongoose v9 ODM. MongoDB's document-oriented structure allows for flexible data modeling, which is particularly useful for pharmaceutical data that may include varying attributes like batch metadata, storage temperatures, or specialized handling instructions. Mongoose is used to enforce strict schema validation, ensuring that only clean, well-structured data enters the system. The `pharmacyId` foreign key pattern on scoped collections enables efficient tenant-isolated queries via standard MongoDB indexing.
- **Security and Communication:** Stateless JWT for authentication with tenant context embedding (`pharmacyId` in the payload), bcrypt v6 for password hashing, Helmet.js for HTTP security headers, CORS origin whitelisting, and HTTPS/TLS for all data in transit. This ensures that sensitive pharmaceutical data is protected from interception and that user identity and tenant affiliation are verified for every transaction.

### High-Level Architecture and Data Flow

The architecture is structured as a distributed system with clear boundaries between the presentation, logic, and data layers.

1. **Client Layer:** The React-based SaaS web dashboard (Pharmacy Management & Admin Console) and the mobile consumer app (Public User marketplace) act as the presentation layer. Both clients interact with the server exclusively through RESTful API endpoints using JSON payloads. The web team owns the SaaS dashboard; the mobile team owns the consumer app — both consume the same shared API.
2. **Logic Layer (Shared API):** The Node.js server acts as the "gatekeeper" and "tenant gate." It handles authentication middleware (JWT verification), tenant context injection (`pharmacyId` extraction from JWT), role-based authorization (RBAC middleware), request validation (Mongoose schemas), and the execution of business logic (service layer). This layer is stateless, meaning it does not store session data on the server, which facilitates horizontal scaling through containerization (e.g., Docker) behind a load balancer.
3. **Data Layer:** MongoDB serves as the "Source of Truth," storing all persistent records with tenant isolation enforced through `pharmacyId` foreign keys on all scoped collections (`medicines`, `orders`, `payments`, `inventoryTransactions`). The data layer is designed to handle high volumes of inventory and transaction records efficiently through the use of database indexing on critical fields like medicine `name`, `category`, `sku`, and user `email`.

The interaction follows a standard REST pattern: a client sends an HTTPS request (e.g., `POST /api/orders`) with a JWT in the Authorization header; the server verifies the token, extracts the user's `pharmacyId` from the JWT payload, validates the request body against Mongoose schemas, executes the tenant-scoped business logic, records an audit log entry (capturing before/after state, IP address, and User-Agent), and returns a JSON response (e.g., `201 Created`).

---

## Database Design

The database design for Pharma-Net is optimized for multi-tenant data isolation, data integrity, and traceability, following the ALCOA+ framework to ensure that all records are Attributable, Legible, Contemporaneous, Original, and Accurate.

### Entity Relationship (ER) Logic

The system utilizes six primary collections in MongoDB, with relationships established through ObjectIDs to ensure referential integrity. The critical distinction is that most collections include a `pharmacyId` foreign key to enforce tenant-scoped data isolation.

- **Users to Tenant Scope:** A Pharmacy Manager user's `_id` serves as the `pharmacyId` for all downstream tenant-scoped collections. This creates a one-to-many (1:N) relationship where one pharmacy tenant is linked to multiple medicines, orders, payments, inventory transactions, and audit log entries.
- **Medicines to Batches:** A one-to-many relationship where a single medicine entry (scoped to a pharmacy via `pharmacyId`) contains an embedded array of batch sub-documents, each with its own quantity, GTIN barcode, shelf location, expiry date, and manufacture date.
- **Orders (Cross-Tenant):** Orders bridge the consumer and tenant boundaries. Each order contains both a `customerId` (the Public User who placed the order) and a `pharmacyId` (the pharmacy tenant who fulfills it). This establishes a many-to-one relationship from orders to both the consumer and the pharmacy.
- **Orders to Payments:** A one-to-one (1:1) or one-to-many (1:N) relationship where orders are linked to specific payment transaction records, also scoped by `pharmacyId`.
- **Inventory Transactions (Immutable Ledger):** A one-to-many relationship where each medicine has multiple GRN/GIN transaction records, each capturing `stockBefore`, `stockAfter`, and `quantityChanged`. These records are schema-level immutable.

### Schema Definition Table

The following table summarizes the primary fields and validation rules for the core database collections.

| Collection               | Key Attributes and Types                                                                                          | Integrity Logic                                                              |
|---------------------------|-------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------|
| **Users**                 | `_id`, `name`, `email` (Unique), `passwordHash`, `role` (enum), `isActive`, `isDeleted`, `deletedAt`            | bcrypt hashing, RBAC, soft delete. No `pharmacyId` — the user `_id` *is* the tenant identifier for `pharmacy_manager` roles. |
| **Medicines**             | `_id`, `pharmacyId` (FK → User), `name`, `sku` (Unique), `genericName`, `category`, `unitPrice`, `totalStock`, `reorderThreshold`, `batches[]`, `isDeleted`, `createdBy` | Tenant-scoped via `pharmacyId`. Soft delete. Virtual `isLowStock` property. |
| **InventoryTransactions** | `_id`, `pharmacyId` (FK), `transactionType` (GRN/GIN), `medicineId` (FK), `batchNumber`, `quantityChanged`, `stockBefore`, `stockAfter`, `createdBy` | **Immutable** — Mongoose pre-hooks block all update/delete operations. Tenant-scoped. |
| **Orders**                | `_id`, `customerId` (FK → Public User), `pharmacyId` (FK → Pharmacy), `items[]`, `totalAmount`, `status` (enum lifecycle), `isDeleted` | Cross-tenant: links consumer to pharmacy. Timestamps auto-generated. Status lifecycle enforcement. |
| **Payments**              | `_id`, `orderId` (FK), `pharmacyId` (FK), `customerId` (FK), `amount`, `paymentMethod`, `status` (enum)          | Tenant-scoped. Linked to order and both consumer/pharmacy users for financial accountability. |
| **AuditLogs**             | `_id`, `userId` (FK), `actionType` (enum), `resource` (enum), `resourceId`, `before` (Mixed), `after` (Mixed), `ipAddress`, `userAgent`, `timestamp` | **Immutable** — append-only. No update/delete endpoints. Captures full before/after state snapshots. |

### Data Integrity Standards (ALCOA+)

To simulate a professional, regulated environment, the database design enforces several critical integrity features.

- **Immutability:** The `AuditLogs` and `InventoryTransactions` collections are append-only. Mongoose schema-level pre-hooks actively block `findOneAndUpdate`, `deleteOne`, `updateOne`, and `replaceOne` operations, throwing an error if any code attempts to modify or remove these records. This ensures a permanent, tamper-proof record of all system activity and stock movements.
- **Traceability:** Every change to a medicine, order, or payment record is linked to the `userId` of the person who initiated the action. Audit logs additionally capture the client's `ipAddress` and `userAgent` header, satisfying the "Attributable" requirement with forensic-level detail.
- **Contemporaneous Logging:** Timestamps are generated by the server at the moment of the transaction (`Date.now`), not provided by the client, ensuring they reflect the actual time of the event and cannot be backdated or fabricated.
- **Soft Deletes:** Records are never permanently removed from the database; instead, they are marked with an `isDeleted: true` flag and a `deletedAt` timestamp. This preserves historical data for audits and sales analysis even after an item is no longer in active use.
- **Tenant Isolation:** The `pharmacyId` foreign key on scoped collections ensures that compliance data — audit logs, stock transactions, and financial records — is attributable not only to a specific user but to a specific pharmacy tenant, enabling per-tenant regulatory review.

---

## User Flow and Wireframes

The user flow for the Pharma-Net platform is designed around two distinct experiences: the **SaaS web dashboard** optimized for Pharmacy Manager efficiency and system administration, and the **consumer mobile experience** (API-driven) optimized for rapid medicine discovery and ordering.

### User Flow Diagrams: Key Paths

**1. Inventory Management Flow (Pharmacy Manager — Tenant Dashboard)**

- **Login:** Pharmacy Manager authenticates via the SaaS web login screen. JWT issued with embedded `pharmacyId`.
- **Dashboard View:** Tenant-scoped dashboard displays low-stock alerts, expiry warnings, and today's incoming order count — all filtered by the manager's `pharmacyId`.
- **Stock Adjustment:** Manager navigates to the Inventory screen and selects a medicine from *their own* catalog.
- **GRN/GIN Submission:** Manager enters stock movement details (e.g., received 500 units of Aspirin, Batch #A123, Expiry 2027-06-15).
- **System Update:** The backend validates the entry, atomically updates the `totalStock` and batch quantities, creates an immutable `InventoryTransaction` record (capturing `stockBefore`, `stockAfter`), and records an entry in the `AuditLogs`.

**2. Consumer Order Placement Flow (Public User — Mobile App via API)**

- **Global Search:** Patient opens the mobile app and searches for "Amoxicillin." The API returns results aggregated across all active pharmacy tenants, showing pharmacy name, unit price, and availability.
- **Pharmacy Selection:** Patient selects a result from "Pharmacy ABC" (cheapest price, closest location).
- **Order Placement:** Patient submits the order. The API stamps it with `customerId` (the patient) and `pharmacyId` (Pharmacy ABC), then performs atomic stock validation.
- **Confirmation:** Patient receives an order confirmation with status "Pending" and can track the lifecycle in real-time.

**3. Order Fulfillment Flow (Pharmacy Manager — Tenant Dashboard)**

- **Order Review:** Pharmacy Manager opens the "Incoming Orders" tab on their SaaS dashboard. Only orders where `pharmacyId` matches their own pharmacy are displayed.
- **Validation:** System displays the requested quantity alongside current stock levels for each item.
- **Action:** Manager selects "Approve" or "Reject" (providing a reason for rejection).
- **Fulfillment:** Upon approval, the system atomically decrements stock, updates the order status to "Approved," and the manager processes the order through "Processing → Ready for Pickup → Delivered." Each transition is recorded in the audit trail.

**4. Platform Governance Flow (System Administrator)**

- **Tenant Management:** Admin accesses the Admin Console to onboard new pharmacy tenants, or activate/deactivate existing ones.
- **Audit Review:** Admin filters the cross-tenant `AuditLogs` by date, user ID, action type, or resource type to investigate compliance concerns.
- **Platform Health:** Admin views aggregated KPIs: total active tenants, platform-wide GMV, daily order volume, and system uptime.

### Key Wireframe Descriptions

The SaaS web application features three primary screen types designed for data density and clarity.

1. **The Tenant Dashboard (Pharmacy Manager Landing Page):** This is the landing page for authenticated Pharmacy Managers. It features real-time, tenant-scoped data widgets showing critical inventory alerts (Red for low stock, Yellow for near-expiry), a count of pending incoming orders requiring action, and a summary of today's sales volume. A sidebar navigation allows quick switching between Inventory, Orders, Payments, and Reporting modules. All data is automatically filtered to the manager's `pharmacyId` — no other tenant's data is ever visible.

2. **Inventory Grid & Audit View:** A tabular view of all medicines in the pharmacy's local catalog. Each row includes the SKU, category, total stock, unit price, and a "last updated" timestamp. Expanding a row reveals the batch-specific details (batch number, GTIN, quantity, expiry date, shelf location) and an inline "Adjust Stock" button for GRN/GIN operations. Color-coding is used throughout to highlight items requiring immediate attention (red for below reorder threshold, amber for approaching expiry within 90 days).

3. **Order Processing Interface:** A split-screen view where the left side lists all incoming consumer orders (filtered by `pharmacyId`) and the right side displays the full details of the selected order (item list, quantities, consumer name, total cost). A prominent "Status" stepper shows the order's progression through the lifecycle. Action buttons (Approve/Reject) are located at the bottom of the detail pane, requiring a confirmation modal to prevent accidental clicks. Upon approval, the system displays the stock deduction summary before committing the transaction.

---

## Implementation Plan

The development roadmap is structured into distinct phases, prioritizing the establishment of the shared backend as the "source of truth" for the entire multi-tenant Pharma-Net ecosystem.

### Development Milestones

| Phase                                    | Focus                   | Key Deliverables                                                                                                          |
|------------------------------------------|-------------------------|---------------------------------------------------------------------------------------------------------------------------|
| **Phase 1: Foundation** (Week 1)         | Core Infrastructure     | GitHub repository setup, monorepo folder structure (backend + frontend), MongoDB/Mongoose connection, Express v5 server configuration, middleware pipeline (Helmet, CORS, Morgan, error handling). |
| **Phase 2: Authentication & Tenancy** (Week 2) | Security & Multi-Tenancy | User model with three-role enum, password hashing with bcrypt, JWT login/registration with `pharmacyId` embedding, RBAC middleware, and tenant-gate middleware that auto-injects `pharmacyId` into downstream queries. |
| **Phase 3: Inventory & Stock Logic** (Week 3)  | Core Business Engine    | Tenant-scoped Medicine CRUD API, batch/expiry tracking, immutable InventoryTransaction model, GRN/GIN stock adjustment endpoints, low-stock virtual property, centralized audit logging utility, and global marketplace search API for public consumers. |
| **Phase 4: Orders, Payments & Dashboard** (Week 4) | Transactions & UI      | Cross-tenant order placement API, pharmacy fulfillment status workflow, atomic stock deduction, payment recording module, SaaS web dashboard development (auth pages, inventory UI, order fulfillment UI), and tenant-scoped report generation. |

### Definition of Done (DoD)

The project is considered complete and ready for deployment when it satisfies the following technical and functional criteria:

- **Functional Multi-Tenant API:** All RESTful endpoints for authentication, tenant-scoped inventory, global marketplace search, cross-tenant orders, and payments are fully functional and return standard HTTP status codes (200, 201, 400, 401, 403, 404, 500). Tenant isolation is verified — no cross-tenant data leakage is possible.
- **SaaS Dashboard Integrity:** The Pharmacy Manager dashboard correctly reflects tenant-scoped database state in real-time and enforces `pharmacyId`-bounded visibility. The Admin Console correctly displays cross-tenant governance tools.
- **Data Integrity Verification:** Audit logs correctly capture "Before" and "After" snapshots for all stock changes and order status transitions. Immutability enforcement on `AuditLogs` and `InventoryTransactions` is verified — all update/delete attempts are blocked at the schema level. Soft-delete logic is successfully implemented for medicines and users.
- **Technical Documentation:** The shared API is fully documented to allow the mobile team to integrate their consumer-facing mobile application. Endpoint documentation includes tenant scoping behavior, required roles, and request/response schemas.
- **Successful Deployment:** The SaaS web application and shared backend are deployed to a production-ready environment (e.g., Vercel, Render, or a containerized server at Bahir Dar University), and the API is accessible to the mobile team for consumer app integration.

---

## Ethiopian Regulatory Context and EFDA Compliance

As an internship project at Bahir Dar University, Pharma-Net is designed with an acute awareness of the Ethiopian pharmaceutical landscape, particularly the mandates of the Ethiopian Food and Drug Authority (EFDA). The multi-tenant SaaS model is particularly well-suited to national-scale compliance, as each pharmacy tenant's data is individually auditable while the platform operator maintains cross-tenant oversight.

### Traceability and Barcoding Standards

The EFDA Traceability Directive requires that pharmaceutical units be uniquely identified through GS1-compliant 2D DataMatrix barcodes. Pharma-Net's medicine and batch schemas are specifically designed to store and query these unique identifiers (GTINs and serial numbers) on a per-tenant basis, allowing for unit-level traceability from each pharmacy's shelf to the public consumer. Each batch sub-document in the `medicines` collection includes an optional `gtin` field for this purpose. This alignment ensures that the system can eventually integrate with national systems like the EFDA-MVC (Medicine Verification and Control) hub, with the multi-tenant architecture enabling per-pharmacy compliance certification.

### Public Health Impact

By providing real-time, cross-tenant visibility into stock levels and expiration dates through the global marketplace, Pharma-Net addresses critical challenges in the Ethiopian health sector. For **patients**, the platform eliminates the information asymmetry that currently forces them to physically visit multiple pharmacies — they can now discover, compare, and order medications digitally in minutes. For **pharmacy operators**, the SaaS dashboard provides enterprise-grade inventory management tooling (batch tracking, expiry alerts, low-stock warnings, audit trails) that most independent pharmacies could never afford to build independently. For **regulators**, the platform's immutable audit traces and tenant-scoped compliance data provide a digital infrastructure for oversight that far exceeds the capabilities of paper-based inspection systems. This digital transformation supports the broader goals of the EFDA to enhance patient safety, reduce the circulation of expired medications, and strengthen supply chain security across the country.

---

## Technical Logic: Stock Validation and Atomic Transactions

A core technical challenge in a multi-tenant pharmaceutical marketplace is ensuring that stock levels remain accurate under heavy load — particularly when multiple public consumers may attempt to order the same medicine from the same pharmacy simultaneously. Pharma-Net addresses this through atomic database operations, strict backend validation logic, and immutable transaction ledgering.

### Atomic Updates in MongoDB

To prevent race conditions — where two consumers might attempt to order the same last unit of medicine from the same pharmacy simultaneously — the system utilizes MongoDB sessions and the `$inc` operator within a transaction. The logic for stock deduction (ΔS) is represented as:

```
Snew = Sold + Qadjustment
```

where `Qadjustment` is a negative value for order fulfillments (GIN / consumer order) or a positive value for inventory receipts (GRN). The system performs a "find-and-modify" operation within a MongoDB session that checks if `Sold + Qadjustment` is greater than or equal to zero before committing the change. This ensures that the `totalStock` field never drops below zero, maintaining the "Accurate" requirement of the ALCOA+ framework. Critically, the stock mutation is followed by the creation of an immutable `InventoryTransaction` record within the same session, capturing the `stockBefore` and `stockAfter` values — ensuring that the transaction ledger is always consistent with the actual stock state.

### Backend Validation Pipeline

Every request to modify inventory or orders passes through a multi-stage validation pipeline that enforces both security and business rules:

1. **Authentication (JWT Verification):** Verifies the user has a valid, non-expired JWT via the `auth.middleware.ts`. Extracts the user's `_id`, `role`, and `pharmacyId` from the token payload.
2. **Authorization (RBAC Check):** The `rbac.middleware.ts` inspects the user's `role` against the endpoint's required permission level (e.g., only `pharmacy_manager` can process GRN/GIN adjustments; only `public_user` can place orders).
3. **Tenant Scoping (Implicit pharmacyId Injection):** For tenant-scoped operations, the API automatically applies a `pharmacyId` filter to the database query. The `pharmacyId` is **never** accepted from the client request body — it is always derived from the authenticated JWT, preventing tenant-hopping attacks.
4. **Schema Validation:** Mongoose checks that the request body contains all required fields (e.g., `batchNumber`, `quantity`, `expiryDate`) and that data types are correct. Invalid requests are rejected with descriptive validation error messages.
5. **Business Logic Check:** The service layer verifies domain-specific invariants — for stock adjustments, it ensures the specific batch being adjusted exists and has sufficient quantity; for orders, it validates that the requested medicines exist at the target pharmacy and have adequate stock; for expiration dates, it ensures the date is in the future.
6. **Audit Capture:** Upon successful mutation, the centralized `auditLogger.ts` utility records the action with full attribution (userId, ipAddress, userAgent), resource identification (resource type, resourceId), and state snapshots (before/after).

This multi-layered approach ensures that the shared backend remains a robust and reliable "Source of Truth" for all connected clients — both the SaaS tenant dashboard and the consumer mobile marketplace — providing the structural integrity required for a mission-critical, multi-tenant medical supply chain.