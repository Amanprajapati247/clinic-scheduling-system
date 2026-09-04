# Submission

Fill this in and commit it. This is the first file we open.

## Links

- **GitHub repository:** https://github.com/Amanprajapati247/clinic-scheduling-system
- **Live application:** https://clinic-scheduling-frontend.vercel.app

## Notes for the reviewer

- **Render Cold Start**: The backend is deployed on Render's free tier, so if it has been inactive for a while, the very first request might take about 30 to 45 seconds to spin up from sleep. Once awake, it runs smoothly.
- **1-Click Demo Logins**: On the login page, I added quick-fill buttons for both **Front Desk Lead** and **Dr. Gregory House** so you don't have to manually type credentials every time you switch personas.
- **Pre-Seeded Data**: The live Supabase database is pre-seeded with 50 appointments across past, present, and upcoming dates, complete with visit notes, care team assignments, and audit logs.
- **Automated Verification**: You can also run the backend domain test suite locally with `cd backend && npx tsx test-suite.ts` (covers 28 test assertions across all 10 domain rules).

## Demo credentials

| Role | Email | Password |
|------|-------|----------|
| Front Desk Lead | `frontdesk@example.com` | `Password123` |
| Clinical Provider (Dr. Gregory House) | `provider@example.com` | `Password123` |
| Clinical Provider (Dr. James Wilson) | `provider2@example.com` | `Password123` |

## Stack

| Layer | What you used | Why |
|-------|---------------|-----|
| Frontend | React 18, Vite, React Router DOM, Tailwind CSS, Recharts, Lucide Icons | Wanted a clean, responsive SPA with fast build times. Tailwind made it quick to build a clean medical dashboard UI, and Recharts gave me the flexibility needed for the weekly moving trend charts. |
| Backend | Node.js, Express.js, TypeScript, Zod | TypeScript and Zod gave strong end-to-end type safety and runtime validation for complex scheduling payloads, while Express kept the routing architecture straightforward and easy to reason about. |
| Database | PostgreSQL (Supabase), Prisma ORM | Prisma handled foreign keys, relations, and composite indexes cleanly. PostgreSQL enums ensure strict database-level constraints for roles, statuses, and audit actions. |
| Hosting | Vercel (Frontend), Render (Backend), Supabase (Database) | Standard, reliable cloud stack with zero-config continuous deployment from GitHub. |

## Goal checklist

Mark each honestly. Partial is fine — say what is partial.

| # | Goal | Status | Notes |
|---|------|--------|-------|
| 1 | Accounts and Roles (RBAC) | Done | Strict backend middleware guards for `FRONT_DESK` and `PROVIDER`, plus role-based UI route protection. |
| 2 | Appointment Slots | Done | Slots support provider, date, start/end time, duration. Unbooked slots can be edited; booking locks the slot; soft archive & restore are fully supported. |
| 3 | Visit Notes | Done | Belongs to an appointment, free text, author-locked editing (only the provider who wrote the note can edit it), displayed chronologically. |
| 4 | Finite State Machine Workflow | Done | Strict transitions (`Requested` → `Confirmed` → `CheckedIn` → `Completed`; `NoShow` allowed only after start time; cancellation only before check-in with mandatory reason). |
| 5 | Care Team Collaboration | Done | Primary scheduling provider + M:N supporting consultants. Providers can see appointments where they are primary or supporting. |
| 6 | Appointment Search & Filtering | Done | Server-side patient name search, multi-filter by provider, status, date range, column sorting, and pagination. |
| 7 | Bulk Recurring Slots & CSV Export | Done | Bulk recurring availability generator with collision detection (reports created vs skipped counts) and RFC 4180 Daily Schedule CSV export. |
| 8 | Dashboard Analytics | Done | 4 KPI cards, Provider Workload bar chart, Status distribution donut chart, and 8-week moving no-show rate area chart. |
| 9 | Immutable Audit Timeline | Done | Append-only transaction ledger logging creations, status transitions, care team changes, cancellations, and note additions with historical diffs. |
| 10 | Dynamic Unconfirmed Alerts | Done | 24-hour warning alerts for requested appointments; Front Desk can dismiss them, but if still unconfirmed within 1 hour, the critical alert automatically reappears. |

## How much time did you actually spend?

I spent about **2 full days (around 16 hours total)** building and polishing the system:

- **Day 1 (~8 hours)**:
  - Designed the relational data model in Prisma (M:N care teams, slots, appointments, notes, audit timeline).
  - Built the Express backend architecture, JWT authentication, and RBAC middleware.
  - Implemented the core domain services: finite state machine transition validator, recurring slot collision avoidance engine, and immutable timeline logger.
  - Wrote the 28-point automated test runner (`backend/test-suite.ts`) to verify all domain edge cases before building the UI.

- **Day 2 (~8 hours)**:
  - Built the React frontend pages (Dashboard with Recharts, Appointments list with server-side filters, Appointment Details with Care Team manager & timeline viewer, Slot Generator, Provider Schedule).
  - Implemented the dynamic 24h & 1h reappearing alert queue and daily CSV schedule exporter.
  - Set up deployment pipelines on Supabase, Render, and Vercel.
  - Seeded realistic clinic data and resolved deployment environment edge cases (cross-origin headers and route mounting).

## What would you do next, with another 12 hours?

1. **WebSocket / Server-Sent Events (SSE)**: Right now alerts and timeline updates refresh on navigation or polling. I'd add real-time SSE push so Front Desk instantly sees new appointment requests or urgent 1-hour alerts popping up without refreshing.
2. **Automated Patient Notifications**: Wire up Twilio / SendGrid webhooks to send automated SMS or email reminders to patients 24 hours prior with a 1-click confirmation link.
3. **Time Zone & Multi-Location Support**: Right now the clinic operates in a single local timezone. I'd extend the data model to support multiple clinic branches, exam rooms, and explicit UTC offset handling.
4. **Optimistic UI Updates & Query Caching**: Add React Query / TanStack Query on the frontend for smoother background caching and instantaneous optimistic state transitions.

## What are you least happy with in this codebase, and why?

- **Frontend Component Granularity**: A few pages like `AppointmentDetails.jsx` and `Appointments.jsx` handle both data fetching and multiple modal states (cancellation, reassignment, care team addition) within the page component. Given more time, I would break them down into smaller custom hooks (e.g. `useAppointmentActions`, `useCareTeam`) to improve maintainability and testability.
- **On-Demand Alert Evaluation**: The 24h and 1h alert logic evaluates dynamically during query execution. While this works reliably for moderate clinic loads with indexed queries, in a high-throughput enterprise deployment with hundreds of thousands of records, I'd prefer a background Redis/BullMQ worker pre-computing and caching active alert states.
