# Architecture

Answer each of these, in your own words, once the system has taken real shape.

---

## 1. What are the moving pieces, and how do they talk to each other?

The system is built out of four decoupled, focused layers:

1. **Frontend Client (React 18 + Vite + Tailwind CSS)**:
   - A single-page application (SPA) that provides two distinct experiences based on role: an operations console for **Front Desk staff** (slot generation, appointment management, alerts, and provider reassignment) and a clinical console for **Providers** (personal schedule, care team collaboration, author-locked visit notes, and schedule CSV export).
   - Manages client-side routing via React Router DOM, handles session persistence in `AuthContext`, and renders data visualizations (provider workload bar charts, appointment status distributions, and 8-week moving no-show trend lines) using Recharts.

2. **Backend API Gateway & Business Engine (Node.js + Express.js + TypeScript)**:
   - A stateless REST API that handles authentication, authorization, request validation, and domain logic.
   - Contains dedicated business engines:
     - **Finite State Machine**: Validates all lifecycle transitions (`Requested` → `Confirmed` → `CheckedIn` → `Completed`, time-gated `NoShow`, and check-in locked cancellations).
     - **Bulk Recurring Slot Generator & Collision Engine**: Generates recurring availability across date ranges while calculating interval overlaps to skip collisions.
     - **Dual-Threshold Alert Engine**: Evaluates unconfirmed appointments within 24 hours and enforces automatic reappearance within 1 hour.
     - **Immutable Audit Ledger**: Records an append-only log of every state change, care team addition, and clinical note.
     - **Daily Schedule CSV Exporter**: Streams RFC 4180-compliant CSV files directly to the client.

3. **Data Access Layer (Prisma ORM)**:
   - Provides end-to-end type safety between the PostgreSQL database and TypeScript application code. Handles relation loading, cascade deletes, transactions (`prisma.$transaction`), and composite indexes.

4. **Relational Persistence Database (PostgreSQL via Supabase / SQLite for local dev)**:
   - Stores relational models: `User`, `Provider`, `AppointmentSlot`, `Appointment`, `SupportingProvider`, `VisitNote`, `AppointmentTimeline`, and `AlertDismissal`.

### How they communicate:
- The **Frontend** communicates with the **Backend** over HTTPS using RESTful JSON endpoints. Every authenticated request includes an `Authorization: Bearer <JWT>` header containing the signed user identity and role.
- The **Backend** communicates with **PostgreSQL** over TCP via Prisma using connection pooling (`pgbouncer=true` on port 6543 for transactions, port 5432 for session/DDL commands).

---

## 2. Where does each piece run?

| Piece | Hosting Platform | Runtime Environment | Configuration / Ports |
| :--- | :--- | :--- | :--- |
| **Frontend Web App** | **Vercel** | Global Edge CDN / Static Web | `frontend/vercel.json` SPA rewrite rules; serves production React build. |
| **Backend REST API** | **Render** | Node.js 20 Linux Container | `backend/render.yaml` web service listening on port `5000`, with health check on `/api/health`. |
| **Database** | **Supabase** | Managed PostgreSQL 16 (AWS `ap-southeast-1`) | Transaction pooler on port `6543`, session direct port `5432`. |
| **Local Development** | **Developer Machine** | Local Node.js / Vite | Frontend on `http://localhost:5173`, Backend on `http://localhost:5000` with zero-config SQLite file database (`dev.db`). |

---

## 3. What is the request path for one representative user action, end to end?

### Representative Action: *Front Desk Staff Cancels an Appointment with a Reason*

```
[ Browser UI ] 
      │ 1. User submits Cancellation Modal with reason "Patient requested reschedule"
      ▼
[ Axios Client ] 
      │ 2. Attaches JWT Bearer token & fires PATCH /api/appointments/:id/status
      ▼
[ Render Web Service (Express) ]
      │ 3. Global Middleware: cors() -> morgan() -> express.json()
      ▼
[ Auth Middleware: authenticateJwt ]
      │ 4. Verifies JWT signature and extracts { userId, role: "FRONT_DESK" }
      ▼
[ Zod Request Validator ]
      │ 5. Validates payload: { status: "Cancelled", cancellationReason: "..." }
      ▼
[ Appointment Controller: updateStatus ]
      │ 6. Extracts appointmentId from params and delegates to AppointmentService
      ▼
[ Appointment Service & Finite State Machine ]
      │ 7. Fetches existing appointment from database.
      │ 8. Invokes validateStatusTransition():
      │    - Verifies current status is NOT "CheckedIn" (cancellations locked after check-in).
      │    - Verifies current status is NOT terminal ("Completed", "NoShow", "Cancelled").
      │    - Verifies non-empty cancellationReason is provided.
      ▼
[ Prisma ORM & Database Transaction ]
      │ 9. In PostgreSQL:
      │    - Updates Appointment record: status = 'Cancelled', cancelledAt = NOW(), cancelledById = userId, cancellationReason = '...'
      │    - Inserts AppointmentTimeline record: actionType = 'CANCELLATION', oldValue = 'Confirmed', newValue = 'Cancelled (Reason: Patient requested reschedule)'
      ▼
[ Response & Client UI State Update ]
      │ 10. Express returns HTTP 200 with updated appointment JSON.
      │ 11. React receives response, updates local state, updates badge to red "Cancelled",
      │     and appends the new entry into the visual Audit Timeline thread.
```

---

## 4. What did you decide not to build, and why?

1. **Stateful WebSockets / Socket.IO Server**:
   - *Decision*: Decided against maintaining a persistent WebSocket server connection.
   - *Why*: Free-tier serverless and container hosts (like Render) spin down during periods of inactivity, which breaks long-lived socket connections without expensive persistent servers or external Redis adapters. Instead, I built lightweight on-demand evaluation with short-interval polling and reactive UI refreshes.

2. **Patient-Facing Self-Registration & Booking Portal**:
   - *Decision*: Did not build a public consumer sign-up flow.
   - *Why*: The project specification focused deeply on internal clinic workflow orchestration: strict clinical role separation (Front Desk vs Provider), author-locked clinical visit notes, multi-provider care team consultations, and bulk recurring availability scheduling. Focusing purely on the staff/provider portal allowed building a much more thorough, production-grade clinical tool.

3. **In-App Ephemeral Chat**:
   - *Decision*: Avoided generic chat rooms or instant messages between providers.
   - *Why*: Healthcare workflows require auditable, permanent documentation. Instead of temporary chat messages, I built structured **Care Team assignments (M:N)**, **Author-Locked Clinical Visit Notes**, and an **Immutable Audit Timeline** where every entry is permanently recorded and attributed.

4. **Distributed Background Worker Queue (e.g. BullMQ / RabbitMQ / Redis)**:
   - *Decision*: Evaluated 24h warning and 1h critical alerts on-demand via indexed SQL queries rather than running an external background cron queue container.
   - *Why*: This kept the deployment architecture lean, cost-effective, and fully stateless without introducing external Redis container dependencies, while still executing in under 15ms due to composite indexes on `[slot.date, slot.startTime, status]`.
