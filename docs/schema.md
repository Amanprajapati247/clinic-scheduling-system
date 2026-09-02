# Database Schema & Entity Relationships

## 1. Entity-Relationship Diagram (ERD)

```
┌─────────────────┐       1:1       ┌──────────────────┐
│      User       ├────────────────►│     Provider     │
└────────┬────────┘                 └─────────┬────────┘
         │                                    │
         │ 1:M                                │ 1:M (Slots)
         ▼                                    ▼
┌─────────────────┐       1:1       ┌──────────────────┐
│ AlertDismissal  │                 │ AppointmentSlot  │
└─────────────────┘                 └─────────┬────────┘
         │                                    │ 1:1 (When Booked)
         │ M:1                                ▼
         │                          ┌──────────────────┐
         └─────────────────────────►│   Appointment    │◄───────────┐
                                    └─────────┬────────┘            │
                                              │                     │
                      ┌───────────────────────┼──────────────────┐  │ M:1
                      │ 1:M                   │ 1:M              │ 1:M
                      ▼                       ▼                  ▼  │
             ┌─────────────────┐     ┌─────────────────┐  ┌─────────┴─────────┐
             │    VisitNote    │     │  TimelineLog    │  │ SupportingProvider│
             └─────────────────┘     └─────────────────┘  └───────────────────┘
```

---

## 2. Table Specifications & Data Dictionary

### 2.1 `User`
Stores system accounts with hashed passwords and role designations.
- `id` (UUID, Primary Key)
- `email` (VARCHAR, Unique, Indexed)
- `passwordHash` (VARCHAR, Bcrypt 10-round hash)
- `name` (VARCHAR)
- `role` (ENUM / VARCHAR: `FRONT_DESK`, `PROVIDER`, Indexed)
- `createdAt` (TIMESTAMP, Default `now()`)
- `updatedAt` (TIMESTAMP, Auto-update)

### 2.2 `Provider`
Extended profile for clinical providers.
- `id` (UUID, Primary Key)
- `userId` (UUID, Foreign Key -> `User.id`, Unique, Cascade Delete)
- `specialty` (VARCHAR, Indexed)
- `department` (VARCHAR, Indexed)
- `phone` (VARCHAR, Optional)
- `createdAt` (TIMESTAMP)
- `updatedAt` (TIMESTAMP)

### 2.3 `AppointmentSlot`
Availability windows offered by providers.
- `id` (UUID, Primary Key)
- `providerId` (UUID, Foreign Key -> `Provider.id`, Cascade Delete)
- `date` (VARCHAR `YYYY-MM-DD`, Composite Index with `providerId`)
- `startTime` (VARCHAR `HH:mm`)
- `endTime` (VARCHAR `HH:mm`)
- `duration` (INT, Duration in minutes)
- `isBooked` (BOOLEAN, Default `false`, Indexed with `isArchived`)
- `isArchived` (BOOLEAN, Default `false`)
- `createdAt` (TIMESTAMP)
- `updatedAt` (TIMESTAMP)

### 2.4 `Appointment`
Clinical encounter booked on a specific slot.
- `id` (UUID, Primary Key)
- `slotId` (UUID, Foreign Key -> `AppointmentSlot.id`, Unique, Cascade Delete)
- `schedulingProviderId` (UUID, Foreign Key -> `Provider.id`, Indexed)
- `patientName` (VARCHAR, Indexed for fast autocomplete)
- `patientEmail` (VARCHAR)
- `patientPhone` (VARCHAR)
- `reasonForVisit` (TEXT)
- `status` (ENUM / VARCHAR: `Requested`, `Confirmed`, `CheckedIn`, `Completed`, `NoShow`, `Cancelled`, Indexed)
- `cancellationReason` (TEXT, Optional)
- `cancelledAt` (TIMESTAMP, Optional)
- `cancelledById` (UUID, Optional)
- `checkedInAt` (TIMESTAMP, Optional)
- `completedAt` (TIMESTAMP, Optional)
- `createdAt` (TIMESTAMP)
- `updatedAt` (TIMESTAMP)

### 2.5 `SupportingProvider` (Join Table)
Many-to-Many relationship between appointments and clinical care team consultants.
- `id` (UUID, Primary Key)
- `appointmentId` (UUID, Foreign Key -> `Appointment.id`, Cascade Delete)
- `providerId` (UUID, Foreign Key -> `Provider.id`, Cascade Delete)
- `assignedAt` (TIMESTAMP, Default `now()`)
- `assignedById` (UUID, Foreign Key -> `User.id`, Optional)
- **Constraint**: Unique Compound Key `@@unique([appointmentId, providerId])`

### 2.6 `VisitNote`
Longitudinal encounter progress notes.
- `id` (UUID, Primary Key)
- `appointmentId` (UUID, Foreign Key -> `Appointment.id`, Cascade Delete, Indexed)
- `providerId` (UUID, Foreign Key -> `Provider.id`, Cascade Delete, Indexed)
- `content` (TEXT)
- `createdAt` (TIMESTAMP, Default `now()`)
- `updatedAt` (TIMESTAMP, Auto-update)

### 2.7 `AppointmentTimeline` (Append-Only Audit Ledger)
Immutable audit trail capturing all critical actions.
- `id` (UUID, Primary Key)
- `appointmentId` (UUID, Foreign Key -> `Appointment.id`, Cascade Delete, Indexed)
- `userId` (UUID, Foreign Key -> `User.id`, Cascade Delete)
- `actionType` (VARCHAR: `APPOINTMENT_CREATED`, `STATUS_CHANGE`, `SUPPORTING_PROVIDER_ADDED`, `SUPPORTING_PROVIDER_REMOVED`, `CANCELLATION`, `VISIT_NOTE_CREATED`, `APPOINTMENT_REASSIGNED`)
- `oldValue` (TEXT, Optional)
- `newValue` (TEXT, Optional)
- `timestamp` (TIMESTAMP, Default `now()`, Composite Index with `appointmentId`)

### 2.8 `AlertDismissal`
Tracks front desk alert dismissals for 24-hour and 1-hour notifications.
- `id` (UUID, Primary Key)
- `appointmentId` (UUID, Foreign Key -> `Appointment.id`, Cascade Delete, Composite Index with `alertType`)
- `userId` (UUID, Foreign Key -> `User.id`, Cascade Delete)
- `alertType` (VARCHAR: `UNCONFIRMED_24H`, `UNCONFIRMED_1H`)
- `dismissedAt` (TIMESTAMP, Default `now()`)
