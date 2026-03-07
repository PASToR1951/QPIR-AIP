SYSTEM ARCHITECTURE & DEPENDENCY SHEET: DepEd Planning Portal

1. System Overview

The DepEd Planning Portal is a unified, frontend-only web application designed to digitize and streamline the creation of two official Department of Education forms:

PIR (Performance Implementation Review / Quarterly PIR)

AIP (Annual Implementation Plan)

The system features a modern, premium aesthetic (inspired by "Aceternity UI") featuring glassmorphism, background blurs, animated grid masks, and inline SVG icons. It offers a dual-mode user experience: a guided "Step-by-Step Wizard" and a classic "Full Form View", with strict responsive guardrails for mobile devices.

2. Technical Dependencies & Environment Setup

To run this application, the target environment must support a modern React + Tailwind CSS stack.

Core Dependencies:

React (v18+)

Hooks used: useState, useEffect, React.Fragment.

React DOM (v18+)

Tailwind CSS (v3.0+)

Required for all styling, layout, grid systems, and animations.

Note: The app heavily relies on arbitrary values (e.g., bg-[size:4rem_4rem], w-[35%]) and complex pseudo-classes (group-focus-within:), which require a fully configured Tailwind engine or the Tailwind CDN script.

External Assets (Zero-Dependency Design):

Icons: Zero external icon libraries are required. All icons are embedded directly as inline <svg> elements.

Fonts: Uses standard sans-serif system fonts. (Optional: Import Google Font 'Inter' in the index.html for perfect fidelity).

State Management: Zero external libraries (no Redux/Zustand). All state is handled locally via React context/props.

How to Run / Build:

Option A (Production): Set up via Vite (npm create vite@latest my-app -- --template react) and install Tailwind CSS (npm install -D tailwindcss postcss autoprefixer). Paste the .jsx code into App.jsx.

Option B (Browser/CDN): Can be run in a single .html file by importing React, ReactDOM, Babel (to compile JSX in-browser), and the Tailwind CSS CDN script (<script src="https://cdn.tailwindcss.com"></script>).

3. System Architecture & Flow

The application is bundled into a single file (DepEd_Portal_App.jsx) and relies on conditional rendering to manage routing.

A. Routing State (App Component)

activeDoc: Determines the current module (null -> Hub, 'pir' -> PIR, 'aip' -> AIP).

viewMode: Determines the layout (null -> Mode Selector, 'wizard' -> Step-by-step, 'full' -> Single Page).

B. User Flow

Master Hub Screen: * The user is greeted by a glassmorphism dashboard.

They select either the PIR or AIP document card.

View Mode Selector:

The user selects "Wizard" or "Full View".

Mobile Guardrail: A useEffect listener detects if window.innerWidth < 768px. If true, this screen is skipped, and the user is forcefully routed to the "Wizard" mode to prevent horizontal scrolling/layout breaks on tiny screens.

Workspace:

The user enters the respective PIRWorkspace or AIPWorkspace.

Print Engine:

Controlled via the window.print() function.

Relies entirely on Tailwind @media print (print:) utility classes to strip away the entire UI (buttons, borders, blurs) and format the data exactly like the official physical paper templates.

4. Component Structure

Reusable UI Primitives

<Input />: Custom text input with an animated gradient underline.

<Select />: Custom dropdown with consistent UI styling.

<TextareaAuto />: A self-resizing textarea that expands based on scrollHeight, eliminating internal scrollbars.

Module 1: PIR Workspace

Step 1: Program Profile (School, Owner, Budget, Source).

Step 2: Activities (Interactive Action Cards replacing complex tables; auto-calculates Physical and Financial gap percentages).

Step 3: Factors (Institutional, Technical, Infrastructure, Learning Resources, Environmental, Others).

Step 4: Review & Signatures.

Module 2: AIP Workspace

Step 1: Alignment (Pillar, SIP Title, Coordinator).

Step 2: Goals (Objectives, OVI Indicators, Annual Targets).

Step 3: Action Plan (Activities categorized strictly into three phases: 1. Planning, 2. Implementation, 3. Monitoring and Evaluation). Auto-generates hierarchical numbering (e.g., 1.1, 1.2).

Step 4: Review & Signatures.

Utilities

formatCurrency(): Formats raw number inputs into Philippine Peso (₱) strings.

calculateGap(): Mathematics for PIR accomplishment shortfalls.

Custom Delete Modal: An absolute-positioned, z-[100] modal to confirm deletion of non-empty activity rows.