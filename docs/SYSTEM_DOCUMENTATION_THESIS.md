---

## Chapter 1: Introduction

### 1.1 Background of the Study

The Department of Education (DepEd) mandates robust planning and evaluation mechanisms to ensure the delivery of quality basic education. The **Annual Implementation Plan (AIP)** serves as the strategic blueprint for schools, outlining specific projects, budgetary requirements, and implementation timelines for a given fiscal year. Concurrently, the **Program Implementation Review (PIR)** is the quarterly evaluation mechanism used to assess physical and financial accomplishments against the targets set in the AIP.

Historically, the consolidation and tracking of AIPs and PIRs across the Division of Guihulngan City have relied on fragmented, manual, or decentralized spreadsheet-based systems. These traditional methods are susceptible to data silos, delayed reporting, and difficulties in enforcing strict bureaucratic workflows (e.g., ensuring a school cannot submit a quarterly PIR without first having an approved AIP).

### 1.2 Objectives of the System

The **AIP-PIR Portal** is designed to digitize, standardize, and centralize the planning and review cycle. The specific objectives of this system are:

1. **Workflow Enforcement:** To programmatically enforce the dependency of the PIR upon the AIP, ensuring structural data integrity.
2. **Role-Based Access Control (RBAC):** To delineate the privileges of School-level users (data entry and submission) versus Division Personnel (monitoring and evaluation).
3. **Data Persistence & Draft Management:** To provide stateful form management, allowing users to save drafts and resume work, thereby reducing data loss during lengthy planning sessions.
4. **Automated Document Generation:** To dynamically generate print-ready, standardized DepEd-compliant documents directly from the database schema.

### 1.3 System Brand Identity: The *"Apir"* Connection

The system's name — **AIP-PIR** — carries a deliberate cultural dimension rooted in Filipino identity. When the acronym is spoken aloud, *"AIP-PIR"* phonetically resolves to ***"Apir!"*** — the Filipino colloquial expression for a **high five**.

In Philippine culture, *Apir* (also rendered as *"Apir na!"* or simply the raised-hand gesture 🤚) is more than a casual greeting. It is a moment of **mutual acknowledgment and shared accomplishment** — two hands raised and brought together in celebration of something successfully done together. The gesture embodies the values of *bayanihan* (communal effort), camaraderie, and the joy of a completed commitment.

This cultural resonance maps directly onto the system's core functional cycle:

| Gesture | System Equivalent | Meaning |
|---|---|---|
| **The first raised hand** | **AIP** — the Annual Implementation Plan | The forward commitment: *"Here is what we will do."* |
| **The second raised hand** | **PIR** — the Program Implementation Review | The honest reckoning: *"Here is what we actually did."* |
| **The slap of connection** | **The completed planning cycle** | Schools and the Division Office meeting in accountability and celebration |

The system's logo — rendered in **DepEd institutional blue (#103E79)** — visually represents this convergence. Just as a high five only succeeds when both hands meet, an AIP only fulfills its purpose when it is completed and reviewed by its corresponding PIR. Neither document is whole without the other.

#### Color Language

The portal's visual identity extends the *Apir* metaphor through a deliberate two-color palette, each color carrying meaning specific to the Division of Guihulngan City:

| Color | Meaning |
|---|---|
| **Pink** | The **love and care** of the Schools Division of Guihulngan City — the warmth behind every planning cycle, the genuine concern for learners that motivates teachers and administrators to plan carefully and follow through |
| **Blue** | **True strength and wisdom** — the institutional resolve and experience of DepEd, reflected in the rigorous standards of the AIP and PIR process |

Together, pink and blue are not decorative choices but a declaration of intent: that this system is built not merely for compliance, but as an expression of a Division that plans with heart and executes with wisdom.

The branding thus communicates a central thesis of the system: that planning and evaluation are not bureaucratic obligations in isolation, but two halves of a single gesture — a shared *Apir* between schools and the Division, celebrating a cycle of education faithfully completed.

#### Logo

The official AIP-PIR logo is designed as a scalable vector mark for sharp reproduction at any size, then exported into optimized web-ready assets for the portal interface and institutional collateral. The logo visually encapsulates the *Apir* high-five gesture and the convergence of planning (AIP) and evaluation (PIR).

