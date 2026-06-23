# Sterling Edge Operations OS

A full-stack procurement and CRM management system built for **Sterling Edge Ltd** — a Kenya-based company focused on AGPO tenders, supply contracts, Exim trading, and government/commercial procurement.

---

## Quick Start

### 1. Prerequisites

- Node.js 18+
- PostgreSQL 14+

### 2. Clone & Install

```bash
git clone <repo>
cd sterling-edge-ops
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/sterling_edge_ops"
NEXTAUTH_SECRET="your-secret-key-run-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Set Up Database

```bash
# Create DB schema
npm run db:push

# OR use migrations (recommended for production)
npm run db:migrate

# Load demo data
npm run db:seed
```

### 5. Run the App

```bash
npm run dev
```

Visit: **http://localhost:3000**

---

## Demo Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@sterlingedge.co.ke | Admin@2024 |
| Director | director@sterlingedge.co.ke | User@2024 |
| Procurement Officer | procurement@sterlingedge.co.ke | User@2024 |
| Finance Officer | finance@sterlingedge.co.ke | User@2024 |

---

## Modules

### Dashboard
- KPI cards: active tenders, pipeline value, cash exposure, tasks today
- Deadline-sorted tender list with status and stage
- Task list with overdue highlights
- Active contracts table with status, margin, and payment dates

### CRM (Client Relationship Management)
- Track ministries, agencies, county governments, private companies
- Pipeline stages: Lead → Contact → Requirements → Quote → Negotiation → Won/Lost
- Opportunity values, follow-up dates, relationship health
- Contact database per client
- Link to tenders, contracts, tasks, and documents

### Tender Management System
- Full tender lifecycle: Identified → Submitted → Won/Lost
- **Bid/No-Bid scoring system** (9 weighted factors):
  - Eligibility, Capital Available, Deadline Pressure, Document Readiness
  - Supplier Availability, Margin Potential, Relationship Strength
  - License Compliance, Payment Risk
- Score → Automatic recommendation: PURSUE / MONITOR / DECLINE
- AGPO / Open / Restricted / International eligibility tracking
- Mandatory document checklist, license requirements
- Bid bond tracking

### Supplier Management
- Rate suppliers: Excellent / Good / Average / Poor / Blacklisted
- Track price history per item
- Delivery capacity, credit terms, lead times, certifications
- Link to contracts and documents

### Contract & Order Tracking
- Full lifecycle: Awarded → Sourcing → PO Issued → Transit → Delivered → Invoiced → Paid
- Live margin calculation from contract value and cost inputs
- Working capital exposure per contract
- Financing gap = required capital minus available financing
- Supplier vs client payment date tracking
- Risk level per contract

### Finance Snapshot
- Portfolio-level: total revenue, costs, gross profit, average margin
- Per-contract finance breakdown
- Cash exposure across all active contracts
- Financing gap alerts with action guidance
- Supplier vs client payment timeline view

### Task Manager
- Priority levels: Urgent / High / Medium / Low
- Link tasks to clients, tenders, contracts, or suppliers
- One-click complete
- Overdue and due-today badges

### Document Vault
- 19 document types: TCC, AGPO, KRA PIN, CR12, NCA, bid docs, LPOs, invoices, contracts, etc.
- Expiry date tracking with alerts (expired + expiring within 30 days)
- Link documents to clients, tenders, suppliers, or contracts
- Verified status flag

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | NextAuth.js (JWT) |
| UI Components | Radix UI primitives |
| Icons | Lucide React |
| Charts | Recharts |

---

## Project Structure

```
sterling-edge-ops/
├── prisma/
│   ├── schema.prisma          # Full database schema
│   └── seed.ts                # Demo data (Kenya-focused)
├── src/
│   ├── app/
│   │   ├── (auth)/login/      # Login page
│   │   ├── (dashboard)/       # Protected routes
│   │   │   ├── page.tsx       # Dashboard
│   │   │   ├── crm/           # CRM module
│   │   │   ├── tenders/       # Tender management
│   │   │   ├── suppliers/     # Supplier management
│   │   │   ├── contracts/     # Contract tracking
│   │   │   ├── finance/       # Finance snapshot
│   │   │   ├── tasks/         # Task manager
│   │   │   ├── documents/     # Document vault
│   │   │   └── settings/      # Settings
│   │   └── api/               # REST API routes
│   ├── components/
│   │   ├── ui/                # Reusable UI components
│   │   ├── layout/            # Sidebar, Header
│   │   ├── dashboard/         # Dashboard components
│   │   ├── crm/               # CRM components + modals
│   │   ├── tenders/           # Tender components + scoring
│   │   ├── suppliers/         # Supplier components
│   │   ├── contracts/         # Contract components
│   │   ├── finance/           # Finance components
│   │   ├── tasks/             # Task components
│   │   └── documents/         # Document vault components
│   ├── lib/
│   │   ├── prisma.ts          # Prisma client singleton
│   │   ├── auth.ts            # NextAuth config
│   │   └── utils.ts           # formatCurrency, getStatusColor, etc.
│   └── types/
│       └── index.ts           # Shared types
```

---

## Seed Data Summary

| Entity | Count | Notable |
|--------|-------|---------|
| Users | 4 | Admin, Director, Procurement Officer, Finance Officer |
| Clients | 5 | MoH, KeNHA, NHIF, NCC, Safaricom |
| Contacts | 8 | 1–2 contacts per client |
| Suppliers | 6 | Medical, ICT, Civil, Office, Logistics, Pharma |
| Tenders | 6 | 1 strong (score 78), 1 high-risk (38), 1 lost, 1 AGPO, 1 submitted, 1 ICT |
| Contracts | 4 | 1 in-transit, 1 invoiced (pending payment), 1 paid (WON), 1 sourcing |
| Tasks | 10 | Mix of urgent, overdue, in-progress, done |
| Documents | 6 | TCC (expired!), AGPO, contract, invoice, tender doc |

---

## User Roles

| Role | Access |
|------|--------|
| Admin | Full access including user management |
| Director | Full read/write across all modules |
| Procurement Officer | Tenders, suppliers, contracts, tasks, documents |
| Finance Officer | Finance, contracts, payments, documents |
| Viewer | Read-only across all modules |

---

## Bid/No-Bid Scoring System

Each tender is scored on 9 factors (0–100 each), weighted:

| Factor | Weight | Guide |
|--------|--------|-------|
| Eligibility | 20% | AGPO=90, Qualified Open=70, Risky=30 |
| Capital Available | 15% | Self-funded=90, Need finance=60, Critical gap=20 |
| Document Readiness | 15% | All ready=90, 1-2 missing=60, Many missing=20 |
| Deadline Pressure | 10% | 3+ weeks=90, 2 weeks=60, <1 week=20 |
| Supplier Availability | 10% | Confirmed=90, Good option=70, Unconfirmed=30 |
| Margin Potential | 10% | >25%=90, 15–25%=70, <10%=30 |
| Relationship Strength | 10% | Strong contact=90, Known=60, Cold=20 |
| License Compliance | 5% | All licenses=90, Can get=60, Missing=20 |
| Payment Risk | 5% | Good payer=90, Average=60, High risk=20 |

**Result:**
- Score ≥ 70 → PURSUE
- Score 50–69 → MONITOR  
- Score < 50 → DECLINE

---

## Suggested Next Improvements

### Phase 2 (High Priority)
1. **File uploads** — Actual document storage (S3/Cloudflare R2) for Document Vault
2. **Client detail page** — Full profile view with timeline, notes, and linked records
3. **Tender detail page** — Bid submission checklist, document tracker, addenda log
4. **Contract detail page** — Payment schedule, milestone tracker, dispute log
5. **Email notifications** — Deadline alerts, task reminders via email/SMS (Africa's Talking)

### Phase 3 (Growth)
6. **Reporting** — Monthly P&L by contract, tender win rate, supplier performance
7. **AGPO compliance tracker** — Certificate expiry calendar, renewal reminders
8. **Supplier portal** — Suppliers can submit quotes directly
9. **Multi-company support** — Manage multiple entities under one account
10. **Mobile app** — React Native for field procurement officers
11. **IFMIS / eProcurement integration** — Auto-import public tenders from Kenya portals
12. **Financial projections** — 90-day cash flow forecast based on active contracts

---

## Kenya-Specific Notes

- Currency is KES (Kenya Shilling) throughout
- AGPO (Access to Government Procurement Opportunities) for Youth, Women, PWDs
- Key government portals: IFMIS, eProcurement, iTax (KRA), AGPO portal
- Common document requirements: TCC, AGPO cert, KRA PIN, CR12, audited accounts
- Payment terms: Government typically pays in 30–90 days; county governments up to 120 days
- Bid bonds: Typically 1–3% of tender value; sourced from banks or insurance companies
