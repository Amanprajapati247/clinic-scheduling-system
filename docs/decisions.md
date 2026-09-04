# Decisions

---

### Decision 1
- **Chose**: Dedicated schema template files (`schema.sqlite.prisma` and `schema.postgresql.prisma`) swapped via a clean build script.
- **Rejected**: A single schema file with runtime regex replacing `provider = "sqlite"` with `provider = "postgresql"`.
- **Why**: SQLite does not support PostgreSQL's native `enum` declarations or `@db.Text` annotations. Trying to regex-replace words caused build crashes when compiling on Render.
- **Later reversed**: Initially, I tried using a single `schema.prisma` file with regex replacement to avoid duplicate files. But after hitting Prisma schema validation errors on PostgreSQL deployment, I reversed this and created two dedicated template schemas.

---

### Decision 2
- **Chose**: Centralized TypeScript state machine validator (`validateStatusTransition`) in the backend service layer.
- **Rejected**: Relying on frontend button disabling or database-level trigger constraints.
- **Why**: Frontend checks can be easily bypassed with direct API calls, and database triggers make business error messages hard to surface. A TypeScript state machine guarantees zero invalid transitions and returns clear human-readable error messages.

---

### Decision 3
- **Chose**: A dedicated `AlertDismissal` relational table storing dismissal records by `alertType` (`UNCONFIRMED_24H` vs `UNCONFIRMED_1H`).
- **Rejected**: Adding a single boolean `isDismissed` column directly to the `Appointment` table.
- **Why**: A single boolean flag permanently hides the alert once clicked. Having distinct alert types allows Front Desk to dismiss the 24-hour warning, while ensuring the critical 1-hour urgent alert still reappears when time is running out.

---

### Decision 4
- **Chose**: Strict backend authorization rule enforcing that only the originating doctor (`providerId === note.providerId`) can edit a clinical visit note.
- **Rejected**: Allowing Front Desk or other care team doctors to edit each other's visit notes.
- **Why**: Medical records require clinical accountability. Other doctors can append their own new notes, but cannot tamper with existing notes written by another physician.

---

### Decision 5
- **Chose**: True time-interval collision math (`startA < endB && endA > startB`) when generating bulk recurring slots.
- **Rejected**: Checking only exact start time equality (`slot.startTime === existing.startTime`).
- **Why**: Availability slots can have different durations (e.g. 15, 30, or 60 minutes). Exact start time matching failed to detect when a 60-minute slot at 09:00 collided with a 30-minute slot starting at 09:30.