<div style="text-align:center;margin:32px 0;">
  <figure style="display:inline-block;margin:0;">
    <img src="/AIP-PIR-logo.webp" alt="AIP-PIR Logo" style="height:180px;width:auto;margin:0 auto;" />
    <figcaption style="margin-top:12px;font-size:0.85rem;"><strong>AIP-PIR</strong> — Official System Logo<br/>Displayed here using the portal's optimized web asset. Used across the portal UI, print documents, and institutional collateral.</figcaption>
  </figure>
</div>

### 1.4 Core System Philosophy: AIP as Repository, PIR as Active Workflow

A fundamental architectural and operational premise of the system is the distinction between how it handles the **Annual Implementation Plan (AIP)** versus the **Program Implementation Review (PIR)**.

Because an AIP is already officially approved *before* it is inputted into the system by users, the system functions primarily as a **secure digital repository** for the AIP. The AIP serves purely as the baseline reference data — the established commitment.

Conversely, the **PIR** represents the system's **primary active workflow**. The active administrative tracking, validation, evaluation, and deadline management within the system are heavily centered around the quarterly PIR cycle. The system utilizes the pre-approved AIP repository data as its benchmark to programmatically populate and enforce the granular evaluation of the PIR quarters. In summary, the AIP defines the system's static configuration and eligibility parameters, while the PIR drives its dynamic, day-to-day operations and accountability checks.

---

## Chapter 2: System Architecture & Technological Framework

The system utilizes a modern, decoupled client-server architecture. This approach separates the presentation layer (frontend) from the business logic and data persistence layer (backend), facilitating scalability, maintainability, and distinct security boundaries.

### 2.1 Presentation Layer: React 19 & Vite

The frontend is constructed as a Single Page Application (SPA) utilizing **React 19** and bundled via **Vite**.

#### 2.1.1 Academic Justification (React & SPA)

React's component-based architecture promotes high modularity and reusability of User Interface (UI) elements. By managing a Virtual Document Object Model (Virtual DOM), React minimizes expensive direct DOM manipulations, resulting in highly performant updates—crucial for complex, highly interactive data-entry interfaces like the multi-phase AIP forms (Aggarwal, 2018). Furthermore, the SPA paradigm shifts the rendering workload to the client, reducing server overhead and providing a fluid, desktop-like user experience by avoiding full page reloads during navigation (Mesbah & van Deursen, 2007).

#### 2.1.2 Styling: Tailwind CSS v4

**Tailwind CSS** is utilized as the utility-first CSS framework. Unlike traditional semantic CSS, utility-first CSS provides low-level utility classes that allow for rapid UI construction directly within the markup. This approach enforces a strict design system, reduces CSS payload bloat (as only used classes are compiled), and mitigates the risk of CSS specificity conflicts in a large codebase.

### 2.2 Server Environment & Runtime: Deno

The backend API is powered by **Deno**, a modern runtime for JavaScript and TypeScript.

#### 2.2.1 Academic Justification (Deno)

Deno was selected over traditional Node.js for several architectural advantages:

1. **Secure by Default:** Deno executes code in a secure sandbox. Unlike Node.js, a Deno process requires explicit permission flags (e.g., `--allow-net`, `--allow-read`) to access the network or file system. This drastically reduces the attack surface, particularly regarding supply chain attacks via third-party dependencies (Dahl, 2018).
2. **Native TypeScript Support:** Deno compiles and executes TypeScript out of the box without requiring external transpilation steps (like `ts-node` or Webpack). This guarantees that the type-safety written during development is natively executed in production, reducing runtime type errors.
3. **Standard Web APIs:** Deno implements modern Web APIs (like `fetch`, `URL`, and `Crypto`) natively, aligning server-side JavaScript closer to standard browser environments.

### 2.3 Data Layer: PostgreSQL & Prisma ORM

Data persistence is handled by **PostgreSQL**, an advanced open-source relational database management system, mediated by the **Prisma** Object-Relational Mapper (ORM).

#### 2.3.1 Academic Justification (Relational Database)

