# Sterling Edge Operations OS — Release Notes

## RC1 — Release Candidate 1

**Release Date:** 2026-06-24
**Status:** Production-Ready
**Stack:** Next.js 14 · TypeScript · PostgreSQL · Prisma · NextAuth.js

---

## What's in RC1

RC1 is the first production-hardened release of Sterling Edge Operations OS. It delivers a complete procurement and CRM management system for Sterling Edge Ltd, covering the full tender lifecycle from client relationship to contract payment.

### Core Modules Delivered

| Module | Status |
|--------|--------|
| Dashboard — KPI cards, deadlines, urgent tasks | Complete |
| CRM — Client pipeline (Lead → Won/Lost) | Complete |
| Contacts — Per-client contact records | Complete |
| Tenders — Full lifecycle + bid/no-bid scoring | Complete |
| Suppliers — Ratings, price history, certifications | Complete |
| Contracts — Status lifecycle, margin, working capital | Complete |
| Finance — Portfolio snapshot | Complete |
| Tasks — Priority task list linked to any record | Complete |
| Documents — 19 types, expiry tracking, verified status | Complete |
| Settings — User preferences | Complete |

### API Coverage

16 REST API routes covering all modules, all with:
- RBAC enforcement via `withAuth()` wrapper
- Zod input validation
- Paginated list responses (`page`, `pageSize`, `total`, `totalPages`)
- `Cache-Control: no-store` on all sensitive GET responses
- Centralized error handling (no raw exceptions exposed)
- Audit logging on all CREATE/UPDATE/DELETE operations

### Security Hardening (RC1)

- **RBAC:** 5 roles (Admin, Director, Procurement Officer, Finance Officer, Viewer) enforced at edge middleware and per-route
- **CSRF Protection:** Origin header checked against Host on all mutating API requests
- **Rate Limiting:** Distributed via Upstash Redis (5 login/15 min, 120 API/min per IP); in-memory fallback for single-instance deployments
- **Auth Cookies:** `sameSite: strict`, `httpOnly`, `secure` in production; `__Secure-` prefix enforced
- **Input Validation:** Zod schemas on all POST/PATCH endpoints, including login credentials
- **Audit Logging:** Fire-and-forget `AuditLog` writes on all CREATE/UPDATE/DELETE operations
- **Security Headers:** HSTS, X-Frame-Options (SAMEORIGIN), nosniff, CSP, Referrer-Policy, Permissions-Policy
- **Environment Validation:** Startup Zod check — app refuses to start with invalid config
- **Error Handling:** Centralized Prisma error mapping — no stack traces or internal details exposed

### Testing

- 13 RBAC integration tests (Vitest) — all passing
- TypeScript strict mode — 0 errors (`tsc --noEmit`)

### Data Model

13 Prisma models: Client, Contact, Tender, Supplier, Contract, Task, Document, User, Note, AuditLog, and supporting junction tables.

---

## Deployment

Four supported deployment paths:
- **Vercel + Neon** (recommended for cloud) — ~15 minutes setup
- **Docker Compose** — self-hosted VPS or local server
- **Railway** — managed cloud
- **Render / DigitalOcean App Platform** — managed cloud alternatives

See `DEPLOY.md` for step-by-step instructions for all paths.

---

## Demo Credentials

> **These are for initial testing only. Change all passwords before entering real company data.**

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@sterlingedge.co.ke | Admin@2024 |
| Director | director@sterlingedge.co.ke | User@2024 |
| Procurement Officer | procurement@sterlingedge.co.ke | User@2024 |
| Finance Officer | finance@sterlingedge.co.ke | User@2024 |

Demo credentials are displayed on the login page **only in development mode** (`NODE_ENV !== "production"`).

---

## Known Limitations (Phase 2 Backlog)

1. **No file uploads** — Documents track metadata but cannot store actual files. Phase 2 adds S3 / Cloudflare R2.
2. **No user management UI** — Admin must manage users directly via the database or Prisma Studio. Phase 2 adds `/settings/users`.
3. **No audit log viewer** — Audit events are stored in the database but not yet surfaced in the UI. Phase 2 adds `/settings/audit`.
4. **No password reset flow** — Users cannot self-reset passwords. Phase 2 adds forgot-password via email.
5. **No email/SMS notifications** — Deadline and expiry alerts require manual checking. Phase 2 integrates Africa's Talking.
6. **In-memory rate limiting** — Without Upstash Redis env vars, rate limits are per-process (safe for single-server, not for serverless multi-instance). Add Upstash for distributed limiting.

---

## Upgrading from Previous Versions

RC1 is the initial release. No migration path from earlier versions is required.

---

## Breaking Changes

N/A — first release.
