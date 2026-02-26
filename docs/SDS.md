# Software Design Specification: Pharma-Net Digital Pharmaceutical Logistics Platform

The modernization of pharmaceutical supply chains represents a critical frontier in global health informatics, particularly within the context of developing healthcare infrastructures. The Pharma-Net platform is designed to address systemic inefficiencies in medicine distribution through a robust, centralized digital ecosystem. This Software Design Specification (SDS) delineates the technical framework, business logic, and regulatory compliance strategies for the internal management web application and the shared backend infrastructure. As the primary "engine room" of the project, this system serves as the single source of truth for both internal warehouse operations and external mobile consumers, ensuring data integrity through rigorous adherence to international and national standards.

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

The pharmaceutical landscape in regional Ethiopian hubs has historically contended with a "visibility gap" that undermines the efficacy of life-saving medicine delivery. The Pharma-Net project is established to bridge this gap by transitioning from archaic, manual communication methods to a streamlined, automated logistics framework.

### Problem Statement

The traditional pharmaceutical supply chain in Ethiopia relies heavily on fragmented, manual processes often described as the "phone call and spreadsheet" model. This reliance creates significant pain points, most notably the lack of real-time visibility into inventory levels across central warehouses and local pharmacies. When stock levels are managed in localized silos, warehouse managers cannot proactively address stockouts, leading to unpredictable medicine shortages and potential public health crises. Furthermore, the absence of a centralized audit trail makes the supply chain vulnerable to errors in data entry, lack of accountability in order fulfillment, and difficulties in complying with evolving regulatory standards such as those set by the Ethiopian Food and Drug Authority (EFDA). The manual nature of these processes also results in significant delays in medicine procurement, as orders must be manually verified, approved, and recorded across multiple disjointed systems.

### Proposed Solution

Pharma-Net is a centralized, web-based pharmaceutical logistics platform designed to modernize the supply chain through a shared backend architecture. The solution utilizes the MERN stack (MongoDB, Express.js, React, Node.js) to provide a unified infrastructure for data handling and internal management. The "system of record" is a shared Node.js/Express API that serves two distinct client types: a React.js internal web application for warehouse and administrative staff, and a separate mobile application for pharmacy end-users. By centralizing the business logic and database, Pharma-Net ensures that every transaction—from order placement to final delivery—is reflected in real-time across all interfaces. The platform integrates high-level data integrity standards, simulating real-world pharmaceutical environments by incorporating ALCOA+ principles and FDA 21 CFR Part 11 compliance, specifically through immutable audit logs and electronic signatures.

### Target Audience

The primary users of the web-based management platform are internal stakeholders responsible for the governance and operational efficiency of the pharmaceutical supply chain.

| User Category                | Description and Context                                                                                                                                  |
|------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------|
| **System Administrators**    | Technical and managerial oversight users responsible for user account management, role assignment, and monitoring global system logs to ensure security and compliance. |
| **Warehouse Managers**       | Operational staff based at central hubs who manage inventory (CRUD), handle stock adjustments via GRN/GIN, review and approve pharmacy orders, and generate analytical reports. |
| **API Consumers (Mobile Team)** | While not direct users of the web UI, the mobile development team acts as a primary technical audience, consuming the shared RESTful API to power the pharmacy-facing mobile application. |

---

## Functional Requirements and Scope

The functional scope of Pharma-Net is defined by its role as the authoritative engine for medicine distribution. Every module is designed to enforce business rules at the API level, ensuring that data integrity is maintained regardless of whether the request originates from the internal web dashboard or the external mobile app.

### Core Business Logic and Modules

The system's functionality is organized into modular components that address the full lifecycle of pharmaceutical logistics, from identity management to financial reporting.

#### Identity and Access Management

The foundation of the platform is a secure authentication and authorization system. Identity management utilizes stateless JSON Web Tokens (JWT) to manage sessions, ensuring that the backend can scale horizontally across multiple server instances without losing track of user state. The registration and login logic employ bcrypt for one-way password hashing, a critical security measure that protects user credentials even in the event of a database breach. Role-Based Access Control (RBAC) is enforced through backend middleware that inspects the JWT for user roles (Admin, Warehouse Manager, or Pharmacy) before granting access to specific API routes.

