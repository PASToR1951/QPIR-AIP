# AIP-PIR Management System

## Annual Implementation Plan and Program Implementation Review Portal

**Formal IT Capstone Documentation**

| Field | Details |
| --- | --- |
| Organization | Department of Education, Schools Division of Guihulngan City |
| System Version | Beta 3, `v1.2.0-beta` |
| Document Status | Technical documentation draft |
| Date | [Insert date] |
| Researchers / Developers | [Insert names] |
| Adviser / Evaluator | [Insert name] |

---

## Abstract

The Department of Education requires schools and division offices to prepare, monitor, and evaluate program implementation through planning and review documents such as the Annual Implementation Plan (AIP) and Program Implementation Review (PIR). In many local workflows, these records are prepared and consolidated through spreadsheets, manual tracking, or disconnected files. This approach can create delays, duplicate encoding, weak status visibility, and difficulty enforcing review requirements.

The AIP-PIR Management System is a centralized web-based portal designed for the DepEd Division of Guihulngan City. It digitizes AIP and PIR records, enforces the dependency of PIR submissions on approved AIP baseline data, supports role-based access control, preserves drafts, routes school submissions through focal-person recommendation and CES review, and generates print-ready documents from structured records. The system is implemented with React 19 and Vite for the frontend, Deno and Hono for the backend API, PostgreSQL for relational data storage, and Prisma ORM for type-safe database access.

This documentation describes the system background, objectives, scope and limitations, related concepts, methodology, system design, implementation, testing evidence, conclusions, and recommendations. It documents the current Beta 3 behavior and does not claim final production impact, formal user acceptance results, or measured performance benchmarks beyond evidence available in the repository.

## Keywords

AIP; PIR; DepEd; Monitoring and Evaluation; Role-Based Access Control; Web-Based Information System; PostgreSQL; React; Deno

---

## Table of Contents

