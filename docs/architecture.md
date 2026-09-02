# System Architecture — Clinic Appointment Scheduling System

## 1. Executive Architecture Overview

The **CareSync Clinic Appointment Scheduling System** is built upon a modern, layered, decoupled client-server architecture designed for high throughput, strict clinical data integrity, role-based access control (RBAC), and regulatory compliance (audit trails and author-locked notes).

```
┌───────────────────────────────────────────────────────────────────────────┐
│                           Client Presentation Tier                        │
│             React 18 + Vite + React Router DOM + Tailwind CSS             │
│   (Role-Based UI Guards, Real-time Alerts Polling, Recharts Analytics)   │
└─────────────────────────────────────▲─────────────────────────────────────┘
                                      │ HTTPS / REST JSON
                                      ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                            API Gateway & Routing                          │
│                Express.js Router + Morgan + CORS + Body Parsers           │
└─────────────────────────────────────▲─────────────────────────────────────┘
                                      │
┌─────────────────────────────────────▼─────────────────────────────────────┐
│                           Security & Middleware Tier                      │
│     JWT Auth Guards ──► RBAC Authorizer ──► Zod Schema Validator ──► ...  │
└─────────────────────────────────────▲─────────────────────────────────────┘
                                      │
┌─────────────────────────────────────▼─────────────────────────────────────┐
│                           Domain Services Tier                            │
│  ┌───────────────────────┐ ┌───────────────────────┐ ┌──────────────────┐ │
│  │ State Machine Engine  │ │  Care Team Manager    │ │ Alert Engine     │ │
│  ├───────────────────────┤ ├───────────────────────┤ ├──────────────────┤ │
│  │ Bulk Slot Generator   │ │  Audit Ledger Logger  │ │ CSV Exporter     │ │
│  └───────────────────────┘ └───────────────────────┘ └──────────────────┘ │
└─────────────────────────────────────▲─────────────────────────────────────┘
                                      │
┌─────────────────────────────────────▼─────────────────────────────────────┐
│                             Data Access Tier                              │
│                    Prisma ORM (Data Layer & Client)                       │
└─────────────────────────────────────▲─────────────────────────────────────┘
                                      │ Connection Pooling
                                      ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                           Persistence Database                            │
│           PostgreSQL (Production Supabase/Render) / SQLite (Dev)          │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Layer Responsibilities

### 2.1 Presentation Tier (`frontend/`)
- **Single Page Application (SPA)**: Built with React 18 and Vite for lightning-fast HMR and bundle optimization.
- **Role-Gated Routing**: Routes are wrapped in `<ProtectedRoute allowedRoles={...} />` to restrict views according to authenticated role claims.
- **Client State & Context**: `AuthContext` provides central session persistence, role helpers (`isFrontDesk`, `isProvider`), and token lifecycle management.
- **Visual Analytics**: Interactive Recharts components render real-time breakdowns of provider workloads, appointment status distributions, and 8-week moving no-show rates.

### 2.2 API & Middleware Tier (`backend/src/middleware/`)
- **`authMiddleware.ts`**:
  - `authenticateJwt`: Validates Bearer token signatures, checks expiration, and retrieves authenticated user entity.
  - `authorizeRoles(...)`: Enforces role-based gates (`FRONT_DESK`, `PROVIDER`).
- **`validatorMiddleware.ts`**: Validates request payloads and query parameters using declarative **Zod** schemas before reaching controllers.
- **`errorHandler.ts`**: Centralized exception handler mapping domain errors, Prisma unique constraint errors (`P2002`), and 404s to standard structured JSON responses.

### 2.3 Domain Services Tier (`backend/src/services/`)
- **`appointmentService.ts`**: Implements server-side search, filtering, pagination, provider reassignment, care team assignments, and invokes the finite state machine for transitions.
- **`stateMachine.ts`**: Finite state machine validating status transitions, time-checks for `NoShow`, check-in locks for cancellations, and reason enforcements.
- **`scheduleService.ts`**: Handles bulk recurring slot generation with automated collision avoidance and RFC 4180 CSV daily schedule streaming.
- **`alertService.ts`**: 24-hour warning alert detection and 1-hour reappearing critical alert logic with dismissal tracking.
- **`visitNoteService.ts`**: Enforces author-only note editing restrictions and chronological sequencing.
- **`timelineService.ts`**: Append-only immutable transaction ledger.

---

## 3. Security & Access Control Model (RBAC)

| Resource / Capability | Front Desk | Provider | Authorization Enforcement |
| :--- | :---: | :---: | :--- |
| **View Appointments** | All | Own + Supporting | Scoped server-side query in `appointmentService` |
| **Create Availability Slots** | Any Provider | Own Only | Verified against `req.user.providerId` |
| **Edit Unbooked Slots** | Allowed | Own Only | Verified unbooked + provider ownership |
| **Reassign Provider** | Allowed | Denied (403) | `requireFrontDesk` middleware |
| **Confirm Appointment** | Allowed | Care Team | State Machine validation |
| **Check In Patient** | Allowed | Care Team | State Machine validation |
| **Cancel Appointment** | Allowed | Care Team | Before CheckIn + required reason |
| **Manage Unconfirmed Alerts** | Allowed | Denied (403) | `requireFrontDesk` middleware |
| **Author Visit Notes** | Denied (403) | Care Team Only | Verified provider belongs to care team |
| **Edit Visit Notes** | Denied (403) | Author Only | Verified `req.user.providerId === note.providerId` |
| **Audit Timeline** | Read-Only | Read-Only | Append-only (No edit/delete endpoints exist) |

---

## 4. State Machine Transition Graph

```
                   ┌──────────────┐
                   │  Requested   │◄──────────────┐ (Slot Booked)
                   └──────┬───────┘               │
                          │ Confirm               │
                          ▼                       │
                   ┌──────────────┐               │
            ┌─────►│  Confirmed   │               │
            │      └──────┬───────┘               │
            │             │                       │
   NoShow   │             │ Check In              │
 (if time   │             ▼                       │
  passed)   │      ┌──────────────┐               │ Cancel
            └─────►│  CheckedIn   │               │ (Before CheckIn
                   └──────┬───────┘               │  + Reason req.)
                          │ Complete              │
                          ▼                       ▼
                   ┌──────────────┐        ┌──────────────┐
                   │  Completed   │        │  Cancelled   │
                   └──────────────┘        └──────────────┘
                       (Final)                 (Final)
```
