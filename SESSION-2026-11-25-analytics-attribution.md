# Session summary — 2026-11-25: Analytics, attribution, privacy

## Goal
Answer "Am I missing anything?" (peer post about Google Ads + AI team) by analysing the
kinesiology-app project and closing the highest-leverage gaps: measurement, attribution,
compliance, and conversion tracking. User does not want paid ads — focus on free channels.

## What was analysed
- Project: Resonance Kinesiology CRM (React 19 + Vite + Supabase + Vercel).
- Gap: no analytics, no conversion tracking, no UTM capture, no privacy policy, no
  attribution storage. Data plumbing (Cal.com, Stripe, Notion, Gmail) already solid.

## What was built (all committed & pushed to main)
Commits: `5e9a6cc2` (main), `3de6c3b0`, `3646d58f`.

### Analytics layer (`src/lib/analytics.ts`)
- Lazy gtag injection reading `VITE_GA_MEASUREMENT_ID` / `VITE_GA4_MEASUREMENT_ID`
  (and optional `VITE_GOOGLE_ADS_CONVERSION_ID`).
- Exports: `trackPageView`, `trackEvent`, `trackConversion`, `analyticsConfigured`.
- No-op when env vars absent.

### UTM capture (`src/lib/utm.ts`)
- `captureUtmFromUrl`, `getUtmParams`, `utmToReferralSource`.
- Persists to sessionStorage + localStorage (30 days).
- Captures utm_*, gclid, fbclid, referrer, landing path.

### Route tracking (`src/components/shared/AnalyticsTracker.tsx`)
- Fires `page_view` on route change; captures UTM on mount.
- Wired into `App.tsx` inside `<BrowserRouter>`.

### Attribution storage
- Migration: `supabase_add_utm_attribution.sql` (utm_* + gclid/fbclid/referrer/
  landing_path/captured_at columns on `clients`).
- Edge function `public-client-intake-update` allowlist updated.
- `PublicIntakeForm.tsx` auto-fills `referral_source` from UTM and writes attribution
  fields to the client row.

### Conversion tracking (5 touchpoints)
- `PublicIntakeForm` submit → `submit_intake` event + conversion (lead)
- `ClientPortalPage` booking → `book_session` event + conversion
- `OnboardingSuccessPage` → purchase + conversion
- `VoicePaidPage` → purchase + conversion
- `BookingConfirmedPage` (new) → `book_session` + conversion (Cal.com redirect landing)

### Compliance
- `src/pages/public/PrivacyPage.tsx` + `/privacy` route + footer link on LandingPage.

### Domains / infra
- Vercel env vars set (non-sensitive): `VITE_GA_MEASUREMENT_ID`, `VITE_GA4_MEASUREMENT_ID`
  both = `G-LC5LQZFPW2`.
- `.env.example` updated.
- OG/Twitter URLs in index.html changed to `kinesiology.danielebuatti.com`.

## Google IDs (obtained via browser automation)
- GA4 Measurement ID: `G-LC5LQZFPW2` (property + web stream created for
  kinesiology.danielebuatti.com).
- Google Ads: account exists but is **cancelled** — needs reactivation + billing.
  Conversion action not created. Code no-ops without `VITE_GOOGLE_ADS_CONVERSION_ID`.

## Infra applied via GitHub Actions (local CLI lacked project access)
- SQL migration applied via one-off workflow (`run-migration.yml`, then removed).
- Edge function deployed via `deploy-functions.yml` workflow.
- App deployed to Vercel production (studio.danielebuatti.com).

## Verified live
- `studio.danielebuatti.com` serves the app; gtag script injecting (verified via
  browser eval: gtagScript=true, dataLayer=true).
- `/privacy`, `/booking-confirmed`, `/onboarding/success`, `/voice/paid` render.
- No console errors.
- SQL migration verified: utm columns exist on clients (REST query returns nulls).

## Key decisions
- User does not want paid ads → GA4 + organic + reactivation campaign (existing
  `/marketing` Launch module) is the strategy.
- Google Ads conversion code left in place as no-op (harmless, ready if reactivated).
- Two domains: `studio.danielebuatti.com` = CRM app (tracked); `kinesiology.danielebuatti.com`
  = separate marketing site (different project, not this repo).

## Outstanding / not done
- Google Ads conversion action (blocked by cancelled account + billing).
- Marketing site (kinesiology.danielebuatti.com) GA4 placeholder — separate project.
- 17 uncommitted WIP files in working tree (not mine) — user to commit/discard.
- Dev server still running on localhost:8080 (optional).

## Important note for future sessions
- The Supabase CLI locally is authenticated to a different account (no access to
  project xebtjnvfkroiplyzftas). Use GitHub Actions (with SUPABASE_ACCESS_TOKEN
  secret) or the Management API for DDL / edge function deploys.
- Direct DB connection (port 5432) is IPv6-only and unreachable from this network;
  use Management API via GitHub Actions for SQL.