Given the strict relational nature of the DepEd data—where a `User` belongs to a `School`, and a `School` generates a highly structured `AIP` containing multiple `Activities`—a relational schema (SQL) is significantly more appropriate than a NoSQL document store. PostgreSQL provides robust ACID (Atomicity, Consistency, Isolation, Durability) compliance, ensuring that complex multi-table inserts (e.g., saving an AIP with its nested objectives and activities) succeed or fail as a single atomic transaction.

#### 2.3.2 Academic Justification (Prisma ORM)

Prisma provides a type-safe data access layer. Traditional string-based SQL queries are prone to injection attacks and runtime errors due to schema mismatches. Prisma generates a strict TypeScript client directly from the database schema. This guarantees that any schema changes immediately trigger compile-time errors in the backend code if queries are not updated accordingly, drastically improving long-term application stability and developer velocity.

---

## Chapter 3: Database & Data Modeling

The relational integrity of the AIP-PIR system is foundational to its ability to accurately track educational programs across multiple organizational levels (Schools and the Division Office). The data layer must enforce complex business rules, such as restricting access to specific programs (e.g., Alternative Learning System) to a subset of authorized schools.

### 3.1 Entity-Relationship (ER) Architecture

The database is modeled using a deeply relational approach to eliminate data redundancy and ensure referential integrity. The core entities govern users, their affiliations, and the highly structured forms they submit.

<div style="margin:32px 0;">
  <figure style="margin:0;">
    <a href="/AIP-PIR.svg" target="_blank" rel="noreferrer">
      <img src="/AIP-PIR.svg" alt="AIP-PIR Portal entity-relationship diagram" style="width:100%;height:auto;display:block;" />
    </a>
    <figcaption style="margin-top:12px;font-size:0.85rem;text-align:center;"><strong>Figure 3.1.</strong> Entity-Relationship Diagram (ERD) of the AIP-PIR Portal database schema. Click the diagram to open the full-resolution SVG.</figcaption>
  </figure>
</div>

#### 3.1.1 Core Entities Mapping

1. **Cluster:** A macro-grouping of multiple schools.
2. **School Entity:** Represents a physical or conceptual educational institution. Associated with a `Cluster`.
3. **User Entity:** Represents an individual authenticating into the system via email/password or Google OAuth SSO. Active roles: `"School"`, `"Division Personnel"`, `"Admin"`, `"CES-SGOD"`, `"CES-ASDS"`, `"CES-CID"`, `"Cluster Coordinator"`, `"Observer"`. `"Pending"` is a staging state for accounts awaiting role assignment. Division Personnel store their name as split `first_name`, `middle_initial`, and `last_name` fields; School and Admin users use the legacy `name` field. `salutation` and `position` fields support formal document headers.
   - *Relationship:* School Users have a **Many-to-One** relationship with `School` (`school_id`), but the database enforces one active School-role user per school via a partial unique index. Cluster Coordinators have a Many-to-One relationship with `Cluster` (`cluster_id`). All other roles have both FKs null.
   - *Account Constraints:* CES roles are singleton (one account per role). Cluster Coordinators are capped at 10 accounts system-wide.
   - *Security and Privacy:* OAuth fields link Google accounts; `password` is nullable for OAuth-only users; `deleted_at` supports soft-delete/anonymization workflows; `must_change_password` enforces a password reset on next login when set by Admin.
   - *Onboarding:* `onboarding_version_seen`, `onboarding_show_on_login`, `onboarding_dismissed_at`, `onboarding_completed_at`, and `checklist_progress` track each user's onboarding tour and practice mode completion state.
4. **Program Entity:** Represents a school-level educational initiative (e.g., SPED, ALS). The `division` field (`"SGOD"` | `"OSDS"` | `"CID"`) indicates which functional division the program belongs to, determining CES routing. Replaced the former `category` KRA grouping field (dropped in v1.0.10).
   - *Relationship:* `School` ↔ `Program` M:N for access restrictions. `User` (Division Personnel) ↔ `Program` M:N for monitoring assignments.
