# Software Requirements Specification (SRS) – Pharma‑Net B2B2C Multi-Tenant SaaS Pharmaceutical Logistics Platform

| Field        | Details                        |
|--------------|--------------------------------|
| **Version**  | 2.0                            |
| **Date**     | 2026‑03‑31                     |
| **Authors**  | Intern Development Team        |

**Distribution:** This SRS is intended for the Pharma‑Net project stakeholders, including web developers, system architects, QA testers, and administrative managers.

**Approval:** _________________________ (Project Sponsor) &nbsp;&nbsp; Date: __________

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [System Scope and Objectives](#2-system-scope-and-objectives)
3. [Overall Description](#3-overall-description)
4. [External Interface Requirements](#4-external-interface-requirements)
5. [System Features (Functional Requirements)](#5-system-features-functional-requirements)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [Verification and Validation](#7-verification-and-validation)
8. [Appendices](#8-appendices)
9. [Deployment and Environment](#9-deployment-and-environment)
10. [Data Privacy and Retention](#10-data-privacy-and-retention)
11. [Risk Assessment and Mitigation](#11-risk-assessment-and-mitigation)
- [Conclusion](#conclusion)

---

## 1. Introduction

The Pharma‑Net platform is a centralized, multi-tenant SaaS system designed to modernize the pharmaceutical supply chain by connecting local Pharmacies directly with Public Users (Patients). Historically, the industry has faced inefficiencies due to fragmented data, meaning patients cannot easily locate available medications locally. Pharma‑Net addresses this by offering a digital marketplace. Pharmacy Managers use the SaaS dashboard to manage their specific inventory and fulfill incoming orders, replacing manual "phone calls and spreadsheets" for inventory tracking.

The primary goals are transparency and accessibility in medicine discovery and procurement. Key features include tenant-isolated stock tracking, public marketplace search, role-based access, automated order workflows, and comprehensive audit logs. This SRS document, following IEEE Std. 29148:2018 (ISO/IEC/IEEE 29148) guidelines, specifies all functional and non-functional requirements for the Pharma‑Net platform. It will guide developers in creating the Node.js/Express API, MongoDB multi-tenant schemas, and React.js frontend dashboard, as well as assist stakeholders in understanding system capabilities and regulatory compliance.

This document is organized as follows: Section 2 covers system scope and objectives; Section 3 provides overall system description; Section 4 details external interface requirements; Section 5 lists system features and functional requirements with acceptance criteria; Section 6 covers non-functional requirements; Section 7 describes verification/validation including a traceability matrix; followed by appendices with API specs, data models, and diagrams.

---

## 2. System Scope and Objectives

The Pharma-Net Shared Backend System (API & Database) provides a centralized, multi-tenant infrastructure for both the SaaS web dashboard and the consumer mobile application. While the Web Team (we) builds the full SaaS management interface for Pharmacy Managers and System Administrators, the Mobile UI for Public Users (Patients) is developed by a separate team. However, all business logic, multi-tenant data isolation, stock validation, and data integrity (ALCOA+) are enforced at the API level. The system focuses exclusively on the medicine discovery, ordering, and inventory management phase of the pharmaceutical lifecycle. It does not handle patient medical records, prescription processing beyond order placement, insurance claims, or advanced clinical functions. The platform provides:

- **Global Marketplace Visibility:** Public Users (via the Mobile App *(out of our scope)*) can search for medicines across all onboarded pharmacy tenants simultaneously, discovering real-time availability, pricing, and pharmacy details to enable informed purchasing decisions.
- **Automated Order Lifecycle:** Public Users submit orders through the Mobile UI targeting a specific pharmacy; the Pharmacy Manager receives, reviews, and approves them via the SaaS tenant dashboard. Stock levels update atomically upon order fulfillment.
- **Multi-Tenant Data Isolation:** Each pharmacy operates as an isolated SaaS tenant. A Pharmacy Manager's operations (inventory, orders, payments, reports) are strictly bounded by their `pharmacyId`, ensuring Pharmacy A can never access Pharmacy B's data.
- **Role-Based Security:** Three user roles (System Administrator, Pharmacy Manager, Public User) have distinct permissions (e.g., public users can search and place orders through the mobile UI, pharmacy managers manage local inventory and fulfill orders, admins govern the platform).
- **Reporting and Alerts:** Pharmacy Managers access tenant-scoped reports on sales volumes, low-stock alerts, and expiring medicines. System Administrators access aggregated platform-wide metrics.
- **Auditability:** All critical actions (logins, approvals, stock changes, payments) are logged with timestamps, user IDs, IP addresses, and before/after state snapshots to comply with data integrity standards (e.g., FDA's 21 CFR Part 11 and ALCOA+).

The system's constraints include: use of the MERN stack (MongoDB, Express, React, Node) with TypeScript, stateless JWT authentication with embedded `pharmacyId` for tenant scoping, and strict adherence to data integrity best practices (ALCOA+). It assumes reliable internet connectivity, availability of standard hardware (PCs, barcode scanners, printers), and compliance with local distribution laws.

---

## 3. Overall Description

### 3.1 Product Perspective

Pharma-Net is a distributed, multi-tenant SaaS system consisting of a shared MERN-stack backend and two distinct client applications. The SaaS Web Dashboard (in scope) serves Pharmacy Managers for tenant-isolated inventory/order management and System Administrators for platform governance. The Mobile Application (external scope) serves Public Users (Patients) for marketplace search and order placement. Both communicate with the same RESTful API to ensure a single 'source of truth' for inventory, with tenant isolation enforced through `pharmacyId` foreign keys on all scoped database documents.

> **Figure 1:** Multi-tenant MERN-stack architecture (SaaS web client + mobile consumer client → shared Node.js/Express API with tenant gate → MongoDB with pharmacyId-scoped collections), containerized for deployment.

### 3.2 Product Functions and Modules

Pharma‑Net's functionality is organized into modular components, each corresponding to a core business area within the multi-tenant model:

- **Authentication & Authorization:** Account creation, login, JWT token management with embedded `pharmacyId`, and three-tier Role-Based Access Control (RBAC): `admin`, `pharmacy_manager`, `public_user`.
- **Multi-Tenant Medicine & Inventory Management:** Tenant-scoped CRUD operations on drug records (auto-stamped with `pharmacyId`), batch/lot tracking with GTIN barcodes, GRN/GIN stock transactions, and automated low-stock alerts per tenant.
- **Global Marketplace Search:** Cross-tenant medicine discovery API enabling Public Users to search medicines across all onboarded pharmacy tenants simultaneously.
- **Consumer Order Management:** Public Users place orders targeting a specific pharmacy; orders are stamped with both `customerId` and `pharmacyId`. Pharmacy Managers review (approve/reject) and fulfill them through a status lifecycle (Pending → Approved → Processing → Ready for Pickup → Delivered).
- **Payment Management:** Tenant-scoped recording of payments against orders (payment type, status tracking) linked to both the order and the pharmacy tenant.
- **Reporting & Analytics:** Tenant-scoped dashboards for Pharmacy Managers (sales, inventory, expiry forecasts) and platform-wide metrics for System Administrators.

Each module will be implemented as a set of API endpoints and corresponding frontend views. For example, the Inventory module includes endpoints like `POST /api/medicines` (tenant-scoped) and `GET /api/medicines/marketplace` (global search), and frontend pages like a Tenant Inventory Grid. The modular design allows incremental development and testing of each feature.

### 3.3 User Classes and Characteristics

- **System Administrator (Web):** Platform owner with global privileges. Can manage all pharmacy tenant accounts and roles, activate/deactivate tenants, configure system settings, and view cross-tenant audit logs. Expert level, expects a dashboard overview of platform health and tenant metrics.
- **Pharmacy Manager (Web — SaaS Tenant):** Operates an individual pharmacy as an isolated SaaS tenant. Can add/edit their local medicine catalog, manage batch tracking, set reorder thresholds, process GRN/GIN stock adjustments, review and fulfill incoming consumer orders, record payments, and generate tenant-scoped reports. Moderate technical skill; needs clear forms for data entry and order management. **All operations are strictly bounded by their `pharmacyId`.**
- **Public User / Patient (Mobile UI — API Consumer):** External user who consumes the API to search the global marketplace for medicine availability across all pharmacies, compare pricing, place orders at a specific pharmacy, and track order status. Does not use the SaaS web dashboard.

### 3.4 Design and Implementation Constraints

- **Technology Stack:** Must use React.js v19 with TypeScript and Vite (frontend), Node.js/Express v5 with TypeScript (API), MongoDB with Mongoose v9 (database). Alternatives need formal approval.
- **Multi-Tenancy Model:** Shared Database, Shared Schema. Tenant isolation enforced at the application layer via `pharmacyId` foreign keys, extracted from JWT payload — never from client request bodies.
- **Authentication:** JWT tokens (stateless) with configurable expiration will secure API calls. The JWT payload must include `userId`, `role`, and `pharmacyId` for tenant-scoped operations. Cookies or server sessions are not used.
- **Data Integrity Standards:** The design must anticipate 21 CFR Part 11 and GAMP5 compliance requirements (e.g., immutable audit trails, before/after state capture, attributable actions) even in this simulation. Audit logs and inventory transactions are schema-level immutable.
- **Platform Support:** Web front-end must be responsive on modern browsers (Chrome, Firefox, Safari). The backend runs on a Linux-based server (Ubuntu or similar).
- **Schema Validation:** Use Mongoose ODM (v9+) to define strict schemas and data types for MongoDB collections, preventing invalid data entries. All tenant-scoped collections must include indexed `pharmacyId` fields.
- **Stateless Services:** The Node.js API will be stateless and container-friendly, enabling horizontal scaling (e.g. multiple API instances behind a load balancer).

### 3.5 Assumptions and Dependencies

- **Network Access:** Users have reliable internet. The system does not support offline mode.
- **Third-Party Services:** Email/SMS providers may be integrated later for alerts. Payment recording is simulated; no real payment gateway is used.
- **Hardware:** Pharmacies have barcode scanners/printers, but all inputs can be entered manually if needed.
- **Regulatory Compliance:** It is assumed that organizational policies enforce legal drug handling; Pharma‑Net provides the tools (e.g., logging, role restrictions, tenant isolation) but does not itself guarantee legal compliance.
- **Tenant Onboarding:** System Administrators create pharmacy tenant accounts. Self-registration for pharmacy tenants is not supported in the initial release.

---

## 4. External Interface Requirements

### 4.1 User Interfaces

- **System Administrator Console:** A web page showing platform-wide KPIs (total active tenants, aggregate order volume, low-stock alerts across tenants, revenue metrics). Includes tenant account management console (create, activate, deactivate pharmacy accounts).
- **Pharmacy Manager Tenant Dashboard:** A tenant-scoped web interface showing only data belonging to the manager's `pharmacyId`. Includes inventory grid, incoming order queue, payment history, and analytical dashboards.
- **Inventory Management UI:** A tabular tenant-scoped inventory view with inline-editing for stock counts and filters by category/expiry. Color-coding highlights low or near-expiry items within the pharmacy's catalog.
- **Order Processing Pages:** Pharmacy Manager view lists incoming consumer orders (filtered by `pharmacyId`). Single-click buttons to Approve/Reject orders. Each action prompts for confirmation and optional notes (especially on rejection).
- **Public User Ordering UI:** The Web Team (we) is responsible for the SaaS Management Dashboard (Admin/Pharmacy Manager). The UI for Public User ordering is handled by the Mobile Team; however, the Web Team defines the API request/response structures that power that UI, including the global marketplace search and order placement endpoints.
- **Reporting Views:** Tenant-scoped web pages for generating/exporting reports (e.g. a date-picker form to generate "sales by medicine" or "expiring soon" reports for the manager's pharmacy). Downloadable as CSV/PDF.
- All pages use consistent navigation and branding. Forms validate input (e.g., require email format on registration) and display clear error messages.

### 4.2 Hardware Interfaces

- **Barcode/RFID Scanners (Optional):** Pharmacy dashboard UI will allow scanning of barcodes (GTIN) for quick stock updates (via standard keyboard-input emulation).
- **Printers:** Pharmacies can print order receipts and reports (standard thermal or laser printers via browser print dialog). No specialized hardware integration is required; printed output is generated as standard PDF or HTML printouts.

### 4.3 Software Interfaces

- **Operating Systems:** The backend is designed to run on Node.js (LTS) on Linux servers. The frontend runs on any OS with a modern browser.
- **Database:** MongoDB (latest) accessed via Mongoose ODM (v9+). These are explicitly required choices. The system does not support other DBs. Collections use `pharmacyId` foreign keys for multi-tenant scoping.
- **Libraries:** Express.js (v5+) for API routing, React.js (v19+) on frontend with Vite build tool. Security libs: bcrypt for password hashing, jsonwebtoken for JWT management, Helmet.js for HTTP security headers.
- **Communication:** All data exchanged via HTTPS/REST. JSON is used for request and response payloads. No XML or binary protocols are used.
- **APIs:** The system exposes its core functionality via a REST API (see Appendix). Examples: `POST /api/auth/login` for authentication, `GET /api/medicines` for tenant-scoped inventory, `GET /api/medicines/marketplace` for global public search, etc. Authentication token (JWT) is sent in the `Authorization: Bearer` header. The JWT includes `pharmacyId` for automatic tenant scoping.

### 4.4 Communications Interfaces

- **Protocols:** HTTPS/TLS 1.2+ is mandatory for all client-server communication. The API follows RESTful conventions (e.g. GET for read, POST for create, PATCH for update).
- **Message Format:** All API requests and responses use JSON with UTF-8 encoding. Dates use ISO 8601 format.
- **Standards:** API URIs use lowercase, plural nouns (e.g. `/api/orders`). HTTP status codes reflect results (200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Server Error, etc.) in compliance with REST best practices.

---

## 5. System Features (Functional Requirements)

Each requirement below is prefixed (e.g., FR-1.1) and followed by its Acceptance Criteria in bullet points. The criteria define conditions that must be met to consider the requirement implemented successfully.

### 5.1 Authentication and Authorization (Security)

- **FR-1.1: User Registration.** The system shall allow new users to create accounts with name, unique email, and password. Registration supports all three roles: `admin`, `pharmacy_manager`, `public_user`.
  - *Acceptance:* A registration form/API is available; submitting valid data creates a new user record with hashed password. An error is shown if email already exists. For `pharmacy_manager` accounts, admin-initiated creation stamps the account as a tenant identity.

- **FR-1.2: Password Security.** The system shall automatically hash all passwords with bcrypt before storage.
  - *Acceptance:* Inspecting the user database shows no plaintext passwords; password comparisons use bcrypt compare.

- **FR-1.3: Secure Login.** The system shall authenticate users via email/password. On success, it returns a signed JWT containing the user's ID, role, and `pharmacyId` (for pharmacy_manager accounts).
  - *Acceptance:* A valid login request returns HTTP 200 with a JSON web token in response. The token includes the correct user ID, role, and `pharmacyId` (if applicable) and is signed with the server secret. Invalid credentials yield a 401 error.

- **FR-1.4: Role-Based Access Control (RBAC).** The system shall restrict API route access based on the user's role in the JWT. Three roles exist: `admin`, `pharmacy_manager`, and `public_user`. Public users can search the marketplace and place orders; pharmacy managers can manage their tenant-scoped inventory and fulfill orders; admins manage tenant accounts and platform configuration.
  - *Acceptance:* Attempting to access a forbidden endpoint (e.g. a public user trying to create a medicine, or a pharmacy manager trying to access another tenant's data) returns 403 Forbidden. The role and `pharmacyId` embedded in the JWT determine accessible routes and data scope.

- **FR-1.5: Token Expiration.** JWTs shall expire after a fixed time (e.g. 8 hours). Users must re-login after expiration.
  - *Acceptance:* Tokens include an `exp` claim; requests with expired tokens receive a 401 Unauthorized. Token lifetime is configurable via an environment variable (e.g. `JWT_EXPIRATION`).

- **FR-1.6: Tenant Context Injection.** For `pharmacy_manager` users, the system shall automatically extract `pharmacyId` from the JWT and inject it into all downstream database queries. The `pharmacyId` is never accepted from the client request body.
  - *Acceptance:* A pharmacy manager's API calls automatically scope all queries by their `pharmacyId`. Attempting to pass a different `pharmacyId` in the request body has no effect — the JWT value always prevails. Cross-tenant data access is impossible.

### 5.2 Multi-Tenant Medicine and Inventory Management

- **FR-2.1: Add New Medication (Tenant-Scoped).** Pharmacy Managers can add new drug items to their local catalog with required fields: Name, SKU, Category, Unit Price, and Unit of Measure. The system automatically stamps the record with the manager's `pharmacyId`.
  - *Acceptance:* A POST to `/api/medicines` with valid data returns 201 Created and the new medicine appears in the database with the correct `pharmacyId`. Missing fields cause a 400 Bad Request with descriptive error. The medicine is only visible to the owning pharmacy tenant.

- **FR-2.2: Batch and Lot Tracking.** Each medicine entry shall support an embedded array of batch records, each tracking: batch number, GTIN barcode, quantity, expiry date, manufacture date, supplier name, shelf location, and received date.
  - *Acceptance:* The Medicine schema includes a `batches` array of sub-documents. Adding a batch with at minimum `batchNumber`, `quantity`, and `expiryDate` is supported. The system allows queries filtering by batch number within the tenant's inventory.

- **FR-2.3: Expiry Management.** Pharmacy Managers must input expiration dates per batch. The system auto-flags any medicine with batches within 90 days of expiry.
  - *Acceptance:* The Batch sub-schema includes an `expiryDate`. The tenant dashboard visibly highlights items expiring soon. A report listing near-expiry items can be generated, scoped to the manager's pharmacy.

- **FR-2.4: Real-Time Stock Updates.** Stock counts update in real-time whenever orders are fulfilled or manual GRN/GIN adjustments are made, all within the pharmacy tenant's boundary.
  - *Acceptance:* After a stock adjustment or order fulfillment, the corresponding medicine `totalStock` in MongoDB is updated atomically. A GET request to `/api/medicines` (tenant-scoped) immediately reflects the new quantities. Only the owning pharmacy's stock is affected.

- **FR-2.5: Low-Stock Notifications.** The system shall alert Pharmacy Managers on their tenant dashboard when any medicine's stock falls below the configurable `reorderThreshold`.
  - *Acceptance:* Thresholds are set per medicine item (default: 50 units). When a stock adjustment triggers `totalStock < reorderThreshold`, the Mongoose virtual `isLowStock` returns `true` and a UI alert or badge appears on the tenant dashboard.

- **FR-2.6: Global Marketplace Search (Public).** Public Users shall search medicines across all onboarded pharmacy tenants by name, generic name, or category. Results include pharmacy name, unit price, availability (stock count), and category.
  - *Acceptance:* The API supports a public search endpoint (e.g. `/api/medicines/marketplace?name=aspirin&category=antibiotic`) that returns matching items aggregated across all active pharmacy tenants. No authentication is required for basic search. Sensitive tenant data (supplier names, shelf locations, internal batch details) is excluded from public responses.

- **FR-2.7: Inventory Transactions (GRN/GIN).** The system shall support Goods Received Notes (GRN) for incoming stock and Goods Issued Notes (GIN) for manual stock removals, each creating an immutable transaction record within the pharmacy tenant's boundary.
  - *Acceptance:* Forms are provided to enter GRN (specify batch details and quantities received) and GIN (e.g. for write-offs or dispensed stock). Creating a GRN increases `totalStock`, while a GIN decreases it. Each transaction creates an immutable `InventoryTransaction` record capturing `stockBefore`, `stockAfter`, `quantityChanged`, and `batchNumber`. These records cannot be modified or deleted (schema-level enforcement).

### 5.3 Order Management

- **FR-3.1: Order Placement (Cross-Tenant).** The system shall provide a secure API endpoint (`POST /api/orders`) to allow authenticated Public Users to submit order requests targeting a specific pharmacy. The backend stamps the order with both the consumer's `customerId` and the target pharmacy's `pharmacyId`, then validates the request against real-time stock levels at that pharmacy.
  - *Acceptance:* A POST to `/api/orders` with a list of items and a target `pharmacyId` returns 201 Created and status "Pending." The response includes an order ID, summary, and target pharmacy details. Only `public_user` role can place orders.

- **FR-3.2: Stock Validation.** Before finalizing an order, the system atomically checks the target pharmacy's stock within a MongoDB transaction. If insufficient stock exists, the order is not placed and the user is notified.
  - *Acceptance:* Attempting to order more units than available at the target pharmacy yields a descriptive error and prevents order creation. Backend validation checks stock within a transaction and rejects the request with 400 and message if insufficient.

- **FR-3.3: Order Review and Fulfillment.** Pharmacy Managers can view incoming consumer orders (filtered by their `pharmacyId`) and approve or reject them. Rejection requires providing a reason.
  - *Acceptance:* An order's status can be changed via `PATCH /api/orders/{id}` by the owning pharmacy manager. Approving sets status to "Approved" and includes approval timestamp; rejecting sets "Rejected" with reason. The order record reflects the action and actor. Only orders matching the manager's `pharmacyId` are accessible.

- **FR-3.4: Order Status Tracking.** The system tracks each order through states: Pending, Approved, Processing, Ready for Pickup, Delivered, Rejected. Each state change is logged in the audit trail.
  - *Acceptance:* The order record contains a `status` field. Frontend displays the current status with a visual stepper. An order history view shows each state transition with date/time. Orders in "Delivered" state are marked completed.

- **FR-3.5: Order History.** All users can view their relevant order history with full details (items, costs, dates, status).
  - *Acceptance:* `GET /api/orders` returns orders scoped to the authenticated user: public users see their own placed orders across all pharmacies; pharmacy managers see all incoming orders for their pharmacy (`pharmacyId`-scoped); admins can view cross-tenant order data. Each order's detail includes line items, total cost, status history, and payment status.

### 5.4 Payment Management

- **FR-4.1: Record Payment.** Pharmacy Managers can record payments against orders within their tenant boundary, specifying amount and method (bank transfer, mobile money, cash).
  - *Acceptance:* A POST to `/api/payments` with order ID creates a payment record stamped with the pharmacy's `pharmacyId`. The corresponding order's record shows updated payment info. The API rejects payments on non-existent orders or orders belonging to a different pharmacy tenant.

- **FR-4.2: Payment Status Mapping.** Each order links to a payment status (Unpaid, Partially Paid, Paid).
  - *Acceptance:* The Order schema includes a `paymentStatus` enum. Recording a partial payment updates status to "Partially Paid"; paying the full amount sets "Paid".

- **FR-4.3: Financial History.** Public Users can view their spend history per order. Pharmacy Managers can view their tenant-scoped payment records.
  - *Acceptance:* The public user's mobile interface shows each order's total cost and payment status. Pharmacy Managers see a tenant-scoped payment dashboard. `GET /api/payments` returns payment records scoped to the authenticated user's role and `pharmacyId`.

- **FR-4.4: Payment Audit Trail.** Each payment entry must include a timestamp, amount, payment method, and the user IDs of both the consumer and the recording pharmacy manager.
  - *Acceptance:* The Payment record contains `timestamp`, `customerId`, `pharmacyId`, and `recordedBy`. Audit logs record every payment creation with these details. Historical views confirm that payments cannot be edited without trace.

### 5.5 Reporting and Analytics

- **FR-5.1: Tenant Inventory Report.** Pharmacy Managers can generate a report of all current stock in their pharmacy, including batch numbers, expiry dates, and value.
  - *Acceptance:* Accessing `/api/reports/inventory` (tenant-scoped) returns a summary of the pharmacy's stock items. The SaaS dashboard lets managers export this report. Values are calculated (sum of quantity×price) and included. Only the pharmacy's own data is visible.

- **FR-5.2: Tenant Sales Statistics.** Pharmacy Managers can generate daily/monthly summaries of order volumes, top-selling medicines, and revenue for their pharmacy.
  - *Acceptance:* `/api/reports/sales?startDate=...&endDate=...` returns aggregated data scoped to the manager's `pharmacyId` (number of orders, revenue, top medicines). The SaaS dashboard presents charts or tables for these stats.

- **FR-5.3: Expiration Forecast.** Pharmacy Managers can generate a report of all items in their catalog expiring within a selected date range.
  - *Acceptance:* `/api/reports/expiring?before=YYYY-MM-DD` returns all stock with batch expiry <= that date, scoped to the manager's pharmacy. The UI highlights critical items.

- **FR-5.4: Audit Log Access.** System Administrators can access a global, cross-tenant log of all significant actions (user logins, record changes, approvals, stock movements). Pharmacy Managers can access their own tenant-scoped audit trail.
  - *Acceptance:* A `GET /api/logs` for admins returns a chronologically ordered list of cross-tenant audit entries (immutable). Pharmacy managers accessing the same endpoint see only logs related to their `pharmacyId`. The log includes user ID, action type, timestamp, resource type, resource ID, and before/after state. Any attempt to modify or delete logs is prevented at the schema level.

- **FR-5.5: Platform Analytics (Admin).** System Administrators can view aggregated platform-wide metrics: total active tenants, total GMV, platform-wide order volume, and tenant health summaries.
  - *Acceptance:* `/api/reports/platform` (admin-only) returns aggregated metrics across all tenants. The admin console displays these in a dashboard format.

---

## 6. Non-Functional Requirements

The platform's quality attributes and constraints are detailed below, with acceptance criteria to ensure they are met.

### 6.1 Performance and Scalability

- **NFR-1.1: Response Time.** Simple tenant-scoped requests (e.g. GET medicines) must complete in under 1 second; complex reports and cross-tenant marketplace searches in under 5 seconds.
  - *Acceptance:* Under test load, the 95th percentile response time for `GET /api/medicines` (tenant-scoped) is < 1000ms; a global marketplace search or multi-month report query averages < 5000ms.

- **NFR-1.2: Concurrency.** The system shall support at least 100 concurrent users across multiple pharmacy tenants without degradation.
  - *Acceptance:* Under a load test simulating 100 simultaneous active sessions (mix of pharmacy managers and public users), response times remain within 10% of baseline for normal traffic.

- **NFR-1.3: Scalability.** The Node.js API is stateless to allow horizontal scaling (multiple instances). The multi-tenant database design supports at least 100 pharmacy tenants with 10,000 medicine records each efficiently.
  - *Acceptance:* The API runs successfully in Docker containers behind a load balancer. MongoDB collections are indexed on frequently queried fields (e.g. `email`, `sku`, `pharmacyId`, `name`, `category`) to maintain performance as tenants and data grow.

- **NFR-1.4: Database Performance.** Critical query fields must be indexed for both tenant-scoped and global marketplace queries.
  - *Acceptance:* The MongoDB schema definitions include indexes on `Users.email`, `Medicines.sku`, `Medicines.name`, `Medicines.category`, `Medicines.pharmacyId`, and `Medicines.isDeleted`. Profiling shows search queries use indexes (no collection scans).

### 6.2 Security and Data Integrity

- **NFR-2.1: Authentication Security.** All API endpoints (except login, registration, and public marketplace search) require a valid JWT. Middleware enforces token verification for every protected request.
  - *Acceptance:* Any request without or with an invalid JWT to a protected endpoint receives HTTP 401. A penetration test confirms unauthorized calls are blocked.

- **NFR-2.2: Tenant Isolation Security.** No user shall be able to access, query, or mutate data belonging to a different pharmacy tenant. The `pharmacyId` is always derived from the JWT — never from client input.
  - *Acceptance:* A comprehensive test suite verifies that Pharmacy Manager A cannot read or write Pharmacy Manager B's medicines, orders, payments, or transactions under any combination of API calls. Attempting to pass a foreign `pharmacyId` in request bodies has no effect.

- **NFR-2.3: Data at Rest.** Sensitive data (passwords) are hashed (bcrypt). Database access is protected by strong credentials and (in production) restricted by network rules.
  - *Acceptance:* The production MongoDB instance enforces authentication. A data breach simulation confirms that hashed passwords cannot be reversed.

- **NFR-2.4: Data in Transit.** All traffic is encrypted via HTTPS/TLS 1.2 or higher.
  - *Acceptance:* The server has TLS enabled; SSL tests (e.g. Qualys SSL Labs) show no insecure cipher suites, and browsers report secure connection.

- **NFR-2.5: Atomic Transactions.** Critical multi-step operations (like fulfilling an order with stock deduction) must use MongoDB sessions/transactions to ensure all changes (order status, inventory decrement, transaction record creation) apply together or not at all.
  - *Acceptance:* In case of failure during order fulfillment (e.g. DB error), neither the order status, the inventory, nor the transaction record is partially updated (rolled back). Unit tests simulate errors to verify atomicity.

### 6.3 Reliability and Availability

- **NFR-3.1: Uptime.** Target 99.9% availability during business hours. Scheduled maintenance is notified at least 24h in advance.
  - *Acceptance:* Monitoring logs show < 0.1% downtime during working hours over a month-long test. Maintenance windows (if any) are logged and communicated to users via the dashboard.

- **NFR-3.2: Backup and Recovery.** The database is backed up daily. The recovery process (restoring the latest backup) can be completed within 4 hours.
  - *Acceptance:* Automated scripts (e.g. `mongodump`) run nightly; periodic restore drills confirm data can be recovered fully from the last backup. Documentation details each recovery step.

- **NFR-3.3: Error Handling.** The application implements centralized error handling. Unhandled errors are logged (server-side log) and a user-friendly error message is shown to clients.
  - *Acceptance:* Frontend never shows stack traces or raw exceptions to the user. Server logs record the full error detail for developers. Error pages display generic messages (e.g. "An unexpected error occurred, please try again").

### 6.4 Regulatory Compliance (Simulation)

- **NFR-4.1: Audit Trails.** To satisfy ALCOA+ (Attributable, Legible, Contemporaneous, Original, Accurate), the Node.js API must automatically generate an immutable audit log for every transaction, identifying the User ID, Timestamp, IP address, and User-Agent regardless of whether the action originated from the SaaS Web Dashboard or the Mobile Consumer interface.
  - *Acceptance:* Every data-modifying API call writes an entry to an `AuditLog` collection. An audit record includes `userId`, `actionType`, `resource`, `resourceId`, `timestamp`, `ipAddress`, `userAgent`, and `before`/`after` state snapshots. Logs are immutable (append-only) — Mongoose pre-hooks block all update and delete operations at the schema level.

- **NFR-4.2: Data Retention.** Records shall not be permanently deleted; instead, they are "soft-deleted" (marked inactive with `isDeleted: true` and `deletedAt` timestamp) to preserve history.
  - *Acceptance:* Deleting a medicine, user, or order sets an `isDeleted` flag and timestamp, rather than removing the document. Queries exclude `isDeleted` items by default. This supports historical auditability and tenant-scoped compliance review.

- **NFR-4.3: Identity Verification.** Each user has a unique ID. Actions requiring accountability (e.g. approving an order, adjusting stock) permanently associate the user's identity with that record.
  - *Acceptance:* The database enforces `Users.email` as unique. The Order schema stores `approvedBy` (user ID). Inventory transactions store `createdBy` (user ID). Audit logs store `userId`. No action occurs anonymously.

- **NFR-4.4: Immutable Transaction Ledger.** Inventory transactions (GRN/GIN) shall be immutable — no updates or deletes are permitted after creation.
  - *Acceptance:* The `InventoryTransaction` Mongoose schema includes pre-hooks that throw errors on `findOneAndUpdate`, `deleteOne`, `updateOne`, and `replaceOne` operations. Attempting to modify a transaction record returns an error.

---

## 7. Verification and Validation

To ensure all requirements are testable and traceable, a traceability matrix will map each functional and non-functional requirement to corresponding test cases (e.g. unit tests, integration tests, and acceptance tests). This helps confirm full coverage. The matrix is shown below. Each requirement above has associated acceptance tests, and automated test suites will be developed to exercise them.

### 7.1 Traceability Matrix

| Requirement ID | Requirement Description                  | Test Case ID              |
|----------------|------------------------------------------|---------------------------|
| FR-1.1         | User Registration                        | TC-Auth-1 (registration)  |
| FR-1.2         | Password Hashing                         | TC-Auth-2 (security)      |
| FR-1.3         | Secure Login (JWT + pharmacyId)          | TC-Auth-3 (login flow)    |
| FR-1.4         | Role-Based Access Control                | TC-Auth-4 (RBAC)          |
| FR-1.5         | Token Expiration                         | TC-Auth-5 (token expiry)  |
| FR-1.6         | Tenant Context Injection                 | TC-Auth-6 (tenant gate)   |
| FR-2.1         | Add New Medication (Tenant-Scoped)       | TC-Inv-1 (create meds)    |
| FR-2.2         | Batch/Lot Tracking                       | TC-Inv-2 (batch field)    |
| FR-2.3         | Expiry Date Management                   | TC-Inv-3 (expiry alerts)  |
| FR-2.4         | Real-Time Stock Updates                  | TC-Inv-4 (stock update)   |
| FR-2.5         | Low-Stock Notifications                  | TC-Inv-5 (alerts)         |
| FR-2.6         | Global Marketplace Search                | TC-Inv-6 (marketplace)    |
| FR-2.7         | GRN/GIN Inventory Transactions           | TC-Inv-7 (GRN/GIN flow)  |
| FR-3.1         | Order Placement (Cross-Tenant)           | TC-Order-1 (create order) |
| FR-3.2         | Stock Validation on Order                | TC-Order-2 (stock check)  |
| FR-3.3         | Order Approval/Rejection (Tenant-Scoped) | TC-Order-3 (approve/reject)|
| FR-3.4         | Order Status Tracking                    | TC-Order-4 (status changes)|
| FR-3.5         | Order History (Role-Scoped)              | TC-Order-5 (history)      |
| FR-4.1         | Record Payment (Tenant-Scoped)           | TC-Pay-1 (add payment)    |
| FR-4.2         | Payment Status Mapping                   | TC-Pay-2 (status update)  |
| FR-4.3         | Financial History                        | TC-Pay-3 (history view)   |
| FR-4.4         | Payment Audit Trail                      | TC-Pay-4 (audit log)      |
| FR-5.1         | Tenant Inventory Report                  | TC-Rep-1 (inventory report)|
| FR-5.2         | Tenant Sales Statistics                  | TC-Rep-2 (sales report)   |
| FR-5.3         | Expiration Forecast                      | TC-Rep-3 (expiring report)|
| FR-5.4         | Audit Log Access (Role-Scoped)           | TC-Rep-4 (logs access)    |
| FR-5.5         | Platform Analytics (Admin)               | TC-Rep-5 (platform metrics)|
| NFR-1.1        | Response Time                            | TC-Perf-1 (load test)     |
| NFR-1.2        | Concurrency                              | TC-Perf-2 (stress test)   |
| NFR-1.3        | Scalability                              | TC-Perf-3 (scale test)    |
| NFR-1.4        | DB Indexes Performance                   | TC-Perf-4 (query speed)   |
| NFR-2.1        | Secured Endpoints                        | TC-Sec-1 (auth tests)     |
| NFR-2.2        | Tenant Isolation Security                | TC-Sec-2 (isolation test) |
| NFR-2.3        | Data Encryption/Hashing                  | TC-Sec-3 (encryption test)|
| NFR-2.4        | HTTPS/TLS Usage                          | TC-Sec-4 (ssl audit)      |
| NFR-2.5        | Atomic Transactions                      | TC-Sec-5 (rollback test)  |
| NFR-3.1        | Availability (uptime)                    | TC-Rel-1 (monitor logs)   |
| NFR-3.2        | Backup and Recovery                      | TC-Rel-2 (restore drill)  |
| NFR-3.3        | Error Handling                           | TC-Rel-3 (error pages)    |
| NFR-4.1        | Audit Trail Maintenance                  | TC-Comp-1 (audit log test)|
| NFR-4.2        | Soft Delete of Records                   | TC-Comp-2 (soft delete)   |
| NFR-4.3        | User Identity in Actions                 | TC-Comp-3 (signature test)|
| NFR-4.4        | Immutable Transaction Ledger             | TC-Comp-4 (immutability)  |

Appendix A includes the full matrix mapping each requirement to detailed test cases and verification methods. Requirements are "testable" by design.

### 7.2 Acceptance Criteria (Summary)

Consistent with IEEE guidelines, each requirement above has specific acceptance conditions. Key examples include:

- **User Registration (FR-1.1):** Must only accept unique emails and store hashed passwords (bcrypt). Pharmacy manager accounts must be linked to a tenant identity.
- **Tenant Isolation (FR-1.6):** Every tenant-scoped query must automatically filter by the JWT-derived `pharmacyId`. Cross-tenant data access must be provably impossible.
- **Marketplace Search (FR-2.6):** Must return medicine results aggregated across all active pharmacy tenants without exposing sensitive tenant operational data.
- **Order Flow (FR-3.x):** Each order update triggers corresponding database changes (inventory decrement, status update, immutable transaction record) in an atomic transaction (all-or-nothing), scoped to the target pharmacy's `pharmacyId`.
- **Performance (NFR-1.x):** Meeting sub-second API responses under load tests with 100+ concurrent users across multiple tenants.
- **Security (NFR-2.x):** All protected endpoints reject unauthorized requests, tenant isolation prevents cross-tenant data leakage, and audit logs show every access (meeting ALCOA+ data integrity principles).

Each acceptance criterion will be verified by manual testing or automated unit/integration tests. For instance, TC-Sec-2 (isolation test) verifies that Pharmacy Manager A cannot access Pharmacy Manager B's data under any API call combination.

---

## 8. Appendices

### 8.1 Appendix A: Traceability Matrix

*(Included above in Section 7.1 for reference.)*

### 8.2 Appendix B: API Specification (Selected Endpoints)

The REST API follows standard patterns with multi-tenant scoping. Below are examples of key endpoints with sample requests/responses (JSON):

**`POST /api/auth/register`** – Register new user

```json
// Request
{ "name": "Dr. Abebe Pharmacy", "email": "abebe@pharma.com", "password": "Secret123", "role": "pharmacy_manager" }

// Response (201 Created)
{ "id": "609e…", "name": "Dr. Abebe Pharmacy", "email": "abebe@pharma.com", "role": "pharmacy_manager" }
```

**`POST /api/auth/login`** – Authenticate user

```json
// Request
{ "email": "abebe@pharma.com", "password": "Secret123" }

// Response (200 OK)
{ "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
// JWT Payload: { "userId": "609e…", "role": "pharmacy_manager", "pharmacyId": "609e…" }
```

**`GET /api/medicines`** – List tenant-scoped medicines (Pharmacy Manager)

```json
// Response (200 OK) — auto-filtered by pharmacyId from JWT
[
  { "id": "m1", "pharmacyId": "609e…", "name": "Aspirin", "sku": "ASP100", "category": "Analgesic", "unitPrice": 5.50, "totalStock": 120, "isLowStock": false, "batches": [{ "batchNumber": "B-2026-001", "quantity": 120, "expiryDate": "2027-12-31" }] },
  { "..." }
]
```

**`GET /api/medicines/marketplace?name=aspirin`** – Global marketplace search (Public User)

```json
// Response (200 OK) — aggregated across all pharmacy tenants
[
  { "medicineId": "m1", "name": "Aspirin", "category": "Analgesic", "unitPrice": 5.50, "totalStock": 120, "pharmacyName": "Dr. Abebe Pharmacy", "pharmacyId": "609e…" },
  { "medicineId": "m8", "name": "Aspirin", "category": "Analgesic", "unitPrice": 4.75, "totalStock": 85, "pharmacyName": "City Pharmacy", "pharmacyId": "710f…" }
]
```

**`POST /api/medicines`** – Add new medication (Pharmacy Manager — tenant-scoped)

```json
// Request — pharmacyId is auto-injected from JWT, NOT from request body
{ "name": "Amoxicillin", "sku": "AMX250", "category": "Antibiotic", "unitPrice": 12.75, "unitOfMeasure": "capsule", "totalStock": 200, "reorderThreshold": 50, "batches": [{ "batchNumber": "BATCH123", "quantity": 200, "expiryDate": "2027-06-30" }] }

// Response (201 Created)
{ "id": "m2", "pharmacyId": "609e…", "name": "Amoxicillin", "..." }
```

**`POST /api/orders`** – Submit consumer order (Public User → targeting a specific pharmacy)

```json
// Request
{ "pharmacyId": "609e…", "items": [{ "medicineId": "m1", "quantity": 10 }, { "medicineId": "m2", "quantity": 5 }] }

// Response (201 Created)
{ "orderId": "o7", "customerId": "u5", "pharmacyId": "609e…", "status": "pending", "items": ["..."], "totalAmount": 118.75 }
```

**`PATCH /api/orders/o7`** – Approve or update order (Pharmacy Manager — tenant-scoped)

```json
// Request to approve (only accessible if order.pharmacyId matches manager's pharmacyId)
{ "status": "approved" }

// Response
{ "orderId": "o7", "status": "approved", "approvedBy": "609e…", "updatedAt": "2026-03-31T14:23:00Z" }
```

**`GET /api/reports/sales?startDate=2026-01-01&endDate=2026-01-31`** – Generate tenant-scoped sales report (Pharmacy Manager)

```json
// Response — auto-scoped to the manager's pharmacyId
{ "pharmacyId": "609e…", "totalRevenue": 12345.67, "orderCount": 89, "topMedicines": [{ "name": "Amoxicillin", "qtySold": 150 }, "..."] }
```

The full API is documented in code comments and the `API_Documentation.md` file.

### 8.3 Appendix C: Database Schema (Mongoose Models)

The MongoDB data model uses six primary collections with multi-tenant scoping. Key fields (with types) include:

**Users:**
```js
{ _id: ObjectId, name: String, email: String (unique), passwordHash: String,
  role: String("admin"/"pharmacy_manager"/"public_user"),
  isActive: Boolean, isDeleted: Boolean, deletedAt: Date }
```

**Medicines (🔒 Tenant-Scoped):**
```js
{ _id: ObjectId, pharmacyId: ObjectId (ref Users — FK),
  name: String, sku: String (unique), genericName: String, category: String,
  unitPrice: Number, unitOfMeasure: String(enum), totalStock: Number,
  reorderThreshold: Number, batches: [{ batchNumber, gtin, quantity, expiryDate,
  manufactureDate, supplierName, shelfLocation, receivedAt }],
  isDeleted: Boolean, deletedAt: Date, createdBy: ObjectId (ref Users) }
// Virtual: isLowStock → true when totalStock < reorderThreshold
```

**InventoryTransactions (🔒 Tenant-Scoped · 🔐 Immutable):**
```js
{ _id: ObjectId, pharmacyId: ObjectId (FK), transactionType: String("GRN"/"GIN"),
  medicineId: ObjectId (ref Medicine), batchNumber: String,
  quantityChanged: Number, stockBefore: Number, stockAfter: Number,
  reason: String, referenceNumber: String, expiryDate: Date,
  createdBy: ObjectId (ref Users) }
// Schema-level immutability: update/delete operations blocked by pre-hooks
```

**Orders (🔒 Tenant-Scoped):**
```js
{ _id: ObjectId, customerId: ObjectId (ref Users — Public User),
  pharmacyId: ObjectId (ref Users — Pharmacy Tenant — FK),
  items: [{ medicineId: ObjectId, quantity: Number, unitPrice: Number }],
  totalAmount: Number, status: String(enum lifecycle), isDeleted: Boolean }
```

**Payments (🔒 Tenant-Scoped):**
```js
{ _id: ObjectId, orderId: ObjectId (ref Orders),
  pharmacyId: ObjectId (FK), customerId: ObjectId (ref Users),
  amount: Number, paymentMethod: String, status: String(enum) }
```

**AuditLogs (🔐 Immutable):**
```js
{ _id: ObjectId, userId: ObjectId (ref Users),
  actionType: String(enum: CREATE/UPDATE/DELETE/LOGIN/LOGOUT/APPROVE/REJECT/PAYMENT_RECORDED/GRN/GIN),
  resource: String(enum: User/Medicine/Order/Payment/InventoryTransaction),
  resourceId: ObjectId, before: Mixed, after: Mixed,
  ipAddress: String, userAgent: String, timestamp: Date }
// Schema-level immutability: update/delete operations blocked by pre-hooks
```

Mongoose schemas enforce these structures, with validation rules (e.g. required fields, value ranges, enum constraints), indexes on `pharmacyId` and other query fields, virtual properties (`isLowStock`), and immutability pre-hooks on compliance-critical collections. See the backend `src/modules/` directory for full definitions.

### 8.4 Appendix D: System Diagrams

The following diagrams illustrate the multi-tenant system architecture and workflows:

- **Figure 1** *(above)*: High-level multi-tenant component diagram of the Pharma‑Net MERN-stack (SaaS web client + mobile consumer client → shared Node.js/Express API with tenant gate → MongoDB with pharmacyId-scoped collections) in a containerized deployment environment.
- **Figure 2:** Sequence diagram for the cross-tenant Order lifecycle (Public User searches marketplace → selects pharmacy → submits order → System validates stock at target pharmacy → Pharmacy Manager approves → System atomically decrements stock → creates immutable transaction record → updates order status).
- **Figure 3:** Entity-Relationship (ER) data model showing key collections (Users, Medicines, InventoryTransactions, Orders, Payments, AuditLogs), their relationships via `pharmacyId` / `customerId` foreign keys, and tenant isolation boundaries.

*(Note: Figures 2 and 3 are (will be) provided in the design documentation; here we reference their existence.)*

---

## 9. Deployment and Environment

Pharma‑Net is intended to run in a containerized environment for ease of deployment and scaling. A typical deployment uses Docker containers:

- **Docker Images:** One image for the Node.js backend (includes all API code and multi-tenant middleware), one for the React frontend (built static files via Vite), and a managed MongoDB instance (e.g. hosted MongoDB Atlas or Dockerized).
- **Environment Variables:** Configurable via `.env` or deployment settings:
  - `NODE_ENV` (production/development)
  - `PORT` (for API, default: 5000)
  - `MONGO_URI` (database connection string)
  - `JWT_SECRET` (for signing tokens — must include pharmacyId in payload)
  - `JWT_EXPIRATION` (token lifetime, e.g. "8h")
  - `PASSWORD_SALT_ROUNDS` (bcrypt cost factor)
  - `CORS_ORIGIN` (comma-separated allowed origins for SaaS dashboard and mobile app)
- **Hosting Target:** The system can be hosted on cloud providers (e.g. AWS ECS/EKS, Azure Container Apps, or any Kubernetes cluster) or on-premise VMs. Continuous Integration pipelines will build Docker images and push to a registry. A load balancer (NGINX or cloud LB) routes traffic to the stateless Node.js containers for the API and to a static web server (or CDN) for the React SaaS dashboard.
- **CI/CD:** Automated builds and deployments are recommended. The monorepo structure (`backend/` + `frontend/`) supports independent build pipelines for each component.

---

## 10. Data Privacy and Retention

Pharma‑Net deals with commercially sensitive data (pharmacy stock levels, pricing, transaction history) and user personal data (emails, names). The multi-tenant model introduces additional privacy requirements — each pharmacy tenant's data must remain invisible to other tenants. Privacy measures include:

- **Minimal Storage:** Only necessary personal data are stored (no unnecessary PII). Passwords are hashed and never retrievable.
- **Tenant Data Isolation:** The `pharmacyId` scoping mechanism ensures that each pharmacy tenant's commercial data (inventory, orders, payments, financials) is strictly isolated. No tenant can access another tenant's data through any API call.
- **Data Retention Policy:** Records are retained for auditing but user-sensitive fields (like email) may be anonymized or purged after a configurable retention period, in compliance with data protection regulations (e.g. GDPR guidelines).
- **Soft Deletion:** Instead of hard-deleting records, the system marks them inactive (`isDeleted: true`, `deletedAt` timestamp) so that historical data is preserved for audits. This satisfies compliance with legal requirements to maintain traceable records.
- **Encryption and Access Control:** Sensitive fields can be encrypted if needed (e.g. tokens in transit, config values at rest). Database access is restricted (firewall rules, least-privilege credentials). Audit logs and inventory transactions are immutable and regularly reviewed.
- **Public Marketplace Data:** The global marketplace search API only exposes non-sensitive fields (medicine name, category, price, availability, pharmacy name). Sensitive operational data (supplier names, shelf locations, batch-level details) is excluded from public responses.

The policy for data deletion follows industry best practices: only delete user data after explicit consent or regulatory necessity. Since Pharma‑Net's primary B2B tenants are pharmacies, tenant accounts persist until deactivated by an admin, at which point the account is disabled rather than erased, and all associated data remains in the system for audit compliance.

---

## 11. Risk Assessment and Mitigation

Identified Risks and Mitigations: As part of project planning, we have identified key risks and planned mitigations:

- **Data Breach / Cross-Tenant Leakage:** *Risk:* A vulnerability could allow one pharmacy tenant to access another's data, or unauthorized access to stock/financial information. *Mitigation:* Enforce strict tenant isolation via JWT-derived `pharmacyId` injection (never from client input). Use strong authentication (bcrypt, JWT), HTTPS/TLS for all traffic, Helmet.js security headers, and CORS origin whitelisting. Comprehensive integration tests verify tenant isolation under all API call combinations.

- **Downtime / Performance Degradation:** *Risk:* System outage could disrupt multiple pharmacy tenants' operations simultaneously, as all share the same backend. *Mitigation:* Architect for high availability (load-balanced stateless services), use automated health checks (`GET /health`), and maintain a documented recovery plan. Regular backups and disaster recovery drills (restore tests) reduce recovery time. The stateless API design enables rapid horizontal scaling.

- **Regulatory Non-Compliance:** *Risk:* Failure to properly record transactions or maintain immutable audit trails could violate FDA/EFDA or local drug distribution regulations. *Mitigation:* Implement comprehensive, schema-level immutable audit trails and inventory transaction ledgers. Enforce soft-delete policy for all business entities. Require attributable identity for all state-changing actions. Regular compliance reviews will ensure alignment.

- **Tenant Onboarding Complexity:** *Risk:* Misconfigured pharmacy tenant accounts could lead to data scoping errors. *Mitigation:* Admin-controlled tenant creation with automated `pharmacyId` assignment. Comprehensive validation tests verify that new tenants are fully isolated from existing ones from the moment of creation.

- **Insufficient Requirements Understanding:** *Risk:* Misinterpreting stakeholder needs could lead to missing features, especially around the multi-tenant scoping model. *Mitigation:* Maintain a traceability matrix and involve stakeholders in reviews. The SRS is detailed to ensure clarity. Periodic demos will validate requirements, particularly around tenant isolation and marketplace search behavior.

- **Change in Scope:** *Risk:* Adding major features (e.g. real-time payment gateway, multi-staff per tenant) mid-project could jeopardize schedules. *Mitigation:* Clearly freeze scope for the internship phase (SaaS dashboard + shared API). Any new requirements must go through a formal change control. These SRS documents agreed to prevent scope creep.

In general, the project will adopt risk management best practices: identifying potential issues early, assessing likelihood/impact, and applying appropriate controls (for example, open communication and iterative reviews to catch problems early). We will treat risk management as an ongoing process integrated with development and testing.

---

## Conclusion

The Pharma-Net Software Requirements Specification defines a structured and comprehensive blueprint for developing a B2B2C multi-tenant SaaS pharmaceutical logistics platform. By aligning the document structure with IEEE 830 and ISO/IEC/IEEE 29148 standards, the project ensures that all functional and non-functional requirements are clearly articulated, traceable, and testable throughout the development lifecycle.

The system architecture is centered on a MERN-based technology stack with TypeScript, utilizing React.js v19 with Vite for the SaaS web dashboard, Node.js with Express.js v5 for the shared backend API, and MongoDB with Mongoose v9 for multi-tenant data modeling and validation. Through clearly defined RESTful APIs, `pharmacyId`-scoped schemas, three-tier role-based access control, and schema-level immutability on compliance-critical collections, Pharma-Net establishes a centralized digital marketplace that connects independent pharmacy tenants with public consumers while maintaining strict data isolation between tenants.

The platform's multi-tenant architecture — where Pharmacy Managers operate as isolated SaaS tenants managing their local inventory and fulfilling consumer orders, while Public Users search a global marketplace aggregated across all onboarded pharmacies — directly addresses the critical information gap in pharmaceutical last-mile logistics. While this project simulates regulatory awareness principles such as ALCOA+ audit logging and 21 CFR Part 11 immutability, its primary objective is to deliver a scalable, secure, and well-documented multi-tenant SaaS system suitable for academic and professional portfolio development. This SRS will serve as the authoritative reference for implementation, testing, validation, and future system enhancement.