#### Medicine and Inventory Management

The inventory engine handles the complex metadata associated with pharmaceutical products. Beyond standard CRUD operations, the system tracks medicine batches, stock-keeping units (SKUs), and categories. A critical logical component is the "real-time stock update" mechanism. Whenever an order is approved or a manual adjustment is made, the system atomically updates the `totalStock` field in MongoDB to prevent race conditions during high-concurrency periods. The system also incorporates "Batch and Expiry Logic," allowing warehouse managers to track specific lots of medicine and their corresponding expiration dates. Automated alerts are triggered on the dashboard when stock levels fall below pre-defined reorder thresholds or when items are within 90 days of expiration.

#### Order and Transaction Lifecycle

The order management module facilitates the transition from manual requests to automated RESTful workflows. When a pharmacy user submits an order via the mobile API, the backend performs a "pre-flight" stock validation. If the requested quantity exceeds the available stock in the warehouse, the request is rejected with a descriptive error message. Approved orders transition through a status-based lifecycle:

**Pending → Approved → Processing → Dispatched → Delivered**

Each transition is timestamped and attributed to the user who performed the action, ensuring a clear chain of custody.

#### Payment and Financial Tracking

Financial accountability is integrated into the order lifecycle through the payment management module. Warehouse managers can record payments against specific orders, specifying the payment method (e.g., bank transfer, cash) and the amount received. The order's payment status is dynamically updated to reflect Unpaid, Partially Paid, or Paid based on the recorded transactions. This module ensures that financial history is transparent and retrievable for both the warehouse and the pharmacy.

#### Reporting and Analytics

The reporting engine translates raw transactional data into actionable insights for management. The internal web application features a dashboard that visualizes sales statistics, daily/monthly order volumes, and top-selling medications. Users can generate and export comprehensive reports in PDF or CSV formats for auditing purposes, including inventory valuations and expiration forecasts.

### User Roles and Permission Matrix

The backend enforces strict permissions to maintain the separation of duties required in a regulated pharmaceutical environment.

| Role                  | Access Level       | Primary Functional Responsibilities                                                                          |
|-----------------------|--------------------|--------------------------------------------------------------------------------------------------------------|
| **Admin**             | Global             | Managing user accounts, role assignment, viewing global audit logs, and system configuration.                |
| **Warehouse Manager** | Operational        | Inventory CRUD, stock adjustments (GRN/GIN), order approval/rejection, and generating financial/stock reports. |
| **Pharmacy User**     | Consumer (API)     | Searching inventory, checking real-time availability, placing orders, and viewing their own spend history.   |

### Out of Scope Specifications

To ensure the web team's efforts are focused on the core infrastructure and internal tools, the following items are explicitly excluded from this phase of development:

- **Mobile User Interface:** The design and implementation of the pharmacy-facing mobile app are the responsibility of the mobile team.
- **Real-time Payment Gateways:** Direct integration with banking APIs for automated fund transfers is not included; payments are recorded manually for tracking purposes.
- **Clinical Patient Records:** The system does not handle individual patient prescriptions or medical histories.
- **Insurance Claim Processing:** Automated handling of insurance reimbursements is excluded from the current scope.

---

## System Architecture and Tech Stack

Pharma-Net adopts a Shared Backend Architecture, a model where a single, robust server manages all business logic, security, and data persistence for multiple client applications.

### Technology Stack Justification

The selection of the MERN stack is driven by the need for a high-performance, stateless system that can handle the real-time demands of pharmaceutical logistics.