4a. **ProgramTemplate Entity:** Stores division-wide default data for a program (outcome, target code, target description, indicators). Used when Admin creates a program from a division preset catalog. One-to-one with `Program`.
4b. **DivisionProgram Entity:** Represents a division-level program owned exclusively by one of the three functional divisions (CID, OSDS, SGOD). Separate from school-level programs; used for Division Personnel AIPs/PIRs. Pre-seeded with 79 standard DepEd programs.
5. **AIP (Annual Implementation Plan) Entity:** The parent document for a given fiscal year, constrained to a unique combination of School, Program, and Year. `edit_requested_at` and `edit_request_count` track the edit-request lifecycle (max 3 lifetime requests).
6. **AIPActivity Entity:** Activities segmented by phase (Planning, Implementation, Monitoring). Child to `AIP`.
7. **PIR (Program Implementation Review) Entity:** The evaluation report for a given quarter, strictly dependent on an approved parent `AIP`. School PIRs route to `"For Cluster Head Review"`; division-level and Cluster Coordinator-owned PIRs route to `"For CES Review"`. Reviewer metadata is tracked via `ces_reviewer_id`, `ces_noted_at`, and active-review fields.
8. **PIRActivityReview & PIRFactor:** Highly granular evaluation metrics comparing the baseline `AIPActivity` against actual quarterly physical and financial accomplishments. Supports unplanned activities (null `aip_activity_id`). `PIRFactor` includes a `recommendations` field.
9. **Deadline Entity:** A standalone administrative configuration table storing admin-overridable submission deadlines per fiscal year and quarter, including optional `open_date` and `grace_period_days`. No foreign key relations — the backend falls back to system defaults (end of quarter month) when no record exists.
10. **EmailConfig & MagicLinkToken & EmailBlastLog:** Support the transactional email system. `EmailConfig` stores SMTP settings (singleton row). `MagicLinkToken` stores hashed single-use tokens for welcome emails, login links, and deadline reminders. `EmailBlastLog` deduplicates admin-triggered email blasts per user.

### 3.2 Database Normalization Strategy

The schema adheres closely to the **Third Normal Form (3NF)** to minimize duplication and avoid insertion/deletion anomalies (Codd, 1970).

1. **First Normal Form (1NF):** All attributes are atomic. For instance, rather than storing a comma-separated list of activity names in a single field, a distinct `AIPActivity` relational table is utilized.
2. **Second Normal Form (2NF):** All non-key attributes are fully functionally dependent on the primary key. E.g., The School Name depends exclusively on the `School ID`.
3. **Third Normal Form (3NF):** No transitive dependencies exist. The `Program` constraints are normalized out into junction tables (e.g., `_ProgramToSchool`), ensuring that modifying a program's metadata does not require cascading updates across all affiliated schools (Date, 2019).

### 3.3 Draft Persistence Modeling

A substantial challenge in extensive form-entry systems is session timeout or accidental navigation resulting in data loss. The current Beta Build accommodates this by saving AIP and PIR drafts as ordinary relational records with `status = "Draft"` rather than as path-addressed JSON files.

#### 3.3.1 Academic Justification (State Persistence)

Rather than relying purely on volatile client-side storage (e.g., `localStorage`), which restricts the user to a single device/browser session, the system implements API-driven server-side draft persistence. This allows the user to begin complex AIP/PIR data entry on a desktop, save the intermediate state to PostgreSQL under their authenticated identity, and safely resume on a different device (Richardson & Ruby, 2008).

---

## Chapter 4: Authentication & Security Authorization

The security architecture of the AIP-PIR portal is built around the principles of Least Privilege and Separation of Concerns (Saltzer & Schroeder, 1975). Authorization—determining what an authenticated user is allowed to do—is strictly enforced at both the client layer (via React Router guards) and the server layer (via Deno middleware).

### 4.1 Authentication Mechanism (JWT)

The system utilizes **JSON Web Tokens (JWT)** for stateless session management. Upon successful credential verification or OAuth callback completion, the Deno backend issues a cryptographically signed JWT as an **HttpOnly cookie**. The frontend stores only non-token user metadata and a session expiry hint for route guards, then refreshes authoritative identity through `GET /api/auth/me`.

#### 4.1.1 Academic Justification (Stateless Auth)

