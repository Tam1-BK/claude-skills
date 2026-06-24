# Sterling Edge Operations OS

A full-stack procurement and CRM management system for **Sterling Edge Ltd** — a Kenya-based company managing AGPO tenders, supply contracts, government procurement, and Exim trading.

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

## User Roles

| Role | Access |
|------|--------|
| Admin | Full access including settings and user management |
| Director | Full read/write across all modules |
| Procurement Officer | Tenders, suppliers, contracts, tasks, documents |
| Finance Officer | Finance, contracts, payments, documents |
| Viewer | Read-only across all modules |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + Radix UI |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | NextAuth.js (JWT) |
| Icons | Lucide React |
| Charts | Recharts |

---

## Project Structure

```
sterling-edge-ops/
├── prisma/
│   ├── schema.prisma          # 12 models, all enums
│   ├── seed.ts                # Demo data (Kenya-focused)
│   └── seed-if-empty.ts       # Idempotent seed runner for CI/CD
├── src/
│   ├── app/
│   │   ├── (auth)/login/      # Login page
│   │   ├── (dashboard)/       # Protected app routes
│   │   │   ├── page.tsx       # Dashboard
│   │   │   ├── crm/
│   │   │   ├── tenders/
│   │   │   ├── suppliers/
│   │   │   ├── contracts/
│   │   │   ├── finance/
│   │   │   ├── tasks/
│   │   │   ├── documents/
│   │   │   └── settings/
│   │   └── api/               # REST API routes
│   ├── components/            # UI components per module
│   ├── lib/
│   │   ├── auth.ts            # NextAuth config
│   │   ├── prisma.ts          # Prisma client singleton
│   │   └── utils.ts           # formatCurrency, calcBidScore, etc.
│   └── types/
│       └── index.ts
├── scripts/
│   └── docker-entrypoint.sh   # DB wait → schema push → seed → start
├── .env.example               # Local dev environment template
├── .env.production.example    # Production environment template
├── .env.docker                # Docker Compose environment template
├── vercel.json                # Vercel build configuration
├── Dockerfile                 # Multi-stage production image
├── docker-compose.yml         # Self-hosted stack (app + postgres)
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

> **Before going live:** change these passwords and set `NEXTAUTH_SECRET` to a strong random value.

---

## Kenya-Specific Context

- Currency is KES throughout
- AGPO = Access to Government Procurement Opportunities (Youth, Women, PWDs)
- Key government documents: TCC, AGPO cert, KRA PIN, CR12, audited accounts, NCA cert
- Government payment terms: 30–90 days (county governments up to 120 days)
- Bid bonds: typically 1–3% of tender value from a bank or insurance company

---

## Suggested Next Phase

### Phase 2 (High Priority)
1. File uploads — actual document storage (S3 or Cloudflare R2)
2. Client detail page — full profile with timeline, notes, linked records
3. Tender detail page — submission checklist, document tracker, addenda log
4. Contract detail page — payment schedule, milestone tracker
5. Email/SMS notifications — deadline alerts via Africa's Talking

### Phase 3 (Growth)
6. Monthly P&L reporting by contract
7. AGPO compliance calendar with renewal reminders
8. Supplier portal — submit quotes directly
9. IFMIS / eProcurement integration — auto-import public tenders
10. 90-day cash flow projection from active contracts

---

## Deployment

See **DEPLOY.md** for full instructions covering Vercel + Neon, Docker Compose, Railway, Render, and DigitalOcean.
