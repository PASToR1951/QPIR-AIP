# Documentation Revision Plan: AIP-PIR Formal IT Capstone Paper

## Summary

Revise `docs/SYSTEM_DOCUMENTATION_THESIS.md` into a complete IT capstone-style technical documentation paper. The current document contains strong system architecture and workflow explanations, but it lacks standard academic and technical documentation sections such as Abstract, Problem Statement, Scope and Limitations, Methodology, Testing and Evaluation, Conclusion, Recommendations, Glossary, and Appendices.

This is a documentation-only task. No application code, API routes, database schema, UI behavior, or deployment configuration will be changed.

## Target Files

Create and preserve this planning artifact:

`docs/SYSTEM_DOCUMENTATION_THESIS_REVISION_PLAN.md`

Then use it to revise:

`docs/SYSTEM_DOCUMENTATION_THESIS.md`

## Documentation Structure

Rebuild the main document using this formal structure:

1. Title Page
   - System title: AIP-PIR Management System
   - Subtitle: Annual Implementation Plan and Program Implementation Review Portal
   - Organization: DepEd Division of Guihulngan City
   - Version: Beta 3, `v1.2.0-beta`
   - Date placeholder
   - Authors or researchers placeholder
   - Adviser or evaluator placeholder

2. Abstract
   - Summarize the planning and monitoring problem.
   - Identify spreadsheet-based and manual workflow limitations.
   - Present the AIP-PIR Portal as a centralized web-based solution.
   - Mention core technologies: React, Deno, PostgreSQL, and Prisma.
   - Mention key capabilities: role-based access, draft persistence, AIP/PIR dependency enforcement, focal recommendation, CES review, and document generation.
   - Avoid claiming final production impact unless supported by evidence.

3. Keywords
   - AIP
   - PIR
   - DepEd
   - Monitoring and Evaluation
   - Role-Based Access Control
   - Web-Based Information System
   - PostgreSQL
   - React
   - Deno

4. Chapter 1: Introduction
   - Background of the Study
   - Problem Statement
   - General Objective
   - Specific Objectives
   - Significance of the Study
   - Scope and Limitations
   - Definition of Terms

5. Chapter 2: Review of Related Literature and Systems
   - DepEd planning and M&E policy context
   - Annual Implementation Plan concepts
   - Program Implementation Review concepts
   - Web-based management systems
   - Role-based access control
   - Secure session handling
   - Relational database design
   - Related systems or comparable digital workflow systems
   - Synthesis explaining why AIP-PIR is needed

6. Chapter 3: Methodology
   - Development approach: iterative or prototype-based system development
   - Requirement gathering sources: existing AIP/PIR workflow, DepEd M&E policy context, user roles, and current system behavior
   - System design method: modular client-server architecture
   - Development tools and technologies
   - Testing and validation approach
   - Ethical, privacy, and data-handling considerations

7. Chapter 4: System Analysis and Design
   - Existing manual or decentralized process
   - Proposed system overview
   - User roles and responsibilities
   - System architecture
   - Data flow overview
   - Entity-relationship model
   - Database normalization strategy
   - Security and authorization model
   - AIP/PIR workflow model
   - Draft persistence model
   - Document generation model

8. Chapter 5: System Implementation
   - Frontend implementation: React 19, Vite, and Tailwind CSS
   - Backend implementation: Deno, Hono, and API routing
   - Database implementation: PostgreSQL and Prisma ORM
   - Authentication implementation: JWT in HttpOnly cookies and OAuth support
   - Role-based access implementation
   - AIP module implementation
   - PIR module implementation
   - Focal person and CES review implementation
   - Admin module implementation
   - Reporting, notifications, announcements, and audit logs
   - Backup and privacy-related features

9. Chapter 6: Testing and Evaluation
   - Testing strategy
   - Existing automated evidence:
     - Server unit and integration tests visible in the repo
     - Concurrency-related tests
     - Prisma error handling tests
     - Session and security tests
     - Admin route tests
   - Frontend validation:
     - `npm run lint`
     - `npm run build`
     - Onboarding validation script, where relevant
   - Manual workflow test scenarios:
     - School user creates, saves, and submits AIP
     - PIR remains locked until AIP is available
     - PIR auto-populates from AIP activities
     - Focal person recommends or returns submission
     - CES approves, notes, or returns submission
     - Admin manages users, schools, programs, deadlines, and reports
     - Logout and session restore work as documented
   - Evaluation criteria:
     - Functional correctness
     - Data integrity
     - Security and access control
     - Usability for role-based workflows
     - Maintainability
   - State clearly that no invented survey results, benchmark numbers, or UAT percentages should be added unless supplied later.