Unlike traditional server-side sessions, which require the server to store session IDs in memory or a database (rendering the system stateful and harder to horizontally scale), JWTs are self-contained. The token carries only the authorization identifiers needed by the backend (`id`, `role`, `school_id`, and `cluster_id`). The server verifies the cryptographic signature against its secret key and reads the cookie automatically on protected API requests (Bradley et al., 2015). Cookie attributes are environment-aware: HTTPS and tunnel origins use `SameSite=None; Secure`, while local HTTP development uses `SameSite=Lax`.

### 4.2 Role-Based Access Control (RBAC) Architecture

The system employs a strict RBAC model spanning multiple user roles, each with precisely scoped authorization boundaries. The primary data-entry roles are the School User and Division Personnel; the review chain introduces CES and Cluster Coordinator roles; and the Admin role retains full system oversight.

#### 4.2.1 The School User

- **Identifier:** Unique School ID mapped to an official DepEd email (e.g., `120233@deped.gov.ph`).
- **Authorization Boundary:** A School User is relationally bound to a single `School` entity. They are strictly authorized to generate, read, update, and submit data (AIP/PIR) *only* for their assigned institution.
- **Dynamic Program Constraints:** School Users are shown only programs applicable to their school's education level (`Elementary`, `Secondary`, or `Both`). Specialized programs such as the Alternative Learning System (ALS) are further restricted via a many-to-many database relation — if a `School` entity is not explicitly linked to the ALS program, the frontend UI will not render it and the backend API will reject any attempt to create ALS-specific records.

#### 4.2.2 The Division Personnel

- **Identifier:** Personnel name mapped to an official DepEd email.
- **Authorization Boundary:** Division Personnel create and manage their own independent AIP and PIR documents at the Division level. Unlike School Users, they are not bound to a single `School` entity — their `school_id` is null. Document ownership is tracked via the `created_by_user_id` field on both `AIP` and `PIR`, ensuring a Division Personnel member can only read, update, or delete documents they themselves created.
- **Programmatic Scope:** Their access scope is bound by a many-to-many relationship to the `Program` entity (via the `_UserPrograms` junction table). A Division Personnel member assigned to monitor "SPED" (Special Education) can only create or access AIPs/PIRs for SPED-related submissions. Programs classified as `"Elementary"` or `"Secondary"` school-level (e.g., ALS) are excluded from Division Personnel access. This implements "Need-to-Know" data compartmentalization.
- **PIR Auto-Population:** When a Division Personnel member creates a PIR, the system automatically fetches the activity list from the linked AIP — including each activity's `implementation_period` — and pre-fills the PIR form with read-only activity records. This bridges the planning and evaluation cycle without requiring manual re-entry.

#### 4.2.3 The CES Roles (Chief of Education Supervisor)

Three CES role values exist in the system — `CES-SGOD`, `CES-ASDS`, and `CES-CID` — each corresponding to one of the three functional divisions of the Schools Division Office (SGOD, OSDS, and CID respectively). Each CES role is a **singleton**: the system enforces a maximum of one active account per role type to reflect the real-world organizational structure.

- **Authorization Boundary:** CES users can only see division-level PIRs routed to their functional division. CES-CID additionally receives Cluster Coordinator-owned PIRs. CES users cannot access AIP creation, admin panels, or submissions outside their queue.
- **Capabilities:** CES users access a dedicated **CES Portal** (`/ces`). They can review the full PIR detail, add remarks, start an active review, and take one of two actions: *Note / Approve* — approve the PIR — or *Return* — send the PIR back to the submitter with remarks. All CES actions are audit-logged and trigger in-app notifications.
- **Routing Logic:** Division-level PIRs use `getCESRoleForDivisionPIR()` in `server/lib/routing.ts`, which resolves the parent program's `division` field. CES-SGOD handles programs with `division = 'SGOD'`; CES-ASDS handles `division = 'OSDS'`; CES-CID handles `division = 'CID'` plus Cluster Coordinator-owned PIRs. School PIRs do not use CES routing; they route directly to the Cluster Coordinator queue.

#### 4.2.4 The Cluster Coordinator (Cluster Head)

Cluster Coordinators (`role = 'Cluster Coordinator'`) are linked to a specific `Cluster` entity via the `cluster_id` foreign key. The system caps Cluster Coordinator accounts at **10 system-wide**, reflecting the organizational limit of cluster groupings within the Division. Admin may additionally designate one Cluster Coordinator as the **cluster head** via the `Cluster.cluster_head_id` field; this assignment auto-fills the PIR "Noted by" signature block.

