# Software Requirements Specification (SRS) – Pharma‑Net Digital Pharmaceutical Logistics Platform

| Field        | Details                        |
|--------------|--------------------------------|
| **Version**  | 1.0                            |
| **Date**     | 2026‑02‑19                     |
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

The Pharma‑Net platform is a centralized web-based system designed to modernize the pharmaceutical supply chain by providing real-time visibility and streamlined communications between local pharmacies and central warehouses. Historically, the industry has faced inefficiencies due to manual processes, lack of stock visibility, and unpredictable medication shortages. Pharma‑Net addresses these issues by offering a single online source-of-truth for inventory levels, order transactions, and reporting. The platform replaces the legacy "phone call and spreadsheet" process with automated RESTful workflows and dashboards, reducing errors and delays in medicine procurement.

The primary goals of Pharma‑Net are to improve transparency, efficiency, and accountability in drug distribution. Key features include real-time stock tracking, automated order approval flows, role-based access, and comprehensive audit logs. This SRS document, following IEEE Std. 29148:2018 (ISO/IEC/IEEE 29148) guidelines, specifies all functional and non-functional requirements for the Pharma‑Net web application. It will guide developers in creating the Node.js/Express API, MongoDB schemas, and React.js frontend, as well as assist stakeholders in understanding system capabilities and regulatory compliance.

This document is organized as follows: Section 2 covers system scope and objectives; Section 3 provides overall system description; Section 4 details specific system features and requirements; Section 5 lists external interface requirements; Section 6 covers system features and acceptance criteria; Section 7 describes verification/validation including a traceability matrix; followed by appendices with API specs, data models, and diagrams.

---

## 2. System Scope and Objectives

The Pharma-Net Backend System (API & Database) provides a centralized infrastructure for both web and mobile clients. While the Web Team (we) provides the full administrative interface, the Mobile UI for pharmacy users is developed by a separate team. However, all business logic, stock validation, and data integrity (ALCOA+) are enforced at the API level. Focuses exclusively on the distribution and inventory management phase of the pharmaceutical lifecycle. It does not handle patient medical records, prescription processing beyond order placement, insurance claims, or advanced clinical functions. The web-only system provides:

