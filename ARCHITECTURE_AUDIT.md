# ARCHITECTURE AUDIT REPORT
## Niphon Farm AI Veterinary Management System
**Document Version:** 1.0.0  
**Audit Date:** 2026-09-21  
**Project:** `niphon-farm888-8` → Niphon Farm AI Veterinary Management System  
**Auditor:** Principal AI Systems & Veterinary Software Architect  
**Status:** PHASE 0 COMPLETE — PENDING USER APPROVAL FOR PHASE 1  

---

## 1. Executive Summary

The target system specified in `PRD.md` is a **mission-critical, production-grade Swine Farm Health Management Platform with an integrated AI Veterinary Decision Support Intelligence Layer**, specifically tailored for **Niphon Farm (นิพนธ์ฟาร์ม) in Phatthalung, Thailand**.

The core operational philosophy strictly mandated by PRD.md:
> **"ระบบจัดการสุขภาพฟาร์มที่มี AI Veterinary Agent ฝังอยู่ในทุก workflow"** — not a standalone chatbot or generic LLM interface, but a reliable operational decision-support tool. AI must never diagnose with unverified certainty, must never autonomously prescribe medication or antimicrobial agents, must operate with complete auditability, and must gracefully degrade when AI services or network connectivity are offline.

### Audit Verdict
The current repository (`niphon-farm888-8`) is an initial, functional single-node prototype demonstrating basic UI layouts and simulated workflow endpoints. However, it currently relies on an **in-memory mutable JavaScript class (`farmStore.ts`)**, lacks persistent relational storage, contains **no database schema or Row Level Security (RLS)**, lacks multi-tenant isolation, has no cryptographic or session-based authentication, and its AI integration in `server/services/aiVetService.ts` is an ungrounded prompt-and-response wrapper around Gemini with no formal multi-agent orchestration, typed tool calling, or JSON Schema validation.

The system requires an architectural migration to a production-oriented stack (Supabase PostgreSQL, strict TypeScript server orchestration, multi-agent pipeline, and validated clinical UI).

---

## 2. Current Architecture Analysis

```
+---------------------------------------------------------------------------------+
|                               CURRENT REPOSITORY RUNTIME                        |
|                                                                                 |
|  +---------------------------+             +---------------------------------+  |
|  |     React 19 + Vite       |             |         Express 4.21            |  |
|  |     (Tailwind CSS)        |  HTTP/JSON  |         Node.js / tsx           |  |
|  |                           +------------>+                                 |  |
|  | - Single App.tsx shell    |             | - server.ts (monolithic routes) |  |
|  | - Client-side state tabs  |             | - In-memory farmStore.ts        |  |
|  | - Mock role toggle        |             | - aiVetService.ts (Gemini SDK)  |  |
|  +---------------------------+             +----------------+----------------+  |
|                                                             |                   |
|                                                             v                   |
|                                            +---------------------------------+  |
|                                            | Google GenAI (@google/genai)    |  |
|                                            | gemini-3.8-flash (fallback)     |  |
|                                            +---------------------------------+  |
+---------------------------------------------------------------------------------+
```

### 2.1 Runtime & Build Configuration
* **Runtime:** Node.js environment orchestrated via `tsx` for development and an `esbuild` CommonJS bundling step (`dist/server.cjs`) for production.
* **Port / Reverse Proxy:** Single container port `3000` hosting both API routes (`/api/*`) and Vite SPA middleware (`vite.middlewares` in dev, `express.static('dist')` in prod).
* **Package Manifest (`package.json`):**
  * Contains remnants of prior boilerplate templates (e.g., `@google-cloud/storage`, `archiver`, `firebase`, `firebase-admin`, `jszip`, `pako`, `agentClient.ts`).
  * Core runtime libraries: `react` (v19.0.1), `express` (v4.21.2), `@google/genai` (v2.11.0), `lucide-react`, `motion`, `recharts`, `tailwindcss` (v4.1.14).

### 2.2 Structural Deficiencies
1. **Monolithic Backend (`server.ts`):** All REST routes (summary, animals, cases, interview, briefing, tasks, reviews, treatments, images, consult) are declared directly in a single 326-line file with no controllers, services, middleware, or repository layers.
2. **Missing Modularization:** As forbidden by PRD Sections 41-42, agent code, tools, schemas, and database adapters are not isolated into dedicated modules (`/agents`, `/tools`, `/lib/db`, `/lib/security`).
3. **Template Drift:** Unused files from legacy agent experiments (`/server/lib/agentClient.ts`, `/server/lib/agentClientPerseus.ts`, `/server/lib/jsonExtractor.ts`, `/test_*.js`, `/agent/`) clutter the repository and generate dead code debt.

