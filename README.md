# CareSync — Clinic Appointment Scheduling System

> Complete, production-ready Full Stack Clinic Appointment Scheduling & Management Platform built with React, Node.js, Express, Prisma ORM, PostgreSQL / SQLite, JWT, and Tailwind CSS.

---

## 🌟 Key Highlights

1. **Role-Based Access Control (RBAC)**: Enforced strictly at the database, backend service layer, and frontend UI for `FRONT_DESK` and `PROVIDER` roles.
2. **Server-Side Finite State Machine**: Strict status transitions (`Requested` → `Confirmed` → `CheckedIn` → `Completed`; `NoShow` strictly after scheduled start time; Cancellation strictly before `CheckedIn` with mandatory reason).
3. **Multi-Provider Care Teams (M:N)**: Primary scheduling provider with collaborative supporting consultants.
4. **Author-Locked Clinical Visit Notes**: Notes can only be edited by the originating author provider.
5. **Append-Only Immutable Audit Timeline**: Complete ledger tracking all state changes, cancellations, care team assignments, and note creations with historical diffs.
6. **Bulk Recurring Availability Generator**: Batch slot generation with automated collision avoidance.
7. **Daily Schedule CSV Exporter**: One-click RFC 4180 CSV export formatted with Patient, Provider, Status, Start Time, and Duration.
8. **Real-time 24h Warning & 1h Reappearing Urgent Alerts**: Alerts for unconfirmed requested appointments, with automatic 1-hour reappearance after early dismissal.
9. **Executive Analytics Dashboard**: Real-time KPI metrics, provider workload breakdown, status donut chart, and 8-week moving no-show rate analytics.
10. **Rich Seed Data & Demo Accounts**: 2 Front Desk accounts, 5 Providers, 50 Appointments, Care Teams, Notes, and Timelines pre-populated.

---

## 🚀 Quick Start

### 1. Backend
```bash
cd backend
npm install
npm run db:setup
npm run dev
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

### 3. Run Automated Domain Test Suite
```bash
cd backend
npx tsx test-suite.ts
```

---

## 🔑 Demo Logins
- **Front Desk Lead**: `frontdesk@example.com` / `Password123`
- **Clinical Provider**: `provider@example.com` / `Password123`

---

## 📚 Complete Documentation
- [System Architecture](file:///C:/Users/amanp/.gemini/antigravity/scratch/clinic-scheduling-system/docs/architecture.md)
- [Database Schema & ERD](file:///C:/Users/amanp/.gemini/antigravity/scratch/clinic-scheduling-system/docs/schema.md)
- [Development Plan](file:///C:/Users/amanp/.gemini/antigravity/scratch/clinic-scheduling-system/docs/plan.md)
- [Architecture Decision Records (ADRs)](file:///C:/Users/amanp/.gemini/antigravity/scratch/clinic-scheduling-system/docs/decisions.md)
- [AI Prompts Used](file:///C:/Users/amanp/.gemini/antigravity/scratch/clinic-scheduling-system/docs/ai-prompts.md)
- [Executive Submission Document](file:///C:/Users/amanp/.gemini/antigravity/scratch/clinic-scheduling-system/SUBMISSION.md)
