# Schema

---

### Table by table: what columns and types does each one have?

1. **`User`**:
   - `id` (UUID, PK), `email` (String, Unique), `passwordHash` (String), `name` (String), `role` (Role Enum: `FRONT_DESK` | `PROVIDER`), `createdAt` (DateTime), `updatedAt` (DateTime).

2. **`Provider`**:
   - `id` (UUID, PK), `userId` (UUID, FK -> User, Unique), `specialty` (String), `department` (String), `phone` (String?), `createdAt` (DateTime), `updatedAt` (DateTime).

3. **`AppointmentSlot`**:
   - `id` (UUID, PK), `providerId` (UUID, FK -> Provider), `date` (String `YYYY-MM-DD`), `startTime` (String `HH:mm`), `endTime` (String `HH:mm`), `duration` (Int), `isBooked` (Boolean), `isArchived` (Boolean), `createdAt` (DateTime), `updatedAt` (DateTime).

4. **`Appointment`**:
   - `id` (UUID, PK), `slotId` (UUID, FK -> AppointmentSlot, Unique), `schedulingProviderId` (UUID, FK -> Provider), `patientName` (String), `patientEmail` (String), `patientPhone` (String), `reasonForVisit` (String), `status` (Status Enum: `Requested` | `Confirmed` | `CheckedIn` | `Completed` | `NoShow` | `Cancelled`), `cancellationReason` (String?), `cancelledAt` (DateTime?), `cancelledById` (UUID?), `checkedInAt` (DateTime?), `completedAt` (DateTime?), `createdAt` (DateTime), `updatedAt` (DateTime).

5. **`SupportingProvider`**:
   - `id` (UUID, PK), `appointmentId` (UUID, FK -> Appointment), `providerId` (UUID, FK -> Provider), `assignedAt` (DateTime), `assignedById` (UUID, FK -> User).

6. **`VisitNote`**:
   - `id` (UUID, PK), `appointmentId` (UUID, FK -> Appointment), `providerId` (UUID, FK -> Provider), `content` (Text), `createdAt` (DateTime), `updatedAt` (DateTime).

7. **`AppointmentTimeline`**:
   - `id` (UUID, PK), `appointmentId` (UUID, FK -> Appointment), `userId` (UUID, FK -> User), `actionType` (ActionType Enum), `oldValue` (Text?), `newValue` (Text?), `timestamp` (DateTime).

8. **`AlertDismissal`**:
   - `id` (UUID, PK), `appointmentId` (UUID, FK -> Appointment), `userId` (UUID, FK -> User), `alertType` (AlertType Enum: `UNCONFIRMED_24H` | `UNCONFIRMED_1H`), `dismissedAt` (DateTime).

---

### Which relationships are one-to-many, and which are many-to-many?

- **One-to-One (1:1)**:
  - `User` ↔ `Provider` (One user account links to one doctor profile).
  - `AppointmentSlot` ↔ `Appointment` (One slot holds exactly one appointment).
- **One-to-Many (1:M)**:
  - `Provider` → `AppointmentSlot` (One doctor has many availability slots).
  - `Provider` → `Appointment` (One primary doctor has many scheduled appointments).
  - `Appointment` → `VisitNote` (One appointment has many clinical visit notes).
  - `Appointment` → `AppointmentTimeline` (One appointment has many audit logs).
  - `Appointment` → `AlertDismissal` (One appointment has multiple alert dismissals).
- **Many-to-Many (M:N)**:
  - `Appointment` ↔ `Provider` (Multi-provider Care Team via `SupportingProvider` join table with `@@unique([appointmentId, providerId])`).

---

### Which constraints are enforced by the database, and which by application code — and why did you draw the line there?

- **Database-Enforced**:
  - Uniqueness (`User.email`, `Appointment.slotId`, `[appointmentId, providerId]`).
  - Foreign key referential integrity with cascade deletes.
  - Native Enum value constraints (`Role`, `AppointmentStatus`, `TimelineActionType`, `AlertType`).
- **Application-Enforced (Code)**:
  - **Finite State Machine transitions** (`Requested` → `Confirmed` → `CheckedIn` → `Completed`).
  - **Time-based rules** (`NoShow` rejected if current time is before slot start time).
  - **Locking rules** (cancellation prohibited after `CheckedIn`; editing locked once slot is booked).
  - **Author-only editing** (only the note author can edit `VisitNote.content`).
- **Why draw the line here?**: 
  - The database handles hard relational integrity and deduplication.
  - The application layer handles complex time calculations, multi-step state transitions, and role authorization where returning friendly JSON error messages is essential.

---

### What did i deliberately denormalise?

1. **`Appointment.schedulingProviderId`**: 
   - Even though the doctor ID can be found via `Appointment -> Slot -> Provider`, I stored `schedulingProviderId` directly on the `Appointment` table. This allows fast direct filtering and indexing on provider appointments without an expensive SQL JOIN on slots.
2. **`AppointmentSlot.duration`**: 
   - Stored alongside `startTime` and `endTime` so slot generation and CSV export don't need to compute minutes from time strings on every request.

---

### What would break first if this had 100x the data?

1. **Dashboard Analytics & Moving No-Show Calculation**:
   - The 8-week moving no-show rate currently queries and calculates statistics dynamically across all past appointments in real-time. At 100x scale (hundreds of thousands of appointments), this would slow down and require pre-computed daily summary rollup tables or a Redis cache.
2. **Dynamic 24h/1h Alert Queries**:
   - The alert engine evaluates string date/time comparisons across all `Requested` appointments on every request. At 100x scale, this would be moved to a background worker queue (e.g. BullMQ / pg_cron) rather than on-demand endpoint calculation.
