# AI prompts

The prompts you actually used, in the order you used them, grouped by what you were trying to achieve. For each significant one: what you asked, what you got back, and what you had to correct.

Include at least one prompt that produced something wrong, and what you did about it.

If you did not use AI at all, say so here, and describe your process instead.

---

## 1. Database & Schema Design

### Prompt
> "Design a PostgreSQL Prisma schema for a Clinic Scheduling system with roles (Front Desk, Provider), provider slots, appointments, M:N care teams, author-locked visit notes, immutable audit timelines, and alert dismissals."

### What you got
- Prisma models for users, providers, slots, appointments, notes, and timelines.

### What you corrected
- Added composite unique constraint `@@unique([appointmentId, providerId])` on `SupportingProvider` to prevent duplicate doctor assignments.
- Added composite indexes `@@index([providerId, date])` for fast calendar lookups.
- Created dual schema templates (`schema.sqlite.prisma` and `schema.postgresql.prisma`) so local SQLite and production PostgreSQL enums both work cleanly.

---

## 2. Finite State Machine Validator (Produced Something Wrong)

### Prompt
> "Write a TypeScript function to validate status transitions: `Requested` -> `Confirmed` -> `CheckedIn` -> `Completed`. Block transitions from terminal states. Block cancellation after `CheckedIn`. Require a reason. Disallow `NoShow` before the scheduled appointment time."

### What you got
```typescript
// Initial AI Output (Flawed)
if (targetStatus === 'NoShow') {
  const today = new Date().toISOString().split('T')[0];
  if (slotDate > today) {
    return { isValid: false, errorMessage: 'Cannot mark NoShow before appointment date' };
  }
}
```

### What you corrected
- **The Bug**: The AI only checked the calendar *date* (`slotDate > today`), allowing a 4:00 PM appointment to be marked `NoShow` at 9:00 AM on the same day.
- **The Fix**: Wrote `parseSlotDateTime(dateStr, timeStr)` to combine date and time (`YYYY-MM-DD` + `HH:mm`) into an exact timestamp, and checked `now.getTime() >= aptStart.getTime()`. Added unit tests in `test-suite.ts` to ensure premature same-day `NoShow` transitions are rejected.

---

## 3. Bulk Recurring Slot Generator

### Prompt
> "Implement a recurring availability generator: given a provider, date range, and weekly rules (day of week, start time, end time, duration), generate slots while skipping collisions with existing provider slots."

### What you got
- A loop generating date intervals and creating slots in batch, checking collisions with `slot.startTime === existing.startTime`.

### What you corrected
- Exact start-time matching missed overlapping slots with different durations (e.g. 60-min slot at 09:00 overlapping a 30-min slot at 09:30). Replaced with true interval overlap logic: `startA < endB && endA > startB`.
- Returned structured counts `{ createdCount, skippedCount }` for the UI toast.

---

## 4. 24h Warning & 1h Reappearing Alerts

### Prompt
> "Build an alert engine for unconfirmed Requested appointments: show warning if within 24h (dismissible by Front Desk), but if still Requested within 1h, show a critical alert that reappears even if 24h was dismissed."

### What you got
- Filtered appointments by date with a single boolean `isDismissed` column on the `Appointment` table.

### What you corrected
- A single boolean flag permanently hid the alert once dismissed. Created the `AlertDismissal` model storing `alertType` (`UNCONFIRMED_24H` vs `UNCONFIRMED_1H`). For appointments under 1h away, the query only checks for `UNCONFIRMED_1H` dismissals, ensuring the alert reappears.

---

## 5. Deployment Route Compatibility

### Prompt
> "Configure Express backend and React Vite frontend for production deployment on Render and Vercel."

### What you got
- Express mounted routes at `app.use('/api', apiRouter)`, and frontend used `baseURL: import.meta.env.VITE_API_URL`.

### What you corrected
- If `VITE_API_URL` was provided without `/api` on Vercel, requests to `/auth/login` returned 404 Route Not Found. Mounted routes on both `/api` and `/` on Express, and added automatic base URL normalization on the frontend Axios client.
