# Sterling Edge Operations OS

A full-stack procurement and CRM management system for **Sterling Edge Ltd** — a Kenya-based company managing AGPO tenders, supply contracts, government procurement, and Exim trading.

**Version:** RC1 | **Status:** Production-Ready | **Stack:** Next.js 14 · TypeScript · PostgreSQL · Prisma · NextAuth.js

---

## What this system does

Sterling Edge Operations OS gives the company a single workspace to manage the full procurement cycle:

- **Track clients and ministries** through a relationship pipeline from first contact to won contract
- **Score bid opportunities** using a 9-factor weighted model before committing resources
- **Manage tender submissions** from identification through to award or loss
- **Track contracts** with live margin, working capital exposure, and financing gap calculations
- **Monitor suppliers** with reliability ratings, price history, and delivery terms
- **Manage documents** with expiry alerts for TCC, AGPO cert, KRA PIN, CR12, and bid documents
- **Assign and track tasks** linked to clients, tenders, contracts, or suppliers
- **See the finance picture** at portfolio level — total revenue, costs, margins, cash exposure

---

## Modules

| Module | Purpose |
|--------|---------|
| **Dashboard** | KPI cards, deadline-sorted tenders, urgent tasks, active contracts |
| **CRM** | Client pipeline — Lead → Contact → Quote → Negotiation → Won/Lost |
| **Tenders** | Full lifecycle with bid/no-bid scoring, AGPO tracking, document checklist |
| **Suppliers** | Reliability ratings, price history, certifications, lead times |
| **Contracts** | Status lifecycle, margin calculation, working capital exposure |
| **Finance** | Portfolio snapshot — revenue, cost, gross profit, financing gaps |
| **Tasks** | Priority task list linked to any record — overdue highlights |
| **Documents** | 19 document types, expiry tracking, verified status |

---

## Bid / No-Bid Scoring

Each tender is scored across 9 weighted factors producing a 0–100 score:

| Factor | Weight |
|--------|--------|
| Eligibility (AGPO, Open, Restricted) | 20% |
| Capital Available | 15% |
| Document Readiness | 15% |
| Deadline Pressure | 10% |
| Supplier Availability | 10% |
| Margin Potential | 10% |
| Relationship Strength | 10% |
| License Compliance | 5% |
| Payment Risk | 5% |

**Decision:** Score ≥ 70 → **PURSUE** · 50–69 → **MONITOR** · < 50 → **DECLINE**

---

## User Roles (RBAC)

| Role | Access |
|------|--------|
| Admin | Full access including settings and user management |
| Director | Full read/write across all modules |
| Procurement Officer | Tenders, suppliers, contracts, tasks, documents |
| Finance Officer | Finance, contracts, payments, documents |
| Viewer | Read-only across all modules |

Role enforcement is layered: Next.js middleware (edge), `withAuth()` wrapper (per-route), and response-level checks.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + Radix UI |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | NextAuth.js (JWT, sameSite=strict cookies) |
| Validation | Zod (all API inputs + env vars at startup) |
| Rate Limiting | Upstash Redis (in-memory fallback for dev) |
| Icons | Lucide React |
| Charts | Recharts |
| Testing | Vitest (13 RBAC integration tests) |

---

## Security Architecture

- **Authentication:** NextAuth.js JWT with `sameSite: strict` cookies and `secure: true` in production
- **RBAC:** Role constants enforced at the edge (middleware) and per-route (`withAuth()` wrapper)
- **CSRF:** Origin header checked against Host on all mutating requests
- **Rate Limiting:** Distributed via Upstash Redis (5 login/15 min, 120 API/min per IP)
- **Input Validation:** Zod schemas on all POST/PATCH endpoints
- **Error Handling:** Centralised Prisma error mapping, no raw exceptions exposed to clients
- **Audit Logging:** Fire-and-forget `AuditLog` writes on all CREATE/UPDATE/DELETE operations
- **Cache Headers:** `Cache-Control: no-store` on all sensitive GET responses
- **Security Headers:** HSTS, X-Frame-Options, nosniff, CSP, Referrer-Policy, Permissions-Policy
- **Env Validation:** Startup check via Zod — app throws before accepting traffic if config is invalid

---

## API Routes

| Route | Methods | Auth |
|-------|---------|------|
| `/api/dashboard` | GET | All roles |
| `/api/crm` | GET (paginated), POST | OPS_READ / OPS_WRITE |
| `/api/crm/[id]` | GET, PATCH, DELETE | OPS_READ / OPS_WRITE |
| `/api/contacts` | GET, POST | OPS_READ / OPS_WRITE |
| `/api/contacts/[id]` | GET, PATCH, DELETE | OPS_READ / OPS_WRITE |
| `/api/tenders` | GET (paginated), POST | OPS_READ / OPS_WRITE |
| `/api/tenders/[id]` | GET, PATCH, DELETE | OPS_READ / OPS_WRITE |
| `/api/suppliers` | GET (paginated), POST | OPS_READ / OPS_WRITE |
| `/api/suppliers/[id]` | GET, PATCH, DELETE | OPS_READ / OPS_WRITE |
| `/api/contracts` | GET (paginated), POST | CONTRACTS_READ / CONTRACTS_WRITE |
| `/api/contracts/[id]` | GET, PATCH | CONTRACTS_READ / CONTRACTS_WRITE |
| `/api/finance` | GET | FINANCE_READ |
| `/api/tasks` | GET (paginated), POST | ALL_ROLES / OPS_WRITE |
| `/api/tasks/[id]` | PATCH, DELETE | OPS_WRITE |
| `/api/documents` | GET (paginated), POST | DOCS_READ / DOCS_WRITE |
| `/api/documents/[id]` | GET, PATCH, DELETE | DOCS_READ / DOCS_WRITE |