- **Authorization Boundary:** Cluster Coordinators see only school PIRs in `"For Cluster Head Review"` or active `"Under Review"` status, filtered to schools within their assigned cluster.
- **Capabilities:** Cluster Coordinators access a dedicated **Cluster Head Portal** (`/cluster-head`). They can start an active review, approve/note a school PIR as final, or return it to the submitter with remarks.
- **Position in Workflow:** The Cluster Coordinator role is the final reviewer for school PIRs. Division-level PIRs are reviewed directly by CES users instead.

#### 4.2.5 The Observer

Observer (`role = 'Observer'`) is a read-only role with access to review dashboards and submitted documents without the ability to take any workflow action. Used for supervisory or monitoring access outside the normal review chain.

### 4.3 Client-Side Route Guards vs Server-Side Verification

While the React application employs Route Guards (e.g., redirecting an unauthenticated user away from the `/dashboard` to `/login`), this is acknowledged primarily as a User Experience (UX) optimization, not an impenetrable security barrier (OWASP, 2021). The definitive source of truth and security lies in the Deno backend. Every protected API endpoint resolves the JWT through `server/lib/auth.ts` (HttpOnly cookie first, with Bearer header compatibility where needed), verifies its integrity, parses the claimant's explicit role, and cross-references it against the specific resource (School/Program ID) being updated before committing any database transactions via Prisma.

---

## Chapter 5: Process Modeling & System Workflows

The AIP-PIR portal essentially digitizes a highly structured bureaucratic workflow. The core objective of the system is not merely to capture data, but to mathematically and logically enforce the sequence of the DepEd planning and evaluation cycle.

### 5.1 The AIP-PIR Dependency Model

The most critical business rule within the Application Programming Interface (API) is the structural dependency of the Program Implementation Review (PIR) upon an approved Annual Implementation Plan (AIP).

#### 5.1.1 Process Enforcement

Academically, this models a strict **Precondition constraint** in business process management (Weske, 2012). A school cannot evaluate its quarterly physical and financial accomplishments (PIR) if it has not yet established its baseline targets and planned budget (AIP).

Technically, this is implemented via a React `ProtectedRoute` variant (the `PIRRouteGuard`). When a School User attempts to access the `/pir` endpoint, the system automatically dispatches an asynchronous request to verify if an approved AIP exists for that specific `School ID` and the current Fiscal Year. If the boolean response is false, the UI explicitly locks the PIR module, rendering it grayscale and displaying an "AIP Submission Required" overlay. This prevents orphaned PIR data entries in the relational database.

### 5.2 Multi-Phase Activity Planning

The AIP Form module diverges from simple flat-file data entry by enforcing a phased chronological structure for all generated activities.

#### 5.2.1 Phase Logic

When a user defines an activity under an Objective, they must categorize it into one of three strict operational phases:

1. **Planning**
2. **Implementation**
3. **Monitoring and Evaluation (M&E)**

This phased approach, deeply rooted in Project Management Body of Knowledge (PMBOK) principles (Project Management Institute, 2021), forces educators to systematically break down their overarching SIP (School Improvement Plan) into actionable, chronologically sound steps, rather than a disorganized list of tasks. The generated `AIPDocument` (the print-ready component) dynamically groups and numbers activities based on these phases.

### 5.3 PIR Activity Auto-Population and Timeline Filtering

A critical usability enhancement in the system is the automatic bridging of planned activities from the AIP into the corresponding PIR form — eliminating redundant manual data re-entry. Furthermore, this auto-population is **timeline-aware**. The system utilizes structured start and end month parameters defined during AIP creation to filter the activities presented in the PIR. For instance, a user conducting a Q1 PIR will only be presented with activities whose implementation period overlaps with January, February, or March. This contextual filtering significantly reduces cognitive load and ensures evaluators focus only on relevant tasks for the current reporting period.

#### 5.3.1 Technical Implementation

