# AI Prompts & Engineering Workflows

## 1. Domain Modeling & Architecture Prompt
```text
Act as a Senior Full Stack Software Engineer and System Architect.
Design a production-ready Clinic Appointment Scheduling System with PostgreSQL, Prisma ORM, Express.js, React, and Tailwind CSS.
Requirements:
1. Strict Role-Based Access Control (FRONT_DESK vs PROVIDER).
2. Slot management (unbooked editing, booked locking, soft archiving).
3. Author-locked clinical visit notes with chronological presentation.
4. Server-side finite state machine: Requested -> Confirmed -> CheckedIn -> Completed; NoShow permitted only after scheduled time; Cancellation permitted only before CheckedIn with mandatory reason.
5. Care team multi-provider M:N relations.
6. Server-side search with multi-parameter filtering, sorting, and pagination.
7. Bulk recurring slot generation with collision avoidance and RFC 4180 CSV export.
8. Analytics dashboard with metrics, provider breakdown, status distribution, and 8-week moving no-show rate.
9. Append-only immutable audit timeline.
10. Dual-tier unconfirmed alert engine (24h warning and 1h reappearing critical alert).
```

---

## 2. Finite State Machine Validation Prompt
```text
Implement a robust server-side state machine validator in TypeScript for clinical appointment status transitions:
- Disallow any transition from terminal states (Completed, NoShow, Cancelled).
- Enforce that NoShow transitions are strictly rejected if current time has not passed slot start time.
- Enforce that Cancellation is strictly prohibited once the patient has CheckedIn.
- Require a non-empty cancellation reason for all cancellations.
- Return structured error messages for all invalid transition attempts.
```

---

## 3. Bulk Recurring Availability & Collision Engine Prompt
```text
Build a high-performance recurring availability generator:
- Inputs: Provider ID, Date range (startDate to endDate), Array of weekly rules (dayOfWeek 0..6, startTime, endTime, duration).
- Fetch existing non-archived slots for provider in date range.
- Iterate through dates, generate time intervals, test for interval overlap collisions.
- Insert non-colliding slots in a batch and skip duplicates.
- Return { createdSlots, skippedSlots, totalSlotsGenerated }.
```

---

## 4. Unconfirmed Alerts Dual-Threshold Engine Prompt
```text
Develop an alert detection engine for Requested appointments:
- Target appointments in Requested status whose start time is within 24 hours.
- If between 1h and 24h away: Warning alert (suppressed if UNCONFIRMED_24H dismissal exists).
- If under 1h away: Critical alert (MUST REAPPEAR even if UNCONFIRMED_24H was dismissed; only suppressed if UNCONFIRMED_1H dismissal exists).
```
