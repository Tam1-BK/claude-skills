# Sterling Edge Operations OS — Release Notes

---

## RC1.1 — Release Candidate 1.1

**Release Date:** 2026-06-24  
**Status:** Production-Ready  
**Stack:** Next.js 14 · TypeScript · PostgreSQL · Prisma · NextAuth.js  
**Previous Release:** RC1 (2026-06-24)

### What's New in RC1.1

RC1.1 is a patch release that resolves all post-RC1 browser QA findings. No new features were added. No RBAC rules were changed. No API contracts were modified.

#### Bug Fixes

| # | Fix | Impact |
|---|-----|--------|
| 1 | **Pagination response mismatch** — All 6 module list pages (CRM, Tenders, Suppliers, Contracts, Tasks, Documents) were rendering empty despite a seeded database. Root cause: frontend consumed the full `{ data, meta }` envelope instead of `.data`. Fixed in 11 call sites across content components and form modal dropdowns. | Critical — all modules now display data |
| 2 | **Missing detail pages** — Clicking any table row returned a Next.js 404 because `/crm/[id]`, `/tenders/[id]`, `/contracts/[id]` did not exist. Created all three pages with full field display, linked records, status badges, and edit modals. | Critical — record navigation now works |
| 3 | **Missing GET /api/tasks/:id** — The task detail page requires a single-record endpoint that was absent. Added GET handler with all relations included. | High — task detail page now loads |
| 4 | **Missing supplier and task detail pages** — `/suppliers/[id]` and `/tasks/[id]` were not created in RC1. Added with price history, linked records, mark-done action, and edit modals. | High — full navigation now complete |
| 5 | **Navigation dead links** — Supplier cards and task title text were not linked to detail pages. Added `<Link>` wrappers to both list views. | High — zero 404s on row/card click |

#### UX Improvements

| # | Feature | Details |
|---|---------|---------|
| 6 | **Access Denied component** — Restricted pages previously rendered blank or failed silently on 403. All 7 content components and 5 detail pages now show a consistent "Access Denied" screen (shield icon, message, "Go to Dashboard" button) on 401/403 API responses. | All roles — no more blank pages |
| 7 | **Role-aware sidebar** — Modules inaccessible to the current user's role now render as dimmed, non-clickable items with a lock icon. Finance Officer sees locks on CRM/Tenders/Suppliers. Procurement Officer and Viewer see a lock on Finance. | Sidebar matches actual permissions |

#### New Files Added

| File | Purpose |
|------|---------|
| `src/components/ui/access-denied.tsx` | Reusable Access Denied component |
| `src/lib/rbac.ts` | Client-safe role constants and `canAccess()` helper |
| `src/app/(dashboard)/crm/[id]/page.tsx` | CRM client detail page |
| `src/app/(dashboard)/tenders/[id]/page.tsx` | Tender detail page with bid scoring |
| `src/app/(dashboard)/contracts/[id]/page.tsx` | Contract detail with financial breakdown |
| `src/app/(dashboard)/suppliers/[id]/page.tsx` | Supplier detail with price history |
| `src/app/(dashboard)/tasks/[id]/page.tsx` | Task detail with linked records |
| `BROWSER_QA_REPORT.md` | Full browser QA checklist and role-by-role test script |
| `FINAL_BROWSER_QA_REPORT.md` | Final QA certification for RC1.1 |

---

## RC1 — Release Candidate 1

**Release Date:** 2026-06-24  
**Status:** Superseded by RC1.1

### What was in RC1

RC1 was the first production-hardened release of Sterling Edge Operations OS. It delivered the complete procurement and CRM management system for Sterling Edge Ltd, covering the full tender lifecycle from client relationship to contract payment.

#### Core Modules Delivered

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

#### API Coverage

17 REST API routes covering all modules (GET /api/tasks/:id added in RC1.1), all with:
- RBAC enforcement via `withAuth()` wrapper
- Zod input validation
- Paginated list responses (`page`, `pageSize`, `total`, `totalPages`)
- `Cache-Control: no-store` on all sensitive GET responses
- Centralized error handling (no raw exceptions exposed)
- Audit logging on all CREATE/UPDATE/DELETE operations

#### Security Hardening

- **RBAC:** 5 roles (Admin, Director, Procurement Officer, Finance Officer, Viewer) enforced at edge middleware and per-route
- **CSRF Protection:** Origin header checked against Host on all mutating API requests
- **Rate Limiting:** Distributed via Upstash Redis (5 login/15 min, 120 API/min per IP); in-memory fallback for single-instance deployments
- **Auth Cookies:** `sameSite: strict`, `httpOnly`, `secure` in production; `__Secure-` prefix enforced
- **Input Validation:** Zod schemas on all POST/PATCH endpoints
- **Audit Logging:** Fire-and-forget `AuditLog` writes on all CREATE/UPDATE/DELETE
- **Security Headers:** HSTS, X-Frame-Options, nosniff, CSP, Referrer-Policy, Permissions-Policy
- **Environment Validation:** Startup Zod check — app refuses to start with invalid config
- **Private Mode:** No public registration, no self-signup; admin-created accounts only

---

## Testing (RC1.1)

- **13 RBAC integration tests (Vitest)** — all passing
- **TypeScript strict mode** — 0 errors (`tsc --noEmit`)
- **Production build** — `npm run build` succeeds, 33 routes compiled
- **Browser QA** — all pages, links, and role restrictions manually verified

---

## Data Model

13 Prisma models: Client, Contact, Tender, Supplier, Contract, Task, Document, User, Note, AuditLog, SupplierPriceHistory, and supporting tables.

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

> **For initial testing only. Change all passwords before entering real company data.**

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@sterlingedge.co.ke | Admin@2024 |
| Director | director@sterlingedge.co.ke | User@2024 |
| Procurement Officer | procurement@sterlingedge.co.ke | User@2024 |
| Finance Officer | finance@sterlingedge.co.ke | User@2024 |
| Viewer | viewer@sterlingedge.co.ke | User@2024 |

Demo credentials are displayed on the login page **only in development mode** (`NODE_ENV !== "production"`).

---

## Known Limitations (Phase 2 Backlog)

1. **No file uploads** — Documents track metadata; no actual file storage. Phase 2 adds S3/Cloudflare R2.
2. **No user management UI** — Admin must manage users directly via DB or Prisma Studio. Phase 2 adds `/settings/users`.
3. **No audit log viewer** — Audit events are stored in the database but not surfaced in the UI. Phase 2 adds `/settings/audit`.
4. **No password reset flow** — Users who forget their password require Admin DB intervention. Phase 2 adds forgot-password via email.
5. **No email/SMS notifications** — Deadline and expiry alerts require manual checking. Phase 2 integrates Africa's Talking.
6. **In-memory rate limiting** — Without Upstash Redis env vars, rate limits are per-process. Add Upstash for distributed limiting on multi-instance deployments.
7. **`/documents/[id]` detail page** — Documents vault is a flat list; row-click navigation is not wired (documents are not linked from any table row). Add if detail view is needed.

---

## Upgrading

**RC1 → RC1.1:** Drop-in replacement. No database migrations required. No env var changes. Run `npm install` if `node_modules` is stale, then `npm run build`.

---

## Breaking Changes

None between RC1 and RC1.1.