- **Real-Time Inventory Visibility:** Pharmacies (via the Mobile App *(out of our scope)*) can view current stock levels of all medicines at connected warehouses, enabling informed ordering decisions.
- **Automated Order Lifecycle:** Pharmacies submit orders through the Mobile UI; warehouses receive, review, and approve them via the admin dashboard. Stock levels update automatically upon order fulfillment.
- **Role-Based Security:** Different user roles (Administrator, Warehouse Manager, *(Pharmacy User Mobile UI - API Consumer out of the scope)*) have distinct permissions (e.g., pharmacies can place orders through mobile UI, warehouse managers approve orders).
- **Reporting and Alerts:** Warehouse managers and admins access reports on sales volumes, low-stock alerts, and expiring medicines to support proactive supply management.
- **Auditability:** All critical actions (logins, approvals, stock changes, payments) are logged with timestamps and user IDs to comply with data integrity standards (e.g., FDA's 21 CFR Part 11).

The system's constraints include: use of the MERN stack (MongoDB, Express, React, Node), stateless JWT authentication, and strict adherence to data integrity best practices (ALCOA+). It assumes reliable internet connectivity, availability of standard hardware (PCs, barcode scanners, printers), and compliance with local distribution laws.

---

## 3. Overall Description

### 3.1 Product Perspective

Pharma-Net is a distributed system consisting of a shared MERN-stack backend and two distinct client applications. The Web Application (in scope) serves Warehouse Managers and Admins for internal management. The Mobile Application (external scope) serves Pharmacy users. Both communicate with the same RESTful API to ensure a single 'source of truth' for inventory.

> **Figure 1:** MERN-stack architecture (web client, Node.js/Express API, MongoDB), containerized for deployment.

### 3.2 Product Functions and Modules

Pharma‑Net's functionality is organized into modular components, each corresponding to a core business area:

- **Authentication & Authorization:** Account creation, login, JWT token management, and Role-Based Access Control (RBAC).
- **Medicine & Inventory Management:** CRUD operations on drug records, batch/expiry tracking, stock audits, and automated low-stock alerts.
- **Order Management:** Pharmacy users create orders; warehouse managers review (approve/reject) them; order status progresses through lifecycle stages (Pending → Approved → Dispatched → Delivered).
- **Payment Management:** Recording of payments for orders (payment type, status tracking) and linking to order records.
- **Reporting & Analytics:** Dashboards and generated reports for inventory levels, sales over time, and expiration forecasts.

Each module will be implemented as a set of API endpoints and corresponding frontend views. For example, the Inventory module includes endpoints like `POST /api/medicines` and `GET /api/medicines`, and frontend pages like an Inventory Grid. The modular design allows incremental development and testing of each feature.

### 3.3 User Classes and Characteristics

- **Administrator (Web):** System owner with full privileges. Can manage all user accounts and roles, configure system settings, and view global logs. Expert level, expects a dashboard overview of system health.
- **Warehouse Manager (Web):** Manages a specific warehouse. Can add/edit inventory, set reorder thresholds, approve/reject orders, and generate reports. Moderate technical skill; needs clear forms for data entry and status monitoring.
- **Pharmacy User (Mobile UI - API Consumer):** External user who consumes the API to search inventory and place orders.

### 3.4 Design and Implementation Constraints

- **Technology Stack:** Must use React.js (frontend), Node.js/Express (API), MongoDB (database). Alternatives need formal approval.
- **Authentication:** JWT tokens (stateless) with 8-hour expiration will secure API calls; cookies or server sessions are not used.
- **Data Integrity Standards:** The design must anticipate 21 CFR Part 11 and GAMP5 compliance requirements (e.g., audit trails, electronic signatures) even in this simulation. For instance, all edits to records will be logged immutably.
- **Platform Support:** Web front-end must be responsive on modern browsers (Chrome, Firefox, Safari). The backend runs on a Linux-based server (Ubuntu or similar).
- **Schema Validation:** Use Mongoose ODM (v6+) to define strict schemas and data types for MongoDB collections, preventing invalid data entries.
- **Stateless Services:** The Node.js API will be stateless and container-friendly, enabling horizontal scaling (e.g. multiple API instances behind a load balancer).

### 3.5 Assumptions and Dependencies

- **Network Access:** Users have reliable internet. The system does not support offline mode.
- **Third-Party Services:** Email/SMS providers may be integrated later for alerts. Payment recording is simulated; no real payment gateway is used.
- **Hardware:** Warehouses have barcode scanners/printers, but all inputs can be entered manually if needed.
- **Regulatory Compliance:** It is assumed that organizational policies enforce legal drug handling; Pharma‑Net provides the tools (e.g., logging, role restrictions) but does not itself guarantee legal compliance.

---

## 4. External Interface Requirements

### 4.1 User Interfaces

- **Administrator Dashboard:** A web page showing system-wide KPIs (total orders, low-stock alerts, sales graphs). Includes user management console.
- **Inventory Management UI:** A tabular inventory view with inline-editing for stock counts and filters by category/expiry. Color-coding highlights low or near-expiry items.
- **Order Processing Pages:** Warehouse view lists pending orders. Single-click buttons to Approve/Reject orders. Each action prompts for confirmation and optional notes (especially on rejection).
- **Pharmacy Ordering UI:** The Web Team (we) is responsible for the Internal Management Dashboard (Admin/Warehouse). The UI for Pharmacy ordering is handled by the Mobile Team; however, the Web Team defines the API request/response structures that power that UI.
- **Reporting Views:** Web pages for generating/exporting reports (e.g. a date-picker form to generate "sales by medicine" or "expiring soon" reports). Downloadable as CSV/PDF.
- All pages use consistent navigation and branding. Forms validate input (e.g., require email format on registration) and display clear error messages.

### 4.2 Hardware Interfaces

- **Barcode/RFID Scanners (Optional):** Warehouse UI will allow scanning of barcodes for quick stock updates (via standard keyboard-input emulation).
- **Printers:** Warehouse can print shipping labels and reports (standard thermal or laser printers via browser print dialog). No specialized hardware integration is required; printed output is generated as standard PDF or HTML printouts.

### 4.3 Software Interfaces

- **Operating Systems:** The backend is designed to run on Node.js (LTS) on Linux servers. The frontend runs on any OS with a modern browser.
- **Database:** MongoDB (v4.4+) accessed via Mongoose ODM (v6+). These are explicitly required choices. The system does not support other DBs.
- **Libraries:** Express.js (v4+) for API routing, React.js (v18+) on frontend, Material-UI (v5) for components. Security libs: bcrypt for password hashing, jsonwebtoken for JWT management.
- **Communication:** All data exchanged via HTTPS/REST. JSON is used for request and response payloads. No XML or binary protocols are used.
- **APIs:** The system exposes its core functionality via a REST API (see Appendix). Examples: `POST /api/auth/login` for authentication, `GET /api/medicines` to list inventory, etc. Authentication token (JWT) is sent in the `Authorization: Bearer` header.

### 4.4 Communications Interfaces

- **Protocols:** HTTPS/TLS 1.2+ is mandatory for all client-server communication. The API follows RESTful conventions (e.g. GET for read, POST for create).
- **Message Format:** All API requests and responses use JSON with UTF-8 encoding. Dates use ISO 8601 format.
- **Standards:** API URIs use lowercase, plural nouns (e.g. `/api/orders`). HTTP status codes reflect results (200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 404 Not Found, 500 Server Error, etc.) in compliance with REST best practices.

---

## 5. System Features (Functional Requirements)

Each requirement below is prefixed (e.g., FR-1.1) and followed by its Acceptance Criteria in bullet points. The criteria define conditions that must be met to consider the requirement implemented successfully.

### 5.1 Authentication and Authorization (Security)

- **FR-1.1: User Registration.** The system shall allow new pharmacy and warehouse users to create accounts with name, unique email, and password.
  - *Acceptance:* A registration form is available; submitting valid data creates a new user record with hashed password. An error is shown if email already exists.

- **FR-1.2: Password Security.** The system shall automatically hash all passwords with bcrypt before storage.
  - *Acceptance:* Inspecting the user database shows no plaintext passwords; password comparisons use bcrypt compare.

- **FR-1.3: Secure Login.** The system shall authenticate users via email/password. On success, it returns a signed JWT containing the user's ID and role.
  - *Acceptance:* A valid login request returns HTTP 200 with a JSON web token in response. The token includes the correct user ID/role and is signed with the server secret. Invalid credentials yield a 401 error.

- **FR-1.4: Role-Based Access Control (RBAC).** The system shall restrict API route access based on the user's role in the JWT. Three roles exist: pharmacy, warehouse, and admin. Pharmacy users can place orders and view inventory; warehouse users can manage inventory and orders; admins manage users and configurations.
  - *Acceptance:* Attempting to access a forbidden endpoint (e.g. a pharmacy user trying to create a medicine) returns 403 Forbidden. The role embedded in the JWT determines accessible routes.

- **FR-1.5: Token Expiration.** JWTs shall expire after a fixed time (e.g. 8 hours). Users must re-login after expiration.
  - *Acceptance:* Tokens include an `exp` claim; requests with expired tokens receive a 401 Unauthorized. Token lifetime is configurable via an environment variable (e.g. `JWT_EXPIRATION`).

### 5.2 Medicine and Inventory Management

- **FR-2.1: Add New Medication.** Warehouse managers can add new drug items with required fields: Name, SKU, Category, Price, and Initial Stock.
  - *Acceptance:* A POST to `/api/medicines` with valid data returns 201 Created and the new medicine appears in the database. Missing fields cause a 400 Bad Request with descriptive error.

- **FR-2.2: Batch and Lot Tracking.** Each inventory entry shall record a batch/lot number.
  - *Acceptance:* The Medicine schema includes a `batch` field. Adding a batch number is mandatory when creating stock entries. The system allows queries filtering by batch number.

- **FR-2.3: Expiry Management.** Warehouse managers must input expiration dates. The system auto-flags any medicine within 90 days of expiry.
  - *Acceptance:* The Medicine schema includes an `expiryDate`. The dashboard visibly highlights items expiring soon. A report listing near-expiry items can be generated.

- **FR-2.4: Real-Time Stock Updates.** Stock counts update in real-time whenever orders are approved or manual adjustments are made.
  - *Acceptance:* After an order is approved, the corresponding medicine `stockCount` in MongoDB is decremented atomically. A GET request to `/api/medicines` immediately reflects the new quantities.

- **FR-2.5: Low-Stock Notifications.** The system shall alert warehouse managers on the dashboard when any medicine's stock falls below a set threshold.
  - *Acceptance:* Thresholds are set per item. When an order approval or adjustment triggers stock < threshold, a UI alert or badge appears on the dashboard.

- **FR-2.6: Search and Filter Inventory.** Users shall search medicines by name, SKU, or category. Results include current stock and price.
  - *Acceptance:* The API supports query parameters (e.g. `/api/medicines?name=aspirin&category=antibiotic`) returning matching items. The frontend provides a search box and category filters that show correct results.

- **FR-2.7: Inventory Transactions (GRN/GIN).** The system shall support Goods Received Notes (GRN) for incoming stock and Goods Issued Notes (GIN) for manual stock removals.
  - *Acceptance:* Forms are provided to enter GRN (specify shipment details and quantities) and GIN (e.g. for write-offs). Creating a GRN increases stock, while a GIN decreases stock, both updating the audit trail.

### 5.3 Order Management

- **FR-3.1: Order Placement.** The system shall provide a secure API endpoint (`POST /api/orders`) to allow authenticated Pharmacy users (via Mobile UI) to submit order requests. The backend will validate these requests against real-time stock levels before processing.
  - *Acceptance:* A POST to `/api/orders` with a list of items returns 201 Created and status "Pending." The response includes an order ID and summary.

- **FR-3.2: Stock Validation.** Before finalizing an order, the system checks warehouse stock. If insufficient, the order is not placed and the user is notified.
  - *Acceptance:* Attempting to order more units than available yields a client-side alert and prevents form submission. Backend validation also checks stock and rejects the request with 400 and message.

- **FR-3.3: Order Review.** Warehouse managers can view pending orders and approve or reject them. Rejection requires providing a reason.
  - *Acceptance:* An order's status can be changed via `PATCH /api/orders/{id}`. Approving sets status to "Approved" and includes approval timestamp; rejecting sets "Rejected" with reason. The order record reflects the action and actor.

- **FR-3.4: Order Status Tracking.** The system tracks each order through states: Pending, Approved, Processing, Dispatched, Delivered, Rejected. Each state change is logged.
  - *Acceptance:* The order record contains a `status` field. Frontend displays the current status. An order history page shows each state transition with date/time. Orders in "Delivered" state are marked completed.

- **FR-3.5: Order History.** All users can view their past orders with full details (items, costs, dates, status).
  - *Acceptance:* `GET /api/orders` returns only orders belonging to the authenticated user (pharmacy sees own orders, warehouse sees all orders for its warehouse). Each order's detail page shows line items, total cost, status history, and payment status.

### 5.4 Payment Management

- **FR-4.1: Record Payment.** Warehouse users can record payments against orders, specifying amount and method (bank transfer, credit, cash).
  - *Acceptance:* A POST to `/api/payments` with order ID creates a payment record. The corresponding order's record shows updated payment info. The API rejects payments on non-existent or unpaid orders.

- **FR-4.2: Payment Status Mapping.** Each order links to a payment status (Unpaid, Partially Paid, Paid).
  - *Acceptance:* The Order schema includes a `paymentStatus` enum. Recording a partial payment updates status to "Partially Paid"; paying the full amount sets "Paid".

- **FR-4.3: Financial History.** Pharmacy users can view their spend history per order.
  - *Acceptance:* The pharmacy dashboard shows each order's total cost and whether it is paid. `GET /api/payments?pharmacyId=...` returns payment records for that user.

- **FR-4.4: Payment Audit Trail.** Each payment entry must include a timestamp, amount, and the user ID who recorded it.
  - *Acceptance:* The Payment record contains `timestamp` and `recordedBy`. Audit logs (system log) record every payment creation with these details. Historical views confirm that payments cannot be edited without trace.

### 5.5 Reporting and Analytics

- **FR-5.1: Inventory Report.** The system can generate a report of all current stock, including batch numbers, expiry dates, and value.
  - *Acceptance:* Accessing `/api/reports/inventory` returns a summary of stock items. The admin UI lets users export this report. Values are calculated (sum of quantity×price) and included.

- **FR-5.2: Sales Statistics.** Generate daily/monthly summaries of order volumes, top-selling medicines, and revenue.
  - *Acceptance:* `/api/reports/sales?startDate=...&endDate=...` returns aggregated data (number of orders, revenue, etc.). The UI presents charts or tables for these stats.

- **FR-5.3: Expiration Forecast.** Generate a report of all items expiring within a selected date range.
  - *Acceptance:* `/api/reports/expiring?before=YYYY-MM-DD` returns all stock with expiry <= that date. The UI highlights critical items.

- **FR-5.4: Transaction Logs.** Administrators can access a global log of all significant actions (user logins, record changes, approvals), searchable by user and date.
  - *Acceptance:* A `GET /api/logs` for admins returns a chronologically ordered list of audit entries (immutable). The log includes user ID, action, timestamp, and affected resource. Any attempt to tamper with logs is prevented.

---

## 6. Non-Functional Requirements

The platform's quality attributes and constraints are detailed below, with acceptance criteria to ensure they are met.

### 6.1 Performance and Scalability

- **NFR-1.1: Response Time.** Simple requests (e.g. GET medicines) must complete in under 1 second; complex reports in under 5 seconds.
  - *Acceptance:* Under test load, the 95th percentile response time for `GET /api/medicines` is < 1000ms; a multi-month report query averages < 5000ms.

- **NFR-1.2: Concurrency.** The system shall support at least 100 concurrent users without degradation.
  - *Acceptance:* Under a load test simulating 100 simultaneous active sessions, response times remain within 10% of baseline for normal traffic.

- **NFR-1.3: Scalability.** The Node.js API is stateless to allow horizontal scaling (multiple instances). The database design supports at least 10,000 medicine records efficiently.
  - *Acceptance:* The API runs successfully in Docker containers behind a load balancer. MongoDB collections are indexed on frequently queried fields (e.g. `email`, `sku`) to maintain performance as data grows.

- **NFR-1.4: Database Performance.** Critical query fields (user email, medicine name/sku) must be indexed.
  - *Acceptance:* The MongoDB schema definitions include indexes on `Users.email`, `Medicines.sku`, and `Medicines.name`. Profiling shows search queries use indexes (no collection scans).

### 6.2 Security and Data Integrity

- **NFR-2.1: Authentication Security.** All API endpoints (except login/registration) require a valid JWT. Middleware enforces token verification for every request.
  - *Acceptance:* Any request without or with an invalid JWT receives HTTP 401. A penetration test confirms unauthorized calls are blocked.

- **NFR-2.2: Data at Rest.** Sensitive data (passwords) are hashed (bcrypt). Database access is protected by strong credentials and (in production) restricted by network rules.
  - *Acceptance:* The production MongoDB instance enforces authentication. A data breach simulation confirms that hashed passwords cannot be reversed.

- **NFR-2.3: Data in Transit.** All traffic is encrypted via HTTPS/TLS 1.2 or higher.
  - *Acceptance:* The server has TLS enabled; SSL tests (e.g. Qualys SSL Labs) show no insecure cipher suites, and browsers report secure connection.

- **NFR-2.4: Atomic Transactions.** Critical multi-step operations (like approving an order) must use MongoDB transactions to ensure all changes (order status, inventory decrement) apply together or not at all.
  - *Acceptance:* In case of failure during order approval (e.g. DB error), neither the order status nor the inventory is partially updated (rolled back). Unit tests simulate errors to verify atomicity.

### 6.3 Reliability and Availability

- **NFR-3.1: Uptime.** Target 99.9% availability during business hours. Scheduled maintenance is notified at least 24h in advance.
  - *Acceptance:* Monitoring logs show < 0.1% downtime during working hours over a month-long test. Maintenance windows (if any) are logged and communicated to users via the dashboard.

- **NFR-3.2: Backup and Recovery.** The database is backed up daily. The recovery process (restoring the latest backup) can be completed within 4 hours.
  - *Acceptance:* Automated scripts (e.g. `mongodump`) run nightly; periodic restore drills confirm data can be recovered fully from the last backup. Documentation details each recovery step.

- **NFR-3.3: Error Handling.** The application implements centralized error handling. Unhandled errors are logged (server-side log) and a user-friendly error message is shown to clients.
  - *Acceptance:* Frontend never shows stack traces or raw exceptions to the user. Server logs record the full error detail for developers. Error pages display generic messages (e.g. "An unexpected error occurred, please try again").

### 6.4 Regulatory Compliance (Simulation)

- **NFR-4.1: Audit Trails.** To satisfy ALCOA+ (Attributable, Legible, Contemporaneous, Original, Accurate), the Node.js API must automatically generate an immutable audit log for every transaction, identifying the User ID and Timestamp regardless of whether the action originated from the Web or Mobile interface.
  - *Acceptance:* Every data-modifying API call writes an entry to an `AuditLog` collection. An audit record includes `userId`, `actionType`, `timestamp`, and a diff of the data before/after. Logs are immutable (append-only).

- **NFR-4.2: Data Retention.** Records shall not be permanently deleted; instead, they are "soft-deleted" (marked inactive) to preserve history.
  - *Acceptance:* Deleting a medicine or order sets an `isDeleted` flag and timestamp, rather than removing the document. Queries exclude `isDeleted` items by default. This supports historical auditability.

- **NFR-4.3: Identity Verification.** Each user has a unique ID. Actions requiring signature (e.g. approving an order) permanently associate the user's identity with that record.
  - *Acceptance:* The database enforces `Users.email` as unique. The Order schema stores `approvedBy` (user ID) and `approvedAt`. No action occurs anonymously.

---

## 7. Verification and Validation

To ensure all requirements are testable and traceable, a traceability matrix will map each functional and non-functional requirement to corresponding test cases (e.g. unit tests, integration tests, and acceptance tests). This helps confirm full coverage. The matrix is shown in Appendix A. Each requirement above has associated acceptance tests, and automated test suites will be developed to exercise them.

### 7.1 Traceability Matrix

| Requirement ID | Requirement Description          | Test Case ID              |
|----------------|----------------------------------|---------------------------|
| FR-1.1         | User Registration                | TC-Auth-1 (registration)  |
| FR-1.2         | Password Hashing                 | TC-Auth-2 (security)      |
| FR-1.3         | Secure Login (JWT)               | TC-Auth-3 (login flow)    |
| FR-1.4         | Role-Based Access Control        | TC-Auth-4 (RBAC)          |
| FR-1.5         | Token Expiration                 | TC-Auth-5 (token expiry)  |
| FR-2.1         | Add New Medication               | TC-Inv-1 (create meds)    |
| FR-2.2         | Batch/Lot Tracking               | TC-Inv-2 (batch field)    |
| FR-2.3         | Expiry Date Management           | TC-Inv-3 (expiry alerts)  |
| FR-2.4         | Real-Time Stock Updates          | TC-Inv-4 (stock update)   |
| FR-2.5         | Low-Stock Notifications          | TC-Inv-5 (alerts)         |
| FR-2.6         | Search and Filter Inventory      | TC-Inv-6 (search/filter)  |
| FR-2.7         | GRN/GIN Inventory Transactions   | TC-Inv-7 (GRN/GIN flow)   |
| FR-3.1         | Order Placement                  | TC-Order-1 (create order) |
| FR-3.2         | Stock Validation on Order        | TC-Order-2 (stock check)  |
| FR-3.3         | Order Approval/Rejection         | TC-Order-3 (approve/reject)|
| FR-3.4         | Order Status Tracking            | TC-Order-4 (status changes)|
| FR-3.5         | Order History                    | TC-Order-5 (history)      |
| FR-4.1         | Record Payment                   | TC-Pay-1 (add payment)    |
| FR-4.2         | Payment Status Mapping           | TC-Pay-2 (status update)  |
| FR-4.3         | Financial History                | TC-Pay-3 (history view)   |
| FR-4.4         | Payment Audit Trail              | TC-Pay-4 (audit log)      |
| FR-5.1         | Inventory Report                 | TC-Rep-1 (inventory report)|
| FR-5.2         | Sales Statistics                 | TC-Rep-2 (sales report)   |
| FR-5.3         | Expiration Forecast              | TC-Rep-3 (expiring report) |
| FR-5.4         | Transaction Logs Access          | TC-Rep-4 (logs access)    |
| NFR-1.1        | Response Time                    | TC-Perf-1 (load test)     |
| NFR-1.2        | Concurrency                      | TC-Perf-2 (stress test)   |
| NFR-1.3        | Scalability                      | TC-Perf-3 (scale test)    |
| NFR-1.4        | DB Indexes Performance           | TC-Perf-4 (query speed)   |
| NFR-2.1        | Secured Endpoints                | TC-Sec-1 (auth tests)     |
| NFR-2.2        | Data Encryption/Hashing          | TC-Sec-2 (encryption test)|
| NFR-2.3        | HTTPS/TLS Usage                  | TC-Sec-3 (ssl audit)      |
| NFR-2.4        | Atomic Transactions              | TC-Sec-4 (rollback test)  |
| NFR-3.1        | Availability (uptime)            | TC-Rel-1 (monitor logs)   |
| NFR-3.2        | Backup and Recovery              | TC-Rel-2 (restore drill)  |
| NFR-3.3        | Error Handling                   | TC-Rel-3 (error pages)    |
| NFR-4.1        | Audit Trail Maintenance          | TC-Comp-1 (audit log test)|
| NFR-4.2        | Soft Delete of Records           | TC-Comp-2 (soft delete)   |
| NFR-4.3        | User Identity in Actions         | TC-Comp-3 (signature test)|

Appendix A includes the full matrix mapping each requirement to detailed test cases and verification methods. Requirements are "testable" by design.

### 7.2 Acceptance Criteria (Summary)

Consistent with IEEE guidelines, each requirement above has specific acceptance conditions. Key examples include:

- **User Registration (FR-1.1):** Must only accept unique emails and store hashed passwords (bcrypt).
- **Order Flow (FR-3.x):** Each order update triggers corresponding database changes (inventory decrement, status update) in an atomic transaction (all-or-nothing).
- **Performance (NFR-1.x):** Meeting sub-second API responses under load tests.
- **Security (NFR-2.x):** All protected endpoints reject unauthorized requests, and audit logs show every access (meeting ALCOA+ data integrity principles).

Each acceptance criterion will be verified by manual testing or automated unit/integration tests. For instance, TC-Order-2 (stock check) verifies that an order exceeding stock is rejected with an appropriate error message.

---

## 8. Appendices

### 8.1 Appendix A: Traceability Matrix

*(Included above in Section 7.1 for reference.)*

### 8.2 Appendix B: API Specification (Selected Endpoints)

The REST API follows standard patterns. Below are examples of key endpoints with sample requests/responses (JSON):

**`POST /api/auth/register`** – Register new user

```json
// Request
{ "name": "Alice", "email": "alice@pharma.com", "password": "Secret123", "role": "pharmacy" }

// Response (201 Created)
{ "id": "609e…", "name": "Alice", "email": "alice@pharma.com", "role": "pharmacy" }
```

**`POST /api/auth/login`** – Authenticate user

```json
// Request
{ "email": "alice@pharma.com", "password": "Secret123" }

// Response (200 OK)
{ "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
```

**`GET /api/medicines`** – List all medicines (all users)

```json
// Response (200 OK)
[
  { "id": "m1", "name": "Aspirin", "sku": "ASP100", "category": "Analgesic", "price": 5.50, "stockCount": 120, "expiryDate": "2024-12-31" },
  { "..." }
]
```

**`POST /api/medicines`** – Add new medication (Warehouse role)

```json
// Request
{ "name": "Amoxicillin", "sku": "AMX250", "category": "Antibiotic", "price": 12.75, "stockCount": 200, "batch": "BATCH123", "expiryDate": "2025-06-30" }

// Response (201 Created)
{ "id": "m2", "name": "Amoxicillin", "..." }
```

**`POST /api/orders`** – Submit pharmacy order

```json
// Request
{ "pharmacyId": "u5", "items": [{ "medicineId": "m1", "quantity": 10 }, { "medicineId": "m2", "quantity": 5 }] }

// Response (201 Created)
{ "orderId": "o7", "status": "Pending", "items": ["..."], "total": 118.75 }
```

**`PATCH /api/orders/o7`** – Approve or update order (Warehouse role)

```json
// Request to approve
{ "status": "Approved" }

// Response
{ "orderId": "o7", "status": "Approved", "approvedBy": "u2", "approvedAt": "2026-02-18T14:23:00Z" }
```

**`GET /api/reports/sales?startDate=2026-01-01&endDate=2026-01-31`** – Generate sales report (Admin/Warehouse)

```json
// Response
{ "totalRevenue": 12345.67, "orderCount": 89, "topMedicines": [{ "name": "Amoxicillin", "qtySold": 150 }, "..."] }
```

The full API is documented in code comments and (optionally) in an OpenAPI/Swagger specification.

### 8.3 Appendix C: Database Schema (Mongoose Models)

The MongoDB data model uses four primary collections. Key fields (with types) include:

**Users:**
```js
{ _id: ObjectId, name: String, email: String (unique), passwordHash: String, role: String("admin"/"warehouse"/"pharmacy") }
```

**Medicines:**
```js
{ _id: ObjectId, name: String, sku: String (unique), category: String, price: Number, stockCount: Number, batch: String, expiryDate: Date, isDeleted: Boolean }
```

**Orders:**
```js
{ _id: ObjectId, pharmacyId: ObjectId (ref Users), items: [{ medicineId: ObjectId, quantity: Number }], total: Number, status: String(enum), createdAt: Date, approvedBy: ObjectId, approvedAt: Date }
```

**Payments:**
```js
{ _id: ObjectId, orderId: ObjectId (ref Orders), amount: Number, status: String("Unpaid"/"Paid"/...), method: String, timestamp: Date, recordedBy: ObjectId }
```

Mongoose schemas enforce these structures, with validation rules (e.g. required fields, value ranges) and pre-save hooks (e.g. password hashing). See the backend `models/` directory for full definitions.

### 8.4 Appendix D: System Diagrams

The following diagrams illustrate system architecture and workflows:

- **Figure 1** *(above)*: High-level component diagram of the Pharma‑Net MERN-stack (web client ↔ Node.js/Express ↔ MongoDB) in a containerized deployment environment.
- **Figure 2:** Sequence diagram for the Order lifecycle (Pharmacy submits order → System validates stock → Warehouse approves → System updates status).
- **Figure 3:** Entity-Relationship (ER) data model showing key collections (Users, Medicines, Orders, Payments) and their relationships.

*(Note: Figures 2 and 3 are (will be) provided in the design documentation; here we reference their existence.)*

---

## 9. Deployment and Environment

Pharma‑Net is intended to run in a containerized environment for ease of deployment and scaling. A typical deployment uses Docker containers:

- **Docker Images:** One image for the Node.js backend (includes all API code), one for the React frontend (built static files), and a managed MongoDB instance (e.g. hosted or Dockerized).
- **Environment Variables:** Configurable via `.env` or deployment settings:
  - `NODE_ENV` (production/development)
  - `PORT` (for API)
  - `MONGO_URI` (database connection string)
  - `JWT_SECRET` (for signing tokens)
  - `PASSWORD_SALT_ROUNDS` (bcrypt cost factor)
  - `ALERT_THRESHOLD` (default low-stock level)
- **Hosting Target:** The system can be hosted on cloud providers (e.g. AWS ECS/EKS, Azure Container Apps, or any Kubernetes cluster) or on-premise VMs. Continuous Integration pipelines will build Docker images and push to a registry. A load balancer (NGINX or cloud LB) routes traffic to the Node.js containers for the API and to a static web server (or CDN) for the React app.
- **CI/CD:** Automated builds and deployments are recommended. For example, an Azure Developer CLI template illustrates deploying a Node+React app with Azure Container Apps and Cosmos DB, which is analogous to our needs.

---

## 10. Data Privacy and Retention

Pharma‑Net deals with commercially sensitive data (stock levels, transaction history) and potentially user personal data (emails, names). Privacy measures include:

- **Minimal Storage:** Only necessary personal data are stored (no unnecessary PII). Passwords are hashed and never retrievable.
- **Data Retention Policy:** Records are retained for auditing but user-sensitive fields (like email) may be anonymized or purged after a configurable retention period, in compliance with data protection regulations (e.g. GDPR guidelines).
- **Soft Deletion:** Instead of hard-deleting records, the system marks them inactive (`isDeleted` flag) so that historical data is preserved for audits. This satisfies compliance with legal requirements to maintain traceable records.
- **Encryption and Access Control:** Sensitive fields can be encrypted if needed (e.g. tokens in transit, config values at rest). Database access is restricted (firewall rules, least-privilege credentials). Audit logs (e.g. for 21 CFR Part 11) are immutable and regularly reviewed.

The policy for data deletion follows industry best practices: only delete user data after explicit consent or regulatory necessity. Since Pharma‑Net's primary users are organizations (pharmacies), user accounts persist until manually removed by an admin, at which point the account is disabled rather than erased.

---

## 11. Risk Assessment and Mitigation

Identified Risks and Mitigations: As part of project planning, we have identified key risks and planned mitigations:

- **Data Breach:** *Risk:* Unauthorized access to inventory or user data could violate confidentiality. *Mitigation:* Enforce strong authentication (bcrypt, JWT), use HTTPS/TLS to encrypt all traffic, keep dependencies updated, and perform security audits. Maintain strict database access controls.

- **Downtime / Performance Degradation:** *Risk:* System outage could disrupt pharmacies' operations. *Mitigation:* Architect for high availability (load-balanced stateless services), use automated health checks, and maintain a documented recovery plan. Regular backups and disaster recovery drills (restore tests) reduce recovery time.

- **Regulatory Non-Compliance:** *Risk:* Failure to properly record transactions could violate FDA or local drug distribution regulations. *Mitigation:* Implement comprehensive audit trails (immutable logs), soft-delete policy, and require electronic signatures for approvals, following ALCOA+ data integrity principles. Regular compliance reviews will ensure alignment.

- **Insufficient Requirements Understanding:** *Risk:* Misinterpreting stakeholder needs could lead to missing features. *Mitigation:* Maintain a traceability matrix and involve stakeholders in reviews. The SRS is detailed to ensure clarity. Periodic demos will validate requirements.

- **Change in Scope:** *Risk:* Adding major features (e.g. mobile app) mid-project could jeopardize schedules. *Mitigation:* Clearly freeze scope for the internship phase (web-only system). Any new requirements must go through a formal change control. These SRS documents agreed to prevent scope creep.

In general, the project will adopt risk management best practices: identifying potential issues early, assessing likelihood/impact, and applying appropriate controls (for example, open communication and iterative reviews to catch problems early). We will treat risk management as an ongoing process integrated with development and testing.

---

## Conclusion

The Pharma-Net Software Requirements Specification defines a structured and comprehensive blueprint for developing a web-based pharmaceutical logistics management system. By aligning the document structure with IEEE 830 and ISO/IEC/IEEE 29148 standards, the project ensures that all functional and non-functional requirements are clearly articulated, traceable, and testable throughout the development lifecycle.

The system architecture is centered on a MERN-based technology stack, utilizing React.js for the web interface, Node.js with Express.js for backend services, and MongoDB with Mongoose for structured data modeling and validation. Through clearly defined RESTful APIs, well-designed schemas, and role-based access control, Pharma-Net establishes a centralized digital platform for managing inventory, orders, payments, and reporting within pharmaceutical warehouse operations.

While this project simulates regulatory awareness principles such as audit logging and data integrity, its primary objective is to deliver a scalable, secure, and well-documented web and backend system suitable for academic and professional portfolio development. This SRS will serve as the authoritative reference for implementation, testing, validation, and future system enhancement.