- **Frontend (Web Application):** React.js with TypeScript and Material UI (MUI). React's component-based architecture is ideal for building complex, data-heavy dashboards for warehouse management. TypeScript adds a layer of static typing that prevents common coding errors in large-scale applications, while MUI provides a professional suite of UI components that ensure a consistent and responsive user experience.
- **Backend (Shared API):** Node.js and Express.js. This environment is highly efficient for handling concurrent requests, which is essential when multiple pharmacies and warehouse managers are interacting with the system simultaneously. Express.js provides a robust routing framework for building the RESTful API endpoints consumed by both the web and mobile clients.
- **Database:** MongoDB with Mongoose ODM. MongoDB's document-oriented structure allows for flexible data modeling, which is particularly useful for pharmaceutical data that may include varying attributes like storage temperatures or specialized handling instructions. Mongoose is used to enforce strict schema validation, ensuring that only clean, well-structured data enters the system.
- **Security and Communication:** Stateless JWT for authentication and HTTPS/TLS for all data in transit. This ensures that sensitive pharmaceutical data is protected from interception and that user identity is verified for every transaction.

### High-Level Architecture and Data Flow

The architecture is structured as a distributed system with clear boundaries between the presentation, logic, and data layers.

1. **Client Layer:** The React-based internal web app (Management Console) and the mobile pharmacy app (Consumer) act as the presentation layer. Both clients interact with the server exclusively through RESTful API endpoints using JSON payloads.
2. **Logic Layer (Shared API):** The Node.js server acts as the "gatekeeper." It handles authentication middleware, role-based authorization, request validation, and the execution of business logic. This layer is stateless, meaning it does not store session data on the server, which facilitates horizontal scaling through containerization (e.g., Docker) behind a load balancer.
3. **Data Layer:** MongoDB serves as the "Source of Truth," storing all persistent records. The data layer is designed to handle high volumes of inventory and transaction records efficiently through the use of database indexing on critical fields like medicine SKU and user email.

The interaction follows a standard REST pattern: a client sends an HTTPS request (e.g., `POST /api/orders`) with a JWT in the header; the server verifies the token, validates the request body against Mongoose schemas, executes the stock deduction logic, records an audit log entry, and returns a JSON response (e.g., `201 Created`).

---

## Database Design

The database design for Pharma-Net is optimized for data integrity and traceability, following the ALCOA+ framework to ensure that all records are Attributable, Legible, Contemporaneous, Original, and Accurate.

### Entity Relationship (ER) Logic

The system utilizes five primary collections in MongoDB, with relationships established through ObjectIDs to ensure referential integrity.

- **Users to Actions:** A one-to-many (1:N) relationship where one user record is linked to multiple orders, payments, and audit log entries.
- **Medicines to Batches:** A one-to-many relationship where a single medicine entry contains an array of batch objects, each with its own quantity, location, and expiry date.
- **Orders to Items:** A one-to-many relationship linking a single order to multiple medicine records through an embedded array of item objects.
- **Orders to Payments:** A one-to-one (1:1) or one-to-many (1:N) relationship where orders are linked to specific payment transaction records.

### Schema Definition Table

The following table summarizes the primary fields and validation rules for the core database collections.

| Collection    | Key Attributes and Types                                                                   | Integrity Logic                                                              |
|---------------|--------------------------------------------------------------------------------------------|------------------------------------------------------------------------------|
| **Users**     | `_id`, `name`, `email` (Unique), `passwordHash`, `role`, `isActive`                       | Uses bcrypt for hashing and RBAC for access control.                         |
| **Medicines** | `_id`, `name`, `sku` (Unique), `category`, `price`, `totalStock`, `batches`, `isDeleted`  | Soft delete (`isDeleted: true`) to preserve historical audit data.           |
| **Orders**    | `_id`, `pharmacyId` (Ref), `items`, `totalAmount`, `status`, `approvedBy` (Ref)           | Timestamps automatically generated by Mongoose.                              |
| **Payments**  | `_id`, `orderId` (Ref), `amount`, `method`, `status`, `recordedBy` (Ref), `timestamp`     | Linked to order and user for financial accountability.                       |
| **AuditLogs** | `_id`, `userId` (Ref), `actionType`, `resource`, `oldData`, `newData`, `timestamp`        | Immutable records capturing state changes (Before/After).                   |