When a School User or Division Personnel initiates a PIR for a given program and year, the system dispatches a `GET /api/aips/activities` request. The backend resolves the parent AIP record using the user's identity (`school_id` for School Users, `created_by_user_id` for Division Personnel) and returns the complete list of `AIPActivity` records, including each activity's `implementation_period`.

The PIR form renders these activities as **read-only pre-populated rows**. Users are not required to re-enter activity names or time periods — they enter only the physical and financial accomplishment values alongside narrative actions to address any gaps. This design enforces **referential consistency**: the PIR's evaluation metrics are always traceable back to the exact activity definitions in the originating AIP.

#### 5.3.2 Academic Justification (Data Traceability)

This approach implements the principle of **single-source-of-truth data design** (Fowler, 2002), ensuring that activity metadata defined at planning time is never duplicated or paraphrased at review time. From a data integrity standpoint, the `PIRActivityReview` model stores only a foreign key (`aip_activity_id`) rather than denormalizing the activity name — changes to the activity's canonical record are automatically reflected in the review without requiring schema migrations.

### 5.4 Draft Persistence & Stateful UX

Complex bureaucratic forms spanning multiple objectives and dozens of financial line items cannot reasonably be expected to be completed in a single session. Session timeouts or network interruptions could lead to catastrophic loss of user input.

#### 5.4.1 Technical Implementation

To mitigate this, the system leverages a hybridized auto-save architecture:

1. **Local State:** As the user interacts with the form, React's `useState` manages the immediate Virtual DOM, providing instantaneous feedback (e.g., dynamically totaling the `budgetAmount` across all activities).
2. **Server-Side Drafts:** An explicit "Save Draft" action transmits the form state to the Deno backend, where it is stored as ordinary relational `AIP` or `PIR` rows with `status = "Draft"`. Upon subsequent logins, an initialization `GET` request retrieves the user's draft row and restores the React state to its prior condition (Fowler, 2002).

### 5.5 PIR Review Routing Chain

Prior to v1.0.10, submitted PIRs were directed straight to an Admin queue under a flat status flow (`Draft → Submitted → Under Review → Approved`). The current Beta Build routes PIRs to one of two reviewer queues: school PIRs go to the Cluster Coordinator for the school's cluster, while division-level and Cluster Coordinator-owned PIRs go to CES.

#### 5.5.1 Status Transition Model

```text
School PIR:
Draft -> For Cluster Head Review -> Approved
                    \-> Returned -> For Cluster Head Review

Division-level PIR:
Draft -> For CES Review -> Approved
                    \-> Returned -> For CES Review
```

| Transition | Triggered by | Next status |
|---|---|---|
| School user submits PIR | `POST /api/pirs` | `For Cluster Head Review` |
| Division Personnel submits PIR | `POST /api/pirs` | `For CES Review` |
| Cluster Coordinator submits own PIR | `POST /api/pirs` | `For CES Review` |
| CES starts review | `POST /admin/ces/pirs/:id/start-review` | `Under Review` |
| CES notes / approves PIR | `POST /admin/ces/pirs/:id/note` | `Approved` |
| CES returns to submitter | `POST /admin/ces/pirs/:id/return` | `Returned` |
| Cluster Head starts review | `POST /admin/cluster-head/pirs/:id/start-review` | `Under Review` |
| Cluster Head notes / approves | `POST /admin/cluster-head/pirs/:id/note` | `Approved` |
| Cluster Head returns to submitter | `POST /admin/cluster-head/pirs/:id/return` | `Returned` |
| User re-saves a returned school PIR | `PUT /api/pirs/:id` | `For Cluster Head Review` |
| User re-saves a returned division-level PIR | `PUT /api/pirs/:id` | `For CES Review` |
| Admin override | `PATCH /admin/submissions/:id/status` | Any valid status |

#### 5.5.2 CES Routing Logic

CES assignment is determined programmatically by `getCESRoleForDivisionPIR()` in `server/lib/routing.ts`. The function accepts the parent program's `division` field and returns the responsible CES role string. Division Personnel PIRs route to the CES corresponding to their program's declared division (`SGOD`, `OSDS`, or `CID`). Programs without a declared division fall back to `CES-CID`, and Cluster Coordinator-owned PIRs also route to `CES-CID`.