---

## 3. Database & Data Storage Layer Analysis

### 3.1 Current State: `server/data/farmStore.ts`
* **Mechanism:** A singleton in-memory JavaScript class `FarmStore` holding hardcoded arrays:
  * `animals`: 5 mock animals (`anim-128`, `anim-129`, `anim-201`, `anim-301`, `anim-130`)
  * `cases`: 4 mock health cases (`case-101` to `case-104`)
  * `tasks`: 5 mock tasks (`task-01` to `task-05`)
  * `treatments`: 3 mock treatment records
  * `protocols`: 4 static protocol strings
  * `barns` & `pens`: 3 barns and 9 pens
* **Persistence Lifecycle:** All mutations (creating cases, updating task statuses, adding follow-ups, recording veterinary reviews) mutate in-memory arrays. **Any server restart, cold start, or container redeploy completely wipes all user data and reverts state to default mock data.**

### 3.2 Reliability, Concurrency & Data Integrity Deficiencies
1. **Zero ACID Guarantees:** Array operations (`unshift`, `find`, `splice`) have no transaction semantics. Concurrent writes from multiple staff devices risk race conditions and memory corruption.
2. **No Relational Constraints:** Foreign keys (`animal_id`, `pen_id`, `barn_id`, `case_id`, `farm_id`) are unvalidated string fields. A case can reference a non-existent `animal_id` without database error.
3. **No Row-Level Security (RLS) or Tenant Isolation:** Data lacks multi-tenant `farm_id` query scoping at the storage engine level.
4. **No Soft-Delete / Immutability:** PRD Section 43 strictly dictates: *"ห้าม hard delete clinical records... Medical records: immutable audit history"*. In `farmStore.ts`, state can be mutated directly without an audit log trigger.
5. **No File / Binary Storage:** Image uploads in `ReportSymptomView.tsx` are handled via raw Base64 strings passed in memory (`express.json({ limit: '50mb' })`). There is no S3/Supabase Storage bucket integration or CDN signing.

---

## 4. Frontend Analysis

### 4.1 UI Stack & Framework
* **Framework:** React 19 + TypeScript with Vite.
* **Styling:** Tailwind CSS v4 utility classes.
* **Component Hierarchy:**
  * `App.tsx`: Main shell holding `currentRole`, `activeTab`, counts poller, modal trigger, desktop top nav, and mobile bottom nav.
  * `components/DashboardView.tsx`: Overview KPI cards, daily briefing block, quick triage queue, and environmental status.
  * `components/ReportSymptomView.tsx`: 60-second mobile-first symptom reporting form with preset chips, camera capture, and temperature input.
  * `components/CaseDetailModal.tsx`: Detailed clinical modal with AI triage breakdown, diagnostic interview Q&A loop, and veterinary sign-off review form.
  * `components/AnimalsView.tsx`: Animal catalog with barn/pen filtering and animal profile drawer with history timeline.
  * `components/TasksView.tsx`: Tabbed task manager (All, My Tasks, Urgent, Completed) with status toggle.
  * `components/AIVetView.tsx`: Freeform chat and SOP document viewer.
  * `components/Header.tsx`: Role selector (`owner`, `manager`, `staff`, `veterinarian`), notifications badge, and live weather widget.

### 4.2 Frontend Strengths
* Good adherence to Thai-language domain terminology ("แม่สุกร", "สุกรขุน", "คอกกัก", "ระดับความเร่งด่วน Triage").
* High visual clarity for mobile touch screens with prominent action buttons and large tap targets.
* Dual navigation support: top bar for desktop/tablet, bottom bar for mobile.