1. [Chapter 1: Introduction](#chapter-1-introduction)
2. [Chapter 2: Review of Related Literature and Systems](#chapter-2-review-of-related-literature-and-systems)
3. [Chapter 3: Methodology](#chapter-3-methodology)
4. [Chapter 4: System Analysis and Design](#chapter-4-system-analysis-and-design)
5. [Chapter 5: System Implementation](#chapter-5-system-implementation)
6. [Chapter 6: Testing and Evaluation](#chapter-6-testing-and-evaluation)
7. [Chapter 7: Conclusion and Recommendations](#chapter-7-conclusion-and-recommendations)
8. [References](#references)
9. [Appendices](#appendices)

---

## Chapter 1: Introduction

### 1.1 Background of the Study

The Annual Implementation Plan (AIP) functions as a school or office planning document that identifies target outcomes, projects, activities, timelines, responsibilities, and budgetary requirements for a fiscal year. The Program Implementation Review (PIR) functions as a monitoring and evaluation mechanism used to assess accomplishments against planned targets. Within the DepEd monitoring and evaluation context, the AIP establishes the intended work while the PIR records the extent to which that work was carried out.

The Division of Guihulngan City requires a reliable mechanism for encoding, tracking, reviewing, and consolidating AIP and PIR records across schools and division personnel. When planning and review documents are handled through separate spreadsheets or manual consolidation, the process becomes vulnerable to fragmented records, delayed reporting, duplicate encoding, inconsistent document formatting, and weak enforcement of workflow requirements.

The AIP-PIR Management System addresses these concerns by providing a centralized portal for planning and implementation review records. The system combines structured data entry, relational storage, review routing, dashboard visibility, and generated print-ready documents. It aligns the technical workflow with DepEd planning and monitoring concepts while preserving role-specific responsibilities.

### 1.2 Problem Statement

The study addresses the following documentation and workflow problems:

1. AIP and PIR records may be stored in disconnected files, making tracking and consolidation difficult.
2. Manual workflows make it harder to enforce the dependency of PIR submissions on approved AIP data.
3. School, Division Personnel, CES, Admin, Observer, and Pending users require different access boundaries that are difficult to maintain in a spreadsheet-based process.
4. Long planning and review forms create a risk of lost work when drafts are not persisted reliably.
5. Submission status, returned records, focal recommendation, and CES review can be difficult to monitor without a central status model.
6. Standardized printed documents require consistent formatting and data provenance.

### 1.3 General Objective

The general objective of the AIP-PIR Management System is to provide a centralized, secure, and structured web-based portal for managing Annual Implementation Plan and Program Implementation Review records within the DepEd Division of Guihulngan City.

### 1.4 Specific Objectives

The system specifically aims to:

1. Digitize the creation, saving, submission, review, and viewing of AIP and PIR records.
2. Enforce workflow rules that require PIR records to be based on approved AIP baseline data.
3. Implement role-based access control for school users, division personnel, CES reviewers, administrators, observers, and pending accounts.
4. Support draft persistence for long forms so users can save and resume work.
5. Route school submissions through focal-person recommendation and CES review.
6. Provide administrative tools for managing users, schools, clusters, programs, focal persons, deadlines, reports, announcements, sessions, and backups.
7. Generate print-ready AIP and PIR documents from structured system records.
8. Preserve traceability through relational records, status metadata, notifications, audit logs, and review remarks.

### 1.5 Significance of the Study

The system is significant to the following stakeholders:

| Stakeholder | Significance |
| --- | --- |
| School Users | Provides a guided interface for encoding AIP and PIR records, saving drafts, and viewing submission status. |
| Division Personnel | Supports program assignment, focal-person review, and division-level AIP/PIR records. |
| CES Reviewers | Provides queues for focal-recommended AIPs and PIRs within the appropriate functional division. |
| Administrators | Provides tools for account management, program configuration, deadlines, reports, announcements, sessions, and backups. |
| Observers | Provides read-only access for monitoring without allowing workflow actions. |
| Learners and DepEd stakeholders | Indirectly supports better planning traceability and monitoring accountability. |

### 1.6 Scope and Limitations

The system covers the following functional scope:

1. Digital encoding and management of AIP records.
2. PIR creation based on approved or available AIP baseline data.
3. Role-based access for School, Division Personnel, CES, Admin, Observer, and Pending users.
4. Focal-person recommendation and CES review routing for school submissions.
5. Draft saving and restoration for AIP and PIR forms.
6. Print-ready AIP and PIR document generation.
7. Administrative management of users, schools, clusters, programs, focal-person assignments, deadlines, announcements, reports, email settings, backups, and sessions.
8. Privacy-related controls such as soft delete, anonymization, audit logs, personal-data export, session revocation, and logout cleanup.
9. Dashboard and reporting support for tracking submission status and program activity.

The system has the following limitations:

1. The accuracy of reports and generated documents depends on the correctness of data entered by users.
2. Email delivery, OAuth sign-in, reCAPTCHA verification, and backup processing depend on correct external service configuration.
3. Generated documents depend on browser rendering and PDF/export behavior.
4. Formal user acceptance testing results are not included in this documentation unless supplied later.
5. Production performance metrics are not included unless measured in a deployed environment.
6. This document reflects Beta 3 behavior, `v1.2.0-beta`, and must be revised when future releases change workflows or data structures.
7. The system does not replace DepEd policy; it digitizes and supports the documented planning and monitoring workflow.

### 1.7 Definition of Terms

| Term | Definition |
| --- | --- |
| AIP | Annual Implementation Plan, the planning baseline for programs, activities, targets, timelines, and budget. |
| PIR | Program Implementation Review, the monitoring record comparing accomplishments against planned AIP targets. |
| CES | Chief Education Supervisor role used for functional division review in the system. |
| Focal Person | Assigned Division Personnel user who reviews school submissions before CES review. |
| RBAC | Role-Based Access Control, an authorization approach that grants access according to user role and resource ownership. |
| Draft | A saved but not final record that can still be edited by the owner. |
| Returned | A record sent back to the submitter for correction. |
| Approved | A record accepted by the authorized reviewer. |
| HttpOnly Cookie | A browser cookie inaccessible to JavaScript and used here to store the signed JWT session token. |
| ORM | Object-Relational Mapper, the data access layer that maps application code to relational database records. |

---

## Chapter 2: Review of Related Literature and Systems

### 2.1 DepEd Planning and Monitoring Context

The system is aligned with the DepEd monitoring and evaluation context described in DepEd Order No. 029, s. 2022, the Basic Education Monitoring and Evaluation Framework (Department of Education, 2022). The policy context recognizes monitoring and evaluation as a mechanism for evidence-based decision-making and program improvement. The Governance of Basic Education Act of 2001 also establishes governance responsibilities in basic education, supporting the need for accountable planning and reporting structures (Republic Act No. 9155, 2001).

Within this context, the AIP-PIR portal is not a policy-making tool. It is a digital information system that supports the encoding, tracking, review, and documentation of the planning and evaluation cycle.

### 2.2 Annual Implementation Plan Concepts

The AIP defines planned activities, objectives, indicators, persons involved, timelines, outputs, and budget sources. In the system, an AIP becomes a structured baseline record. Its activities are grouped into planning, implementation, and monitoring and evaluation phases. This structure reflects common project management sequencing and helps users encode the intended work in a consistent form (Project Management Institute, 2021).

### 2.3 Program Implementation Review Concepts

The PIR records actual implementation against the AIP baseline. In the system, PIR activity reviews compare planned activities with physical and financial accomplishments, expected outputs, adjustments, and actions to address gaps. The PIR also captures facilitating and hindering factors such as institutional, technical, infrastructure, learning resources, environmental, and other factors.

### 2.4 Web-Based Management Systems

Web-based information systems are suited for multi-user workflows because they centralize data storage and make records available across authorized devices. Single Page Application patterns can provide a fluid user experience by reducing full-page reloads during navigation (Mesbah & van Deursen, 2007). React's component-based design supports modular user interfaces for complex forms, dashboards, modals, and review queues (Aggarwal, 2018).

### 2.5 Role-Based Access Control

Role-Based Access Control separates permissions by job function and responsibility. In the AIP-PIR portal, school users are limited to their assigned school, division personnel are limited by program ownership or focal-person assignment, CES users are limited by functional division routing, administrators manage configuration and oversight tools, and observers receive read-only access. This supports the principle of least privilege described by Saltzer and Schroeder (1975).

### 2.6 Secure Session Handling

The system uses signed JSON Web Tokens (JWTs) stored in HttpOnly cookies. JWTs provide a compact and signed representation of identity claims (Bradley et al., 2015), while HttpOnly storage reduces exposure to JavaScript-accessible token theft. The backend also validates session rows, expiry, revocation state, role matching, and active-user status before allowing protected requests.

### 2.7 Relational Database Design

The system data model is relational because users, schools, programs, AIPs, PIRs, activities, factors, deadlines, sessions, and logs have structured relationships. Relational design supports referential integrity and reduces duplication when normalized. The schema follows the principles of relational modeling introduced by Codd (1970), with normalization concepts consistent with Date (2019).

### 2.8 Related Systems

Comparable digital workflow systems commonly provide user authentication, workflow status tracking, review queues, reports, document generation, and audit history. The AIP-PIR portal applies those ideas to the specific DepEd planning and PIR workflow. Its distinguishing requirement is the direct dependency between AIP baseline records and PIR review records, along with focal-person and CES routing.

### 2.9 Synthesis

The related concepts support the need for a centralized information system that can enforce access control, preserve structured data, generate consistent documents, and maintain workflow traceability. A spreadsheet-based process can store data, but it cannot reliably enforce ownership, status transitions, reviewer routing, server-side validation, session security, or relational consistency. The AIP-PIR system fills this gap by combining web-based forms, relational data modeling, role-specific access, and structured review workflows.

---

## Chapter 3: Methodology

### 3.1 Development Approach

The system follows an iterative and prototype-based development approach. Features are refined through repeated updates to requirements, data models, frontend forms, backend routes, review workflows, and documentation. This approach is appropriate because the AIP/PIR workflow involves multiple roles, evolving status rules, and institutional document requirements that benefit from incremental validation.

### 3.2 Requirement Gathering Sources

The requirements were derived from:

1. The AIP and PIR workflow needs of schools and division personnel.
2. DepEd monitoring and evaluation policy context.
3. Role boundaries for school users, division personnel, CES reviewers, administrators, observers, and pending users.
4. Existing application behavior documented in the README, route structure, Prisma schema, security documentation, and concurrency documentation.
5. The need for print-ready documents and structured reporting.

### 3.3 System Design Method

The design uses a modular client-server architecture:

| Layer | Design Method |
| --- | --- |
| Frontend | React components, route guards, dashboards, form modules, and document views. |
| Backend | Deno/Hono HTTP routes, middleware, authentication helpers, validation, review actions, and admin services. |
| Database | PostgreSQL relational tables accessed through Prisma ORM. |
| Security | JWT authentication, HttpOnly cookies, server-side authorization, session records, audit logs, and privacy controls. |

### 3.4 Development Tools and Technologies

| Purpose | Technology |
| --- | --- |
| Frontend framework | React 19 |
| Frontend build tool | Vite |
| Styling | Tailwind CSS 4 |
| Backend runtime | Deno 2 |
| Backend web framework | Hono 4 |
| Database | PostgreSQL |
| ORM | Prisma 7 |
| Authentication | JWT in HttpOnly cookies, Google OAuth support |
| Reporting and document generation | React document components, browser print/export support, CSV/XLSX export support where implemented |

### 3.5 Testing and Validation Approach

The testing approach combines automated and manual validation. Automated tests cover selected server behavior such as security helpers, session handling, Prisma error mapping, concurrency helpers, admin route behavior, and shared route handlers. Frontend validation is supported by linting, production builds, and onboarding validation scripts. Manual validation scenarios cover the major role-based workflows described in Chapter 6.

### 3.6 Ethical, Privacy, and Data Handling Considerations

The system handles personally identifiable information, school records, submissions, review remarks, and activity logs. Privacy-related controls include HttpOnly session cookies, server-side authorization, soft-delete timestamps, anonymization support, personal-data export, session revocation, logout cleanup, and audit logs. These controls support the confidentiality, integrity, and availability expectations associated with the Data Privacy Act of 2012 (Republic Act No. 10173, 2012).

---

## Chapter 4: System Analysis and Design

### 4.1 Existing Manual or Decentralized Process

In a manual or spreadsheet-based process, AIP and PIR files may be created separately by different schools or offices, transmitted through email or file sharing, reviewed manually, and consolidated after submission. This process can cause inconsistent templates, delayed status updates, duplicate work, and limited traceability. It also requires reviewers to check dependencies manually, such as whether a PIR corresponds to an approved AIP.

### 4.2 Proposed System Overview

The proposed system centralizes the AIP/PIR cycle in one portal. Users authenticate through the application, access modules according to role, create or review records, receive status updates, and generate documents. The database stores the canonical record, while generated documents present the stored data in a formal layout.

### 4.3 User Roles and Responsibilities

| Role | Main Responsibilities | Access Boundary |
| --- | --- | --- |
| School | Create, save, submit, and view school-owned AIPs and PIRs. | Bound to one school and applicable programs. |
| Division Personnel | Create division-level records and act as focal reviewer when assigned. | Bound by program assignments and focal-person mappings. |
| CES-SGOD | Review focal-recommended records for SGOD programs. | Functional division review queue. |
| CES-CID | Review focal-recommended records for CID programs and fallback records without a declared division. | Functional division review queue. |
| CES-ASDS | Review focal-recommended records for OSDS programs. | Functional division review queue. |
| Admin | Manage users, schools, clusters, programs, deadlines, reports, announcements, sessions, backups, and settings. | System administration; not the normal focal/CES review chain. |
| Observer | View submitted records and dashboards without workflow actions. | Read-only monitoring. |
| Pending | Await role assignment before receiving normal access. | Restricted staging account state. |

### 4.4 System Architecture

The AIP-PIR Portal follows a three-tier client-server architecture in which the presentation, application, and data tiers are clearly separated.

#### 4.4.1 Architectural Style

The system is a Single Page Application backed by a stateless REST-style HTTP API and a relational database:

1. **Presentation tier** — A React 19 SPA bundled with Vite. It renders dashboards, forms, document views, route guards, notification UI, admin consoles, and review queues. Route guards on the frontend are a usability layer; authorization is not enforced here.
2. **Application tier** — A Deno 2 process running a Hono 4 HTTP server. It exposes REST routes for authentication, user data, AIP/PIR records, admin management, review actions, reports, notifications, and backups. It also enforces authentication, authorization, validation, concurrency control, audit logging, and notifications.
3. **Data tier** — A PostgreSQL database accessed through the Prisma 7 ORM. The schema defines the relational entities listed in Section 4.9 together with unique constraints, indexes, and partial indexes used to enforce workflow invariants.

#### 4.4.2 Component View

```text
+--------------------------------------------------------------------+
|                        Browser (React SPA)                         |
|  Pages   Components   Route Guards   API Client (fetch + cookie)   |
+-----------------------------------|--------------------------------+
                                    | HTTPS + HttpOnly JWT cookie
                                    v
+--------------------------------------------------------------------+
|                 Deno 2 + Hono 4 (server/server.ts)                 |
|   Auth middleware   RBAC guards   Advisory locks   Audit writer    |
|         |               |              |               |           |
|         v               v              v               v           |
|    /api/auth       /api/aips      /api/pirs       /api/admin/*     |
|    /api/oauth      /api/dashboard /api/notifications /api/backup/* |
+-----------------------------------|--------------------------------+
                                    | Prisma client
                                    v
+--------------------------------------------------------------------+
|                            PostgreSQL                              |
|   Users  Schools  Programs  AIPs  PIRs  Sessions  AuditLogs  ...   |
+--------------------------------------------------------------------+
```

#### 4.4.3 Cross-Cutting Concerns

- **Authentication and session** — JWTs are signed by the backend and issued as `HttpOnly` cookies. Each protected request is matched against a `UserSession` row so that individual sessions can be revoked before the JWT expires.
- **Concurrency control** — PostgreSQL advisory locks guard concurrency-sensitive transitions, including duplicate AIP/PIR submissions for the same school, program, and reporting period (`server/lib/advisoryLock.ts`).
- **Auditability** — `AuditLog` and `UserActivityLog` rows record administrative and user activity for traceability.
- **Notifications** — A relational notifications table plus a server-sent-events stream surface workflow changes to users in near-real time.

#### 4.4.4 Deployment Shape

The frontend is built to static assets (`react-app/dist`) and served by the same Deno backend, which exposes both the API surface and the SPA. The database runs as an external PostgreSQL service. This single-process deployment keeps the operational surface small while leaving room to scale the backend horizontally if needed.

### 4.5 Systems Design

Systems design translates the architectural intent of Section 4.4 into concrete decisions for modules, interfaces, data, and behavior.

#### 4.5.1 Design Principles

1. **Server as the authority** — All authorization, validation, and state-transition rules live in the backend. Frontend route guards mirror these rules for usability but never substitute for them.
2. **Single source of truth** — Submitted records live in PostgreSQL. Generated documents are derived views of those records rather than parallel artifacts.
3. **Least privilege** — Each route validates the caller's role and resource ownership before reading or mutating data (Saltzer & Schroeder, 1975).
4. **Separation of concerns** — Frontend, backend, and database have clear module boundaries; cross-cutting concerns such as authentication and audit logging are factored into shared helpers.
5. **Idempotent, transactional writes** — Submission paths run inside advisory-lock-protected transactions to prevent duplicate records and to keep status transitions consistent under concurrent submissions.

#### 4.5.2 Module Decomposition

**Frontend (`react-app/src/`):**

| Module | Purpose |
| --- | --- |
| `pages/` | Top-level routed views including login, dashboards, AIP/PIR forms, and document views. |
| `components/` | Reusable UI primitives and composite widgets shared across pages. |
| `admin/` | Admin console pages for user, program, school, deadline, report, and backup management. |
| `lib/` | API client, auth context, formatters, and shared utilities. |

**Backend (`server/`):**

| Module | Purpose |
| --- | --- |
| `server.ts` | Bootstraps the Hono app, mounts routers, and exposes `/api/health`. |
| `routes/auth.ts`, `routes/oauth.ts` | Authentication, magic-link verification, OAuth callback, and session restore. |
| `routes/data/` | End-user data routes: AIPs, PIRs, drafts, dashboard, lookups, notifications. |
| `routes/admin/` | Admin and reviewer routes: users, programs, schools, deadlines, focal review, CES review, reports, audit logs, announcements, backups. |
| `lib/` | Shared helpers for authentication, advisory locks, Prisma error mapping, sanitization, and session validation. |
| `prisma/schema.prisma` | Authoritative data schema. |

#### 4.5.3 Data Design

The schema follows the relational model (Codd, 1970) with normalization that reduces duplication while preserving referential integrity. Selected design decisions include:

- **One school AIP per school, program, and year** — enforced by `@@unique([school_id, program_id, year])` on the `AIP` model. Division-level AIPs are enforced by a partial unique index over `created_by_user_id` rather than `school_id`.
- **One PIR per AIP and reporting period** — enforced by `@@unique([aip_id, quarter])` on the `PIR` model.
- **Program division ownership** — represented by the `Program.division` field rather than a separate entity, allowing a single program record to serve both school-level and division-level routing.
- **Phase-based AIP activities** — `AIPActivity.phase` carries one of "Planning", "Implementation", or "Monitoring and Evaluation".
- **Soft delete and anonymization** — `deleted_at` timestamps and anonymization workflows preserve audit history without destroying records.

#### 4.5.4 Interface Design

The HTTP API is REST-shaped. Resources are nouns under `/api/...`; methods follow HTTP semantics (`GET` for reads, `POST` for create or action endpoints, `PUT`/`PATCH` for updates, and `DELETE` for removal). Request and response bodies are JSON. Errors return appropriate HTTP status codes with a JSON body containing an `error` field. A representative endpoint inventory is provided in Appendix B.

#### 4.5.5 Security Design

Security design follows defense in depth:

1. The token cookie is `HttpOnly`, reducing exposure to JavaScript-accessible token theft.
2. The signed JWT carries identity claims but is paired with a server-side `UserSession` row, so individual sessions can be revoked even before the JWT expires.
3. Each protected route revalidates the user's role and resource ownership. CES routes additionally validate the division-to-role mapping defined in `server/routes/admin/pirReview.ts`.
4. Soft delete, anonymization, audit logs, and personal-data export support the confidentiality and accountability expectations of the Data Privacy Act of 2012 (Republic Act No. 10173, 2012).

### 4.6 System Flow

System flow describes how a request moves through the system from user action to persisted state and back.

#### 4.6.1 Request Lifecycle

A typical authenticated request follows this path:

1. The browser issues a fetch to `/api/...` with the `HttpOnly` JWT cookie attached.
2. Hono routes the request to the matching handler. Auth-protected handlers call `getUserFromToken` to verify the JWT and load the active session.
3. The handler validates the caller's role and resource ownership (e.g., `requireCES`, `requireAdmin`).
4. The handler parses, sanitizes, and validates the request body.
5. Mutating handlers wrap their database work in a transaction, optionally guarded by an advisory lock for concurrency-sensitive operations.
6. The handler writes audit-log entries and pushes notifications when appropriate.
7. A JSON response returns to the browser, which updates UI state.

#### 4.6.2 AIP Submission Flow

```text
School user           Backend                 PostgreSQL
   |                     |                        |
   | POST /api/aips      |                        |
   |-------------------->|                        |
   |                     | auth + RBAC check      |
   |                     | advisoryLock(AIP, key) |
   |                     | validate + transform   |
   |                     | INSERT AIP             |
   |                     |----------------------->|
   |                     | INSERT AIPActivity[..] |
   |                     |----------------------->|
   |                     | writeAuditLog          |
   |                     |----------------------->|
   |                     | pushNotification[focal]|
   |                     |----------------------->|
   | 200 OK + AIP        |                        |
   |<--------------------|                        |
```

A school AIP enters `For Recommendation` when the program has assigned focal persons. A Focal Person can later issue `POST /api/admin/focal/aips/:id/recommend` (advances to `For CES Review`) or return the record. A CES reviewer in the correct functional division then approves or returns it.

#### 4.6.3 PIR Submission Flow

PIR submission depends on AIP baseline data. When a user creates a PIR, the backend retrieves the related AIP's approved activities and populates the PIR review form. The submission path follows the same shape as the AIP path but additionally enforces:

1. The referenced AIP exists and is approved (for school PIRs).
2. The reporting period (`quarter`) is unique per AIP.
3. The submitter's role determines the entry status: school submissions enter `For Recommendation`; CES-role submissions enter `For Admin Review`; division submissions enter `For CES Review`.

#### 4.6.4 Cross-Cutting Flows

- **Notifications** — Every workflow transition that affects another role triggers a `Notification` row and a server-sent-events push so dashboards update in near-real time.
- **Audit logging** — Administrative actions and selected workflow events write to `AuditLog`; user-facing activity writes to `UserActivityLog`.
- **Background flows** — Backups can be triggered via `POST /api/admin/backup/trigger` and observed via `GET /api/admin/backup/status`. Magic-link verification consumes a one-time token and creates a session.

### 4.7 User Flow

This section walks through the typical user journey for each role.

#### 4.7.1 School User

1. Sign in via password, magic link, or Google OAuth.
2. Open the school dashboard, which lists assigned programs, current deadlines, and submission status.
3. Open the AIP form for a program and year, fill in activities grouped by Planning, Implementation, and Monitoring and Evaluation phases, save drafts as needed, and submit.
4. Wait for focal recommendation. If the AIP is returned, edit and resubmit.
5. Once the AIP is approved, open the PIR form. The system auto-populates planned activities so the user fills in physical and financial accomplishments, MOVs, adjustments, gaps, factors, and recommendations.
6. Submit the PIR; respond to focal or CES return remarks as needed.
7. View read-only submitted records and download print-ready documents.

#### 4.7.2 Division Personnel

1. Sign in and open the division dashboard.
2. As a focal reviewer for assigned programs, open the focal queue (`/api/admin/focal/aips`, `/api/admin/focal/pirs`) and either recommend the submission for CES review or return it with remarks.
3. As a program owner, create and submit division-level AIPs and PIRs. Division-level PIRs skip focal recommendation and enter `For CES Review` directly.

#### 4.7.3 CES Reviewer (CES-SGOD, CES-ASDS, CES-CID)

1. Sign in and open the CES queue, which is filtered by functional division: SGOD for `CES-SGOD`, OSDS for `CES-ASDS`, and CID together with null-division programs for `CES-CID`.
2. Open a focal-recommended AIP or PIR, review the contents, and either approve or return with remarks. For PIRs the reviewer may first transition the record to `Under Review` to indicate active review.
3. CES reviewers may also create and submit their own PIRs. Those records enter `For Admin Review` and are surfaced through the admin consolidation view.

#### 4.7.4 Administrator

1. Sign in and open the admin console.
2. Manage users (create, update, deactivate, anonymize), schools and clusters, programs, focal-person assignments, deadlines and trimester windows, email and OAuth settings, announcements, sessions, audit logs, and backups.
3. Generate and export reports for compliance, monitoring, budget, workload, accomplishments, factors, and consolidated views.
4. Trigger backups and review backup status.

#### 4.7.5 Observer

1. Sign in and open the observer dashboard.
2. View submitted records, dashboards, and reports in read-only mode without taking workflow actions.

#### 4.7.6 Pending Account

1. After signup or first login, the account is created in the `Pending` state with restricted access.
2. An administrator assigns the appropriate role, after which the user gains full role-specific access on the next sign-in or session refresh.

### 4.8 Entity-Relationship Model

The database uses relational entities for schools, clusters, users, programs, AIPs, AIP activities, PIRs, PIR activity reviews, PIR factors, deadlines, trimester deadlines, sessions, notifications, announcements, audit logs, magic link tokens, and email configuration.

<div style="margin:32px 0;">
  <figure style="margin:0;">
    <a href="/AIP-PIR.svg" target="_blank" rel="noreferrer">
      <img src="/AIP-PIR.svg" alt="AIP-PIR Portal entity-relationship diagram" style="width:100%;height:auto;display:block;" />
    </a>
    <figcaption style="margin-top:12px;font-size:0.85rem;text-align:center;"><strong>Figure 4.1.</strong> Entity-Relationship Diagram of the AIP-PIR Portal database schema.</figcaption>
  </figure>
</div>

### 4.9 Core Data Model

| Entity | Purpose |
| --- | --- |
| Cluster | Groups schools for organizational reporting. |
| School | Represents a school associated with users and submissions. |
| User | Represents authenticated accounts, roles, names, OAuth fields, sessions, and program assignments. |
| Program | Represents both school-level and division-level programs. Division ownership is expressed by the `division` field (`SGOD`, `OSDS`, `CID`, or null) rather than by a separate entity. Also stores access restrictions and focal-person mappings. |
| ProgramTemplate | Stores default program data used to prefill new AIP forms. |
| ProgramFocalPerson | Maps programs to Division Personnel users who can recommend school submissions. |
| AIP | Stores the annual planning baseline, status, reviewer metadata, and ownership. |
| AIPActivity | Stores phase-based activities, implementation period, outputs, persons involved, and budget data. |
| PIR | Stores review period, ownership, status, reviewer metadata, budget context, and action items. |
| PIRActivityReview | Stores physical and financial accomplishment data tied to planned or unplanned activities. |
| PIRFactor | Stores facilitating factors, hindering factors, and recommendations by factor type. |
| Deadline and TrimesterDeadline | Store submission windows and grace periods. |
| UserSession | Stores server-side session state, expiry, revocation, user agent, and last seen data. |
| AuditLog and UserActivityLog | Preserve administrative and user activity traceability. |

### 4.10 Database Normalization Strategy

The schema follows normalization principles to reduce duplication and preserve consistency:

1. First Normal Form: Repeating data, such as activities and review entries, is stored in separate rows rather than comma-separated fields.
2. Second Normal Form: Non-key attributes depend on their owning record. For example, school metadata belongs to the School entity.
3. Third Normal Form: Program restrictions, user program assignments, and focal-person assignments use relational mappings instead of duplicating program data across user rows.

The system also uses unique constraints and indexes to support data integrity, such as one school AIP per school, program, and year, and one PIR per AIP and reporting period.

### 4.11 Security and Authorization Model

Authentication uses JWTs issued by the backend and stored as HttpOnly cookies. Protected backend routes verify the token, server-side session row, expiry, revocation state, role match, and active-user state. The frontend route guards improve user experience, but the backend remains the authoritative security boundary. This follows the principle that client-side route checks should not be treated as a complete access-control mechanism (OWASP Foundation, 2021).

Authorization is resource-aware. A school user can only access records for the assigned school. Division Personnel users can access assigned programs and focal queues. CES users can access only the functional division queue they are assigned to review. Admin users manage configuration and oversight functions. Observer users receive read-only monitoring access.

### 4.12 AIP/PIR Workflow Model

School AIPs and PIRs follow a multi-step review chain in Beta 3. This models a role-specific approval workflow in which each reviewer contributes a defined control point before final approval (Weske, 2012).

```text
School AIP:
Draft -> For Recommendation -> For CES Review -> Approved
                    -> Returned -> For Recommendation

School PIR:
Draft -> For Recommendation -> For CES Review -> Under Review -> Approved
                    -> Returned -> For Recommendation

Division-level PIR:
Draft -> For CES Review -> Under Review -> Approved
                    -> Returned -> For CES Review

CES-submitted PIR:
Draft -> For Admin Review
```

Division Personnel AIPs are stored as division-level planning records and use ownership by `created_by_user_id`. School PIR creation requires the related AIP to be approved before submission can proceed.

Because CES-role users cannot review their own submissions, a PIR submitted by a CES reviewer enters the `For Admin Review` holding state rather than the CES queue. In Beta 3 this state is surfaced to administrators through the consolidation view, but dedicated approve and return endpoints for this state are not yet exposed and remain a documented gap for future work.

### 4.13 Draft Persistence Model

AIP and PIR drafts are saved as relational records with `status = "Draft"`. This allows users to resume work across sessions and devices when they are authenticated. Server-side draft persistence is preferable to relying only on browser local storage because the saved record is tied to the authenticated user and protected by backend authorization. This follows the broader application architecture principle that important domain state should be stored in a durable system of record rather than only in a volatile client context (Fowler, 2002).

### 4.14 Document Generation Model

The system generates print-ready AIP and PIR document views from the same structured records used by the application. This reduces re-encoding and helps ensure that generated documents match the database state. Submitted records are shown in read-only views to preserve audit integrity, while returned or draft records can be edited according to workflow rules.

---

## Chapter 5: System Implementation

### 5.1 Frontend Implementation

The frontend is implemented as a React 19 Single Page Application bundled with Vite. React components organize dashboards, AIP and PIR forms, admin pages, CES pages, notification UI, onboarding, and document views. Tailwind CSS 4 provides utility-based styling and supports consistent spacing, typography, and component states.

React is suitable for this system because the AIP and PIR forms include dynamic rows, multi-step workflows, calculations, status-dependent views, and read-only document rendering. The SPA model also supports smooth navigation between dashboards, forms, review queues, and history pages.

### 5.2 Backend Implementation

The backend is implemented using Deno and Hono. Deno provides native TypeScript support and an explicit runtime permission model, while Hono provides lightweight HTTP routing. Deno's design was introduced as a response to several server-side JavaScript limitations identified by Dahl (2018). Backend routes are grouped by domain, including authentication, OAuth, user data, admin functions, backup functions, reports, focal review, CES review, notifications, and submissions.

The backend handles validation, authorization, database transactions, advisory locks for concurrency-sensitive operations, notification creation, audit logging, and response formatting. Its REST-style route surface follows common web service design patterns for resource-oriented operations (Richardson & Ruby, 2008).

### 5.3 Database and ORM Implementation

PostgreSQL stores relational data for the system. Prisma ORM provides a generated client based on the schema and supports type-aware database access. This reduces the risk of mismatched column names and helps keep application queries aligned with schema changes.

The database model supports:

1. School-owned and division-owned AIPs and PIRs.
2. Activity-level AIP planning records.
3. PIR activity review entries tied to planned or unplanned work.
4. Program access restrictions.
5. Program focal-person assignments.
6. Functional division routing.
7. Session tracking and revocation.
8. Audit and activity logs.
9. Soft-delete and anonymization support.

### 5.4 Authentication Implementation

The system supports password login, magic link verification, and Google OAuth sign-in where configured. After successful authentication, the backend issues a signed JWT in an HttpOnly cookie. The frontend stores only non-secret profile and expiry hints. Protected routes call `GET /api/auth/me` to restore session state when browser session storage is empty but the server-side cookie remains valid.

Logout revokes the current server-side session, expires the token cookie, and clears app-managed browser state such as session metadata and local AIP/PIR drafts.

### 5.5 Role-Based Access Implementation

Role-based access is implemented on both frontend and backend layers. The frontend hides or shows navigation and modules based on role. The backend enforces the actual authorization rule before returning or mutating data. This layered approach improves usability while preserving server-side security.

### 5.6 AIP Module Implementation

The AIP module supports form creation, draft saving, submission, returned-record editing, read-only submitted views, and generated document output. Activities are grouped into Planning, Implementation, and Monitoring and Evaluation phases. School submissions require assigned focal persons for the selected program before the record can enter the recommendation workflow.

### 5.7 PIR Module Implementation

The PIR module depends on AIP baseline data. When a user creates a PIR, the system retrieves related AIP activities and populates the PIR review form. Users enter accomplishments, MOVs or expected outputs, adjustments, actions to address gaps, and factor-based observations. For school submissions, the PIR is routed to focal review and then CES review. Division-level PIRs route directly to CES review.

### 5.8 Focal Person and CES Review Implementation

Focal-person review is available to assigned Division Personnel users. They can recommend or return school-owned AIPs and PIRs under their assigned programs. A recommendation moves the record to `For CES Review`; a return sends the record back to the submitter with remarks.

CES reviewers access role-specific queues. `CES-SGOD` handles SGOD programs, `CES-ASDS` handles OSDS programs, and `CES-CID` handles CID programs and programs without a declared division where applicable. CES users can approve or return AIPs and can start, note, approve, or return PIRs.

### 5.9 Admin Module Implementation

The admin module supports configuration and oversight. Admin users can manage users, schools, clusters, programs, focal-person assignments, division programs, deadlines, trimester windows, settings, reports, announcements, email configuration, sessions, logs, and backups. Admin users also have oversight tools, but the normal review chain for school submissions is performed by focal reviewers and CES roles.

### 5.10 Reporting, Notifications, Announcements, and Audit Logs

Reporting routes provide datasets and exports for compliance, quarterly or trimester monitoring, budget, workload, accomplishments, factors, AIP funnel, and cluster PIR summary views where implemented. Notifications inform users about relevant workflow changes. Announcements allow system-wide or targeted messages. Audit logs preserve administrative actions and selected workflow activity for accountability.

### 5.11 Backup and Privacy-Related Features

Backup features include administrative visibility and trigger support for configured backup services. Privacy features include soft-delete timestamps, anonymization workflows, personal-data export, session revocation, and logout cleanup. These controls support responsible handling of user and submission data.

---

## Chapter 6: Testing and Evaluation

### 6.1 Testing Strategy

The system uses a combination of automated tests, build checks, linting, and manual workflow validation. This documentation records available evidence in the repository and does not invent user survey results, production benchmarks, or formal UAT percentages.

### 6.2 Existing Automated Evidence

The repository includes server tests for:

| Test File | Area |
| --- | --- |
| `server/concurrency.integration.test.ts` | Concurrent submission and workflow hardening. |
| `server/lib/advisoryLock.test.ts` | Advisory lock helper behavior. |
| `server/lib/prismaErrors.test.ts` | Prisma error classification and conflict mapping. |
| `server/lib/security.test.ts` | Security utility behavior. |
| `server/lib/userSessions.test.ts` | Session validation and revocation behavior. |
| `server/lib/quarters.test.ts` | Quarter helper behavior. |
| `server/lib/trimesters.test.ts` | Trimester helper behavior. |
| `server/routes/admin/security.test.ts` | Admin access-control behavior. |
| `server/routes/admin/logs/adminLogs.test.ts` | Admin log behavior. |
| `server/routes/admin/shared/exports.test.ts` | Export utility behavior. |
| `server/routes/admin/submissions/pirActions.test.ts` | Admin PIR action behavior. |
| `server/routes/data/shared/asyncHandler.test.ts` | Data-route error handling behavior. |

### 6.3 Frontend Validation

Available frontend validation commands include:

```bash
cd react-app
npm run lint
npm run build
npm run validate:onboarding
```

These checks validate code quality, production build readiness, and onboarding content consistency. They do not replace formal user acceptance testing.

### 6.4 Backend Validation

The server uses Deno tests under `server/**/*.test.ts`, including the concurrency integration test. A full backend validation pass should be performed from the `server` directory using the Deno test command appropriate to the local environment and permissions.

### 6.5 Manual Workflow Test Scenarios

| Test Area | Scenario | User Role | Expected Result | Evidence Type |
| --- | --- | --- | --- | --- |
| Authentication | Login, logout, and session restore | All authenticated roles | Session is restored only while valid and revoked on logout. | Manual check and session tests. |
| AIP Draft | Save school AIP draft | School | Draft is saved and can be restored. | Manual check and database record. |
| AIP Submission | Submit school AIP | School | AIP enters `For Recommendation` when focal persons are assigned. | Manual workflow check. |
| AIP Focal Review | Recommend school AIP | Division Personnel | AIP moves to `For CES Review`. | Manual workflow check. |
| AIP CES Review | Approve school AIP | CES | AIP moves to `Approved`. | Manual workflow check. |
| PIR Lock | Attempt PIR before approved AIP | School | PIR access or submission is blocked. | Manual workflow check. |
| PIR Auto-Population | Create PIR from approved AIP | School or Division Personnel | AIP activities appear in PIR review rows. | Manual workflow check. |
| PIR Submission | Submit school PIR | School | PIR enters `For Recommendation`. | Manual workflow check. |
| PIR Focal Review | Recommend or return PIR | Division Personnel | Recommended PIR enters `For CES Review`; returned PIR goes back to submitter. | Manual workflow check. |
| PIR CES Review | Start, approve, note, or return PIR | CES | PIR status and remarks are updated correctly. | Manual workflow check. |
| Admin Users | Create, update, deactivate, or anonymize users | Admin | User records and access states update correctly. | Manual check and audit logs. |
| Program Assignment | Assign programs and focal persons | Admin | Program visibility and focal queues reflect assignments. | Manual check. |
| Deadlines | Configure deadlines and trimester windows | Admin | Submission windows enforce configured dates and grace periods. | Manual check. |
| Reports | Export reports | Admin | CSV/XLSX output is generated where implemented. | Manual check. |
| Privacy | Export or anonymize personal data | Admin / User as applicable | Personal data controls behave as expected. | Manual check and audit logs. |
| Concurrency | Repeat or simultaneous submission attempts | School / Division Personnel | Duplicate records are prevented and conflicts are handled cleanly. | Automated and manual check. |

### 6.6 Evaluation Criteria

The system should be evaluated using the following criteria:

1. Functional correctness: workflows produce the expected records and statuses.
2. Data integrity: relational constraints prevent orphaned or duplicate records.
3. Security and access control: users cannot access resources outside their role and ownership boundary.
4. Usability: users can complete AIP, PIR, review, and admin workflows with clear status feedback.
5. Maintainability: code organization, schema structure, tests, and documentation support future updates.

### 6.7 Current Evidence Limitations

This document does not include formal UAT results, production performance metrics, survey percentages, interview summaries, or deployment analytics. Those should be added only after actual evaluation activities are conducted and documented.

---

## Chapter 7: Conclusion and Recommendations

### 7.1 Conclusion

The AIP-PIR Management System centralizes the documentation and review cycle for Annual Implementation Plans and Program Implementation Reviews. It converts disconnected planning and monitoring files into structured relational records, enforces workflow dependencies between AIP and PIR records, and separates access by role and ownership. The system also improves traceability through review metadata, audit logs, notifications, read-only submitted views, and generated documents.

The Beta 3 implementation supports school-level focal recommendation and CES review, division-level PIR routing, draft persistence, administrative configuration, reporting, session handling, and privacy-related controls. These features make the system a suitable technical foundation for digitizing the DepEd AIP/PIR workflow, subject to formal user validation and production readiness review.

### 7.2 Recommendations

The following improvements are recommended:

1. Conduct formal user acceptance testing with school users, division personnel, CES reviewers, administrators, and observers.
2. Add measurable usability evaluation, including task completion time, error frequency, and user satisfaction feedback.
3. Expand end-to-end tests for complete AIP and PIR workflows across all major roles.
4. Record production performance metrics after deployment, including response time, error rate, and backup reliability.
5. Prepare deployment, backup restoration, disaster recovery, and incident response documentation for production operations.
6. Add screenshots or interface figures to the appendices after the final interface is approved.
7. Update this document after future releases change status flows, data models, or institutional requirements.

---

## References

Aggarwal, S. (2018). *Modern web-development using ReactJS*. International Journal of Recent Research Aspects, 5(1), 133-137.

Bradley, J., Jones, M., & Sakimura, N. (2015). *JSON Web Token (JWT)*. RFC 7519, Internet Engineering Task Force.

Codd, E. F. (1970). A relational model of data for large shared data banks. *Communications of the ACM, 13*(6), 377-387.

Dahl, R. (2018). *10 things I regret about Node.js*. JSConf EU.

Date, C. J. (2019). *Database design and relational theory: Normal forms and all that jazz* (2nd ed.). O'Reilly Media.

Department of Education. (2022). *DepEd Order No. 029, s. 2022: Basic Education Monitoring and Evaluation Framework*.

Fowler, M. (2002). *Patterns of enterprise application architecture*. Addison-Wesley Professional.

Mesbah, A., & van Deursen, A. (2007). Migrating multi-page web applications to single-page AJAX interfaces. *11th European Conference on Software Maintenance and Reengineering*, 181-190.

OWASP Foundation. (2021). *OWASP Top 10: Broken Access Control*. Open Web Application Security Project.

Project Management Institute. (2021). *A guide to the project management body of knowledge (PMBOK Guide)* (7th ed.). Project Management Institute.

Republic Act No. 9155. (2001). *Governance of Basic Education Act of 2001*.

Republic Act No. 10173. (2012). *Data Privacy Act of 2012*.

Richardson, L., & Ruby, S. (2008). *RESTful web services*. O'Reilly Media.

Saltzer, J. H., & Schroeder, M. D. (1975). The protection of information in computer systems. *Proceedings of the IEEE, 63*(9), 1278-1308.

Weske, M. (2012). *Business process management: Concepts, languages, architectures* (2nd ed.). Springer.

---

## Appendices

### Appendix A: Entity-Relationship Diagram

The ERD is stored in the repository as `AIP-PIR.svg` and is referenced in Figure 4.1. It should be exported or embedded in the final paper format when the document is prepared for submission.

### Appendix B: API Endpoint Summary

| Area | Example Endpoints | Purpose |
| --- | --- | --- |
| Public and Auth | `GET /api/health`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` | Health check, login, logout, and session profile. |
| User Data | `GET /api/dashboard`, `GET /api/programs`, `GET /api/schools` | Dashboard and role-filtered reference data. |
| AIP | `GET /api/aips`, `POST /api/aips`, `PUT /api/aips/:id`, `GET/POST/DELETE /api/aips/draft` | AIP listing, submission, returned edit, and draft management. |
| PIR | `GET /api/pirs`, `POST /api/pirs`, `PUT/DELETE /api/pirs/:id`, `GET/POST/DELETE /api/pirs/draft` | PIR listing, submission, returned edit, deletion, and draft management. |
| Focal Review | `GET /api/admin/focal/aips`, `GET /api/admin/focal/pirs`, `POST /api/admin/focal/aips/:id/recommend`, `POST /api/admin/focal/pirs/:id/return` | Focal queue and recommendation or return actions. |
| CES Review | `GET /api/admin/ces/aips`, `POST /api/admin/ces/aips/:id/approve`, `GET /api/admin/ces/pirs`, `POST /api/admin/ces/pirs/:id/note` | CES review queues and decisions. |
| Admin Management | `/api/admin/users`, `/api/admin/schools`, `/api/admin/programs`, `/api/admin/deadlines`, `/api/admin/settings/*` | Administrative configuration and oversight. |
| Reports and Logs | `/api/admin/reports/*`, `/api/admin/audit-logs`, `/api/admin/logs` | Reports, exports, audit logs, and investigation timeline. |
| Notifications and Announcements | `/api/notifications`, `/api/notifications/stream`, `/api/announcement`, `/api/admin/announcements` | User notifications and admin announcements. |
| Backups | `GET /api/admin/backup/status`, `POST /api/admin/backup/trigger` | Backup status and backup trigger support. |

### Appendix C: User Role Matrix

| Capability | School | Division Personnel | CES | Admin | Observer | Pending |
| --- | --- | --- | --- | --- | --- | --- |
| Create school AIP/PIR | Yes | No | No | No | No | No |
| Create division-level records | No | Yes | Limited by configured workflow | No | No | No |
| Save drafts | Yes | Yes | No | No | No | No |
| Focal recommendation | No | Yes, when assigned | No | No | No | No |
| CES review | No | No | Yes | No | No | No |
| Manage users and programs | No | No | No | Yes | No | No |
| View reports and oversight data | Limited | Limited | Limited | Yes | Read-only | No |
| Configure deadlines and settings | No | No | No | Yes | No | No |
| Read-only submitted views | Own records | Assigned or owned records | Review queue records | Yes | Yes | No |

### Appendix D: AIP/PIR Workflow Status Matrix

| Record | Actor | Action | From Status | To Status |
| --- | --- | --- | --- | --- |
| School AIP | School | Save draft | None or Draft | Draft |
| School AIP | School | Submit | Draft or Returned | For Recommendation |
| School AIP | Focal Person | Recommend | For Recommendation | For CES Review |
| School AIP | Focal Person | Return | For Recommendation | Returned |
| School AIP | CES | Approve | For CES Review | Approved |
| School AIP | CES | Return | For CES Review | Returned |
| Division AIP | Division Personnel | Submit | Draft or Returned | Approved |
| School PIR | School | Save draft | None or Draft | Draft |
| School PIR | School | Submit | Draft or Returned | For Recommendation |
| School PIR | Focal Person | Recommend | For Recommendation | For CES Review |
| School PIR | Focal Person | Return | For Recommendation | Returned |
| School PIR | CES | Start review | For CES Review | Under Review |
| School PIR | CES | Approve or note | For CES Review or Under Review | Approved |
| School PIR | CES | Return | For CES Review or Under Review | Returned |
| Division PIR | Division Personnel | Submit | Draft or Returned | For CES Review |
| Division PIR | CES | Approve or note | For CES Review or Under Review | Approved |
| Division PIR | CES | Return | For CES Review or Under Review | Returned |
| CES-submitted PIR | CES user | Submit | Draft or Returned | For Admin Review |

A PIR submitted by a CES-role user enters `For Admin Review` because CES reviewers cannot review their own submissions. In Beta 3 this state is visible to administrators in the consolidation view, but a dedicated admin approve or return endpoint for `For Admin Review` PIRs is not yet implemented and is recommended as future work.

### Appendix E: Test Scenario Matrix

The detailed test scenario matrix is provided in Section 6.5. Future revisions should add actual run dates, tester names, test data references, and pass/fail results after formal validation.

### Appendix F: Interface and Branding Placeholders

Screenshots should be added after the interface is approved for final documentation. Recommended figures include:

1. Login screen.
2. School dashboard.
3. AIP form.
4. PIR form with auto-populated activities.
5. Focal-person review queue.
6. CES review queue.
7. Admin reports view.
8. Generated AIP or PIR document.

The system name AIP-PIR also carries a local identity connection to "Apir", a Filipino expression for a high five. The branding may be discussed briefly in final presentation materials, but the main technical paper should prioritize workflow, architecture, security, and evaluation.

### Appendix G: Acronym List

| Acronym | Meaning |
| --- | --- |
| AIP | Annual Implementation Plan |
| API | Application Programming Interface |
| CES | Chief Education Supervisor |
| CID | Curriculum Implementation Division |
| DepEd | Department of Education |
| ERD | Entity-Relationship Diagram |
| JWT | JSON Web Token |
| M&E | Monitoring and Evaluation |
| MOV | Means of Verification |
| ORM | Object-Relational Mapper |
| OSDS | Office of the Schools Division Superintendent |
| PIR | Program Implementation Review |
| RBAC | Role-Based Access Control |
| SGOD | School Governance and Operations Division |
| SPA | Single Page Application |
| UAT | User Acceptance Testing |
