# Step-by-Step Production Deployment Guide

Deploy the **CareSync Clinic Appointment Scheduling System** across the target production cloud architecture:
- **Database**: Supabase PostgreSQL
- **Backend API**: Render Web Service
- **Frontend SPA**: Vercel

---

## 🏗️ Architecture Matrix

| Component | Platform | Configuration File | Key Environment Variables |
| :--- | :--- | :--- | :--- |
| **Database** | Supabase | `prisma/schema.postgresql.prisma` | Port 5432 / 6543 Pooler URI |
| **Backend** | Render | `backend/render.yaml` / `Dockerfile` | `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `PORT=5000` |
| **Frontend** | Vercel | `frontend/vercel.json` | `VITE_API_URL` |

---

## 📦 Step 1: Deploy Supabase PostgreSQL Database

1. Navigate to **[supabase.com](https://supabase.com)** and sign in (or create a free account).
2. Click **New Project**:
   - **Name**: `clinic-scheduling-db`
   - **Database Password**: Choose a strong password (save this securely).
   - **Region**: Select the region closest to your Render deployment (e.g., US East / EU Central).
3. Once the database is provisioned (approx. 1-2 minutes):
   - Go to **Project Settings** -> **Database**.
   - Scroll to **Connection string** and select **URI**.
   - Copy the URI string:
     ```text
     postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
     ```
   - Replace `[YOUR-PASSWORD]` with your actual database password.

---

## ⚙️ Step 2: Deploy Backend to Render

1. Sign in to **[render.com](https://render.com)**.
2. Ensure your project repository is pushed to **GitHub** or **GitLab**.
3. Click **New +** -> **Web Service**.
4. Connect your GitHub repository.
5. Configure the service settings:
   - **Name**: `clinic-scheduling-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**:
     ```bash
     npm install && npm run db:switch:postgres && npm run build
     ```
   - **Start Command**:
     ```bash
     npx prisma db push && npm start
     ```
   - **Instance Type**: `Free`
6. Add the following **Environment Variables** in Render Dashboard -> **Environment**:
   - `NODE_ENV`: `production`
   - `PORT`: `5000`
   - `DATABASE_URL`: `[YOUR_SUPABASE_POSTGRESQL_CONNECTION_URI]`
   - `JWT_SECRET`: `[ANY_SECURE_RANDOM_64_CHAR_STRING]`
   - `JWT_EXPIRES_IN`: `7d`
   - `CORS_ORIGIN`: `*` (or your Vercel URL once generated in Step 3)
7. Click **Create Web Service**.
8. Render will build and deploy the backend.
   - Once deployed, copy your Render URL: e.g. `https://clinic-scheduling-backend.onrender.com`.
   - Test health check: `https://clinic-scheduling-backend.onrender.com/api/health` (should return `{ "status": "healthy" }`).

---

## 🖥️ Step 3: Deploy Frontend to Vercel

1. Sign in to **[vercel.com](https://vercel.com)**.
2. Click **Add New...** -> **Project**.
3. Import your GitHub repository.
4. Configure project settings:
   - **Project Name**: `clinic-scheduling-frontend`
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click *Edit* and choose `frontend`.
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Expand **Environment Variables**:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://clinic-scheduling-backend.onrender.com/api` (Use your actual Render backend URL with `/api` suffix)
6. Click **Deploy**.
7. Vercel will build the frontend and provide your live production domain: e.g. `https://clinic-scheduling-frontend.vercel.app`.

---

## 🌱 Step 4: Seed Production Database

To populate the 50 realistic demo appointments, 5 clinical providers, care teams, visit notes, and audit timelines in your Supabase PostgreSQL database:

Run the seed script from your local terminal with the Supabase connection string:

```powershell
cd C:\Users\amanp\.gemini\antigravity\scratch\clinic-scheduling-system\backend

# 1. Switch schema to Postgres
npm run db:switch:postgres

# 2. Push schema and seed
$env:DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
npx prisma db push
npx tsx prisma/seed.ts
```

Output:
```text
--- Starting Database Seeding ---
Created 2 Front Desk Users.
Created 5 Clinical Providers.
Successfully created 50 Appointments with Slots, Care Teams, Notes, and Timelines.
--- Database Seeding Complete ---
```

---

## 🔒 Step 5: Final Security & CORS Lockdown

1. In Render Dashboard for `clinic-scheduling-backend`:
   - Update `CORS_ORIGIN` to your exact Vercel frontend URL: e.g. `https://clinic-scheduling-frontend.vercel.app`.
   - Click **Save Changes** (Render will automatically redeploy with CORS restricted to your frontend).
2. Open your Vercel URL in your browser:
   - Test login with `frontdesk@example.com` / `Password123`
   - Test login with `provider@example.com` / `Password123`
   - Verify Appointments table, Status transitions, Care Teams, Notes, and CSV Export.

---

## 🛠️ Production Troubleshooting Checklist

| Issue | Cause | Fix |
| :--- | :--- | :--- |
| **Direct page reload gives 404 on Vercel** | SPA routing rewrite missing | Ensure `frontend/vercel.json` contains `{"rewrites": [{"source": "/(.*)", "destination": "/index.html"}]}` (already configured). |
| **CORS Blocked error in browser console** | `CORS_ORIGIN` mismatch on Render | Set `CORS_ORIGIN` in Render Environment Variables to match your Vercel domain or `*`. |
| **Prisma connection timeout** | Supabase connection pool exhaustion | Use the Supabase **Pooler** port (`6543` with `?pgbouncer=true`) instead of direct port `5432`. |
| **Cold start delay on Render** | Free tier spins down after 15m inactivity | Render free instances spin down when idle and wake up on the first request in ~30s. |
