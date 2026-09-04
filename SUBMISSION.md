# Submission

Fill this in and commit it. This is the first file we open.

## Links

- **GitHub repository:** https://github.com/Amanprajapati247/clinic-scheduling-system
- **Live application:** https://clinic-scheduling-frontend.vercel.app

## Notes for the reviewer

- **Render Backend Cold Start**: The backend is hosted on Render's free tier. If the service has been idle, the very first API request may take approximately 30–50 seconds to spin up from sleep mode. Subsequent requests will be fast and responsive.
- **1-Click Demo Personas**: The login page includes quick 1-click persona buttons for **Front Desk Lead** and **Clinical Provider (Dr. Gregory House)** for instant access.
- **Pre-Seeded Database**: The live Supabase PostgreSQL database is pre-populated with 50 appointments across past, present, and future dates with active care teams, clinical visit notes, and audit timelines.
- **Automated Domain Test Suite**: You can run the comprehensive 28-assertion domain test suite locally anytime with `cd backend && npx tsx test-suite.ts`.

## Demo credentials

| Role | Email | Password |
|------|-------|----------|
| Front Desk Lead | `frontdesk@example.com` | `Password123` |
| Clinical Provider (Dr. Gregory House) | `provider@example.com` | `Password123` |
| Clinical Provider (Dr. James Wilson) | `provider2@example.com` | `Password123` |

## Stack

| Layer | What you used | Why |
|-------|---------------|-----|
| Frontend | React 18, Vite, React Router v6, Tailwind CSS, Lucide Icons, Recharts | Fast SPA performance, component-driven UI, responsive medical dashboard styling, and rich charting for weekly analytics. |
| Backend | Node.js, Express.js, TypeScript, Zod | Type safety across domain layers, scalable REST architecture, schema-level request validation, and strict state machine guarantees. |
| Database | PostgreSQL (Supabase), Prisma ORM | Relational integrity with foreign key cascades, composite indexes for search performance, native Enums, and dual compatibility with local SQLite. |
| Hosting | Vercel (Frontend), Render (Backend), Supabase (Database) | High availability global edge CDN for React SPA, containerized backend runtime, and scalable PostgreSQL database. |

## Goal checklist

Mark each honestly. Partial is fine — say what is partial.

| # | Goal | Status | Notes |
|---|------|--------|-------|
| 1 | **Accounts & Roles (RBAC)** | Done | Strict backend middleware and frontend route guards for `FRONT_DESK` and `PROVIDER`. |
| 2 | **Appointment Slots** | Done | Provider slots with date, start/end time, duration; editable only when unbooked; locked on booking; soft archive & restore supported. |
| 3 | **Visit Notes** | Done | Belongs to appointment; free text; author-provider editable only; displayed chronologically with author badges. |
| 4 | **Finite State Machine Workflow** | Done | Strict state machine (`Requested` → `Confirmed` → `CheckedIn` → `Completed`; `NoShow` strictly after start time; cancellation strictly before check-in with mandatory reason). |
| 5 | **Care Team Collaboration** | Done | Primary scheduling provider + M:N supporting consultants; providers view appointments where they are primary or supporting. |
| 6 | **Appointment Search & Filtering** | Done | Server-side patient name search, multi-filter by provider/status/date range, sorting, and pagination. |
| 7 | **Bulk Recurring Slots & CSV Export** | Done | Batch slot generation with collision avoidance (reporting created/skipped counts) and RFC 4180 Daily Schedule CSV exporter. |
| 8 | **Dashboard Analytics** | Done | Real-time KPI cards, provider workload bar chart, appointment status donut chart, and 8-week moving no-show rate area chart. |
| 9 | **Immutable Audit Timeline** | Done | Append-only transaction ledger tracking creations, status changes, care team assignments, cancellations with reasons, and visit notes with historical diffs. |
| 10 | **Dynamic Unconfirmed Alerts** | Done | 24-hour warning alert queue, dismissible by Front Desk, with automatic reappearance at < 1 hour if still in `Requested` status. |

## How much time did you actually spend?

- **Total time spent**: ~14 hours
  - **Architecture & Database Modeling**: ~2.5 hours (Prisma schema design, composite indexes, M:N care teams, state machine matrix).
  - **Backend Core Services & State Machine**: ~4 hours (RBAC, bulk recurring slot generator, collision avoidance, CSV streaming, alert engine, and 28-point automated test suite).
  - **Frontend UI & Visualization**: ~4.5 hours (React dashboard, Recharts analytics, Appointments console, slot generator modal, author-locked note editor, and visual timeline).
  - **Deployment & Cloud Infrastructure**: ~3 hours (Supabase PostgreSQL setup, Render Web Service configuration, Vercel SPA routing, and CI/CD audit).

## What would you do next, with another 12 hours?

1. **Real-time WebSockets / SSE**: Push instant notifications for urgent 1-hour alerts, status changes, and newly assigned care team consultants without polling.
2. **Automated Patient Communication**: Integrate Twilio SMS and SendGrid email webhooks for automated 24-hour confirmation links and reminder notices.
3. **Multi-Location / Room Management**: Extend the data model to support multiple clinic physical facilities, exam rooms, and equipment scheduling.
4. **HL7 / FHIR Integration**: Add FHIR-compliant (`/Appointment`, `/Patient`, `/Encounter`) REST export endpoints for interoperability with hospital EHR systems.
5. **Advanced Patient Self-Booking Portal**: A lightweight public-facing portal for patients to view open provider availability slots and submit appointment requests.

## What are you least happy with in this codebase, and why?

- **Dual-Schema Management (SQLite Local vs PostgreSQL Cloud)**: To achieve instant zero-config local development while maintaining native PostgreSQL Enums in production, we maintained template schemas swapped via a build script. In a production team environment, adopting a local Dockerized PostgreSQL container or PostgreSQL migration baseline would unify the database dialect into a single source of truth.
- **Alert Evaluation Mechanism**: Alerts are currently evaluated dynamically on-demand during dashboard/alert requests using indexed date comparisons. For a clinic with hundreds of thousands of active appointments, this would be better served by a background job scheduler (e.g. BullMQ / Redis or PostgreSQL pg_cron) pre-computing urgent alert states into an active notification cache.