### 4.3 Frontend Deficiencies & Gaps
1. **Simulated Authentication & RBAC:** User roles are switched via a client-side dropdown in `Header.tsx` without passwords, tokens, or JWT verification. Any user can switch to `veterinarian` or `owner` and bypass permissions.
2. **No Offline Support (PRD Section 44):** No service worker, IndexedDB local draft queue, or offline sync status indicator (`✓ บันทึกแล้ว`, `⟳ กำลังส่ง`, `⚠ รออินเทอร์เน็ต`).
3. **Hardcoded Polling:** `App.tsx` polls `/api/farm/summary` every 15 seconds with `setInterval`. There is no Supabase Realtime or WebSocket connection for live case alerts.
4. **Scattered State Logic:** Views fetch data independently using native `fetch()` in disjointed `useEffect` hooks without standardized caching (e.g., TanStack Query or SWR) or global store.
5. **Missing Two UI Modes (PRD Section 77):** Staff UI still exposes technical parameters rather than maintaining a pure "Simple Mode" for barn workers and an "Expert Mode" for veterinarians and managers.

---

## 5. Backend Analysis

### 5.1 Route Structure & Controller Logic
All routes are declared in `server.ts`:
* `GET /api/farm/summary`: Aggregates in-memory totals.
* `GET /api/farm/animals`: In-memory filter.
* `GET /api/farm/animals/:id`: Single animal lookup.
* `GET /api/farm/barns`: List barns and pens.
* `GET /api/farm/cases`: List health cases.
* `POST /api/farm/cases`: Creates case, triggers inline `aiVetService.runTriage()`, auto-generates tasks.
* `POST /api/ai/interview`: Appends Q&A to case and re-runs triage.
* `GET /api/ai/daily-briefing`: Runs LLM prompt or fallback.
* `GET /api/farm/tasks` & `PATCH /api/farm/tasks/:id`: Task retrieval and status updates.
* `POST /api/farm/cases/:id/review`: Vet review signoff.
* `GET /api/farm/treatments` & `POST /api/farm/treatments/:id/followup`: Treatment tracking.
* `POST /api/ai/analyze-image`: Gemini image analysis or heuristic text.
* `POST /api/ai/consult`: Freeform farm vet chat.

### 5.2 Backend Deficiencies
1. **Synchronous Coupling with AI (PRD Section 72 violation):** In `POST /api/farm/cases`, AI triage is called within the request pipeline. If Gemini times out or throws an unhandled error, the request experiences latency (up to 8,000ms timeout per model). Although wrapped in `try/catch`, it should be completely asynchronous/event-driven via a queue.
2. **Missing Input Validation (PRD Section 45):** Requests do not validate request bodies using Zod or JSON Schema. Malformed payloads or invalid UUIDs pass directly into store methods.
3. **Zero Authentication Middleware:** Endpoints lack bearer token validation (`Authorization: Bearer <token>`). Any client can invoke `POST /api/farm/cases/:id/review` and impersonate a licensed veterinarian.
4. **Missing Rate Limiting & Audit Logging (PRD Section 59, 60, 62):** No request rate limiting, no structured JSON audit logs for clinical updates, and no telemetry tracking for token cost or latency.

---

## 6. AI Layer Analysis

### 6.1 Current Implementation: `server/services/aiVetService.ts`
* **SDK:** `@google/genai` (v2.11.0).
* **Model Fallback List:** `['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite']`.
* **Prompting Strategy:** Single monolothic string template interpolating farm context into the prompt, asking the LLM to output a JSON object.
* **Deterministic Fallback:** A hardcoded method `generateRuleBasedTriage()` generates static yellow/red recommendations if Gemini fails or if `GEMINI_API_KEY` is missing.

### 6.2 AI Layer Deficiencies & Vulnerabilities
1. **No Tool Layer / Direct LLM Execution:** The AI model is given a static JSON text blob in the prompt rather than using **typed function calling / tools** (`get_animal_history`, `get_pen_density`, `search_farm_protocols`).
2. **Fragile JSON Parsing:** `JSON.parse(responseText)` is used without strict schema validation (such as Zod). If the model returns markdown or malformed JSON, it silently catches the error and drops back to the rule engine.
3. **Lack of True Grounded RAG (PRD Section 46, 65):** The "protocols" are hardcoded strings in `farmStore.ts`. There is no vector embedding store, chunking, citation verification, or authority score check (WOAH, Thai DLD).
4. **Single-Agent Monolith:** All AI functions (intake, triage, clinical advice, briefing) are crammed into `AIVetService`. PRD Section 42 & 74 explicitly require specialized agents:
   * `Intake Agent`
   * `Triage Agent`
   * `Clinical Interview Agent`
   * `Surveillance Agent`
   * `Prevention Agent`
   * `Follow-up Agent`
   * `Safety Gatekeeper Agent`

---

