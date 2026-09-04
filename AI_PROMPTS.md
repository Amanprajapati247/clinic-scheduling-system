# AI prompts

The prompts you actually used, in the order you used them, grouped by what you were trying to achieve. For each significant one: what you asked, what you got back, and what you had to correct.

Include at least one prompt that produced something wrong, and what you did about it.

If you did not use AI at all, say so here, and describe your process instead.

---

## 1. System Architecture & Relational Schema Design

### Prompt
> "Act as a Senior System Architect. Design a production-grade PostgreSQL Prisma ORM schema for a Clinic Appointment Scheduling System. It must support:
> 1. Role-Based Access Control (`FRONT_DESK` and `PROVIDER`).
> 2. Provider availability slots with unbooked editing, booked locking, and soft archiving.
> 3. Clinical visit notes belonging to an appointment, editable ONLY by the original author provider.
> 4. Multi-provider Care Teams (primary scheduling provider plus M:N supporting consultants).
> 5. Append-only immutable audit timeline tracking status transitions and clinical actions.
> 6. Dual-tier alert dismissals (24h warning vs 1h critical)."

### What you got
- A structured Prisma schema containing `User`, `Provider`, `AppointmentSlot`, `Appointment`, `VisitNote`, `SupportingProvider`, and `AppointmentTimeline` models.
- Basic foreign key relationships and index annotations.

### What you corrected
- **Missing unique compound constraints**: `SupportingProvider` lacked a unique constraint on `[appointmentId, providerId]`, which would have allowed duplicate assignments of the same consultant to an appointment. I added `@@unique([appointmentId, providerId])`.
- **Query performance indexes**: Added composite indexes `@@index([providerId, date])` on slots and `@@index([appointmentId, timestamp])` on timeline logs to ensure fast queries during calendar filtering.
- **PostgreSQL vs SQLite dual compatibility**: Prisma does not allow native enums in SQLite, so I created two synchronized schema templates (`schema.sqlite.prisma` for zero-config local runs and `schema.postgresql.prisma` with native Enums and `@db.Text` for Supabase/Render).

---

## 2. Finite State Machine & Status Lifecycle Validator (Produced Something Wrong)

### Prompt
> "Write a TypeScript finite state machine validator function `validateStatusTransition` for appointment statuses: `Requested` -> `Confirmed` -> `CheckedIn` -> `Completed`. Disallow any transition from terminal states (`Completed`, `NoShow`, `Cancelled`). Disallow cancellation after `CheckedIn`. Require a cancellation reason. Ensure `NoShow` is only valid after the scheduled appointment time."

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
- ⚠️ **The Error**: The AI code only checked if the appointment *date* was in the future (`slotDate > today`). This meant an appointment scheduled for 4:00 PM today could be marked as `NoShow` at 9:00 AM in the morning before the patient even had a chance to arrive!
- 🛠️ **The Fix**: I wrote a dedicated datetime parser `parseSlotDateTime(dateStr, timeStr)` that constructs a full `Date` object combining the slot date (`YYYY-MM-DD`) and start time (`HH:mm`). Then I implemented `isAppointmentTimePassed()`:
```typescript
export function isAppointmentTimePassed(dateStr: string, startTimeStr: string, now = new Date()): boolean {
  const aptStart = parseSlotDateTime(dateStr, startTimeStr);
  return now.getTime() >= aptStart.getTime();
}
```
I also wrote automated test assertions in `backend/test-suite.ts` to guarantee that marking `NoShow` at 9:00 AM on a 4:00 PM appointment is rejected with an HTTP 400 error.

---

## 3. Bulk Recurring Slot Generator & Overlap Collision Detection

### Prompt
> "Implement a high-performance recurring availability generator in TypeScript:
> - Parameters: `providerId`, `startDate`, `endDate`, `weeklySchedule` (array of rules with `dayOfWeek`, `startTime`, `endTime`, `duration`).
> - Iterate through every date between startDate and endDate.
> - Calculate start and end time intervals for each matching day.
> - Avoid duplicate or overlapping slots with existing active provider slots.
> - Return count of created slots vs skipped collisions."

### What you got
- A working date iteration loop using JavaScript `Date` and `prisma.appointmentSlot.createMany`.
- Collision check compared only exact start time strings (`slot.startTime === existing.startTime`).

### What you corrected
- **Interval overlap logic**: Comparing only exact start time misses overlapping slots with different durations (e.g., a 60-min slot starting at 09:00 collides with a 30-min slot starting at 09:30). I replaced the equality check with true time interval overlap:
  `startA < endB && endA > startB`.
- **Batch transaction safety**: Wrapped creation in `createMany` with `skipDuplicates: true` and returned structured metrics `{ createdCount, skippedCount, totalEvaluated }` so the frontend UI can display an exact breakdown toast to Front Desk staff.

---

## 4. Dynamic 24h Warning & 1h Reappearing Alert Engine

### Prompt
> "Build an alert calculation service for unconfirmed appointments in `Requested` status:
> - If an appointment is in `Requested` status and starts within the next 24 hours, generate a `UNCONFIRMED_24H` warning alert.
> - Allow Front Desk to dismiss the alert.
> - Critical requirement: If the appointment is STILL in `Requested` status within 1 hour of start time, generate a `UNCONFIRMED_1H` critical alert that MUST reappear even if the Front Desk previously dismissed the 24h warning alert."

### What you got
- A service that filtered appointments by date and checked a boolean `isDismissed` column on the `Appointment` table.

### What you corrected
- **Single boolean flag failed reappearance rule**: A single boolean `isDismissed` on the appointment prevented the 1-hour alert from showing up if the 24-hour alert had been dismissed earlier.
- **Dedicated dismissal entity**: Created the `AlertDismissal` model storing `[appointmentId, alertType, userId, dismissedAt]`. In `AlertService.getActiveAlerts()`, when `diffMinutes <= 60`, the query checks ONLY for dismissals with `alertType === 'UNCONFIRMED_1H'`. This guarantees that dismissing a 24-hour warning never suppresses the 1-hour critical alert.

---

## 5. Deployment & Cross-Origin Route Compatibility

### Prompt
> "Set up the Express backend and React Vite frontend configuration for production deployment to Render and Vercel with CORS and environment variable handling."

### What you got
- Standard Express setup mounting routes at `app.use('/api', apiRouter)`.
- Frontend Axios client using `baseURL: import.meta.env.VITE_API_URL`.

### What you corrected
- **Route not found on custom base URLs**: When deployed, if `VITE_API_URL` was set to `https://clinic-backend.onrender.com` without `/api`, the frontend called `POST /auth/login` and received `404 Route not found: POST /auth/login`.
- **Dual-mount & URL normalization**:
  1. Updated `backend/src/app.ts` to mount routes on **both `/api` and `/`** (`app.use('/api', apiRouter); app.use('/', apiRouter);`).
  2. Updated `frontend/src/api/client.js` with helper `getBaseUrl()` that strips trailing slashes and handles any base URL format gracefully.
