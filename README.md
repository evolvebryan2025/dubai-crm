# Dubai Real Estate CRM

A full-featured real estate CRM built for the Dubai market. Manage listings, leads, transactions, commissions, and agent performance — all role-gated with RLS security.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (Postgres + Auth + RLS + Storage)
- **Styling**: Tailwind CSS + shadcn/ui
- **Charts**: Recharts
- **Webhooks**: n8n-compatible POST endpoints

## Roles

| Role | Access |
|------|--------|
| **Super Admin** | Full access to everything including Settings |
| **Admin** | All modules except Settings |
| **Finance** | Dashboard, Transactions, Commissions only |
| **Agent** | Dashboard, Listings, Owners, Leads, Bulk Database, Transactions, Commissions |

## Modules

1. **Dashboard** — Role-specific stats, leads bar chart (30 days)
2. **Listings** — Sale/Rental tabs, CRUD, publish toggle + webhook
3. **Owner List** — Off-market property owners, agent assignment
4. **Leads** — Pipeline kanban + table view, 5-stage workflow
5. **Bulk Database** — CSV upload with column mapping, area tagging
6. **Transactions** — Deal form linked to listings, auto-creates commission record
7. **Commission Approval** — 3-step workflow: Pending → Owner Approved → Finance Cleared
8. **Activity Log** — Filterable audit trail (admin only)
9. **KPR Reports** — 5 Recharts visualizations with date range filter
10. **Settings** — Team management, role assignment, integrations, company profile
11. **Webhooks** — 5 secured POST endpoints for n8n automation

## Setup

### Prerequisites

- Node.js 18+
- A Supabase project (free tier works)

### 1. Clone and install

```bash
cd dubai-crm
npm install
```

### 2. Configure environment

Copy the example env file and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
WEBHOOK_SECRET=your-secret-string
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL (Settings > API) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key (Settings > API) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (Settings > API). **Keep secret.** |
| `WEBHOOK_SECRET` | Shared secret for webhook endpoint auth. Set to any strong string. |
| `NEXT_PUBLIC_SITE_URL` | Your app base URL. `http://localhost:3000` for local dev. |

### 3. Run database migrations

Open the **Supabase SQL Editor** and run these files in order:

1. `supabase/migrations/00001_create_tables.sql` — Creates all 12 tables, indexes, triggers
2. `supabase/migrations/00002_create_rls_policies.sql` — Enables RLS with role-based policies

### 4. Create your first user

Option A — via Supabase Dashboard:
1. Go to Authentication > Add User (email + password)
2. Go to Table Editor > profiles > find the row > set `role` to `super_admin`

Option B — via SQL after creating the auth user:
```sql
UPDATE public.profiles
SET role = 'super_admin', full_name = 'Admin'
WHERE email = 'your-email@example.com';
```

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in.

## Webhook Endpoints

All endpoints require the `x-webhook-secret` header matching your `WEBHOOK_SECRET` env var. Each event is logged to the `activity_logs` table automatically.

### Connecting n8n

In n8n, use an **HTTP Request** node to call these endpoints. Set the method to POST, add the `x-webhook-secret` header, and connect the output to your automation flow.

---

### POST `/api/webhooks/listing-published`

Fired when a listing is published via the toggle switch.

```json
{
  "event": "listing.published",
  "listing_id": "uuid",
  "listing": { "...full listing object..." }
}
```

**n8n use case**: Syndicate listing to Property Finder / Bayut portals.

---

### POST `/api/webhooks/lead-assigned`

Fired when a lead is assigned or reassigned to an agent.

```json
{
  "event": "lead.assigned",
  "lead_name": "John Doe",
  "assigned_agent_id": "uuid"
}
```

**n8n use case**: Send WhatsApp/email notification to the assigned agent.

---

### POST `/api/webhooks/transaction-created`

Fired when a new transaction/deal is recorded.

```json
{
  "event": "transaction.created",
  "transaction_id": "uuid",
  "agent_id": "uuid",
  "deal_value": 1500000
}
```

**n8n use case**: Notify management or trigger accounting workflows.

---

### POST `/api/webhooks/commission-approved`

Fired when a commission moves from Pending to Owner Approved.

```json
{
  "event": "commission.owner_approved",
  "approval_id": "uuid",
  "approved_by": "uuid"
}
```

**n8n use case**: Notify finance team that a commission is ready for clearance.

---

### POST `/api/webhooks/finance-cleared`

Fired when a commission moves from Owner Approved to Finance Cleared.

```json
{
  "event": "commission.finance_cleared",
  "approval_id": "uuid",
  "cleared_by": "uuid"
}
```

**n8n use case**: Trigger payment processing or update accounting system.

---

### Testing webhooks locally

```bash
curl -X POST http://localhost:3000/api/webhooks/listing-published \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: your-secret" \
  -d '{"event":"listing.published","listing_id":"test-123"}'
```

Expected: `{"received":true,"event":"listing.published"}`

Without secret: `{"error":"Unauthorized"}` (HTTP 401)

## Database Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles (linked to Supabase Auth) |
| `teams` | Agent team groupings |
| `listings` | Property listings (sale/rent) |
| `listing_images` | Listing photo storage references |
| `owners` | Off-market property owners |
| `leads` | Lead/inquiry pipeline |
| `contacts` | Bulk-imported contacts |
| `upload_batches` | CSV upload tracking |
| `transactions` | Closed deals |
| `commission_approvals` | 3-step commission workflow |
| `activity_logs` | Audit trail for all actions |
| `settings` | System configuration (company, integrations) |

## Project Structure

```
src/
├── app/
│   ├── (auth)/login/          # Login page + actions
│   ├── (dashboard)/           # All authenticated pages
│   │   ├── page.tsx           # Dashboard
│   │   ├── listings/          # Listings CRUD
│   │   ├── owners/            # Owner list CRUD
│   │   ├── leads/             # Lead pipeline
│   │   ├── bulk-database/     # CSV import
│   │   ├── transactions/      # Deal management
│   │   ├── commissions/       # Approval workflow
│   │   ├── activity-log/      # Audit trail
│   │   ├── reports/           # KPR charts
│   │   └── settings/          # System config
│   └── api/webhooks/          # 5 webhook endpoints
├── components/
│   ├── layout/                # Sidebar, header, mobile nav
│   ├── shared/                # PageHeader, RoleGate
│   ├── ui/                    # shadcn/ui components
│   └── [module]/              # Per-module components
├── hooks/                     # useUser hook
├── lib/
│   ├── supabase/              # Client, server, admin, middleware
│   ├── constants.ts           # Nav items, Dubai areas
│   └── webhooks.ts            # Shared webhook auth + logging
└── types/
    ├── database.ts            # All table types
    ├── enums.ts               # Role, status, type enums
    └── index.ts               # Re-exports
```

## Security

- All server actions authenticate via `supabase.auth.getUser()`
- RLS policies enforce row-level access per role
- Webhook endpoints validate `x-webhook-secret` header
- All mutations are logged to `activity_logs`
- **Rotate your `SUPABASE_SERVICE_ROLE_KEY` after initial testing**
- Never expose `SUPABASE_SERVICE_ROLE_KEY` or `WEBHOOK_SECRET` to the client

## Deployment

Deploy to Vercel:

```bash
npm run build
```

Set the same environment variables in your Vercel project settings. Update `NEXT_PUBLIC_SITE_URL` to your production domain.
