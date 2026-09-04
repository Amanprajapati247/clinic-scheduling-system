# Architecture
---

### What are the moving pieces, and how do they talk to each other?

1. **Frontend (React + Vite + Tailwind)**:
   - The web UI for Front Desk staff and Doctors.
   - Shows dashboard charts, calendar schedules, appointment lists, alerts, and visit notes.
   - Talks to the backend by sending standard HTTPS JSON requests with a JWT auth token.

2. **Backend (Node.js + Express + TypeScript)**:
   - The central API server.
   - Handles login, checks role permissions (RBAC), validates status transitions with a state machine, generates bulk slots, and records audit logs.
   - Queries the database using Prisma ORM.

3. **Database (PostgreSQL on Supabase)**:
   - Relational database storing users, doctors, availability slots, appointments, care teams, visit notes, and audit history.

---

### Where does each piece run?

- **Frontend**: Hosted on **Vercel** (Global Edge CDN).
- **Backend**: Hosted on **Render** (Node.js Web Service).
- **Database**: Hosted on **Supabase** (Managed PostgreSQL in the cloud).
- *Local Dev*: Runs locally on your machine with a zero-config SQLite database (`dev.db`).

---

### What is the request path for one representative user action, end to end?

**Example: Front Desk cancels an appointment with a reason**

1. **User Action**: Front Desk staff enters a reason in the popup modal and clicks "Confirm Cancellation".
2. **Frontend Request**: React sends a `PATCH /api/appointments/:id/status` request with `{ status: "Cancelled", cancellationReason: "Patient rescheduled" }` and the JWT token.
3. **Backend Auth**: Express checks the JWT token to verify the user is logged in as Front Desk.
4. **State Machine Validation**: The server checks that the patient has not already checked in, and confirms a non-empty reason was provided.
5. **Database Transaction**: Prisma updates the appointment status to `Cancelled` and saves an immutable audit log entry into the timeline table.
6. **Response**: Express returns HTTP 200 with the updated appointment.
7. **UI Update**: React updates the status badge to red "Cancelled" and adds the cancellation entry to the audit timeline on screen.

---

### What did i decide not to build, and why?

1. **WebSockets (Live Sockets)**:
   - Free cloud tiers (like Render) spin down when idle, which disconnects live socket servers. Simple HTTP requests and polling kept the backend 100% stateless and reliable.
2. **Patient Self-Booking Portal**:
   - Focused entirely on the internal clinic staff and doctor workflow (state machines, locked clinical notes, multi-doctor care teams, and analytics) as specified in requirements.
3. **In-App Ephemeral Chat**:
   - Healthcare decisions require permanent records. Instead of temporary chat, built author-locked clinical notes and an immutable audit timeline.
4. **Separate Redis Queue Worker**:
   - Evaluated 24h and 1h alerts on-demand using fast indexed database queries instead of adding extra complex server infrastructure.