All list endpoints support `?page=1&pageSize=20` pagination, returning `{ data, meta: { total, page, pageSize, totalPages } }`.

---

## Project Structure

```
sterling-edge-ops/
├── prisma/
│   ├── schema.prisma          # 13 models, all enums, AuditLog
│   ├── seed.ts                # Demo data (Kenya-focused)
│   └── seed-if-empty.ts       # Idempotent seed runner for CI/CD
├── src/
│   ├── __tests__/
│   │   └── rbac.test.ts       # 13 RBAC integration tests (Vitest)
│   ├── app/
│   │   ├── error.tsx          # Global React error boundary
│   │   ├── not-found.tsx      # 404 page
│   │   ├── (auth)/login/      # Login page
│   │   └── (dashboard)/       # Protected app routes
│   │       ├── error.tsx      # Dashboard-scoped error boundary
│   │       ├── page.tsx       # Dashboard
│   │       ├── crm/
│   │       ├── tenders/
│   │       ├── suppliers/
│   │       ├── contracts/
│   │       ├── finance/
│   │       ├── tasks/
│   │       ├── documents/
│   │       └── settings/
│   │   └── api/               # REST API — 16 route files
│   ├── components/            # UI components per module
│   ├── lib/
│   │   ├── api-utils.ts       # withAuth(), RBAC constants, auditLog(), noStore(), pagination
│   │   ├── auth.ts            # NextAuth config (strict cookies, Zod validation, rate limit)
│   │   ├── env.ts             # Zod env validation at startup
│   │   ├── prisma.ts          # Prisma client singleton
│   │   ├── rate-limit.ts      # Upstash Redis + in-memory fallback
│   │   ├── utils.ts           # formatCurrency, calcBidScore, etc.
│   │   └── validations.ts     # Zod schemas for all 7 entity types
│   └── middleware.ts          # Edge auth, CSRF check, role enforcement
├── scripts/
│   └── docker-entrypoint.sh   # DB wait → schema push → seed → start
├── .env.example               # Local dev environment template
├── .env.production.example    # Production environment template (with Upstash)
├── .env.docker                # Docker Compose environment template
├── vercel.json                # Vercel build configuration
├── next.config.mjs            # Security headers, CSP, external packages
├── Dockerfile                 # Multi-stage production image
├── docker-compose.yml         # Self-hosted stack (app + postgres)
├── vitest.config.ts           # Vitest test configuration
└── DEPLOY.md                  # Full deployment guide
```

---

## Local Development

### Requirements
- Node.js 18+
- PostgreSQL 14+ running locally

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy environment template
cp .env.example .env
# Edit .env — set DATABASE_URL to your local Postgres

# 3. Push schema and load demo data
npm run db:push
npm run db:seed

# 4. Start the dev server
npm run dev
```

Open **http://localhost:3000**

### Useful scripts

```bash
npm run db:push       # Push Prisma schema to database
npm run db:seed       # Load demo data
npm run db:reset      # Full reset: drop, repush, reseed
npm run db:studio     # Open Prisma Studio (visual DB browser)
npm run lint          # Run ESLint
npm run build         # Production build
npm test              # Run RBAC integration tests (Vitest)
```

---

## Demo Data

The seed loads a complete Kenya-focused dataset for testing all modules:

| Entity | Count | Notable examples |
|--------|-------|-----------------|
| Users | 4 | Admin, Director, Procurement Officer, Finance Officer |
| Clients | 5 | Ministry of Health, KeNHA, NHIF, Nairobi City County, Safaricom |
| Contacts | 8 | 1–2 per client |
| Suppliers | 6 | Medical, ICT, Civil, Office, Logistics, Pharma |
| Tenders | 6 | One high-risk (score 38), one strong (score 78), one lost, one AGPO |
| Contracts | 4 | In-transit, invoiced (pending payment), paid (won), sourcing |
| Tasks | 10 | Mix of urgent, overdue, in-progress |
| Documents | 6 | TCC (expired — triggers alert), AGPO cert, KRA PIN |

### Demo login credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@sterlingedge.co.ke | Admin@2024 |
| Director | director@sterlingedge.co.ke | User@2024 |
| Procurement Officer | procurement@sterlingedge.co.ke | User@2024 |
| Finance Officer | finance@sterlingedge.co.ke | User@2024 |

> **Before going live:** change these passwords via the app and rotate `NEXTAUTH_SECRET`.

---

## Kenya-Specific Context

- Currency is KES throughout
- AGPO = Access to Government Procurement Opportunities (Youth, Women, PWDs)
- Key government documents: TCC, AGPO cert, KRA PIN, CR12, audited accounts, NCA cert
- Government payment terms: 30–90 days (county governments up to 120 days)
- Bid bonds: typically 1–3% of tender value from a bank or insurance company

---

## Deployment

See **DEPLOY.md** for full instructions covering Vercel + Neon, Docker Compose, Railway, Render, and DigitalOcean.

---

## Suggested Next Phase

### Phase 2 (High Priority)
1. File uploads — actual document storage (S3 or Cloudflare R2)
2. User management UI — `/settings/users` for admins to create/deactivate accounts
3. Audit log viewer — `/settings/audit` page showing all CREATE/UPDATE/DELETE events
4. Password reset flow — forgot-password endpoint + email integration
5. Email/SMS notifications — deadline alerts via Africa's Talking

### Phase 3 (Growth)
6. Monthly P&L reporting by contract
7. AGPO compliance calendar with renewal reminders
8. Supplier portal — submit quotes directly
9. IFMIS / eProcurement integration — auto-import public tenders
10. 90-day cash flow projection from active contracts
