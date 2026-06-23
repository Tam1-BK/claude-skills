# Sterling Edge Operations OS — Deployment Guide

## What you get after following this guide

- A live public URL (e.g. `https://sterling-edge-ops.vercel.app`)
- PostgreSQL database on Neon (free tier) or Supabase (free tier)
- Demo data pre-loaded (5 clients, 6 tenders, 4 contracts, users)
- Logins working out of the box

Estimated time: **15 minutes**

---

## Prerequisites

- A GitHub account (repo already exists)
- A Vercel account — free at [vercel.com](https://vercel.com)
- A Neon **or** Supabase account — both free

---

## Step 1 — Set up the database

Choose **one** of the two options below.

---

### Option A — Neon (recommended)

1. Go to [neon.tech](https://neon.tech) and sign up / log in.
2. Click **New Project**.
3. Name it `sterling-edge-ops`, choose your nearest region, click **Create project**.
4. Once created, click **Connection Details** in the left sidebar.
5. In the **Connection string** dropdown, select **Prisma**.
6. Copy the connection string. It looks like:
   ```
   postgresql://alex:password@ep-cool-fog-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
7. Save this string — you'll paste it into Vercel in Step 3.

---

### Option B — Supabase

1. Go to [supabase.com](https://supabase.com) and sign up / log in.
2. Click **New project**, fill in name and database password, click **Create new project**.
3. Wait ~2 minutes for provisioning.
4. Go to **Settings → Database**.
5. Scroll to **Connection string → URI**.
6. Copy the URI. It uses port `5432` (not 6543). It looks like:
   ```
   postgresql://postgres:YourPassword@db.abcdefgh.supabase.co:5432/postgres
   ```
7. Save this string — you'll paste it into Vercel in Step 3.

---

## Step 2 — Connect the repo to Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and click **Import Git Repository**.
2. Connect your GitHub account if prompted.
3. Find and select the `claude-skills` repository.
4. When asked for the **Root Directory**, type: `sterling-edge-ops`
5. Click **Continue** — Vercel will detect Next.js automatically.
6. **Do not deploy yet** — set environment variables first (Step 3).

---

## Step 3 — Set environment variables in Vercel

In the Vercel project setup screen, click **Environment Variables** and add these three:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | The connection string you copied in Step 1 |
| `NEXTAUTH_SECRET` | A random 32-character secret (see below) |
| `NEXTAUTH_URL` | `https://your-project-name.vercel.app` *(fill in after first deploy — see note)* |

**Generating `NEXTAUTH_SECRET`:**

You can use any of these methods:
- Open your browser console (F12 → Console) and run:
  ```javascript
  btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(24))))
  ```
- Or use [generate-secret.vercel.app](https://generate-secret.vercel.app) (Vercel's official tool)
- Or use [random.js.org](https://random.js.org) base64 random string generator

**About `NEXTAUTH_URL`:**

On the very first deploy you won't know the URL yet. Set it temporarily to `https://placeholder.vercel.app` and update it after the first deploy succeeds. Alternatively, set it to your custom domain if you have one.

Click **Deploy**.

---

## Step 4 — Wait for the build

Vercel will:
1. Install dependencies (`npm ci`)
2. Generate the Prisma client
3. Push the database schema (`prisma db push`) — creates all tables
4. Check if the database is empty — if yes, load demo seed data automatically
5. Build the Next.js app

The build takes about **2–4 minutes** on first run.

When it says **"Congratulations! Your project has been deployed"**, click **Visit** to open the live app.

---

## Step 5 — Update NEXTAUTH_URL

1. In Vercel → your project → **Settings → Environment Variables**
2. Find `NEXTAUTH_URL` and edit the value to your real deployment URL, e.g.:
   `https://sterling-edge-ops.vercel.app`
3. Go to **Deployments** and click **Redeploy** → **Redeploy** (no changes needed, just to pick up the updated env var).

---

## Step 6 — Log in

Visit your live URL and log in with any demo credential:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@sterlingedge.co.ke | Admin@2024 |
| Director | director@sterlingedge.co.ke | User@2024 |
| Procurement Officer | procurement@sterlingedge.co.ke | User@2024 |
| Finance Officer | finance@sterlingedge.co.ke | User@2024 |

---

## Troubleshooting

### Build fails: "Can't reach database server"
- Check that `DATABASE_URL` is set correctly in Vercel env vars.
- For Neon: ensure you copied the Prisma connection string (includes `?sslmode=require`).
- For Supabase: use port `5432`, not `6543`.

### "NEXTAUTH_SECRET is not set"
- Add `NEXTAUTH_SECRET` in Vercel → Settings → Environment Variables, then redeploy.

### App loads but login fails
- Make sure `NEXTAUTH_URL` matches the exact URL you are visiting (including `https://`).
- Redeploy after updating `NEXTAUTH_URL`.

### Seed data missing (blank dashboard)
- This happens if the first build failed before the seed step.
- Trigger a new deployment in Vercel → Deployments → Redeploy.
- The seed check runs on every build and seeds automatically if the database is empty.

### "Table does not exist" error
- The `prisma db push` step may have failed.
- Check Vercel build logs. If you see a DB error there, fix the `DATABASE_URL` and redeploy.

---

## Redeployment behaviour

Every time you push a new commit to GitHub, Vercel rebuilds automatically. The seed step is safe to run on every build — it checks the user count first and skips seeding if data already exists.

---

## How to reset demo data

To wipe and re-seed:

1. In your Neon or Supabase dashboard, go to the database and run:
   ```sql
   DROP SCHEMA public CASCADE;
   CREATE SCHEMA public;
   ```
2. Trigger a new Vercel deployment — `db push` will recreate the schema and the seed will run again.

---

## Custom domain (optional)

1. Vercel → your project → **Settings → Domains**
2. Add your domain, follow the DNS instructions (add a CNAME record at your registrar)
3. Update `NEXTAUTH_URL` to `https://yourdomain.com`
4. Redeploy

---

## Environment variables reference

See `.env.production.example` for the full list with explanations and example values.

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string from Neon or Supabase |
| `NEXTAUTH_SECRET` | Yes | Random 32-byte base64 string for JWT signing |
| `NEXTAUTH_URL` | Yes | Full public URL of your deployment |

---

## Architecture notes (for developers)

- **Framework:** Next.js 14 (App Router), TypeScript
- **Styling:** Tailwind CSS + Radix UI
- **Database:** PostgreSQL via Prisma ORM
- **Auth:** NextAuth.js with JWT session strategy
- **Build:** `vercel.json` overrides Vercel's default build command to run schema push + seed before `next build`
- **Seed logic:** `prisma/seed-if-empty.ts` — checks `user.count()` and only seeds on an empty database. Safe on every redeploy.
- **No Docker required** for Vercel deployment — Docker setup is available separately in `docker-compose.yml` for self-hosted VPS deployments.

---

## Handing off to a developer

Give them this checklist:

- [ ] GitHub repo access (add them as collaborator)
- [ ] Vercel project access (invite via Vercel team or share credentials)
- [ ] Neon or Supabase project access (share project or rotate and share credentials)
- [ ] The three env vars: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- [ ] This `DEPLOYMENT.md` file
- [ ] `.env.production.example` for reference

The developer does **not** need to run anything locally to get the app live. All setup happens through web dashboards and Vercel's build pipeline.