## 7. Data Flow Analysis

### 7.1 Current Data Flow
```
[User on Mobile / Desktop]
            |
            v  (HTTP POST /api/farm/cases)
     [server.ts]
            |
            +-----> [farmStore.createCase()]  <--- In-memory state only (RAM)
            |
            +-----> [aiVetService.runTriage()]
                         |
                         +-----> Google Gemini API (gemini-3.8-flash)
                         |       (or fallback to generateRuleBasedTriage)
                         v
     [Auto-append tasks to farmStore.tasks]
            |
            v  (JSON Response)
[User receives case + triage]
```

### 7.2 Flaws in the Current Data Flow
1. **Persistence is Not Guaranteed:** Data exists solely in Node process memory.
2. **No Event Emission:** When a case is created, no domain event (`HEALTH_CASE_CREATED`) is emitted to trigger asynchronous background surveillance or push notifications.
3. **Synchronous Latency:** The client must wait for the AI generation cycle before receiving confirmation of case creation, violating PRD Section 72 ("การบันทึกข้อมูลต้องทำงานได้แม้ AI ล่ม: User -> Save Record -> Success -> AI async analysis").

---

## 8. Safety & Veterinary Risk Analysis

| Risk Area | Current System Behavior | Severity | PRD Requirement | Remediation |
|---|---|---|---|---|
| **Antimicrobial Stewardship** | Freeform consult prompt mentions not prescribing antibiotics, but no strict programmatic filter exists. | **CRITICAL** | PRD Section 23, 75, 92: AI must NEVER prescribe prescription antimicrobials or formulate drug dosages. | Implement a deterministic `Safety Gatekeeper` that regex/semantic checks all AI outputs against a banned prescription dictionary. |
| **Diagnostic Hallucination** | System prompt instructs AI not to declare 100% certainty, but LLM output is not structurally bounded by an assessment schema. | **HIGH** | PRD Section 46, 48: Separate observed facts, assessment, unknowns, and recommended checks. | Enforce JSON Schema with strict enum validation; strip any diagnostic claims not backed by vet review. |
| **Impersonation of Vet** | Any user can submit a clinical review via `/api/farm/cases/:id/review` by setting `reviewed_by` in the request body. | **CRITICAL** | PRD Section 66, 75: Only users with verified `veterinarian` license/role can confirm diagnoses and approve treatments. | Enforce JWT authentication with Supabase RBAC and database-level RLS policies. |
| **Silent Audit Failure** | AI prompt executions, model versions, and vet modifications are not written to an immutable audit ledger. | **HIGH** | PRD Section 43, 59: Every AI decision must trace input, context, model, safety check, and human approval. | Implement `ai_audit_logs` and `clinical_audit_events` tables in PostgreSQL. |
| **Biosecurity Escalation** | Heuristic red flag check only looks for keywords ('ตาย', 'เลือดออก'). Multiple mild cases across pens are ignored. | **HIGH** | PRD Section 20, 50, 74: Multi-animal / cross-pen anomaly detection. | Add a deterministic Surveillance Rule Engine calculating barn-level morbidity thresholds. |

---

## 9. Comprehensive PRD.md Gap Analysis

The following table benchmarks current repository capabilities against the 94 sections of `PRD.md`:

