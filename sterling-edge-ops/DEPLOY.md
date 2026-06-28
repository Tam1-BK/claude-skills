# Sterling Edge Operations OS — Deployment Guide

This guide covers every supported deployment path. Choose the one that matches how you want to run the system.

| Method | Best for | Requires |
|--------|---------|---------|
| [Vercel + Neon](#vercel--neon-recommended) | Cloud, no server, free tier | GitHub account |
| [Docker Compose](#docker-compose-self-hosted) | VPS or local server | Docker installed |
| [Railway](#railway) | Managed cloud, simple setup | GitHub account |
| [Render](#render) | Managed cloud | GitHub account |
| [DigitalOcean App Platform](#digitalocean-app-platform) | Managed cloud | GitHub account |

---

## Environment Variables

All deployment methods require these three variables. Set them **before** deploying.

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Yes | Random 32-byte secret for JWT signing |
| `NEXTAUTH_URL` | Yes | Full public URL of your deployed app |
| `UPSTASH_REDIS_REST_URL` | No | Upstash Redis REST URL (distributed rate limiting) |
| `UPSTASH_REDIS_REST_TOKEN` | No | Upstash Redis REST token |

> **Rate limiting:** When `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are absent, the app falls back to per-process in-memory rate limiting. This is safe for single-instance deployments but will not share limits across multiple Vercel serverless instances. For production, add Upstash.

### Optional: Upstash Redis (Distributed Rate Limiting)

Upstash provides a serverless Redis that works on Vercel's edge and serverless functions.

1. Sign up at [upstash.com](https://upstash.com)
2. Create a new **Redis** database → choose the region closest to your deployment
3. Go to **REST API** tab and copy the **REST URL** and **REST Token**
4. Add them as environment variables in your deployment:

```
UPSTASH_REDIS_REST_URL=https://your-database.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
```

Rate limits enforced:
- **Login endpoint:** 5 attempts per IP per 15 minutes (sliding window)
- **API endpoints:** 120 requests per IP per minute (sliding window)

When Upstash is configured, limits are shared across all serverless instances. Without it, each instance maintains its own in-memory counter (safe for single-server deployments).

### Generating NEXTAUTH_SECRET

Choose any method:

```bash
# Terminal (Linux/Mac)
openssl rand -base64 32

# Browser console (F12 → Console)
btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(24))))
```

Or use Vercel's generator: **generate-secret.vercel.app**

---

## Vercel + Neon (Recommended)

No server required. Free tier on both platforms handles the full app.

**Estimated time: 15 minutes**

### Step 1 — Create a Neon database

1. Sign up at [neon.tech](https://neon.tech)
2. Click **New Project** → name it `sterling-edge-ops` → choose your nearest region
3. Once created, go to **Connection Details** in the sidebar
4. In the dropdown, select **Prisma**
5. Copy the connection string — it looks like:
   ```
   postgresql://alex:password@ep-cool-fog-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

### Step 2 — Import the repo to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import Git Repository** → connect your GitHub account
3. Select the repository
4. Set **Root Directory** to: `sterling-edge-ops`
5. **Do not deploy yet** — set environment variables first

### Step 3 — Set environment variables

In the Vercel setup screen, expand **Environment Variables** and add:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | The Neon connection string from Step 1 |
| `NEXTAUTH_SECRET` | Your generated 32-byte secret |
| `NEXTAUTH_URL` | `https://your-project.vercel.app` |

> You can use a placeholder for `NEXTAUTH_URL` on the first deploy, then update it once you know the real URL.

Click **Deploy**.

### Step 4 — What happens during build

Vercel runs (configured in `vercel.json`):
1. `npm ci` — installs dependencies and generates the Prisma client
2. `prisma db push` — creates all database tables
3. `prisma/seed-if-empty.ts` — loads demo data if the database is empty
4. `next build` — builds the production app

First build takes 2–4 minutes.

### Step 5 — Update NEXTAUTH_URL

After the first successful deploy:
1. Copy the actual Vercel URL (e.g. `https://sterling-edge-ops.vercel.app`)
2. Go to **Settings → Environment Variables** in your Vercel project
3. Update `NEXTAUTH_URL` to the real URL
4. Go to **Deployments** → click the three dots → **Redeploy**

### Vercel troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `404: NOT_FOUND` | Root Directory not set | Settings → General → Root Directory → `sterling-edge-ops` → Redeploy |
| `Can't reach database` | Wrong DATABASE_URL | Check the connection string includes `?sslmode=require` for Neon |
| Login fails | Wrong NEXTAUTH_URL | Update to exact URL you're visiting, including `https://` |
| Blank dashboard | Seed didn't run | Trigger a new deployment — seed runs automatically on empty DB |
| `NEXTAUTH_SECRET not set` | Missing env var | Add it in Vercel → Settings → Environment Variables → Redeploy |

---

## Docker Compose (Self-Hosted)

Runs the full stack — Next.js app + PostgreSQL — on any server or local machine with Docker.

**Requirements:** Docker + Docker Compose v2

### Step 1 — Configure environment

```bash
cp .env.docker .env
```

Edit `.env` and fill in all three required values:

```env
# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET=your-generated-secret-here

# Set to the URL where the app will be accessed
NEXTAUTH_URL=http://localhost:3000

# Generate with: openssl rand -hex 16
DB_PASSWORD=your-strong-database-password
```

### Step 2 — Start the stack

```bash
docker compose up -d
```

On first start the app will automatically:
1. Wait for PostgreSQL to be healthy
2. Push the Prisma schema (creates all tables)
3. Check if the database is empty — seed demo data if yes
4. Start the Next.js server

Visit **http://localhost:3000** (or your server's IP on port 3000).

### Useful commands

```bash
# View live logs
docker compose logs -f app

# Stop the stack
docker compose down

# Full reset (deletes all data)
docker compose down -v && docker compose up -d

# Open Prisma Studio (database browser)
# Copy DB_PASSWORD from your .env first
DATABASE_URL=postgresql://sterling:<DB_PASSWORD>@localhost:5432/sterling_edge_ops npx prisma studio
```

### Running on a public VPS

After starting with Docker Compose, put a reverse proxy in front of the app for HTTPS:

**Nginx example** (`/etc/nginx/sites-available/sterling`):

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Then use [Certbot](https://certbot.eff.org) for a free SSL certificate:

```bash
sudo certbot --nginx -d yourdomain.com
```

Update `NEXTAUTH_URL` in your `.env` to `https://yourdomain.com` and restart:

```bash
docker compose down && docker compose up -d
```

---

## Railway

1. Push the repo to GitHub
2. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub** → select the repo
3. Set the **Root Directory** to `sterling-edge-ops`
4. Add a **PostgreSQL** plugin — Railway injects `DATABASE_URL` automatically
5. Add environment variables:
   ```
   NEXTAUTH_SECRET=<your generated secret>
   NEXTAUTH_URL=https://<your-railway-domain>
   ```
6. Railway detects the `Dockerfile` and builds automatically
7. The Docker entrypoint handles schema push and seeding on first boot

---

## Render

1. Push the repo to GitHub
2. Go to [render.com](https://render.com) → **New → Web Service** → connect the repo
3. Set:
   - **Root Directory:** `sterling-edge-ops`
   - **Environment:** Docker
   - **Dockerfile Path:** `./Dockerfile`
4. Create a **PostgreSQL** database from the Render dashboard; copy the **Internal Database URL**
5. Add environment variables:
   ```
   DATABASE_URL=<Render internal PostgreSQL URL>
   NEXTAUTH_SECRET=<your generated secret>
   NEXTAUTH_URL=https://<your-render-domain>
   ```
6. Click **Create Web Service** — the Docker entrypoint seeds on first boot

---

## DigitalOcean App Platform

1. Push the repo to GitHub
2. Go to [cloud.digitalocean.com](https://cloud.digitalocean.com) → **App Platform** → **Create App** → GitHub
3. Select the repo and set the **Source Directory** to `sterling-edge-ops`
4. DigitalOcean detects the `Dockerfile` automatically
5. Add a **Dev Database** component (PostgreSQL) — the platform injects `DATABASE_URL`
6. Add environment variables:
   ```
   NEXTAUTH_SECRET=<your generated secret>
   NEXTAUTH_URL=https://<your-do-domain>
   ```
7. Click **Deploy** — schema push and seeding happen on first boot

---

## Demo Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@sterlingedge.co.ke | Admin@2024 |
| Director | director@sterlingedge.co.ke | User@2024 |
| Procurement Officer | procurement@sterlingedge.co.ke | User@2024 |
| Finance Officer | finance@sterlingedge.co.ke | User@2024 |

> These credentials are for demo/testing only. Change them before entering real company data.

---

## How seed data works

The seed script (`prisma/seed-if-empty.ts`) runs on every deployment but **only loads data when the database is empty**. This means:

- First deploy → tables created + demo data loaded automatically
- Every subsequent deploy → data check passes, seed skipped
- Safe to redeploy as many times as needed

To reset back to demo data:

```sql
-- Run this in your database console (Neon, Supabase, or psql)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```

Then trigger a new deployment — schema and seed will run again.

---

## Production Checklist

Before going live with real company data:

- [ ] Generate a real `NEXTAUTH_SECRET` (32 random bytes — not the example value)
- [ ] Set `NEXTAUTH_URL` to your exact public domain with `https://`
- [ ] Set a strong `DB_PASSWORD` (Docker deployments)
- [ ] Change demo user passwords or delete seed users and create real accounts
- [ ] Enable HTTPS (Vercel and managed platforms do this automatically; VPS needs Nginx + Certbot)
- [ ] Set up regular database backups
- [ ] Review which users have the Admin role

---

## Developer Handoff Checklist

If handing this project to a developer, give them:

- [ ] GitHub repository access
- [ ] Vercel or hosting platform access (invite via team or share project)
- [ ] Database platform access (Neon / Supabase / managed DB)
- [ ] The three env vars: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- [ ] This `DEPLOY.md` file
- [ ] `.env.production.example` for reference

The developer does **not** need to run anything locally to get the app live — all setup happens through web dashboards and the platform build pipeline.
