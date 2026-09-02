# Complete Clinic Appointment Scheduling System — Submission Overview

## 🌟 Executive Summary
CareSync is a production-grade, enterprise-ready full-stack Clinic Appointment Scheduling System designed to streamline clinical workflows, enforce medical data integrity, facilitate multi-provider care teams, and provide executive analytics.

---

## 🔑 Demo Personas & Credentials

| Role | Email | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| **Front Desk Lead** | `frontdesk@example.com` | `Password123` | Full slot creation, provider reassignments, alert management, confirming/cancelling bookings. |
| **Front Desk Coordinator** | `frontdesk2@example.com` | `Password123` | Reception coordination, appointment check-ins, alert review. |
| **Dr. Gregory House** | `provider@example.com` | `Password123` | Primary Provider (Diagnostic Medicine), author-locked notes, personal schedule & CSV export. |
| **Dr. James Wilson** | `provider2@example.com` | `Password123` | Oncology Provider & Care Team Consultant. |
| **Dr. Lisa Cuddy** | `provider3@example.com` | `Password123` | Endocrinology & Outpatient Care. |
| **Dr. Robert Chase** | `provider4@example.com` | `Password123` | Critical Care Services & Surgery. |
| **Dr. Allison Cameron** | `provider5@example.com` | `Password123` | Immunology & Infectious Disease. |

> [!TIP]
> The login screen features **1-Click Demo Buttons** to instantly log into either the Front Desk or Provider portals without manual typing.

---

## 🚀 Quick Start Guide (Local Execution)

### Prerequisites
- Node.js (v18+)
- npm

### 1. Backend Setup
```bash
cd backend
npm install
npm run prisma:generate
npm run db:setup     # Applies database schema and seeds 50 appointments with care teams, visit notes, and audit timelines
npm run dev          # Starts Express backend on http://localhost:5000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev          # Starts Vite React dev server on http://localhost:5173
```

### 3. Run Automated Domain Test Suite
```bash
cd backend
npx tsx test-suite.ts
```

---

## 🌐 Production Deployment Guide

### A. Database Deployment (Supabase PostgreSQL)
1. Create a new PostgreSQL project on [Supabase](https://supabase.com).
2. Copy the Connection String from Project Settings -> Database (URI format).
3. In `backend/prisma/schema.prisma`, update provider to `postgresql` (or use `backend/prisma/schema.postgresql.prisma`).
4. Set `DATABASE_URL` in your environment.
5. Run `npx prisma db push && npx tsx prisma/seed.ts`.

### B. Backend Deployment (Render)
1. Connect your GitHub repository to [Render](https://render.com).
2. Create a new **Web Service** pointing to the `backend/` directory.
3. Configure settings:
   - **Environment**: Node
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npm start`
4. Set Environment Variables:
   - `DATABASE_URL`: Your Supabase connection URI
   - `JWT_SECRET`: Secure 64-character string
   - `NODE_ENV`: `production`
   - `CORS_ORIGIN`: Your Vercel frontend URL

### C. Frontend Deployment (Vercel)
1. Import the repository in [Vercel](https://vercel.com).
2. Set Root Directory to `frontend`.
3. Framework Preset: `Vite`.
4. Environment Variable:
   - `VITE_API_URL`: `https://your-render-backend.onrender.com/api`
5. Click **Deploy**.

---

## 📡 REST API Catalogue

### Authentication (`/api/auth`)
- `POST /api/auth/register`: Register new user account.
- `POST /api/auth/login`: Authenticate and receive JWT.
- `GET /api/auth/me`: Get current authenticated profile.
- `GET /api/auth/providers`: List all registered providers.

### Appointments (`/api/appointments`)
- `GET /api/appointments`: Server-side search, multi-parameter filter, sort, and paginate appointments.
- `GET /api/appointments/:id`: Retrieve single appointment with slot, care team, notes, and audit timeline.
- `POST /api/appointments`: Book an available slot into an appointment (`Requested` status).
- `PATCH /api/appointments/:id/status`: Update status via Finite State Machine.
- `POST /api/appointments/:id/cancel`: Cancel appointment (requires reason; forbidden if CheckedIn).
- `POST /api/appointments/:id/reassign`: Reassign appointment to another provider (Front Desk only).
- `POST /api/appointments/:id/supporting-providers`: Add consultant to care team.
- `DELETE /api/appointments/:id/supporting-providers/:providerId`: Remove consultant from care team.

### Availability Slots (`/api/slots`)
- `GET /api/slots`: List availability slots with provider, date, booked, and archived filters.
- `POST /api/slots`: Create single availability slot.
- `PATCH /api/slots/:id`: Edit unbooked slot.
- `PATCH /api/slots/:id/archive`: Soft-archive slot.
- `PATCH /api/slots/:id/restore`: Restore archived slot.

### Schedules & CSV Export (`/api/schedule`)
- `POST /api/schedule/bulk-generate`: Generate recurring slots across weekly schedules with collision skipping.
- `GET /api/schedule/export-csv`: Stream RFC 4180 Daily Schedule CSV.

### Clinical Visit Notes (`/api/notes`)
- `GET /api/notes/appointment/:appointmentId`: List chronological notes.
- `POST /api/notes/appointment/:appointmentId`: Author new note (Providers on care team).
- `PATCH /api/notes/:noteId`: Update note (**Strictly locked to author provider**).

### Immutable Audit Timeline (`/api/timeline`)
- `GET /api/timeline/:appointmentId`: Retrieve append-only audit trail.

### Alerts Engine (`/api/alerts`)
- `GET /api/alerts`: List active 24h warning and 1h reappearing unconfirmed alerts (Front Desk).
- `POST /api/alerts/dismiss`: Dismiss alert record.

### Analytics Dashboard (`/api/dashboard`)
- `GET /api/dashboard/metrics`: Aggregate real-time statistics, provider workloads, status distribution, and 8-week no-show rates.
