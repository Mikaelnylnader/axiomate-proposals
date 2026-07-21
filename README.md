# Axiomate Proposals

Internal proposal and Stripe payment application for Axiomate AI.

## Setup

### Prerequisites

- Node.js 18+
- Supabase project
- Stripe account (test mode)

### Environment

```bash
cp .env.example .env.local
```

Fill in:

- `NEXT_PUBLIC_SUPABASE_URL` — from Supabase project settings
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from Supabase project settings
- `SUPABASE_SERVICE_ROLE_KEY` — from Supabase project settings (server only)
- `STRIPE_SECRET_KEY` — from Stripe dashboard (test mode)
- `STRIPE_WEBHOOK_SECRET` — from Stripe CLI or dashboard

### Database

Run the initial migration against your Supabase project:

```bash
# Using Supabase CLI
supabase db push

# Or manually in the Supabase SQL editor
# Copy the contents of supabase/migrations/20260714000001_initial_schema.sql
```

After migration, create the first admin user:

1. Sign up through the app (or create the user in Supabase Auth)
2. Set `is_admin = true` in the `profiles` table for that user

### Install and run

```bash
npm install
npm run dev        # http://localhost:3000
```

### Commands

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check formatting |

## Stripe testing

Install the Stripe CLI and forward events:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`.

Use test cards:
- `4242 4242 4242 4242` — success
- `4000 0000 0000 0002` — decline

## Deployment

The app is Netlify-compatible. Set all environment variables in the Netlify dashboard. Update `STRIPE_WEBHOOK_SECRET` to the production webhook signing secret.

## Architecture

```
app/
├─ (auth)/       — Login, auth callback
├─ (admin)/      — Dashboard, clients, proposals (protected)
├─ p/[token]/    — Public proposal view + acceptance
└─ api/stripe/   — Checkout + webhook

lib/
├─ supabase/     — Browser, server, admin clients
├─ proposal/     — Service layer, templates, public
├─ stripe/       — Checkout sessions, webhook processing
├─ validation/   — Zod schemas, money helpers
└─ cn.ts         — Classname utility

supabase/
└─ migrations/   — Database schema
```

## Product constraints

- One internal company (Axiomate AI)
- One administrator at launch
- Two fixed proposal types
- No customer accounts
- No drag-and-drop editor
- No Stripe Connect

See `docs/implementation-status.md` for full details.
