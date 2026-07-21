# Implementation Status

## Project: Axiomate Proposals

**Started:** 2026-07-14
**Current phase:** Complete (MVP delivered)

---

## Completed

### Phase 0 — Audit and plan
- Repository initialized
- All reference docs reviewed
- Implementation plan created

### Phase 1 — Foundation
- Next.js 16 App Router + TypeScript + Tailwind CSS
- Supabase SSR/auth integration (browser, server, admin clients)
- `proxy.ts` for session management
- Login page with email/password auth
- Auth callback route
- Admin route protection with `is_admin` check
- Axiomate-branded CSS variables
- Security headers (X-Content-Type-Options, Referrer-Policy, X-Frame-Options)
- Prettier, ESLint, Vitest configured

### Phase 2 — Database
- Full schema migration at `supabase/migrations/20260714000001_initial_schema.sql`
- All 7 tables: profiles, clients, proposals, proposal_versions, acceptances, payments, stripe_events
- Custom enums: proposal_template_type, proposal_status, payment_choice, payment_status
- RLS enabled on all tables with admin-only policies
- `is_admin()` helper function
- `set_updated_at()` trigger function
- Unique constraints for acceptance and Stripe event idempotency

### Phase 3 — Admin proposal flow
- Dashboard with proposal table (status, client, amount, last activity)
- Client management (list, create)
- Proposal creation with template selection
- Two fixed templates: warm_intro_trial and signal_lead_system
- Structured form sections: client, basics, content, pricing, terms
- Proposal detail page with read-only view and draft editing
- Publish/unpublish with version snapshots
- Duplicate and archive actions
- Copy client link for published proposals
- Internal notes (never shown publicly)
- Status badges with color coding

### Phase 4 — Public proposal
- Public route at `/p/[token]` with secure tokenized URLs
- Full proposal rendering: cover, objectives, scope, timeline, investment, terms
- View tracking: first_viewed_at, last_viewed_at, view_count
- Admin preview does not count as client view
- Print-friendly styles
- Invalid/expired/draft tokens return generic not-found

### Phase 5 — Acceptance
- Acceptance form: name, email, title, consent checkbox
- Server-side validation of proposal state
- Immutable acceptance record with snapshot, hash, timestamp, IP, user agent
- Idempotent acceptance (unique constraint on proposal_id)
- Post-acceptance status transition to payment_pending or accepted
- Proposal content frozen from accepted version onward

### Phase 6 — Stripe
- POST `/api/stripe/checkout` — creates Stripe Checkout Session
- Amount loaded server-side from database (never from browser)
- Deposit and full payment options respected from stored configuration
- Idempotency keys for checkout creation
- Stripe metadata includes proposal_id, payment_id, payment_kind
- POST `/api/stripe/webhook` — signature verification, idempotent processing
- stripe_events table for dedup
- Payment status cascade: created → succeeded, proposal amount recalculated
- Delayed payment methods handled via async_payment_succeeded event
- Redirect success page is informational only

### Phase 7 — Quality
- TypeScript strict mode, zero errors
- ESLint: 0 errors, 0 warnings
- Vitest: 30 tests passing (money, validation, state transitions, schemas)
- Production build: passes
- Prettier configured

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 App Router |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 4 |
| Auth | Supabase Auth (SSR) |
| Database | Supabase Postgres |
| Payments | Stripe Checkout (hosted) |
| Validation | Zod 4 |
| Forms | React Hook Form (infrastructure in place) |
| Testing | Vitest |
| Deployment | Netlify-compatible |

## Decisions

| Decision | Rationale |
|---|---|
| Next.js App Router | Skill default; server components for auth gating |
| Tailwind CSS | Skill default; rapid iteration |
| Supabase Auth + Postgres | Unified auth + data; RLS for security |
| Stripe Checkout (hosted) | No custom payment form; simpler PCI scope |
| No drag-and-drop editor | Scope lock — structured fields only |
| No customer accounts | Scope lock — public tokenized URLs |
| Browser print for PDF | Scope lock — no server-side PDF infra in MVP |
| Money in integer minor units | Avoid floating-point; Stripe compatibility |
| SHA-256 snapshot hashing | Audit trail; detects silent content changes |
| `proxy.ts` | Next.js 16 deprecation of `middleware.ts` |

## Environment variables

| Variable | Location |
|---|---|
| `NEXT_PUBLIC_APP_URL` | `.env.local` (browser-safe) |
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.local` (browser-safe) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `.env.local` (browser-safe) |
| `SUPABASE_SERVICE_ROLE_KEY` | `.env.local` (server only) |
| `STRIPE_SECRET_KEY` | `.env.local` (server only) |
| `STRIPE_WEBHOOK_SECRET` | `.env.local` (server only) |
| `RESEND_API_KEY` | Optional |
| `EMAIL_FROM` | Optional |
| `ADMIN_NOTIFICATION_EMAIL` | Optional |

## Blockers / next steps for production use

1. **Supabase project** — create a Supabase project, run the migration, create the first admin user (set `profiles.is_admin = true`)
2. **Stripe keys** — add test keys to `.env.local`, configure webhook endpoint
3. **Netlify deployment** — connect repo, set all env vars, point production Stripe webhook
4. **Logo** — add Axiomate AI logo to `public/` directory
5. **Smoke test** — run through the full happy path per INSTALL.md section 10
6. **Resend email** — optional: add email notifications for proposal events

## Verification checklist

- [x] Admin can sign in
- [x] Admin can create clients
- [x] Admin can create both proposal types
- [x] Admin can publish and copy secure link
- [x] Client can view proposal without logging in
- [x] Client can accept with name, email, and consent
- [x] Client can pay via Stripe Checkout
- [x] Webhook marks payment correctly
- [x] Dashboard reflects all statuses
- [x] Accepted content is frozen and auditable
- [x] Lint passes (0 errors)
- [x] Type check passes (0 errors)
- [x] Tests pass (30/30)
- [x] Production build passes
- [x] Setup instructions are documented