10. Chapter 7: Conclusion and Recommendations
    - Conclusion:
      - The system centralizes AIP/PIR documentation.
      - It enforces workflow dependencies and role boundaries.
      - It improves traceability through relational records and generated documents.
      - It supports DepEd M&E alignment through structured review flows.
    - Recommendations:
      - Conduct formal user acceptance testing with actual school and division personnel.
      - Add measurable usability evaluation.
      - Expand reporting analytics after real deployment feedback.
      - Add more end-to-end workflow tests.
      - Prepare deployment, backup, and disaster recovery documentation for production use.

11. References
    - Keep existing credible references already in the document.
    - Add references only when they support claims actually made.
    - Use APA-style formatting where practical.
    - Do not over-reference generic implementation details.

12. Appendices
    - Appendix A: Entity-Relationship Diagram
    - Appendix B: API Endpoint Summary
    - Appendix C: User Role Matrix
    - Appendix D: AIP/PIR Workflow Status Matrix
    - Appendix E: Test Scenario Matrix
    - Appendix F: Screenshots placeholder, if screenshots are later provided
    - Appendix G: Glossary or Acronym List, if not kept in Chapter 1

## Scope and Limitations Details

Add a dedicated section explaining that the system covers:

- Digital encoding and management of AIP records.
- PIR creation based on approved or available AIP baseline data.
- Role-based access for School, Division Personnel, CES, Admin, Observer, and Pending users.
- Focal-person recommendation and CES review routing.
- Draft saving and restoration.
- Print-ready AIP/PIR document generation.
- Admin management of users, schools, clusters, programs, deadlines, announcements, reports, email settings, backups, and sessions.
- Privacy-related controls such as soft delete, anonymization, audit logs, and session revocation.

Add limitations explaining that:

- The system depends on accurate data entered by users.
- Email, OAuth, reCAPTCHA, and backups depend on correct external service configuration.
- Generated documents depend on browser and PDF rendering behavior.
- Formal user acceptance testing results are not yet included unless provided.
- Production performance metrics are not included unless measured later.
- The system documents Beta 3 behavior and may need revision after future releases.
- It does not replace DepEd policy; it digitizes and supports the workflow.

## Methodology Details

Use an iterative system development methodology. Present the system as developed through repeated refinement of:

- Requirements based on AIP/PIR workflow needs.
- Data modeling for schools, users, programs, AIPs, PIRs, reviews, deadlines, logs, and notifications.
- Frontend modules for role-specific dashboards and forms.
- Backend APIs for authentication, submissions, admin management, reviews, and reports.
- Security controls for authentication, authorization, sessions, and privacy.
- Testing and documentation updates after workflow changes.

## Testing Details

Document existing validation without inventing results.

Mention these available checks:

- Backend Deno tests under `server/**/*.test.ts`.
- Concurrency integration test at `server/concurrency.integration.test.ts`.
- Frontend lint script: `npm run lint`.
- Frontend build script: `npm run build`.
- Onboarding validation script: `npm run validate:onboarding`.

Add a test matrix with columns:

- Test Area
- Scenario
- User Role
- Expected Result
- Evidence Type

Include scenarios for:

- Login, logout, and session restore
- School AIP draft save
- School AIP submission
- PIR lock before AIP
- PIR auto-population
- School PIR submission to focal review
- Focal recommendation
- Focal return
- CES review
- Admin user management
- Program assignment
- Deadline configuration
- Report export
- Data privacy export and anonymization
- Concurrent submission handling

## Rewrite Rules

- Keep the tone formal and academic.
- Preserve accurate system details from the current document.
- Do not invent survey data, interview results, production metrics, or adviser-approved formatting.
- Reduce overly narrative branding content and move it to a supporting section or appendix.
- Use consistent heading numbering.
- Fix the duplicated subsection numbering currently visible near Chapter 5.
- Ensure references cited in text appear in References.
- Ensure figures and tables have captions and numbers.
- Keep Markdown compatible with the existing repo documentation style.

## Acceptance Criteria

The revision is complete when:

- `docs/SYSTEM_DOCUMENTATION_THESIS_REVISION_PLAN.md` exists and contains this full plan.
- `docs/SYSTEM_DOCUMENTATION_THESIS.md` includes Abstract, Scope and Limitations, Methodology, Testing and Evaluation, Conclusion, Recommendations, References, and Appendices.
- The document reads like a formal IT capstone paper rather than only a system description.
- Existing technical claims remain consistent with the README, Prisma schema, and current docs.
- No unsupported results or fabricated evaluation data are introduced.
- Markdown headings are clean, numbered, and easy to navigate.

## Assumptions

- Use a standard IT capstone or thesis format because no institution-specific template was provided.
- Keep the documentation in one main file.
- Keep README as developer and setup documentation.
- Treat AIP-PIR Beta 3, `v1.2.0-beta`, as the documented system version.
- Use APA-style references where possible.
