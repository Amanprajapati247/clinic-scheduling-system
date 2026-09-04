# Plan


---

### How did you break the work into sessions?

I split the work across 4 focused sessions over 2 days:

1. **Session 1 (Data & Core API)**: Designed the Prisma database schema, JWT auth, and RBAC middleware guards.
2. **Session 2 (Business Logic & Testing)**: Implemented the finite state machine, bulk recurring slot generator, 24h/1h alert engine, and wrote the automated test suite.
3. **Session 3 (Frontend UI & Analytics)**: Built the React dashboard, Recharts visualizations, appointment management table, and clinical visit note editor.
4. **Session 4 (Deployment & Polish)**: Deployed to Supabase, Render, and Vercel, seeded the 50 demo records, and fixed cross-origin route compatibility.

---

### What order did you build in, and why that order?

- **Order**: Database Schema → Backend Services & State Machine → Automated Test Suite → Frontend React UI → Cloud Deployment.
- **Why**: 
  1. Starting with the database and state machine locked down the strict business rules (valid transitions, note locks, and care team relations) first.
  2. Writing the 28-point automated test suite before touching the frontend gave 100% confidence that the core logic was rock-solid before building UI forms around it.
  3. Building the UI on top of verified endpoints avoided endless back-and-forth debugging.

---

### What did i estimate versus what it actually took?

| Task | Estimated | Actual | Notes |
| :--- | :--- | :--- | :--- |
| **Schema & Auth** | 2 hours | 2.5 hours | Extra time spent configuring dual SQLite/PostgreSQL schema templates. |
| **State Machine & Services** | 3 hours | 4 hours | Edge case handling for `NoShow` time comparisons and 1h alert reappearance logic took longer than expected. |
| **Frontend UI & Charts** | 6 hours | 6.5 hours | Building custom Recharts tooltips and responsive modals took a bit of extra polish. |
| **Deployment & Seeding** | 2 hours | 3 hours | Debugging Render build scripts and base URL pathing added an hour. |
| **Total** | **~14 hours** | **~16 hours** | Spread across 2 days. |

---

### What did i cut when you ran short?

1. **WebSocket Real-Time Server**:
   - Dropped live socket connections in favor of fast on-demand polling to keep backend hosting simple and stateless on Render free tier.
2. **Patient Self-Registration Portal**:
   - Cut public patient signup to focus 100% of time on the core clinic staff and doctor workflow requirements.
3. **PDF Export for Invoices**:
   - Focused on the required RFC 4180 Daily Schedule CSV exporter instead of building a heavy PDF generator.