| PRD Section | Requirement Description | Current Implementation Status | Gap & Required Action |
|---|---|---|---|
| **1-4** | Vision, Core Problems, Primary Target | Concept understood; basic prototype exists | Productionization required; eliminate all mock data. |
| **5** | Product Architecture | Partially implemented | Split into modular layers: UI, Agents, Tools, DB, Security. |
| **6-8** | Symptom Reporting Workflow (Fast < 60s) | Implemented in `ReportSymptomView.tsx` | Connect to persistent database, add offline draft queue. |
| **9-11** | AI Triage & Diagnostic Interview Agent | Implemented in `aiVetService.ts` | Refactor to specialized Agents, add Zod schema validation. |
| **12-13** | Veterinary Review & Drug Administration | Partially simulated in `CaseDetailModal.tsx` | Require vet auth, link to drug withdrawal tracking database. |
| **14** | AI Daily Farm Vet Briefing | Implemented in `aiVetService.generateDailyBriefing` | Connect to real database aggregates; cache daily outputs. |
| **15-16** | Knowledge Base & RAG Architecture | Static text in `farmStore.ts` | Implement vector embedding / full-text search with WOAH & DLD sources. |
| **17-19** | Farm, Barn, Pen, Animal Data Models | Types exist in `farm.ts`, mock in `farmStore.ts` | Create PostgreSQL migration schema with UUIDs and foreign keys. |
| **20-22** | Disease Surveillance & Outbreak Prevention | Basic warning badge on barn | Implement herd anomaly detection algorithm and cross-pen cluster alerts. |
| **23-25** | Antimicrobial Stewardship & WOAH Alignment | Mentioned in prompt | Build deterministic safety filter blocking auto-prescription. |
| **26-27** | Image Analysis & Multimodal Inspection | Heuristic endpoint in `server.ts` | Ground image analysis in structured clinical observation schema. |
| **28-30** | Feed, Water & Environmental Health | Simulated weather widget | Add environmental log tables and heat-index anomaly triggers. |
| **31-33** | Farm Task Management & Operations | Implemented in `TasksView.tsx` | Persist in PostgreSQL; implement automated recurring task generation. |
| **34-36** | Vaccination, Deworming & Biosecurity | Types exist; records simulated | Implement vaccination schedules and biosecurity audit logging. |
| **37-39** | Animal Profile, Timeline & Reports | Implemented in `AnimalsView.tsx` | Connect timeline to database event stream; add export functionality. |
| **40-42** | Tech Stack & Project Structure | React/Express single-node setup | Restructure directories to `/agents`, `/tools`, `/lib`, `/schemas`. |
| **43** | Database Rules & Immutability | **MISSING (in-memory RAM)** | Implement Supabase PostgreSQL schema with RLS and immutable audit triggers. |
| **44** | Offline / Poor Connectivity Handling | **MISSING** | Implement Service Worker, IndexedDB queue, and sync status pills. |
| **45** | Data Validation | **MISSING** | Implement comprehensive Zod schemas on all API inputs. |
| **46-48** | AI Grounding, Prompting & Reasoning | Partial prompt in `aiVetService.ts` | Enforce strict schema separation: Facts, Assessment, Unknowns, Checks. |
| **49-51** | Case Examples, Anomaly Detection & Eval | Ad-hoc fallback | Implement benchmark test dataset and evaluation test suite. |
| **52-55** | Acceptance Criteria, MVP Scope & Build Order | In progress (Phase 0 Audit) | Follow the 15-step build order in `MIGRATION_PLAN.md`. |
| **56-58** | UX Design System & Notifications | Dark theme UI exists | Refine typography (Noto Sans Thai), color semantics, in-app notifications. |
| **59-63** | Auditability, Security, Backup & Observability | **MISSING** | Implement audit logging, structured error handling, token tracking. |
| **64-69** | Data Quality, Review Queue & Feedback Loop | Review UI exists in modal | Persist vet modifications to a dedicated feedback dataset. |
| **70-75** | API Specs, Async AI & Event Principles | Synchronous coupling in `server.ts` | Decouple record creation from AI processing; adopt event-driven workflow. |
| **76-80** | Language, UI Modes & Demo Scenario | Thai UI implemented | Formalize Simple Mode (staff) vs. Expert Mode (vet/manager). |
| **81-83** | Definition of Done & AI Studio Rules | Phase 0 audit ongoing | Complete audit and migration plan without premature code edits. |
| **84-86** | Seed Demo Data & Test Users | Hardcoded mock in RAM | Write SQL seed migration for `นิพนธ์ฟาร์ม Demo` (50 animals, 15 cases). |
| **87-94** | Performance, Scalability & WOAH Standards | Not verified | Add database indexes, latency benchmarks, reference documentation. |

---

## 10. Architectural Recommendations & Conclusions

1. **Immediate Decoupling:** Immediately separate the in-memory store from production routes. The system must use a real database (Supabase / PostgreSQL) with relational integrity.
2. **AI Boundary Isolation:** The AI layer must be encapsulated behind an `AgentOrchestrator` using typed tool interfaces and Zod schema validation. The LLM must **never** execute raw SQL or mutate database tables directly.
3. **Safety Gatekeeper:** Introduce a hard programmatic check between LLM output and the database/client to guarantee that no unauthorized antibiotic recommendations or unqualified diagnostic guarantees reach the farm staff.
4. **Transition to Phase 1:** Proceed directly to schema creation, migrations, and clean architectural refactoring according to `MIGRATION_PLAN.md`.
