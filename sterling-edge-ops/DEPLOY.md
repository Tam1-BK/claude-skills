# Deployment Guide

## One-Click Local / VPS (Docker Compose)

**Requirements:** Docker + Docker Compose v2

```bash
# Clone and start
git clone <repo>
cd sterling-edge-ops

# Optional: customise secrets
cp .env.docker .env
# Edit .env — at minimum set a real NEXTAUTH_SECRET and NEXTAUTH_URL

# Start everything
docker compose up -d

# Watch logs
docker compose logs -f app
```

Visit **http://localhost:3000**

On first start the app will:
1. Wait for PostgreSQL to be ready
2. Push the Prisma schema
3. Seed the database with demo data
4. Start the Next.js server

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@sterlingedge.co.ke | Admin@2024 |
| Director | director@sterlingedge.co.ke | User@2024 |
| Procurement Officer | procurement@sterlingedge.co.ke | User@2024 |
| Finance Officer | finance@sterlingedge.co.ke | User@2024 |

### Useful Commands

```bash
# Stop
docker compose down

# Stop and delete database volume (full reset)
docker compose down -v

# Force re-seed after reset
docker compose up -d

# View app logs
docker compose logs -f app

# Open Prisma Studio against the running DB
DATABASE_URL=postgresql://sterling:sterling_secure_2024@localhost:5432/sterling_edge_ops npx prisma studio
```

---

## Railway

1. Push this repo to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Add a **PostgreSQL** plugin (Railway auto-sets `DATABASE_URL`)
4. Set environment variables:
   ```
   NEXTAUTH_SECRET=<openssl rand -base64 32>
   NEXTAUTH_URL=https://<your-railway-domain>
   ```
5. Railway detects the `Dockerfile` and builds automatically
6. The entrypoint handles schema push and seeding on first boot

---

## Render

1. Push repo to GitHub
2. Go to [render.com](https://render.com) → New → Web Service → connect repo
3. Set:
   - **Environment:** Docker
   - **Dockerfile Path:** `./Dockerfile`
4. Add a **PostgreSQL** database from Render dashboard; copy the Internal DB URL
5. Set environment variables:
   ```
   DATABASE_URL=<Render internal PostgreSQL URL>
   NEXTAUTH_SECRET=<openssl rand -base64 32>
   NEXTAUTH_URL=https://<your-render-domain>
   ```
6. Deploy — entrypoint seeds on first start

---

## Vercel + Neon (Serverless)

> Neon provides a serverless PostgreSQL compatible with Vercel's edge network.

1. Create a project at [neon.tech](https://neon.tech) → copy the connection string
2. Push this repo to GitHub
3. Go to [vercel.com](https://vercel.com) → New Project → import repo
4. Set environment variables in Vercel:
   ```
   DATABASE_URL=<Neon connection string>
   NEXTAUTH_SECRET=<openssl rand -base64 32>
   NEXTAUTH_URL=https://<your-vercel-domain>
   ```
5. Add a build command override in `vercel.json`:

```json
{
  "buildCommand": "npx prisma generate && npx prisma db push && npm run build",
  "installCommand": "npm ci"
}
```

6. Run the seed once from your local machine pointing at Neon:
   ```bash
   DATABASE_URL="<Neon connection string>" npx tsx prisma/seed.ts
   ```

> **Note:** Vercel runs serverless functions, so the Docker entrypoint is not used. Schema push and seeding happen via the build command and the one-time local seed command above.

---

## DigitalOcean App Platform

1. Push repo to GitHub
2. Go to [cloud.digitalocean.com](https://cloud.digitalocean.com) → App Platform → New App → GitHub
3. Select the repo — DigitalOcean detects the `Dockerfile`
4. Add a **Dev Database** component: PostgreSQL → the platform injects `DATABASE_URL` automatically
5. Set environment variables:
   ```
   NEXTAUTH_SECRET=<openssl rand -base64 32>
   NEXTAUTH_URL=https://<your-do-domain>
   ```
6. Deploy — the Docker entrypoint pushes schema and seeds on first boot

---

## Production Checklist

- [ ] Generate a real `NEXTAUTH_SECRET`: `openssl rand -base64 32`
- [ ] Set `NEXTAUTH_URL` to your actual public domain (with `https://`)
- [ ] Change default DB password if running Docker Compose on a public server
- [ ] Set up SSL termination (Nginx, Caddy, or your platform's built-in TLS)
- [ ] Back up the `postgres_data` Docker volume regularly
- [ ] Rotate passwords and add a real SMTP provider for email notifications when needed