### Data Integrity Standards (ALCOA+)

To simulate a professional, regulated environment, the database design enforces several critical integrity features.

- **Immutability:** The `AuditLogs` collection is append-only. No API endpoints exist to edit or delete log entries, ensuring a permanent record of all system activity.
- **Traceability:** Every change to a medicine or order record is linked to the `userId` of the person who initiated the change, satisfying the "Attributable" requirement.
- **Contemporaneous Logging:** Timestamps are generated by the server at the moment of the transaction, not provided by the client, ensuring they reflect the actual time of the event.
- **Soft Deletes:** Records are never permanently removed from the database; instead, they are marked with an `isDeleted` flag. This preserves historical data for audits and sales analysis even after an item is no longer in active use.

---

## User Flow and Wireframes

The user flow for the Pharma-Net web application is designed to maximize operational efficiency for warehouse and administrative personnel, providing clear paths for inventory management and order fulfillment.

### User Flow Diagrams: Key Paths

**1. Inventory Management Flow (Warehouse Manager)**

- **Login:** Manager authenticates via the web login screen.
- **Dashboard View:** Displays low-stock and expiring-soon alerts.
- **Stock Adjustment:** Manager navigates to the Inventory screen and selects a medicine.
- **GRN/GIN Submission:** Manager enters stock movement details (e.g., received 500 units of Aspirin, Batch #A123).
- **System Update:** The backend validates the entry, updates the `totalStock`, and records an entry in the `AuditLogs`.

**2. Order Approval Flow (Warehouse Manager)**

- **Order Review:** Manager opens the "Pending Orders" tab to see requests from pharmacies.
- **Validation:** System displays the requested quantity alongside current stock levels.
- **Action:** Manager selects "Approve" or "Reject" (providing a reason for rejection).
- **Automation:** Upon approval, the system atomically decrements stock, updates the order status to "Approved," and generates a notification for the mobile team's API.

**3. User Governance Flow (System Administrator)**

- **Account Management:** Admin accesses the Admin Console to create or disable user accounts.
- **Audit Review:** Admin filters the global `AuditLogs` by date or user ID to review system-wide changes.
- **System Health:** Admin views KPIs related to total orders and active warehouse users.

### Key Wireframe Descriptions

The internal web application features three primary screens designed for data density and clarity.

1. **The Command Center Dashboard:** This is the landing page for all internal users. It features real-time data widgets showing critical inventory alerts (Red for low stock, Yellow for near-expiry) and a summary of today's order volume. A sidebar navigation allows quick switching between Inventory, Orders, and Reporting modules.

2. **Inventory Grid & Audit View:** A tabular view of all medicines in the warehouse. Each row includes the SKU, category, total stock, and a "last updated" timestamp. Expanding a row reveals the batch-specific details and an inline "Adjust Stock" button. Color-coding is used throughout to highlight items requiring immediate attention.

3. **Order Processing Interface:** A split-screen view where the left side lists all pending orders and the right side displays the full details of the selected order (items, pharmacy name, total cost). A prominent "Status" stepper shows the order's progression. Action buttons (Approve/Reject) are located at the bottom of the detail pane, requiring a confirmation modal to prevent accidental clicks.

---

## Implementation Plan

The development roadmap is structured into distinct phases, prioritizing the establishment of the shared backend as the "source of truth" for the entire Pharma-Net ecosystem.

### Development Milestones

| Phase                                   | Focus                  | Key Deliverables                                                                                                          |
|-----------------------------------------|------------------------|---------------------------------------------------------------------------------------------------------------------------|
| **Phase 1: Foundation** (Week 1)        | Core Infrastructure    | GitHub repository setup, folder structure, MongoDB/Mongoose connection, and basic Express server configuration.           |
| **Phase 2: Authentication** (Week 2)    | Security & IAM         | User model implementation, password hashing with bcrypt, JWT login/registration logic, and RBAC middleware.               |
| **Phase 3: Inventory & Logic** (Week 3) | Core Business Engine   | Medicine CRUD API, batch/expiry logic, stock validation middleware, and GRN/GIN adjustment endpoints.                     |
| **Phase 4: Orders & Reporting** (Week 4)| Transactions & UI      | Order placement API, status workflow, payment recording, internal web dashboard development, and report generation features.|

### Definition of Done (DoD)

The project is considered complete and ready for deployment when it satisfies the following technical and functional criteria:

- **Functional API:** All RESTful endpoints for authentication, inventory, orders, and payments are fully functional and return standard HTTP status codes (200, 201, 400, 401, 403, 404, 500).
- **Web Dashboard Integrity:** The internal management UI correctly reflects database state in real-time and enforces role-based visibility for Admins and Warehouse Managers.
- **Data Integrity Verification:** Audit logs correctly capture "Before" and "After" snapshots for all stock changes, and soft-delete logic is successfully implemented for medicines and users.
- **Technical Documentation:** The shared API is fully documented (e.g., via Swagger or a comprehensive README) to allow the mobile team to integrate their pharmacy-facing UI.
- **Successful Deployment:** The web application and backend are deployed to a production-ready environment (e.g., Vercel, Render, or a containerized server at Bahir Dar University), and the API is accessible to the mobile team.

---

## Ethiopian Regulatory Context and EFDA Compliance

As an internship project at Bahir Dar University, Pharma-Net is designed with an acute awareness of the Ethiopian pharmaceutical landscape, particularly the mandates of the Ethiopian Food and Drug Authority (EFDA).

### Traceability and Barcoding Standards

The EFDA Traceability Directive requires that pharmaceutical units be uniquely identified through GS1-compliant 2D DataMatrix barcodes. Pharma-Net's medicine and batch schemas are specifically designed to store and query these unique identifiers (GTINs and serial numbers), allowing for unit-level traceability from the warehouse to the pharmacy. This alignment ensures that the system can eventually integrate with national systems like the EFDA-MVC (Medicine Verification and Control) hub.

### Public Health Impact

By providing real-time visibility into stock levels and expiration dates, Pharma-Net addresses critical challenges in the Ethiopian health sector, such as the circulation of expired medications and medication errors due to manual data handling. The system's automated alerts for low stock and near-expiry items empower warehouse managers to make data-driven procurement decisions, reducing waste and ensuring that life-saving drugs are available when and where they are needed most. This digital transformation supports the broader goals of the EFDA to enhance patient safety and supply chain security across the country.

---

## Technical Logic: Stock Validation and Atomic Transactions

A core technical challenge in pharmaceutical logistics is ensuring that stock levels remain accurate under heavy load. Pharma-Net addresses this through atomic database operations and strict backend validation logic.

### Atomic Updates in MongoDB

To prevent race conditions—where two users might attempt to order the same last unit of medicine simultaneously—the system utilizes MongoDB's `$inc` operator within a transaction. The logic for stock deduction (ΔS) is represented as:

```
Snew = Sold + Qadjustment
```

where `Qadjustment` is a negative value for order fulfillments or a positive value for inventory receipts (GRN). The system performs a "find-and-modify" operation that checks if `Snew + Qadjustment` is greater than or equal to zero before committing the change. This ensures that the `totalStock` field never drops below zero, maintaining the "Accurate" requirement of the ALCOA+ framework.

### Backend Validation Pipeline

Every request to modify inventory or orders passes through a three-stage validation pipeline:

1. **Authentication & Role Check:** Verifies the user has a valid JWT and the required role (Warehouse Manager).
2. **Schema Validation:** Mongoose checks that the request body contains all required fields (e.g., `batchNo`, `quantity`, `expiryDate`) and that data types are correct.
3. **Business Logic Check:** The system verifies that the specific batch being adjusted exists and has sufficient quantity. For expiration date changes, it ensures the new date is in the future.

This multi-layered approach ensures that the shared backend remains a robust and reliable "Source of Truth" for all connected clients, providing the structural integrity required for a mission-critical medical supply chain.