#### 5.5.3 Cluster Head Routing Logic

School PIRs are routed directly to the Cluster Head portal and filtered by `cluster_id`. The Cluster Coordinator sees only school PIRs from their assigned cluster. Division Personnel PIRs have no `school_id` and therefore do not appear in the Cluster Head queue.

#### 5.5.4 Academic Justification (Multi-Tier Approval Workflows)

The routing chain architecturally implements a role-specific approval gateway in Business Process Management (BPM), where the assigned reviewer depends on the organizational owner of the document (Weske, 2012). CES review provides division-level programmatic evaluation, while Cluster Head review provides localized supervisory accountability for school submissions. From a software architecture standpoint, division-level CES routing is centralized in `routing.ts`, while school PIR routing is determined once from the linked AIP's `school_id`.

### 5.6 Read-Only Submitted View

Once an AIP or PIR document has been formally submitted and persisted to the database, the system transitions the corresponding form module into a **read-only view mode**. This behavior enforces submission finality — a fundamental audit requirement in any accountability-oriented document management system.

#### 5.5.1 Technical Implementation

Two dedicated read-only endpoints — `GET /api/aips` and `GET /api/pirs` — return the full submitted record for the authenticated user. When the AIP or PIR form component initializes, it first checks whether a submitted record exists for the selected program and year. If a submitted record is found, the component bypasses the interactive wizard entirely and renders the document in a locked, print-ready layout derived from the same `AIPDocument` or `PIRDocument` component used for print output.

The PIR read-only view additionally provides a **"View AIP" reference modal** — an inline overlay that renders the linked AIP document without requiring the user to navigate away. This modal sources its data from the same `GET /api/aips` endpoint, resolving the parent AIP by the `aip_id` foreign key stored on the submitted `PIR` record.

Fields pre-filled or derived from the parent AIP record (`program_owner`, budget allocations, and funding context) are visually distinguished with a padlock badge labelled **"From AIP"** — a UI pattern that communicates data provenance and prevents user confusion about which fields are editable.

#### 5.5.2 Academic Justification (Immutability for Audit Integrity)

The decision to enforce read-only mode after submission is grounded in the principle of **referential immutability** in audit trail design (Richardson & Ruby, 2008). Permitting post-submission edits without a tracked revision history would undermine the evidentiary value of the submitted document. By locking the record and presenting it as a static view, the system guarantees that any printed or on-screen copy of a submitted AIP or PIR accurately represents the state of the record at the time of submission — satisfying the traceability requirements of DepEd planning and evaluation standards.

---

## References

* Aggarwal, S. (2018). *Modern Web-Development using ReactJS*. International Journal of Recent Research Aspects, 5(1), 133-137.
* Bradley, J., Jones, M., & Sakimura, N. (2015). *JSON Web Token (JWT)*. RFC 7519, Internet Engineering Task Force.
* Codd, E. F. (1970). *A Relational Model of Data for Large Shared Data Banks*. Communications of the ACM, 13(6), 377-387.
* Dahl, R. (2018). *10 Things I Regret About Node.js*. JSConf EU.
* Date, C. J. (2019). *Database Design and Relational Theory: Normal Forms and All That Jazz* (2nd ed.). O'Reilly Media.
* Fowler, M. (2002). *Patterns of Enterprise Application Architecture*. Addison-Wesley Professional.
* Mesbah, A., & van Deursen, A. (2007). *Migrating Multi-page Web Applications to Single-page AJAX Interfaces*. 11th European Conference on Software Maintenance and Reengineering (CSMR'07), 181-190.
* OWASP Foundation. (2021). *OWASP Top 10: Broken Access Control*. Open Web Application Security Project.
* Project Management Institute. (2021). *A Guide to the Project Management Body of Knowledge (PMBOK Guide)* (7th ed.). Project Management Institute.
* Richardson, L., & Ruby, S. (2008). *RESTful Web Services*. O'Reilly Media.
* Saltzer, J. H., & Schroeder, M. D. (1975). *The Protection of Information in Computer Systems*. Proceedings of the IEEE, 63(9), 1278-1308.
* Weske, M. (2012). *Business Process Management: Concepts, Languages, Architectures* (2nd ed.). Springer.
