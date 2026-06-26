import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronRight, Mail, User, Globe, CreditCard, FileText, Calendar, Webhook, Brain, Mic, Zap, ArrowRight, AlertTriangle, CheckCircle2, ExternalLink, Settings, Search, BookOpen, Workflow, Database, Cloud, Play, Copy, Terminal, Hash, Shield, Clock, RefreshCw, XCircle, DollarSign, Building, Eye, Code } from "lucide-react";
import AppLayout from "@/components/crm/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { showSuccess } from "@/utils/toast";

type StepType = "trigger" | "edge-function" | "email" | "db-write" | "ui" | "decision" | "webhook";
type BadgeColor = "default" | "primary" | "destructive" | "emerald" | "amber" | "indigo" | "rose" | "slate" | "purple" | "cyan";

interface Step {
  type: StepType;
  label: string;
  desc: string;
  badge?: string;
  badgeColor?: BadgeColor;
  detail?: string;
  fileRef?: string;
}

interface Workflow {
  id: string;
  title: string;
  category: "fnh" | "voice";
  trigger: string;
  triggerDetail: string;
  steps: Step[];
  emailSubject?: string;
  emailPreview?: string;
  errorStates?: string[];
  notes?: string;
}

interface EdgeFunction {
  name: string;
  description: string;
  triggers: string[];
  calls: string[];
  envVars: string[];
  dbTables: string[];
  authGuard: string;
  emailSubject?: string;
  codePattern?: string;
  errorHandling?: string;
  notes?: string;
}

interface StateNode {
  state: string;
  description: string;
  details: string;
  transitions: { to: string; via: string }[];
}

interface DbTable {
  name: string;
  description: string;
  usedBy: string[];
  keyFields: string[];
}

interface EnvVar {
  name: string;
  description: string;
  usedBy: string[];
}

interface ExternalApi {
  name: string;
  endpoints: string[];
  usedBy: string[];
}

const WORKFLOWS: Workflow[] = [
  {
    id: "fnh-calendar-book",
    title: "FNH — Slot Click → Book",
    category: "fnh",
    trigger: "Practitioner clicks a time slot on the calendar",
    triggerDetail: "Available on: Month view (UnifiedCalendarPage), Week view (WeeklyTimeGrid), Overview view (WeekByWeekOverview). The slot click opens a service chooser → client chooser flow.",
    steps: [
      { type: "ui", label: "Slot click", desc: "Practitioner clicks empty time slot on week/overview/month view", badge: "UI", badgeColor: "indigo", fileRef: "src/pages/UnifiedCalendarPage.tsx, src/components/crm/WeeklyTimeGrid.tsx" },
      { type: "ui", label: "Service chooser", desc: "Select: Current rate (uses client.standard_rate) / New client $70 / FNH Community Free ($0)", badge: "UI", badgeColor: "indigo", fileRef: "src/pages/UnifiedCalendarPage.tsx SLOT_SERVICES, src/components/crm/CalcomSlotsView.tsx" },
      { type: "ui", label: "Client chooser", desc: "Searchable client list from the clients table. Filters by name/email.", badge: "UI", badgeColor: "indigo" },
      { type: "edge-function", label: "create-calcom-booking", desc: "POST /v2/bookings to Cal.com. Sets attendee email/name, event type ID, metadata.", badge: "EdgeFn", badgeColor: "amber", fileRef: "supabase/functions/create-calcom-booking/index.ts" },
      { type: "decision", label: "Paid session?", desc: "If calculated rate > 0: proceed to payment email. If rate === 0 (Free): skip email entirely.", badge: "Decision", badgeColor: "slate" },
      { type: "edge-function", label: "send-manual-onboarding", desc: "Generates Stripe Checkout Session (if rate > 0) + sends confirmation email via Gmail API. Includes appointment details, payment link (if paid), intake CTA (if <50% filled).", badge: "EdgeFn", badgeColor: "amber", fileRef: "supabase/functions/send-manual-onboarding/index.ts" },
      { type: "email", label: "FNH Confirmation Email", desc: "Subject: 'Your FNH Session is Confirmed'. Always sent for paid bookings. Payment button + appointment time + conditional intake CTA.", badge: "Email", badgeColor: "emerald", fileRef: "send-manual-onboarding lines 197-237" },
    ],
    emailSubject: "Your FNH Session is Confirmed",
    emailPreview: "Hi [name], your Functional Neuro Health session has been booked. [appointment time] [Stripe Pay button] [Intake form CTA if <50% filled]",
    errorStates: ["Cal.com API down — booking creation fails", "Stripe API down — payment link not generated but email still sent", "Gmail API auth failure — email not sent, but booking still created"],
    notes: "This is the primary booking path. The rate is determined by: (1) SLOT_SERVICES price if set, (2) client.standard_rate, (3) falls back to $70. The 'Current rate' option in SLOT_SERVICES has price: undefined so it uses client.standard_rate.",
  },
  {
    id: "fnh-quickbook",
    title: "FNH — QuickBook Dialog",
    category: "fnh",
    trigger: "Practitioner uses the QuickBook dialog from the schedule page",
    triggerDetail: "QuickBookDialog is accessible from the Calendar/ availability page. Offers a streamlined form with client, service type, price, date, and a 'Send onboarding' checkbox.",
    steps: [
      { type: "ui", label: "QuickBookDialog", desc: "Compact dialog: client selector, service type dropdown, price input, date/time pickers. 'Send onboarding' checkbox (default: checked).", badge: "UI", badgeColor: "indigo", fileRef: "src/components/crm/QuickBookDialog.tsx" },
      { type: "edge-function", label: "create-calcom-booking", desc: "Creates the Cal.com booking with selected event type.", badge: "EdgeFn", badgeColor: "amber" },
      { type: "decision", label: "Send onboarding checkbox?", desc: "If checked → invoke send-manual-onboarding. If unchecked → booking created, no email sent.", badge: "Decision", badgeColor: "slate" },
      { type: "edge-function", label: "send-manual-onboarding", desc: "Only if checkbox is checked. Sends confirmation + payment link + intake form CTA.", badge: "EdgeFn", badgeColor: "amber" },
    ],
    emailSubject: "Your FNH Session is Confirmed",
    notes: "The 'Send onboarding' checkbox allows the practitioner to create bookings silently (for in-person bookings where the client is already in the room, no email needed).",
  },
  {
    id: "fnh-appointment-form",
    title: "FNH — AppointmentForm",
    category: "fnh",
    trigger: "Practitioner uses the 'Book Client' modal (standalone or from slot chooser)",
    triggerDetail: "AppointmentForm is the full-featured booking modal. Accessed from: slot chooser 'Book client' button, or standalone via the schedule page. Default type: Kinesiology. Price buttons: Free ($0), Standard ($70), Custom input.",
    steps: [
      { type: "ui", label: "AppointmentForm", desc: "Modal with client selector, date, time, type (default Kinesiology), price (Free / $70 / Custom), 'Send onboarding' checkbox.", badge: "UI", badgeColor: "indigo", fileRef: "src/components/crm/AppointmentForm.tsx" },
      { type: "edge-function", label: "create-calcom-booking", desc: "Creates Cal.com booking with event type 4279898 (Kinesiology) or selected type.", badge: "EdgeFn", badgeColor: "amber" },
      { type: "decision", label: "Send onboarding checkbox?", desc: "Checked → sends email. Unchecked → appointment created silently.", badge: "Decision", badgeColor: "slate" },
      { type: "edge-function", label: "send-manual-onboarding", desc: "Conditional on checkbox state.", badge: "EdgeFn", badgeColor: "amber" },
    ],
    emailSubject: "Your FNH Session is Confirmed",
    notes: "Price fallback changed from $50 to $70. Free option always available. The 'Send onboarding' checkbox is independent of price — free sessions can also send the confirmation email (without payment link).",
  },
  {
    id: "fnh-send-payment-link",
    title: "FNH — Send Payment Link (BookingsList)",
    category: "fnh",
    trigger: "BookingsList → kebab menu (⋮) → 'Send payment link' / 'Resend payment link'",
    triggerDetail: "Available on any unpaid FNH booking row in the BookingsList (Calendar page list view). Shows a rate confirmation dialog before sending.",
    steps: [
      { type: "ui", label: "BookingsList kebab menu", desc: "Click ⋮ → 'Send payment link' or 'Resend payment link' (text varies by previous send status). Only shown on non-free items.", badge: "UI", badgeColor: "indigo", fileRef: "src/components/crm/BookingsList.tsx lines 141-159" },
      { type: "ui", label: "Rate confirmation dialog", desc: "Shows the current rate and allows override before sending. Confirms action.", badge: "UI", badgeColor: "indigo" },
      { type: "edge-function", label: "send-manual-onboarding", desc: "Invoked with { clientId, appointmentId, force: true }. Generates Stripe link + sends full confirmation email.", badge: "EdgeFn", badgeColor: "amber" },
      { type: "email", label: "FNH Confirmation Email", desc: "Payment link + appointment details + intake CTA (if <50% filled). Same template as booking email.", badge: "Email", badgeColor: "emerald" },
    ],
    emailSubject: "Your FNH Session is Confirmed",
    notes: "'Resend payment link' text appears when the appointment already has a payment_link stored. The flow is identical — it generates a new Stripe link each time.",
  },
  {
    id: "fnh-client-detail",
    title: "FNH — Send Onboarding (Client Detail)",
    category: "fnh",
    trigger: "Client Detail page → 'Send Onboarding' button",
    triggerDetail: "Found in the client detail header area. Sends to the most recent appointment for this client.",
    steps: [
      { type: "ui", label: "ClientDetailPage", desc: "'Send Onboarding' button in the client detail view header.", badge: "UI", badgeColor: "indigo", fileRef: "src/pages/ClientDetailPage.tsx line 242" },
      { type: "edge-function", label: "send-manual-onboarding", desc: "No appointment ID provided — function finds the most recent appointment for this client (query: appointments for client_id, ordered by date DESC, limit 1).", badge: "EdgeFn", badgeColor: "amber" },
      { type: "email", label: "FNH Confirmation Email", desc: "Same email template. Payment link (if rate > 0) + intake CTA (if <50% filled).", badge: "Email", badgeColor: "emerald" },
    ],
    emailSubject: "Your FNH Session is Confirmed",
    notes: "When called without appointmentId, the edge function queries for the latest appointment by client_id. This is useful for re-sending to clients whose previous email may have bounced or been missed.",
  },
  {
    id: "fnh-client-row",
    title: "FNH — Send Onboarding (Settings → Client Row)",
    category: "fnh",
    trigger: "Settings → Clients list → 'Send' button on a client row",
    triggerDetail: "Settings page's client management list. Each row has a 'Send Onboarding' button for quick re-send.",
    steps: [
      { type: "ui", label: "ClientRow", desc: "Settings page client list row action button.", badge: "UI", badgeColor: "indigo", fileRef: "src/components/crm/settings/ClientRow.tsx line 1291" },
      { type: "edge-function", label: "send-manual-onboarding", desc: "Same flow — finds most recent appointment, generates Stripe link, sends email.", badge: "EdgeFn", badgeColor: "amber" },
    ],
    emailSubject: "Your FNH Session is Confirmed",
  },
  {
    id: "fnh-client-audit",
    title: "FNH — Bulk Send Onboarding (Client Audit)",
    category: "fnh",
    trigger: "Business → Client Audit → 'Send Onboarding' bulk action",
    triggerDetail: "The ClientAuditPage has a bulk action toolbar. Select clients with email addresses, click 'Send Onboarding', confirm, and it iterates through all selected clients invoking send-manual-onboarding for each.",
    steps: [
      { type: "ui", label: "ClientAuditPage", desc: "Select clients in the audit table → 'Send Onboarding' bulk action button. Filters to clients with email addresses.", badge: "UI", badgeColor: "indigo", fileRef: "src/pages/ClientAuditPage.tsx lines 681-704" },
      { type: "edge-function", label: "send-manual-onboarding (×N)", desc: "Invoked once per selected client in a for loop. Each call: { clientId: client.id, force: true }. Shows success count at end.", badge: "EdgeFn", badgeColor: "amber" },
    ],
    emailSubject: "Your FNH Session is Confirmed",
    errorStates: ["Individual client failures are caught and logged (not thrown) — the loop continues", "No email address on client record — silently skipped (filtered before loop)"],
    notes: "The bulk send uses a for loop, not Promise.all, so failures don't cascade. Success/failure per client is individually caught. Total success count shown in a toast.",
  },
  {
    id: "fnh-public-intake",
    title: "FNH — Client Fills Intake Form",
    category: "fnh",
    trigger: "Client opens /onboarding/:id link from email or practitioner shares URL",
    triggerDetail: "Public URL: /onboarding/:id (no auth required). Client receives this link in the confirmation email (if <50% complete) or practitioner can share it directly.",
    steps: [
      { type: "trigger", label: "Client opens link", desc: "URL format: {SITE_URL}/onboarding/{clientId}. Public route with no authentication.", badge: "URL", badgeColor: "indigo" },
      { type: "db-write", label: "OnboardingPage fetches client", desc: "Fetches client record by ID from supabase. Loads all intake columns into form.", badge: "DB", badgeColor: "slate", fileRef: "src/pages/public/OnboardingPage.tsx" },
      { type: "ui", label: "PublicIntakeForm renders", desc: "10 sections, 40+ fields. Sections: About You, Contact, Health History, Medications, Stress & Lifestyle, Goals, Preferences, Consent, Emergency Contact, Additional Info.", badge: "UI", badgeColor: "indigo", fileRef: "src/components/crm/PublicIntakeForm.tsx" },
      { type: "db-write", label: "UPDATE clients SET ...", desc: "All intake fields saved directly to the clients table row via Supabase update.", badge: "DB", badgeColor: "slate" },
    ],
    notes: "Intake form completion is measured by isIntakeFormFilled() in send-manual-onboarding — counts non-null/non-empty values across 42 intake-specific columns. Threshold: >=50% = complete. Form fields from supabase_intake_form.sql migration.",
  },
  {
    id: "fnh-stripe-webhook",
    title: "FNH — Stripe Payment → Confirmation",
    category: "fnh",
    trigger: "Stripe sends checkout.session.completed webhook",
    triggerDetail: "After client completes payment via Stripe Checkout. Stripe POSTs to {supabase_url}/functions/v1/stripe-webhook. Signature verified via STRIPE_WEBHOOK_SECRET_CRM.",
    steps: [
      { type: "webhook", label: "Stripe webhook fires", desc: "checkout.session.completed event. Signature verified with STRIPE_WEBHOOK_SECRET_CRM.", badge: "Webhook", badgeColor: "rose", fileRef: "supabase/functions/stripe-webhook/index.ts" },
      { type: "edge-function", label: "stripe-webhook processes payment", desc: "4-tier matching: (1) metadata.appointment_id exact match, (2) client_reference_id, (3) stripe_customer_id, (4) email fallback. Always logs to webhook_failures if unmatched — never loses money silently.", badge: "EdgeFn", badgeColor: "amber" },
      { type: "db-write", label: "UPDATE appointments SET payment_received = true", desc: "Updates the matched appointment record. Sets payment_method = 'Stripe'.", badge: "DB", badgeColor: "slate" },
      { type: "email", label: "Payment Confirmation Email", desc: "Subject: 'Payment received — Your FNH session is confirmed'. Includes green checkmark, amount, practitioner signature.", badge: "Email", badgeColor: "emerald" },
    ],
    errorStates: ["Unmatched payment → logged to webhook_failures table (manual reconciliation required)", "Gmail API failure → payment recorded but confirmation email not sent (non-fatal)"],
    notes: "The webhook has robust 4-tier matching to handle edge cases where appointment_id metadata is missing. The webhook_failures table serves as an audit trail for unmatched payments.",
  },
  {
    id: "fnh-calcom-webhook",
    title: "FNH — Cal.com Booking Lifecycle",
    category: "fnh",
    trigger: "Cal.com sends booking lifecycle event (created/cancelled/rescheduled)",
    triggerDetail: "Cal.com POSTs to {supabase_url}/functions/v1/calcom-webhook. Only processes event type IDs [4279898, 5302336, 5927215].",
    steps: [
      { type: "webhook", label: "Cal.com webhook fires", desc: "Events: BOOKING_CREATED, BOOKING_CANCELLED, BOOKING_RESCHEDULED. Only handles FNH event types.", badge: "Webhook", badgeColor: "rose", fileRef: "supabase/functions/calcom-webhook/index.ts" },
      { type: "edge-function", label: "calcom-webhook processes event", desc: "BOOKING_CANCELLED → deletes appointment by calcom_booking_id (or time-window email fallback). BOOKING_CREATED → creates/upserts appointment + client. BOOKING_RESCHEDULED → updates status.", badge: "EdgeFn", badgeColor: "amber" },
      { type: "db-write", label: "Upsert/DELETE appointments", desc: "Maintains parity between Cal.com and local Supabase appointments table.", badge: "DB", badgeColor: "slate" },
    ],
    notes: "Allowed event types: 4279898 (Kinesiology $70), 5302336 (Full Price Session $100), 5927215 (Free $0). Pricing is determined by event type ID with Cal.com payment amount override if present.",
  },
  {
    id: "fnh-sync-calcom",
    title: "FNH — Sync Cal.com Bookings",
    category: "fnh",
    trigger: "Manual sync from settings or scheduled cron",
    triggerDetail: "Bulk syncs all upcoming Cal.com bookings into the local Supabase appointments table. Useful for backfilling or recovering from sync failures.",
    steps: [
      { type: "trigger", label: "Manual / Scheduled", desc: "Triggered from NotionSettings sync button or potentially via scheduled cron job.", badge: "Trigger", badgeColor: "indigo" },
      { type: "edge-function", label: "sync-calcom-bookings", desc: "GET /v2/bookings?status=upcoming from Cal.com API. Filters by ALLOWED_EVENT_IDS. Upserts each booking into appointments.", badge: "EdgeFn", badgeColor: "amber", fileRef: "supabase/functions/sync-calcom-bookings/index.ts" },
      { type: "db-write", label: "Upsert appointments + clients", desc: "Creates missing clients by email. Upserts appointments by calcom_booking_id. Same time-window matching logic as calcom-webhook.", badge: "DB", badgeColor: "slate" },
    ],
  },
  {
    id: "fnh-sync-notion",
    title: "FNH — Sync to Notion",
    category: "fnh",
    trigger: "Manual action from Settings → Notion sync buttons",
    triggerDetail: "Multiple actions: pull-from-notion, sync-all-clients, sync-all-appointments, configure-schema, merge-clients. Each action syncs bidirectionally or unidirectionally between Supabase and Notion databases.",
    steps: [
      { type: "trigger", label: "Manual from Settings", desc: "NotionSettings component has buttons for each sync action.", badge: "Trigger", badgeColor: "indigo", fileRef: "src/components/crm/settings/NotionSettings.tsx" },
      { type: "edge-function", label: "sync-to-notion", desc: "Orchestrator with 3 sub-modules (notion-api.ts, client-sync.ts, appointment-sync.ts). Handles Notion API rate limits with exponential backoff (3 retries, 1s/2s/4s).", badge: "EdgeFn", badgeColor: "amber" },
      { type: "db-write", label: "Syncs clients, appointments, client_wins", desc: "Bidirectional sync. Self-healing duplicate email detection (mangles with +dup-{id} suffix).", badge: "DB", badgeColor: "slate" },
    ],
    notes: "Notion DB IDs: CLIENTS_DB_ID = 074e2c00..., MAIN_DB_ID = 171f7156..., PLANNER_DB_ID = 11caad21..., VOICE_CLIENTS_DB_ID = af3e38f4... Schema-flexible property mapping with fallback name aliases.",
  },
  {
    id: "voice-calendar-book",
    title: "Voice — Calendar → Book",
    category: "voice",
    trigger: "Voice calendar slot or SimpleBookDialog → book lesson",
    triggerDetail: "Accessed from the Voice Dashboard or from the unified calendar (voice events). The SimpleBookDialog provides a streamlined form.",
    steps: [
      { type: "ui", label: "Voice slot click / SimpleBookDialog", desc: "Practitioner clicks a slot or uses the SimpleBookDialog. Enter student name, email, date, time, cost.", badge: "UI", badgeColor: "indigo", fileRef: "src/components/crm/SimpleBookDialog.tsx" },
      { type: "edge-function", label: "voice-create-booking", desc: "POST /v2/bookings to Cal.com. Default event type: 1945081. Metadata source: 'Voice Studio CRM'. Calls /confirm immediately after creation.", badge: "EdgeFn", badgeColor: "amber", fileRef: "supabase/functions/voice-create-booking/index.ts" },
      { type: "decision", label: "Cost > 0?", desc: "If cost > 0 → trigger voice-send-onboarding. If free → no email sent.", badge: "Decision", badgeColor: "slate" },
      { type: "edge-function", label: "voice-send-onboarding", desc: "Sends onboarding email with Stripe payment link + 'Complete Student Profile' CTA. Also creates Notion student record (if new) + upserts voice_onboarding DB row.", badge: "EdgeFn", badgeColor: "amber" },
      { type: "email", label: "Voice Onboarding Email", desc: "Subject: 'Welcome to Voice Studio! 🎵 — Your Lesson Booking'. Shows lesson date/time, payment section, student profile CTA.", badge: "Email", badgeColor: "emerald" },
    ],
    emailSubject: "Welcome to Voice Studio! 🎵 — Your Lesson Booking",
    emailPreview: "Hi [name], thanks for booking a voice lesson! [lesson details] [Pay Now button] [Complete Student Profile button]",
  },
  {
    id: "voice-calcom-embed",
    title: "Voice — Client Books via Cal.com Embed",
    category: "voice",
    trigger: "Client books a voice lesson directly via the Cal.com embed on the public website",
    triggerDetail: "No authentication. Cal.com sends BOOKING_CREATED webhook to calcom-voice-webhook. If the booking has metadata.source !== 'Voice Studio CRM', it's from the embed.",
    steps: [
      { type: "webhook", label: "Cal.com voice webhook fires", desc: "calcom-voice-webhook receives booking.created event. Only non-CRM bookings proceed to email.", badge: "Webhook", badgeColor: "rose", fileRef: "supabase/functions/calcom-voice-webhook/index.ts" },
      { type: "edge-function", label: "calcom-voice-webhook", desc: "Looks up student in Notion by email (fallback to name, fallback to create). Reads event_pricing table. Invokes voice-schedule-lesson for Notion sync. For paid lessons with CRM source !== 'Voice Studio CRM', triggers voice-send-onboarding.", badge: "EdgeFn", badgeColor: "amber" },
      { type: "decision", label: "Paid lesson + not CRM-originated?", desc: "If cost > 0 AND metadata.source !== 'Voice Studio CRM' → send onboarding email. No email for free lessons or CRM-originated bookings.", badge: "Decision", badgeColor: "slate" },
      { type: "edge-function", label: "voice-send-onboarding", desc: "Sends email. Creates Notion student record. Upserts voice_onboarding DB row.", badge: "EdgeFn", badgeColor: "amber" },
    ],
    emailSubject: "Welcome to Voice Studio! 🎵 — Your Lesson Booking",
  },
  {
    id: "voice-send-payment-link",
    title: "Voice — Send Payment Link (BookingsList)",
    category: "voice",
    trigger: "BookingsList → kebab menu (⋮) → 'Send payment link' on a voice item",
    triggerDetail: "Different from FNH — this does NOT send an email. It generates a Stripe link and copies the URL to the clipboard for the practitioner to share manually.",
    steps: [
      { type: "ui", label: "BookingsList kebab menu", desc: "⋮ → 'Send payment link' on a voice lesson row.", badge: "UI", badgeColor: "indigo", fileRef: "src/components/crm/BookingsList.tsx" },
      { type: "edge-function", label: "voice-payment-link", desc: "Generates Stripe Checkout Session. Returns the URL. Does NOT send any email. Returns URL to the UI which copies it to clipboard.", badge: "EdgeFn", badgeColor: "amber", fileRef: "supabase/functions/voice-payment-link/index.ts" },
    ],
    notes: "No email subject — this flow is clipboard-only. The practitioner pastes the Stripe link into their own message (SMS, email, etc.).",
  },
  {
    id: "voice-student-onboarding",
    title: "Voice — Student Fills Profile",
    category: "voice",
    trigger: "Student opens /voice-onboarding/:email link from onboarding email",
    triggerDetail: "Public URL: /voice-onboarding/:email (no auth required). Student fills in goals, experience level, and additional notes.",
    steps: [
      { type: "trigger", label: "Student opens link", desc: "URL: /voice-onboarding/:email (public, no auth).", badge: "URL", badgeColor: "indigo", fileRef: "src/pages/public/VoiceOnboardingPage.tsx" },
      { type: "ui", label: "VoiceOnboardingPage", desc: "Form with name, mobile, goals, experienceLevel, additionalNotes fields.", badge: "UI", badgeColor: "indigo" },
      { type: "edge-function", label: "voice-submit-onboarding", desc: "Upserts voice_onboarding table by email. Sets onboarding_completed = true, submitted_at = now().", badge: "EdgeFn", badgeColor: "amber", fileRef: "supabase/functions/voice-submit-onboarding/index.ts" },
    ],
  },
  {
    id: "voice-stripe-webhook",
    title: "Voice — Stripe Payment → Confirmation",
    category: "voice",
    trigger: "Stripe sends checkout.session.completed to voice-stripe-webhook",
    triggerDetail: "Separate webhook endpoint from FNH. Signature verified via STRIPE_WEBHOOK_SECRET_VOICE. Updates voice_bookings status + Notion lesson payment status.",
    steps: [
      { type: "webhook", label: "Stripe voice webhook fires", desc: "checkout.session.completed event. Verified with STRIPE_WEBHOOK_SECRET_VOICE.", badge: "Webhook", badgeColor: "rose", fileRef: "supabase/functions/voice-stripe-webhook/index.ts" },
      { type: "edge-function", label: "voice-stripe-webhook", desc: "Resolves lesson: (1) metadata.lesson_id, (2) metadata.calcom_booking_uid → voice_bookings lookup, (3) email fallback. Updates Notion lesson page Payment → 'Paid (Stripe)'. Updates voice_bookings status → 'paid'. Logs to webhook_failures if unmatched.", badge: "EdgeFn", badgeColor: "amber" },
      { type: "email", label: "Voice Payment Confirmation", desc: "Subject: 'Payment received 🎵 — Your lesson is confirmed'. Rose-themed, voice coach branding.", badge: "Email", badgeColor: "emerald" },
    ],
    emailSubject: "Payment received 🎵 — Your lesson is confirmed",
    notes: "3-tier lesson ID resolution. If no match found, inserts into webhook_failures then creates a new voice_bookings record from session data (with status='paid' and today's date) — self-healing.",
  },
  {
    id: "voice-cancel",
    title: "Voice — Cancel Lesson",
    category: "voice",
    trigger: "BookingsList kebab menu → 'Cancel booking' on a voice item",
    triggerDetail: "Also available from VoiceCalendarPage. Shows confirmation dialog before proceeding.",
    steps: [
      { type: "ui", label: "BookingsList / VoiceCalendar cancel", desc: "Confirmation dialog → confirms cancellation.", badge: "UI", badgeColor: "indigo" },
      { type: "edge-function", label: "voice-cancel-lesson", desc: "POST /v2/bookings/{id}/cancel in Cal.com. Archives Notion lesson pages (both DB1 and DB2). Updates voice_bookings.status = 'cancelled'.", badge: "EdgeFn", badgeColor: "amber", fileRef: "supabase/functions/voice-cancel-lesson/index.ts" },
    ],
  },
  {
    id: "fnh-cancel",
    title: "FNH — Cancel Appointment",
    category: "fnh",
    trigger: "BookingsList kebab menu → 'Cancel booking' on an FNH item",
    triggerDetail: "Confirmation dialog → cancels in Cal.com + updates local status.",
    steps: [
      { type: "ui", label: "BookingsList cancel", desc: "Confirmation dialog.", badge: "UI", badgeColor: "indigo" },
      { type: "edge-function", label: "delete-external-appointment", desc: "POST /v2/bookings/{id}/cancel in Cal.com. Does NOT delete Notion entries (unlike voice). Then UI updates appointments.status = 'Cancelled'.", badge: "EdgeFn", badgeColor: "amber", fileRef: "supabase/functions/delete-external-appointment/index.ts" },
    ],
  },
  {
    id: "fnh-reschedule",
    title: "FNH — Reschedule Appointment",
    category: "fnh",
    trigger: "BookingsList kebab menu → 'Reschedule' on an FNH item",
    triggerDetail: "Opens slot picker (21-day window). Loads available slots via get-calcom-slots.",
    steps: [
      { type: "ui", label: "Slot picker", desc: "Loads available slots via get-calcom-slots. 21-day window.", badge: "UI", badgeColor: "indigo" },
      { type: "edge-function", label: "create-calcom-booking", desc: "Called with bookingUid + new startTime. Cal.com creates new booking, old booking cancelled automatically.", badge: "EdgeFn", badgeColor: "amber" },
      { type: "webhook", label: "calcom-webhook receives BOOKING_RESCHEDULED", desc: "Deletes old appointments row by old calcom_booking_id, inserts new row with new UID.", badge: "Webhook", badgeColor: "rose" },
    ],
  },
  {
    id: "voice-reschedule",
    title: "Voice — Reschedule Lesson",
    category: "voice",
    trigger: "BookingsList kebab menu → 'Reschedule' on a voice item",
    triggerDetail: "Similar to FNH but uses voice-create-booking with Notion date sync.",
    steps: [
      { type: "ui", label: "Slot picker", desc: "Loads available slots.", badge: "UI", badgeColor: "indigo" },
      { type: "edge-function", label: "voice-create-booking", desc: "Calls Cal.com reschedule API. Updates Notion lesson page dates (DB1: Date + Breakthroughs, DB2: Date + Details). Marks old booking status = 'rescheduled'. Inserts new booking record.", badge: "EdgeFn", badgeColor: "amber" },
    ],
  },
];

const EDGE_FUNCTIONS: EdgeFunction[] = [
  {
    name: "send-manual-onboarding",
    description: "FNH: Generates Stripe Checkout Session + sends confirmation email via Gmail API. Core business logic: determines intake form completeness (41-field check, >=50% threshold), generates payment link only when priceAmount > 0, includes conditional intake CTA in email body.",
    triggers: ["Calendar slot booking", "QuickBookDialog", "AppointmentForm", "BookingsList payment link", "Client detail page", "Settings client row", "Client audit page bulk send", "Debug appointment page"],
    calls: ["Stripe API (create checkout session)", "Google OAuth (get Gmail access token)", "Gmail API (send email)"],
    envVars: ["STRIPE_SECRET_KEY", "GMAIL_CLIENT_ID", "GMAIL_CLIENT_SECRET", "GMAIL_REFRESH_TOKEN", "GMAIL_USER_EMAIL", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SITE_URL"],
    dbTables: ["clients", "appointments"],
    authGuard: "requireUser (service-role token or authenticated app user)",
    emailSubject: "Your FNH Session is Confirmed",
    codePattern: "Gets Gmail access token via OAuth refresh → Fetches client + appointment from Supabase → Determines intake completeness → Optionally creates Stripe session → Builds HTML email → Sends via Gmail API → Updates appointment.payment_link",
    errorHandling: "Missing gmail creds → throw. Stripe failure → non-fatal (email still sent without payment link). App not found → uses fallback defaults. Gmail send failure → throws.",
    notes: "Previously had bug where getGmailAccessToken() was never called (accessToken was undefined). Also had 6-month skip logic that was removed — payment links now always sent. Stripe link condition changed from is_paid/payment_received flags to priceAmount > 0. Else-branch query was ascending (got earliest appointment) — fixed to descending (gets latest).",
  },
  {
    name: "create-calcom-booking",
    description: "Creates or reschedules an FNH booking in Cal.com v2 API. Handles both new bookings and reschedules (when bookingUid provided). Writes to appointments table with new calcom_booking_id.",
    triggers: ["Calendar slot booking", "QuickBookDialog", "AppointmentForm", "BookingsList reschedule", "Debug appointment page", "Unified calendar booking", "WeekByWeekOverview booking"],
    calls: ["Cal.com API (POST /v2/bookings)", "Cal.com API (POST /v2/bookings/{uid}/reschedule when rescheduling)"],
    envVars: ["CALCOM_API_KEY", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
    dbTables: ["clients", "appointments"],
    authGuard: "requireUser",
  },
  {
    name: "calcom-webhook",
    description: "Processes FNH Cal.com booking lifecycle events. Handles BOOKING_CANCELLED (deletes appointment), BOOKING_CREATED (creates/upserts appointment + client), BOOKING_RESCHEDULED (updates status). Only processes specific FNH event type IDs.",
    triggers: ["Cal.com webhook (automatic, no auth)"],
    calls: ["Supabase (appointments upsert/delete, clients upsert)"],
    envVars: ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
    dbTables: ["profiles", "clients", "appointments"],
    authGuard: "verify_jwt = false (webhook — Cal.com signature not verified in code, relies on URL secrecy)",
    errorHandling: "Event type not in ALLOWED_EVENT_IDS → silently skip. Cancellation with no matching calcom_booking_id → time-window fallback (10 min window by email).",
    notes: "ALLOWED_EVENT_IDS = [4279898, 5302336, 5927215]. Pricing hardcoded by event type ID with Cal.com payment amount override. Time-window matching: ±60 seconds of startTime for creation events.",
  },
  {
    name: "calcom-voice-webhook",
    description: "Processes Voice Studio Cal.com webhook events. Handles BOOKING_PAYMENT_SUCCESSFUL (confirms booking, updates Notion + Supabase), BOOKING_CREATED (creates student in Notion, schedules lesson, conditionally sends email), BOOKING_RESCHEDULED, BOOKING_CANCELLED. Reads pricing from event_pricing table.",
    triggers: ["Cal.com webhook (automatic, no auth)"],
    calls: ["Cal.com API (confirm booking)", "Notion API (query/create/update pages)", "Internal: voice-schedule-lesson edge function", "Internal: voice-send-onboarding edge function"],
    envVars: ["NOTION_API_KEY", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "CALCOM_API_KEY"],
    dbTables: ["voice_bookings", "event_pricing"],
    authGuard: "verify_jwt = false (webhook)",
    codePattern: "Parse Cal.com payload → event type → lookup event_pricing for price/duration → lookup/create student in Notion → invoke voice-schedule-lesson → conditionally invoke voice-send-onboarding",
    notes: "CRM-originated bookings (metadata.source === 'Voice Studio CRM') skip onboarding email to avoid double-send. Pricing resolved from event_pricing table with send_payment_link flag. Dates converted to Australia/Melbourne timezone.",
  },
  {
    name: "voice-send-onboarding",
    description: "Voice equivalent of send-manual-onboarding. Generates Stripe payment link + sends welcome email with student profile CTA. Also creates Notion student record and upserts voice_onboarding DB row.",
    triggers: ["Voice calendar booking (SimpleBookDialog)", "calcom-voice-webhook (embed bookings)"],
    calls: ["Stripe API (create checkout session)", "Google OAuth (get Gmail access token)", "Gmail API (send email)", "Notion API (create student page)"],
    envVars: ["STRIPE_SECRET_KEY", "GMAIL_CLIENT_ID", "GMAIL_CLIENT_SECRET", "GMAIL_REFRESH_TOKEN", "GMAIL_USER_EMAIL", "NOTION_API_KEY", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SITE_URL"],
    dbTables: ["voice_onboarding"],
    authGuard: "verify_jwt = false (public — called from webhook)",
    emailSubject: "Welcome to Voice Studio! 🎵 — Your Lesson Booking",
    notes: "No accessToken bug (unlike FNH version — does call getGmailAccessToken properly). Always shows 'Complete Student Profile' CTA (no conditional based on completion like FNH). BCCs daniele.buatti@gmail.com.",
  },
  {
    name: "voice-payment-link",
    description: "Generates a Stripe Checkout Session for a voice lesson and returns the URL. Does NOT send any email — the URL is copied to the practitioner's clipboard for manual sharing.",
    triggers: ["BookingsList voice item → 'Send payment link'"],
    calls: ["Stripe API (create checkout session)"],
    envVars: ["STRIPE_SECRET_KEY", "SITE_URL"],
    dbTables: [],
    authGuard: "verify_jwt = false (open endpoint)",
    codePattern: "Parse { amount, lessonTitle, email, lessonId, studentName } → Create Stripe Checkout Session → Return URL",
  },
  {
    name: "voice-create-booking",
    description: "Creates or reschedules a voice lesson in Cal.com v2 API. On create: POST /v2/bookings + POST /confirm. On reschedule: POST /v2/bookings/{uid}/reschedule. Writes to voice_bookings table. Updates Notion lesson page dates on reschedule.",
    triggers: ["Voice calendar booking", "Voice reschedule from BookingsList"],
    calls: ["Cal.com API (create/reschedule/confirm bookings)", "Notion API (update lesson dates on reschedule)"],
    envVars: ["CALCOM_API_KEY", "NOTION_API_KEY", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
    dbTables: ["voice_bookings"],
    authGuard: "requireUser",
    notes: "Default eventTypeId = 1945081. Force mode: if force=true, skips Cal.com entirely and returns synthetic UID force-{timestamp}. Conflict repair: on 400 'already has booking', queries Cal.com and tries to find the conflicting booking by exact time + email. Time zone: Australia/Melbourne.",
  },
  {
    name: "voice-submit-onboarding",
    description: "Saves voice student onboarding/profile form data to voice_onboarding table. Called when student submits the /voice-onboarding/:email form.",
    triggers: ["/voice-onboarding/:email page submit"],
    calls: ["Supabase (voice_onboarding upsert)"],
    envVars: ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
    dbTables: ["voice_onboarding"],
    authGuard: "verify_jwt = false (public)",
    codePattern: "Parse { email, name, mobile, goals, experienceLevel, additionalNotes } → Upsert voice_onboarding by email → Set onboarding_completed=true, submitted_at=now()",
  },
  {
    name: "stripe-webhook",
    description: "Processes FNH Stripe payment events (checkout.session.completed and payment_intent.succeeded). 4-tier payment matching to handle edge cases. Updates appointments.payment_received. Sends payment confirmation email. Logs unmatched payments to webhook_failures.",
    triggers: ["Stripe webhook (automatic, no auth)"],
    calls: ["Stripe API (constructEvent, retrieve customer)", "Google OAuth (get Gmail access token)", "Gmail API (send payment confirmation email)"],
    envVars: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET_CRM", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "GMAIL_CLIENT_ID", "GMAIL_CLIENT_SECRET", "GMAIL_REFRESH_TOKEN", "GMAIL_USER_EMAIL"],
    dbTables: ["appointments", "clients", "webhook_failures"],
    authGuard: "verify_jwt = false (webhook — signature verified via Stripe SDK)",
    emailSubject: "Payment received — Your FNH session is confirmed",
    errorHandling: "Missing STRIPE_WEBHOOK_SECRET_CRM → falls back to no signature verification (unsafe but functional). Unmatched payment → inserts into webhook_failures (never lose money silently). Gmail failure → non-fatal (payment still recorded).",
  },
  {
    name: "voice-stripe-webhook",
    description: "Processes Voice Studio Stripe payment events (checkout.session.completed). 3-tier lesson ID resolution. Updates voice_bookings status to 'paid'. Updates Notion lesson page Payment property to 'Paid (Stripe)'. Self-healing: creates new voice_bookings record if no match found.",
    triggers: ["Stripe webhook (automatic, no auth)"],
    calls: ["Stripe API (constructEvent)", "Notion API (update lesson payment status)", "Google OAuth (get Gmail access token)", "Gmail API (send confirmation email)"],
    envVars: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET_VOICE", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "NOTION_API_KEY", "GMAIL_CLIENT_ID", "GMAIL_CLIENT_SECRET", "GMAIL_REFRESH_TOKEN", "GMAIL_USER_EMAIL"],
    dbTables: ["voice_bookings", "webhook_failures"],
    authGuard: "verify_jwt = false (webhook — signature verified via Stripe SDK)",
    emailSubject: "Payment received 🎵 — Your lesson is confirmed",
  },
  {
    name: "sync-calcom-bookings",
    description: "Bulk syncs all upcoming Cal.com bookings (status=upcoming, startTime>=now) into the local Supabase appointments table. Filters by ALLOWED_EVENT_IDS. Creates missing clients by email.",
    triggers: ["Manual from NotionSettings sync button", "Potential scheduled cron"],
    calls: ["Cal.com API (GET /v2/bookings?status=upcoming)", "Supabase (upsert appointments + clients)"],
    envVars: ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "CALCOM_API_KEY"],
    dbTables: ["profiles", "clients", "appointments"],
    authGuard: "requireUser",
  },
  {
    name: "sync-to-notion",
    description: "Orchestrator for bidirectional Notion sync. Supports: pull-from-notion (import Notion clients into Supabase), configure-schema (add Notion DB properties), sync-all-clients, sync-all-appointments, merge-clients. Uses 3 sub-modules with exponential backoff retry.",
    triggers: ["Manual from NotionSettings buttons", "DB trigger on appointments UPDATE", "DB trigger on clients UPDATE"],
    calls: ["Notion API (databases query, pages create/update, schema PATCH)", "Supabase (clients + appointments CRUD)"],
    envVars: ["NOTION_API_KEY", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
    dbTables: ["profiles", "clients", "appointments", "client_wins"],
    authGuard: "requireUser",
    codePattern: "Action dispatch → sync-to-notion/notion-api.ts (HTTP client with retry) / client-sync.ts (client CRUD maps) / appointment-sync.ts (appointment CRUD maps)",
    errorHandling: "Exponential backoff retry: 3 retries with 1s/2s/4s delays for 429 (rate limit) and 502+ (server error) statuses. Self-healing duplicate email detection: if both Supabase and Notion have different IDs for same email, the email is mangled with +dup-{pageId} suffix.",
    notes: "Notion API version: '2022-06-28'. Schema-flexible property mapping with fallback name aliases (e.g. ['Name', 'Client Name', 'Full Name']). Appointment sync writes to both MAIN_DB_ID and PLANNER_DB_ID.",
  },
  {
    name: "delete-external-appointment",
    description: "Cancels an FNH appointment in Cal.com and optionally archives Notion pages. Does NOT delete local appointments row — that's done by the UI after successful invocation.",
    triggers: ["BookingsList FNH cancel", "Appointment form cancel"],
    calls: ["Cal.com API (POST /v2/bookings/{id}/cancel)", "Notion API (archive pages — optional, based on body params)"],
    envVars: ["CALCOM_API_KEY", "NOTION_API_KEY", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
    dbTables: [],
    authGuard: "requireUser",
  },
  {
    name: "voice-cancel-lesson",
    description: "Cancels a voice lesson in Cal.com + archives Notion lesson pages (both DB1 and DB2) + updates voice_bookings.status = 'cancelled'.",
    triggers: ["BookingsList voice cancel", "VoiceCalendarPage cancel dialog"],
    calls: ["Cal.com API (POST /v2/bookings/{id}/cancel)", "Notion API (PATCH /v1/pages/{id} archived:true × 2 lessons)", "Supabase (update voice_bookings)"],
    envVars: ["CALCOM_API_KEY", "NOTION_API_KEY", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
    dbTables: ["voice_bookings"],
    authGuard: "requireUser",
  },
];

const EMAIL_TEMPLATES = [
  {
    name: "FNH Confirmation",
    source: "send-manual-onboarding",
    subject: "Your FNH Session is Confirmed",
    when: "Sent on every paid FNH booking + manual 'Send payment link'/'Send Onboarding' actions. Always sent for paid sessions. Conditional intake CTA only when <50% intake form filled.",
    sections: [
      "✦ Resonance Kinesiology + Functional Neuro Health header (navy #1E3261 + rose #D46A9B accent)",
      "Greeting line: 'Hi [first name], your Functional Neuro Health session has been booked.'",
      "Appointment date/time block (positioned as a card with border, only if appointment exists)",
      "Payment section: 'Secure Payment ($XX)' + 'Pay via Stripe' button + PayID/Bank Transfer details (only if priceAmount > 0)",
      "Intake form CTA: subtle card at the bottom, centered, with 'Complete Your Intake Form' button (only if intakeFilled === false, i.e. <50% complete)",
      "Signature: Daniele Buatti, Neuro-Somatic Kinesiologist",
      "BCC: daniele.buatti@gmail.com (on every send)",
    ],
    htmlSkeleton: `<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; background-color: #FDFCFB; font-family: sans-serif;">
  <center style="width: 100%; background-color: #FDFCFB; padding: 40px 0;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 40px; overflow: hidden; border: 1px solid #E0F2FE;">
      <tr><td style="height: 6px; background-color: #D46A9B;"></td></tr>
      <tr>
        <td style="padding: 56px 40px;">
          <div style="text-align: center;">
            <div style="color: #1E3261; font-size: 28px; font-weight: 700;">✦ Resonance Kinesiology</div>
            <div style="color: #D46A9B; font-size: 11px; font-weight: 900; letter-spacing: 0.4em; margin-top: 16px; text-transform: uppercase;">Functional Neuro Health</div>
          </div>

          <div style="text-align: left; margin-top: 48px; line-height: 1.8; font-size: 17px; color: #334155;">
            <p>Hi {firstName},</p>
            <p>Your Functional Neuro Health session has been booked.</p>

            {appointmentSection}
            {paymentSection}

            {conditionalIntakeSection}
          </div>

          <div style="border-top: 1px solid #F1F5F9; margin-top: 40px; padding-top: 32px; text-align: left;">
            <div style="font-weight: 700; color: #1E3261; font-size: 18px;">Daniele Buatti</div>
            <div style="color: #D46A9B; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;">Neuro-Somatic Kinesiologist</div>
          </div>
        </td>
      </tr>
    </table>
  </center>
</body>
</html>`,
  },
  {
    name: "FNH Payment Confirmation",
    source: "stripe-webhook",
    subject: "Payment received — Your FNH session is confirmed",
    when: "Sent automatically when Stripe webhook processes a successful payment. Always includes amount and green checkmark.",
    sections: [
      "Indigo accent bar (#4f46e5)",
      "Large green checkmark emoji (✅)",
      "'Payment Received' badge in uppercase",
      "'Thank you, {firstName}!' heading",
      "Payment amount + confirmation message",
      "Signature: Daniele Buatti, Resonance Kinesiology",
    ],
    htmlSkeleton: `<!DOCTYPE html><html><body style="margin:0;padding:0;font-family:sans-serif;">
  <center style="width:100%;padding:40px 0;background:#f8fafc;">
    <table role="presentation" width="100%" style="max-width:560px;margin:0 auto;background:#fff;border-radius:32px;overflow:hidden;">
      <tr><td style="height:6px;background:#4f46e5;"></td></tr>
      <tr><td style="padding:48px 40px;text-align:center;">
        <div style="font-size:44px;">✅</div>
        <div style="color:#4f46e5;font-size:11px;font-weight:900;letter-spacing:0.3em;text-transform:uppercase;margin-top:12px;">Payment Received</div>
        <h1 style="color:#1E293B;font-size:24px;margin:12px 0 8px;">Thank you, {firstName}!</h1>
        <p style="color:#475569;font-size:15px;line-height:1.6;">Your payment{amountSection} for your FNH Neuro-Health Assessment is confirmed. Your session is locked in — looking forward to seeing you.</p>
        <div style="border-top:1px solid #F1F5F9;margin-top:32px;padding-top:24px;text-align:left;">
          <div style="font-weight:700;color:#1E293B;">Daniele Buatti</div>
          <div style="color:#4f46e5;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;">Resonance Kinesiology</div>
        </div>
      </td></tr>
    </table>
  </center>
</body></html>`,
  },
  {
    name: "Voice Onboarding",
    source: "voice-send-onboarding",
    subject: "Welcome to Voice Studio! 🎵 — Your Lesson Booking",
    when: "Sent on voice lesson booking (calendar or Cal.com embed). Only for paid lessons (cost > 0).",
    sections: [
      "Rose accent bar (#E11D48)",
      "Music note emoji (🎵)",
      "'Welcome to Voice Studio' heading",
      "'Lesson Confirmed' badge",
      "Lesson details card: Date + Time + Duration",
      "Payment section: 'Pay Now' button via Stripe (only if cost > 0)",
      "'Complete Student Profile' CTA linking to /voice-onboarding/:email (always shown)",
      "Signature: Daniele Buatti, Voice Coach",
      "BCC: daniele.buatti@gmail.com",
    ],
    htmlSkeleton: `<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; font-family: sans-serif;">
  <center style="width: 100%; padding: 40px 0;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 40px; overflow: hidden;">
      <tr><td style="height: 6px; background-color: #E11D48;"></td></tr>
      <tr>
        <td style="padding: 56px 40px; text-align: center;">
          <div style="font-size: 48px; margin-bottom: 16px;">🎵</div>
          <div style="color: #1E293B; font-size: 28px; font-weight: 700;">Welcome to Voice Studio</div>
          <div style="color: #E11D48; font-size: 11px; font-weight: 900; letter-spacing: 0.4em; margin-top: 12px; text-transform: uppercase;">Lesson Confirmed</div>

          <div style="text-align: left; margin-top: 40px; line-height: 1.8; font-size: 16px; color: #475569;">
            <p>Hi {firstName},</p>
            <p>Thanks for booking a voice lesson! Here's your session details:</p>

            {lessonDetailsCard}

            {paymentSection}

            <div style="text-align: center; padding: 12px 0 28px;">
              <a href="{onboardingUrl}" style="display: inline-block; background-color: #E11D48; color: #ffffff; padding: 16px 40px; border-radius: 100px; text-decoration: none; font-weight: 700; font-size: 15px;">Complete Student Profile</a>
            </div>
            <p style="font-size: 13px; color: #94A3B8; text-align: center;">Tell me about your goals, experience level, and what you'd like to focus on.</p>

            <p>I'm looking forward to working with you!</p>
          </div>

          <div style="border-top: 1px solid #F1F5F9; margin-top: 40px; padding-top: 32px; text-align: left;">
            <div style="font-weight: 700; color: #1E293B; font-size: 18px;">Daniele Buatti</div>
            <div style="color: #E11D48; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;">Voice Coach</div>
          </div>
        </td>
      </tr>
    </table>
  </center>
</body>
</html>`,
  },
  {
    name: "Voice Payment Confirmation",
    source: "voice-stripe-webhook",
    subject: "Payment received 🎵 — Your lesson is confirmed",
    when: "Sent automatically when voice Stripe webhook processes a successful payment.",
    sections: [
      "Rose accent bar (#E11D48)",
      "Green checkmark emoji (✅)",
      "'Payment Received' badge",
      "'Thank you, {name}! 🎵' heading",
      "Payment amount + lesson date confirmation",
      "Signature: Daniele Buatti, Voice Coach",
    ],
    htmlSkeleton: `<!DOCTYPE html><html><body style="margin:0;padding:0;font-family:sans-serif;">
  <center style="width:100%;padding:40px 0;background:#f8fafc;">
    <table role="presentation" width="100%" style="max-width:560px;margin:0 auto;background:#fff;border-radius:32px;overflow:hidden;">
      <tr><td style="height:6px;background:#E11D48;"></td></tr>
      <tr><td style="padding:48px 40px;text-align:center;">
        <div style="font-size:44px;">✅</div>
        <div style="color:#E11D48;font-size:11px;font-weight:900;letter-spacing:0.3em;text-transform:uppercase;margin-top:12px;">Payment Received</div>
        <h1 style="color:#1E293B;font-size:24px;margin:12px 0 8px;">Thank you, {name}! 🎵</h1>
        <p style="color:#475569;font-size:15px;line-height:1.6;">Your payment{amountSection} is confirmed{lessonDateSection}. Your spot is locked in — I'm looking forward to working with you.</p>
        <div style="border-top:1px solid #F1F5F9;margin-top:32px;padding-top:24px;text-align:left;">
          <div style="font-weight:700;color:#1E293B;">Daniele Buatti</div>
          <div style="color:#E11D48;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;">Voice Coach</div>
        </div>
      </td></tr>
    </table>
  </center>
</body></html>`,
  },
];

const FNH_STATES: StateNode[] = [
  { state: "1. New Client", description: "Client record created via Cal.com webhook or manual entry. No appointments yet.", details: "Initial state. Client exists only in the database with basic contact info (name, email, phone). No appointments, no onboarding sent.", transitions: [{ to: "Onboarding Sent", via: "Manual 'Send Onboarding' from client detail / settings / client audit" }, { to: "Appointment Booked", via: "Calendar slot booking / QuickBook / AppointmentForm" }] },
  { state: "2. Onboarding Sent", description: "send-manual-onboarding email sent with intake form link + payment link", details: "Confirmation email sent. Intake CTA included only if <50% of fields are filled. Payment link always included if priceAmount > 0.", transitions: [{ to: "Onboarding Complete", via: "Client submits intake form at /onboarding/:id (≥50% fields filled)" }, { to: "Appointment Booked", via: "Booking created while onboarding is still pending" }, { to: "Onboarding Re-sent", via: "'Resend' from client detail / BookingsList kebab menu" }] },
  { state: "3. Onboarding Complete", description: "≥50% of intake form fields filled (checked by isIntakeFormFilled())", details: "Intake form marked complete. 42 intake-specific columns checked. Future emails will NOT include the intake CTA. Client health history, stress levels, goals, and preferences now available in CRM.", transitions: [{ to: "Appointment Booked", via: "New booking created" }, { to: "Re-engagement", via: "No recent appointments (6+ months gap)" }] },
  { state: "4. Appointment Booked", description: "Appointment exists in Supabase + Cal.com", details: "Cal.com booking created. Supabase appointments row written (via create-calcom-booking or calcom-webhook). Booking has status='Scheduled', date, time, event type ID, price amount.", transitions: [{ to: "Payment Link Sent", via: "Automatic on booking (paid sessions) or manual 'Send payment link' from BookingsList" }, { to: "Completed", via: "Session happens without payment link needed (free session)" }, { to: "Cancelled", via: "Booking cancelled via BookingsList kebab menu or Cal.com" }, { to: "Rescheduled", via: "Reschedule via BookingsList kebab menu" }] },
  { state: "5. Payment Link Sent", description: "Stripe Checkout Session created and emailed to client", details: "Stripe payment link generated and included in confirmation email. appointments.payment_link updated with Stripe URL. Link can be resent multiple times (new session each time).", transitions: [{ to: "Payment Received", via: "Stripe webhook (checkout.session.completed) or manual 'Mark as paid'" }, { to: "Payment Link Re-sent", via: "'Resend payment link' from BookingsList kebab menu" }] },
  { state: "6. Payment Received", description: "payment_received = true. Session financially settled.", details: "Updated by stripe-webhook (4-tier matching) or manual 'Mark as paid' toggle. Payment confirmation email sent. Payment method recorded (Stripe / manual).", transitions: [{ to: "Completed", via: "Appointment status marked complete by practitioner" }, { to: "Active", via: "Has ongoing care (multiple appointments in regular cadence)" }] },
  { state: "7. Completed", description: "Appointment status = Completed", details: "Practitioner marks appointment as completed. Clinical notes, assessments, and outcomes recorded in the session tabs.", transitions: [{ to: "Active", via: "Has ongoing appointments booked" }, { to: "Re-engagement", via: "No recent appointments (6+ months gap)" }] },
  { state: "8. Active", description: "Regular client with ongoing appointments. No onboarding needed.", details: "Client in regular care cadence. Confirmation emails still sent for new bookings but with no intake CTA (already complete). Payment links still sent for paid sessions.", transitions: [{ to: "Re-engagement", via: "No recent appointments / extended gap" }, { to: "Completed", via: "Individual session completed (with more upcoming)" }] },
  { state: "9. Re-engagement", description: "Previous client with no recent activity. May receive re-engagement outreach.", details: "Gap of 6+ months since last appointment. No automatic re-engagement email exists yet — practitioner manually reaches out or uses the Client Audit page to find inactive clients.", transitions: [{ to: "Appointment Booked", via: "New booking after hiatus (returns to flow at step 4)" }] },
  { state: "10. Cancelled", description: "Appointment cancelled. Client record remains.", details: "Cal.com booking cancelled. Appointments row updated to status='Cancelled'. Client record intact. Can be re-booked at any time.", transitions: [{ to: "Appointment Booked", via: "New booking (client re-books)" }] },
];

const DB_TABLES: DbTable[] = [
  { name: "clients", description: "All FNH client records. Contains 40+ intake form columns (added by supabase_intake_form.sql migration).", usedBy: ["send-manual-onboarding", "calcom-webhook", "sync-calcom-bookings", "sync-to-notion", "stripe-webhook", "create-calcom-booking"], keyFields: ["id (UUID)", "email", "name", "standard_rate", "stripe_customer_id", "notion_page_id", "onboarding_submitted_at", "40+ intake fields (goals, health_history, stress_level, etc.)"] },
  { name: "appointments", description: "FNH appointment records. One row per booking. Linked to clients via client_id.", usedBy: ["send-manual-onboarding", "stripe-webhook", "calcom-webhook", "sync-calcom-bookings", "sync-to-notion", "create-calcom-booking"], keyFields: ["id (UUID)", "client_id (FK → clients)", "user_id (FK → profiles)", "date", "calcom_booking_id", "calcom_event_type_id", "status (Scheduled/Cancelled/Completed)", "price_amount", "price_currency", "is_paid", "payment_received", "payment_method", "payment_link"] },
  { name: "profiles", description: "Practitioner profiles. Single row (one practitioner).", usedBy: ["calcom-webhook", "sync-calcom-bookings", "sync-to-notion"], keyFields: ["id (UUID)", "email", "name"] },
  { name: "voice_bookings", description: "Voice lesson bookings. Linked to Cal.com via calcom_booking_id.", usedBy: ["calcom-voice-webhook", "voice-stripe-webhook", "voice-mark-paid", "voice-create-booking", "voice-resolve-booking", "voice-cancel-lesson", "voice-schedule-lesson", "voice-backfill"], keyFields: ["id", "student_name", "student_email", "lesson_date", "cost", "status (scheduled/paid/cancelled/rescheduled)", "calcom_booking_id", "notion_lesson_id_1", "notion_lesson_id_2"] },
  { name: "voice_onboarding", description: "Voice student onboarding/profile submissions.", usedBy: ["voice-send-onboarding", "voice-submit-onboarding", "calcom-voice-webhook"], keyFields: ["email (PK)", "name", "mobile", "goals", "experience_level", "additional_notes", "onboarding_completed", "submitted_at"] },
  { name: "event_pricing", description: "Cal.com event type pricing configuration.", usedBy: ["calcom-voice-webhook"], keyFields: ["calcom_event_type_id", "price", "duration_minutes", "send_payment_link (boolean)"] },
  { name: "webhook_failures", description: "Audit log for unmatched Stripe payments. Critical for reconciliation.", usedBy: ["stripe-webhook", "voice-stripe-webhook"], keyFields: ["id", "source", "event_type", "reference", "amount", "detail", "created_at"] },
  { name: "client_wins", description: "Client testimonials and success stories.", usedBy: ["sync-to-notion"], keyFields: ["id", "client_id", "content", "created_at"] },
];

const ENV_VARS: EnvVar[] = [
  { name: "SUPABASE_URL", description: "Supabase project URL", usedBy: ["ALL functions"] },
  { name: "SUPABASE_SERVICE_ROLE_KEY", description: "Supabase service-role key (full DB access)", usedBy: ["ALL functions"] },
  { name: "SUPABASE_ANON_KEY", description: "Supabase anonymous key (used by _shared/auth.ts)", usedBy: ["_shared/auth"] },
  { name: "STRIPE_SECRET_KEY", description: "Stripe API secret key", usedBy: ["send-manual-onboarding", "stripe-webhook", "voice-payment-link", "voice-stripe-webhook", "stripe-manager"] },
  { name: "STRIPE_WEBHOOK_SECRET_CRM", description: "Stripe webhook signing secret for FNH", usedBy: ["stripe-webhook"] },
  { name: "STRIPE_WEBHOOK_SECRET_VOICE", description: "Stripe webhook signing secret for Voice", usedBy: ["voice-stripe-webhook"] },
  { name: "GMAIL_CLIENT_ID", description: "Google OAuth client ID for Gmail API", usedBy: ["send-manual-onboarding", "stripe-webhook", "voice-stripe-webhook", "voice-send-onboarding"] },
  { name: "GMAIL_CLIENT_SECRET", description: "Google OAuth client secret for Gmail API", usedBy: ["send-manual-onboarding", "stripe-webhook", "voice-stripe-webhook", "voice-send-onboarding"] },
  { name: "GMAIL_REFRESH_TOKEN", description: "Google OAuth refresh token for Gmail API", usedBy: ["send-manual-onboarding", "stripe-webhook", "voice-stripe-webhook", "voice-send-onboarding"] },
  { name: "GMAIL_USER_EMAIL", description: "Sender email (daniele.buatti@gmail.com)", usedBy: ["send-manual-onboarding", "stripe-webhook", "voice-stripe-webhook", "voice-send-onboarding"] },
  { name: "CALCOM_API_KEY", description: "Cal.com API key (v2)", usedBy: ["create-calcom-booking", "sync-calcom-bookings", "calcom-webhook", "calcom-voice-webhook", "voice-create-booking", "voice-cancel-lesson", "voice-resolve-booking", "get-calcom-slots", "list-calcom-event-types", "manage-calcom-availability", "notion-to-calcom", "delete-external-appointment"] },
  { name: "NOTION_API_KEY", description: "Notion API key (internal integrations)", usedBy: ["calcom-voice-webhook", "voice-send-onboarding", "voice-create-booking", "voice-cancel-lesson", "voice-schedule-lesson", "voice-clients", "voice-lessons", "voice-backfill", "voice-backfill-db2", "voice-onboard", "voice-mark-paid", "voice-delete-student", "voice-log-contact", "voice-ics-feed", "sync-to-notion", "delete-external-appointment"] },
  { name: "GEMINI_API_KEY", description: "Google Gemini AI API key", usedBy: ["analyze-*", "generate-*", "prioritize-backlog"] },
  { name: "OPENROUTER_API_KEY", description: "OpenRouter API key (AI fallback)", usedBy: ["analyze-fractals", "prioritize-backlog"] },
  { name: "KIT_API_SECRET", description: "Kit (ConvertKit) API secret", usedBy: ["sync-to-kit"] },
  { name: "SITE_URL", description: "Public-facing site URL (default: https://kinesiology-app.vercel.app)", usedBy: ["send-manual-onboarding", "voice-send-onboarding", "voice-payment-link"] },
];

const EXTERNAL_APIS: ExternalApi[] = [
  { name: "Stripe API", endpoints: ["POST /v1/checkout/sessions (create payment link)", "POST /v1/customers (create/retrieve)", "Webhook: constructEvent (signature verification)"], usedBy: ["send-manual-onboarding", "stripe-webhook", "voice-payment-link", "voice-stripe-webhook", "stripe-manager"] },
  { name: "Google APIs", endpoints: ["POST oauth2.googleapis.com/token (OAuth refresh)", "POST gmail.googleapis.com/gmail/v1/users/me/messages/send (send email)"], usedBy: ["send-manual-onboarding", "stripe-webhook", "voice-stripe-webhook", "voice-send-onboarding", "send-rate-increase-email"] },
  { name: "Cal.com API (v2)", endpoints: ["POST /v2/bookings (create)", "POST /v2/bookings/{id}/cancel (cancel)", "POST /v2/bookings/{id}/reschedule (reschedule)", "POST /v2/bookings/{id}/confirm (confirm)", "GET /v2/bookings?status=upcoming (list)", "GET /v2/event-types (list event types)", "GET /v2/slots (get availability)"], usedBy: ["create-calcom-booking", "sync-calcom-bookings", "calcom-webhook", "calcom-voice-webhook", "voice-create-booking", "voice-cancel-lesson", "voice-resolve-booking", "get-calcom-slots", "list-calcom-event-types"] },
  { name: "Notion API", endpoints: ["POST /v1/databases/{id}/query (query DB)", "POST /v1/pages (create page)", "PATCH /v1/pages/{id} (update/archive page)", "PATCH /v1/databases/{id} (configure schema)", "GET /v1/databases/{id} (fetch schema)"], usedBy: ["calcom-voice-webhook", "sync-to-notion", "voice-create-booking", "voice-stripe-webhook", "voice-send-onboarding", "voice-cancel-lesson", "delete-external-appointment"] },
  { name: "Internal Edge Functions", endpoints: ["POST {supabase_url}/functions/v1/voice-schedule-lesson", "POST {supabase_url}/functions/v1/voice-send-onboarding (called by webhook)"], usedBy: ["calcom-voice-webhook"] },
];

const NOTION_DB_IDS = [
  { name: "FNH Clients", id: "074e2c006bd541d88c502feb397ef31d", usedBy: "sync-to-notion" },
  { name: "FNH Appointments", id: "171f7156cdc645e8b689af13d217bc7c", usedBy: "sync-to-notion" },
  { name: "Finance / Planner", id: "11caad21cd0980d8a3eeeffb27fc43c0", usedBy: "sync-to-notion, voice-lessons DB2" },
  { name: "Voice Clients", id: "af3e38f400d84dc8975eff4b6269157b", usedBy: "calcom-voice-webhook, sync-to-notion" },
  { name: "Voice Lessons DB1", id: "8d6369c637c8425fb007adf261f8e576", usedBy: "calcom-voice-webhook, voice-create-booking" },
];

const EVENT_TYPE_IDS = [
  { id: 4279898, name: "Kinesiology Session", price: "$70", system: "FNH" },
  { id: 5302336, name: "Full Price Session", price: "$100", system: "FNH" },
  { id: 5927215, name: "Free Session", price: "$0", system: "FNH" },
  { id: 1945081, name: "Voice Lesson (Default)", price: "Varies", system: "Voice" },
];

const WorkflowDebuggerPage = () => {
  const navigate = useNavigate();
  const [expandedWorkflows, setExpandedWorkflows] = useState<Set<string>>(new Set(WORKFLOWS.map(w => w.id)));
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["workflows", "edge-functions", "email-templates", "state-machine", "database", "env-vars", "external-apis"]));
  const [expandedFunctions, setExpandedFunctions] = useState<Set<string>>(new Set(EDGE_FUNCTIONS.map(f => f.name)));
  const [expandedTemplates, setExpandedTemplates] = useState<Set<string>>(new Set(EMAIL_TEMPLATES.map(t => t.name)));
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const toggleWorkflow = (id: string) => {
    const next = new Set(expandedWorkflows);
    if (next.has(id)) next.delete(id); else next.add(id);
    setExpandedWorkflows(next);
  };

  const toggleSection = (id: string) => {
    const next = new Set(expandedSections);
    if (next.has(id)) next.delete(id); else next.add(id);
    setExpandedSections(next);
  };

  const toggleFunction = (id: string) => {
    const next = new Set(expandedFunctions);
    if (next.has(id)) next.delete(id); else next.add(id);
    setExpandedFunctions(next);
  };

  const toggleTemplate = (id: string) => {
    const next = new Set(expandedTemplates);
    if (next.has(id)) next.delete(id); else next.add(id);
    setExpandedTemplates(next);
  };

  const filteredWorkflows = WORKFLOWS.filter(w => {
    if (search && !w.title.toLowerCase().includes(search.toLowerCase()) && !w.trigger.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === "all") return true;
    return w.category === filter;
  });

  const selectAll = () => {
    setExpandedWorkflows(new Set(WORKFLOWS.map(w => w.id)));
    setExpandedFunctions(new Set(EDGE_FUNCTIONS.map(f => f.name)));
    setExpandedTemplates(new Set(EMAIL_TEMPLATES.map(t => t.name)));
    setExpandedSections(new Set(["workflows", "edge-functions", "email-templates", "state-machine", "database", "env-vars", "external-apis"]));
  };

  const collapseAll = () => {
    setExpandedWorkflows(new Set());
    setExpandedFunctions(new Set());
    setExpandedTemplates(new Set());
    setExpandedSections(new Set());
  };

  const typeIcon = (type: StepType) => {
    switch (type) {
      case "trigger": return <Globe size={12} />;
      case "edge-function": return <Zap size={12} />;
      case "email": return <Mail size={12} />;
      case "db-write": return <Database size={12} />;
      case "ui": return <User size={12} />;
      case "decision": return <AlertTriangle size={12} />;
      case "webhook": return <Webhook size={12} />;
      default: return <Zap size={12} />;
    }
  };

  const stepBadge = (type: string, badgeColor?: string) => {
    const colorMap: Record<string, string> = {
      indigo: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300",
      amber: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
      emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
      rose: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
      slate: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
      purple: "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300",
      cyan: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300",
      default: "bg-muted text-muted-foreground",
    };
    return colorMap[badgeColor || "default"] || colorMap.default;
  };

  const collapseAllSections = () => {
    setExpandedSections(new Set());
    setExpandedWorkflows(new Set());
    setExpandedFunctions(new Set());
    setExpandedTemplates(new Set());
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showSuccess("Copied to clipboard!");
    } catch {
      showSuccess("Failed to copy to clipboard.");
    }
  };

  const copyAll = () => {
    const lines: string[] = [];

    // Header
    lines.push("# Workflow Debugger — Full Export");
    lines.push("");

    // Workflows
    lines.push("## Workflows");
    lines.push("");
    WORKFLOWS.forEach((wf) => {
      lines.push(`### ${wf.title} [${wf.category.toUpperCase()}]`);
      lines.push(`**Trigger:** ${wf.trigger}`);
      lines.push(`**Trigger Detail:** ${wf.triggerDetail}`);
      lines.push("");
      lines.push("**Steps:**");
      wf.steps.forEach((s, i) => {
        lines.push(`${i + 1}. **[${s.type}]** ${s.label} — ${s.desc}`);
        if (s.fileRef) lines.push(`   - File: ${s.fileRef}`);
      });
      if (wf.emailSubject) lines.push(`\n**Email:** ${wf.emailSubject}`);
      if (wf.errorStates?.length) lines.push(`\n**Error States:** ${wf.errorStates.join(", ")}`);
      if (wf.notes) lines.push(`\n**Notes:** ${wf.notes}`);
      lines.push("");
    });

    // Edge Functions
    lines.push("## Edge Functions");
    lines.push("");
    EDGE_FUNCTIONS.forEach((ef) => {
      lines.push(`### ${ef.name}`);
      lines.push(`**Description:** ${ef.description}`);
      lines.push(`**Triggers:** ${ef.triggers.join(", ")}`);
      lines.push(`**Calls:** ${ef.calls.join(", ")}`);
      lines.push(`**Env Vars:** ${ef.envVars.join(", ")}`);
      lines.push(`**DB Tables:** ${ef.dbTables.join(", ")}`);
      lines.push(`**Auth:** ${ef.authGuard}`);
      if (ef.codePattern) lines.push(`**Code Flow:** ${ef.codePattern}`);
      if (ef.errorHandling) lines.push(`**Error Handling:** ${ef.errorHandling}`);
      if (ef.emailSubject) lines.push(`**Email Subject:** ${ef.emailSubject}`);
      if (ef.notes) lines.push(`**Notes:** ${ef.notes}`);
      lines.push("");
    });

    // Email Templates
    lines.push("## Email Templates");
    lines.push("");
    EMAIL_TEMPLATES.forEach((tmpl) => {
      lines.push(`### ${tmpl.name}`);
      lines.push(`**Source:** ${tmpl.source}`);
      lines.push(`**Subject:** ${tmpl.subject}`);
      lines.push(`**When Sent:** ${tmpl.when}`);
      lines.push("");
      lines.push("**Sections:**");
      tmpl.sections.forEach((s) => lines.push(`- ${s}`));
      lines.push("");
      lines.push("**HTML Skeleton:**");
      lines.push("```html");
      lines.push(tmpl.htmlSkeleton);
      lines.push("```");
      lines.push("");
    });

    // State Machine
    lines.push("## Client State Machine");
    lines.push("");
    FNH_STATES.forEach((st) => {
      lines.push(`### ${st.state}`);
      lines.push(`**Description:** ${st.description}`);
      lines.push(`**Details:** ${st.details}`);
      st.transitions.forEach((t) => lines.push(`- → **${t.to}** via ${t.via}`));
      lines.push("");
    });

    // DB Tables
    lines.push("## Database Tables");
    lines.push("");
    DB_TABLES.forEach((tbl) => {
      lines.push(`### ${tbl.name}`);
      lines.push(`**Description:** ${tbl.description}`);
      lines.push(`**Key Fields:** ${tbl.keyFields.join(", ")}`);
      lines.push(`**Used By:** ${tbl.usedBy.join(", ")}`);
      lines.push("");
    });

    lines.push("### Notion Database IDs");
    NOTION_DB_IDS.forEach((ndb) => {
      lines.push(`- **${ndb.name}:** \`${ndb.id}\` (${ndb.usedBy})`);
    });
    lines.push("");

    lines.push("### Cal.com Event Types");
    EVENT_TYPE_IDS.forEach((et) => {
      lines.push(`- **${et.name}:** ID \`${et.id}\` — ${et.price} · ${et.system}`);
    });
    lines.push("");

    // Env Vars
    lines.push("## Environment Variables");
    lines.push("");
    ENV_VARS.forEach((ev) => {
      lines.push(`- **${ev.name}:** ${ev.description} (used by: ${ev.usedBy.join(", ")})`);
    });
    lines.push("");

    // External APIs
    lines.push("## External APIs");
    lines.push("");
    EXTERNAL_APIS.forEach((api) => {
      lines.push(`### ${api.name}`);
      lines.push(`**Endpoints:**`);
      api.endpoints.forEach((ep) => lines.push(`- \`${ep}\``));
      lines.push(`**Used by:** ${api.usedBy.join(", ")}`);
      lines.push("");
    });

    copyToClipboard(lines.join("\n"));
  };

  const copySection = (section: string) => {
    const lines: string[] = [];
    const add = (s: string) => lines.push(s);

    switch (section) {
      case "workflows":
        add("# Workflows\n");
        WORKFLOWS.forEach((wf) => {
          add(`## ${wf.title} [${wf.category.toUpperCase()}]`);
          add(`Trigger: ${wf.trigger}`);
          add(`Trigger Detail: ${wf.triggerDetail}\n`);
          add("Steps:");
          wf.steps.forEach((s, i) => {
            add(`${i + 1}. [${s.type}] ${s.label} — ${s.desc}`);
            if (s.fileRef) add(`   File: ${s.fileRef}`);
          });
          if (wf.emailSubject) add(`\nEmail: ${wf.emailSubject}`);
          if (wf.errorStates?.length) add(`\nError States: ${wf.errorStates.join(", ")}`);
          if (wf.notes) add(`\nNotes: ${wf.notes}`);
          add("");
        });
        break;

      case "edge-functions":
        add("# Edge Functions\n");
        EDGE_FUNCTIONS.forEach((ef) => {
          add(`## ${ef.name}`);
          add(`Description: ${ef.description}`);
          add(`Triggers: ${ef.triggers.join(", ")}`);
          add(`Calls: ${ef.calls.join(", ")}`);
          add(`Env Vars: ${ef.envVars.join(", ")}`);
          add(`DB Tables: ${ef.dbTables.join(", ")}`);
          add(`Auth: ${ef.authGuard}`);
          if (ef.codePattern) add(`Code Flow: ${ef.codePattern}`);
          if (ef.errorHandling) add(`Error Handling: ${ef.errorHandling}`);
          if (ef.emailSubject) add(`Email Subject: ${ef.emailSubject}`);
          if (ef.notes) add(`Notes: ${ef.notes}`);
          add("");
        });
        break;

      case "email-templates":
        add("# Email Templates\n");
        EMAIL_TEMPLATES.forEach((tmpl) => {
          add(`## ${tmpl.name}`);
          add(`Source: ${tmpl.source}`);
          add(`Subject: ${tmpl.subject}`);
          add(`When Sent: ${tmpl.when}\n`);
          add("Sections:");
          tmpl.sections.forEach((s) => add(`- ${s}`));
          add("\nHTML Skeleton:");
          add("```html");
          add(tmpl.htmlSkeleton);
          add("```\n");
        });
        break;

      case "state-machine":
        add("# Client State Machine\n");
        FNH_STATES.forEach((st) => {
          add(`## ${st.state}`);
          add(`Description: ${st.description}`);
          add(`Details: ${st.details}`);
          st.transitions.forEach((t) => add(`- → ${t.to} via ${t.via}`));
          add("");
        });
        break;

      case "database":
        add("# Database Tables\n");
        DB_TABLES.forEach((tbl) => {
          add(`## ${tbl.name}`);
          add(`Description: ${tbl.description}`);
          add(`Key Fields: ${tbl.keyFields.join(", ")}`);
          add(`Used By: ${tbl.usedBy.join(", ")}\n`);
        });
        add("Notion Database IDs:\n");
        NOTION_DB_IDS.forEach((ndb) => add(`- ${ndb.name}: \`${ndb.id}\` (${ndb.usedBy})`));
        add("");
        add("Cal.com Event Types:\n");
        EVENT_TYPE_IDS.forEach((et) => add(`- ${et.name}: ID \`${et.id}\` — ${et.price} · ${et.system}`));
        break;

      case "env-vars":
        add("# Environment Variables\n");
        ENV_VARS.forEach((ev) => add(`- **${ev.name}:** ${ev.description}`));
        break;

      case "external-apis":
        add("# External APIs\n");
        EXTERNAL_APIS.forEach((api) => {
          add(`## ${api.name}`);
          add("Endpoints:");
          api.endpoints.forEach((ep) => add(`- \`${ep}\``));
          add(`Used by: ${api.usedBy.join(", ")}\n`);
        });
        break;
    }

    copyToClipboard(lines.join("\n"));
  };

  return (
    <AppLayout variant="workspace">
      <div className="space-y-8 animate-in fade-in duration-500 pb-20">
        <PageHeader
          title="Workflow Debugger"
          subtitle="Every booking workflow, email template, edge function, API integration, and client state across FNH and Voice."
          icon={Settings}
          iconClassName="bg-amber-600"
        />

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <div className="bg-card rounded-xl border border-border p-3 text-center">
            <div className="text-lg font-black text-amber-600">{WORKFLOWS.length}</div>
            <div className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Workflows</div>
          </div>
          <div className="bg-card rounded-xl border border-border p-3 text-center">
            <div className="text-lg font-black text-amber-600">{EDGE_FUNCTIONS.length}</div>
            <div className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Edge Functions</div>
          </div>
          <div className="bg-card rounded-xl border border-border p-3 text-center">
            <div className="text-lg font-black text-amber-600">{EMAIL_TEMPLATES.length}</div>
            <div className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Email Templates</div>
          </div>
          <div className="bg-card rounded-xl border border-border p-3 text-center">
            <div className="text-lg font-black text-amber-600">{FNH_STATES.length}</div>
            <div className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Client States</div>
          </div>
          <div className="bg-card rounded-xl border border-border p-3 text-center">
            <div className="text-lg font-black text-amber-600">{DB_TABLES.length}</div>
            <div className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">DB Tables</div>
          </div>
          <div className="bg-card rounded-xl border border-border p-3 text-center">
            <div className="text-lg font-black text-amber-600">{ENV_VARS.length}</div>
            <div className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Env Vars</div>
          </div>
          <div className="bg-card rounded-xl border border-border p-3 text-center">
            <div className="text-lg font-black text-amber-600">{EXTERNAL_APIS.length}</div>
            <div className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">External APIs</div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-muted rounded-xl p-0.5 border border-border">
            {["all", "fnh", "voice"].map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={cn("px-4 py-2 rounded-[10px] text-xs font-semibold transition-all", filter === f ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>{f === "all" ? "All" : f === "fnh" ? "FNH" : "Voice"}</button>
            ))}
          </div>
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search workflows..." className="pl-8 h-9 rounded-xl text-xs" />
          </div>
          <div className="flex gap-2 ml-auto">
            <button onClick={copyAll} className="text-xs font-semibold text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg border border-border hover:bg-muted/50 transition-all inline-flex items-center gap-1.5"><Copy size={12} />Copy all</button>
            <button onClick={selectAll} className="text-xs font-semibold text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg border border-border hover:bg-muted/50 transition-all">Expand all</button>
            <button onClick={collapseAll} className="text-xs font-semibold text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg border border-border hover:bg-muted/50 transition-all">Collapse all</button>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
           WORKFLOWS SECTION
           ══════════════════════════════════════════════════════════ */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <button onClick={() => toggleSection("workflows")} className="w-full flex items-center justify-between p-5 hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 flex items-center justify-center"><Workflow size={16} /></div>
              <div>
                <h3 className="font-black text-foreground text-sm">Workflows ({filteredWorkflows.length})</h3>
                <p className="text-xs text-muted-foreground font-medium">Every booking path, email trigger, intake flow, cancellation, reschedule, and sync</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={(e) => { e.stopPropagation(); copySection("workflows"); }} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all" title="Copy section"><Copy size={14} /></button>
              {expandedSections.has("workflows") ? <ChevronDown size={18} className="text-muted-foreground" /> : <ChevronRight size={18} className="text-muted-foreground" />}
            </div>
          </button>
          {expandedSections.has("workflows") && (
            <div className="px-5 pb-5 space-y-3">
              {filteredWorkflows.map((wf) => (
                <div key={wf.id} className="border border-border rounded-xl overflow-hidden">
                  <button onClick={() => toggleWorkflow(wf.id)} className="w-full flex items-center justify-between p-4 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-3">
                      {wf.category === "fnh" ? <Brain size={16} className="text-chart-primary" /> : <Mic size={16} className="text-chart-destructive" />}
                      <div className="text-left">
                        <div className="font-semibold text-sm text-foreground">{wf.title}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{wf.trigger}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {wf.emailSubject && <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-none text-[9px] font-semibold">Email</Badge>}
                      {wf.errorStates && <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-none text-[9px] font-semibold">{wf.errorStates.length} errors</Badge>}
                      {expandedWorkflows.has(wf.id) ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronRight size={14} className="text-muted-foreground" />}
                    </div>
                  </button>
                  {expandedWorkflows.has(wf.id) && (
                    <div className="px-4 pb-4">
                      {/* Trigger detail */}
                      <div className="flex gap-3 mb-3">
                        <div className="flex flex-col items-center">
                          <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 flex items-center justify-center text-[10px] font-bold"><Globe size={12} /></div>
                        </div>
                        <div className="pb-2 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-foreground">Trigger</span>
                            <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-none text-[9px] font-semibold">Trigger</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{wf.triggerDetail}</p>
                        </div>
                      </div>
                      {/* Steps */}
                      {wf.steps.map((step, si) => (
                        <div key={si} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold", stepBadge(step.type, step.badgeColor))}>{typeIcon(step.type)}</div>
                            {si < wf.steps.length - 1 && <div className="w-px flex-1 bg-border" />}
                          </div>
                          <div className={cn("pb-4 flex-1", si === wf.steps.length - 1 && "pb-0")}>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-foreground">{step.label}</span>
                              {step.badge && <Badge className={cn("border-none text-[9px] font-semibold", stepBadge(step.type, step.badgeColor))}>{step.badge}</Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
                            {step.fileRef && (
                              <div className="flex items-center gap-1 mt-1">
                                <FileText size={10} className="text-muted-foreground/60" />
                                <span className="text-[9px] font-mono text-muted-foreground/60">{step.fileRef}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {/* Email info */}
                      {wf.emailSubject && (
                        <div className="mt-2 p-3 bg-muted/30 rounded-lg border border-border/50">
                          <div className="flex items-center gap-2 text-xs font-semibold text-foreground"><Mail size={12} /><span>Email: {wf.emailSubject}</span></div>
                          {wf.emailPreview && <p className="text-xs text-muted-foreground mt-1">{wf.emailPreview}</p>}
                        </div>
                      )}
                      {/* Error states */}
                      {wf.errorStates && wf.errorStates.length > 0 && (
                        <div className="mt-2 p-3 bg-rose-50/50 dark:bg-rose-950/20 rounded-lg border border-rose-200/50 dark:border-rose-900/50">
                          <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 dark:text-rose-400"><XCircle size={12} /><span>Error States ({wf.errorStates.length})</span></div>
                          <ul className="mt-1 space-y-0.5">
                            {wf.errorStates.map((e, i) => (
                              <li key={i} className="text-[10px] text-rose-500/80 dark:text-rose-400/80 flex items-start gap-1"><span className="mt-0.5">•</span> {e}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {/* Notes */}
                      {wf.notes && (
                        <div className="mt-2 p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-lg border border-amber-200/50 dark:border-amber-900/50">
                          <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400"><BookOpen size={12} /><span>Notes</span></div>
                          <p className="text-[10px] text-amber-600/80 dark:text-amber-400/80 mt-0.5">{wf.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════
           EDGE FUNCTIONS SECTION
           ══════════════════════════════════════════════════════════ */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <button onClick={() => toggleSection("edge-functions")} className="w-full flex items-center justify-between p-5 hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 flex items-center justify-center"><Zap size={16} /></div>
              <div><h3 className="font-black text-foreground text-sm">Edge Functions ({EDGE_FUNCTIONS.length})</h3><p className="text-xs text-muted-foreground font-medium">Supabase edge functions — triggers, call chains, env vars, DB tables, error handling</p></div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={(e) => { e.stopPropagation(); copySection("edge-functions"); }} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all" title="Copy section"><Copy size={14} /></button>
              {expandedSections.has("edge-functions") ? <ChevronDown size={18} className="text-muted-foreground" /> : <ChevronRight size={18} className="text-muted-foreground" />}
            </div>
          </button>
          {expandedSections.has("edge-functions") && (
            <div className="px-5 pb-5 space-y-2">
              {EDGE_FUNCTIONS.map((ef) => (
                <div key={ef.name} className="border border-border rounded-xl overflow-hidden">
                  <button onClick={() => toggleFunction(ef.name)} className="w-full flex items-center justify-between p-3 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-2">
                      <Zap size={14} className={ef.name.startsWith("voice") ? "text-rose-500" : "text-amber-500"} />
                      <span className="font-semibold text-xs text-foreground">{ef.name}</span>
                      {ef.emailSubject && <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-none text-[9px] font-semibold">Email</Badge>}
                      {ef.authGuard.includes("webhook") && <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-none text-[9px] font-semibold">Webhook</Badge>}
                      {ef.authGuard.includes("requireUser") && <Badge className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-none text-[9px] font-semibold">Auth</Badge>}
                    </div>
                    {expandedFunctions.has(ef.name) ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronRight size={14} className="text-muted-foreground" />}
                  </button>
                  {expandedFunctions.has(ef.name) && (
                    <div className="px-3 pb-3 space-y-3 text-xs">
                      <p className="text-muted-foreground leading-relaxed">{ef.description}</p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3 bg-muted/30 rounded-xl border border-border/50">
                          <div className="font-semibold text-foreground mb-1 flex items-center gap-1.5"><Zap size={12} /> Triggers</div>
                          <ul className="space-y-0.5">
                            {ef.triggers.map((t, i) => <li key={i} className="text-muted-foreground flex items-start gap-1"><span className="text-foreground/40 mt-0.5">•</span> {t}</li>)}
                          </ul>
                        </div>
                        <div className="p-3 bg-muted/30 rounded-xl border border-border/50">
                          <div className="font-semibold text-foreground mb-1 flex items-center gap-1.5"><Cloud size={12} /> Calls</div>
                          <ul className="space-y-0.5">
                            {ef.calls.map((c, i) => <li key={i} className="text-muted-foreground flex items-start gap-1"><span className="text-foreground/40 mt-0.5">•</span> {c}</li>)}
                          </ul>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3 bg-muted/30 rounded-xl border border-border/50">
                          <div className="font-semibold text-foreground mb-1 flex items-center gap-1.5"><Hash size={12} /> Env Vars ({ef.envVars.length})</div>
                          <div className="flex flex-wrap gap-1">
                            {ef.envVars.map((v) => <Badge key={v} className="bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300 border-none text-[9px] font-mono">{v}</Badge>)}
                          </div>
                        </div>
                        <div className="p-3 bg-muted/30 rounded-xl border border-border/50">
                          <div className="font-semibold text-foreground mb-1 flex items-center gap-1.5"><Database size={12} /> DB Tables ({ef.dbTables.length})</div>
                          <div className="flex flex-wrap gap-1">
                            {ef.dbTables.map((t) => <Badge key={t} className="bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-none text-[9px] font-mono">{t}</Badge>)}
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-muted/30 rounded-xl border border-border/50">
                        <div className="font-semibold text-foreground mb-1 flex items-center gap-1.5"><Shield size={12} /> Auth</div>
                        <span className="text-muted-foreground">{ef.authGuard}</span>
                      </div>

                      {ef.codePattern && (
                        <div className="p-3 bg-muted/30 rounded-xl border border-border/50">
                          <div className="font-semibold text-foreground mb-1 flex items-center gap-1.5"><Terminal size={12} /> Code Flow</div>
                          <p className="text-muted-foreground font-mono text-[10px] leading-relaxed">{ef.codePattern}</p>
                        </div>
                      )}

                      {ef.errorHandling && (
                        <div className="p-3 bg-rose-50/50 dark:bg-rose-950/20 rounded-xl border border-rose-200/50 dark:border-rose-900/50">
                          <div className="font-semibold text-rose-600 dark:text-rose-400 mb-1 flex items-center gap-1.5"><AlertTriangle size={12} /> Error Handling</div>
                          <p className="text-rose-500/80 dark:text-rose-400/80 text-[10px]">{ef.errorHandling}</p>
                        </div>
                      )}

                      {ef.emailSubject && (
                        <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200/50 dark:border-emerald-900/50">
                          <div className="font-semibold text-emerald-600 dark:text-emerald-400 mb-1 flex items-center gap-1.5"><Mail size={12} /> Email Subject</div>
                          <span className="text-emerald-600/80 dark:text-emerald-400/80 font-mono text-[10px]">{ef.emailSubject}</span>
                        </div>
                      )}

                      {ef.notes && (
                        <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200/50 dark:border-amber-900/50">
                          <div className="font-semibold text-amber-600 dark:text-amber-400 mb-1 flex items-center gap-1.5"><BookOpen size={12} /> Notes</div>
                          <p className="text-amber-600/80 dark:text-amber-400/80 text-[10px]">{ef.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════
           EMAIL TEMPLATES SECTION
           ══════════════════════════════════════════════════════════ */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <button onClick={() => toggleSection("email-templates")} className="w-full flex items-center justify-between p-5 hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center justify-center"><Mail size={16} /></div>
              <div><h3 className="font-black text-foreground text-sm">Email Templates ({EMAIL_TEMPLATES.length})</h3><p className="text-xs text-muted-foreground font-medium">Full email templates with HTML structure and section breakdowns</p></div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={(e) => { e.stopPropagation(); copySection("email-templates"); }} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all" title="Copy section"><Copy size={14} /></button>
              {expandedSections.has("email-templates") ? <ChevronDown size={18} className="text-muted-foreground" /> : <ChevronRight size={18} className="text-muted-foreground" />}
            </div>
          </button>
          {expandedSections.has("email-templates") && (
            <div className="px-5 pb-5 space-y-4">
              {EMAIL_TEMPLATES.map((tmpl) => (
                <div key={tmpl.name} className="border border-border rounded-xl overflow-hidden">
                  <button onClick={() => toggleTemplate(tmpl.name)} className="w-full flex items-center justify-between p-4 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-emerald-500" />
                      <span className="font-bold text-sm text-foreground">{tmpl.name}</span>
                      <Badge className="bg-muted text-muted-foreground border-none text-[9px] font-semibold">{tmpl.source}</Badge>
                    </div>
                    {expandedTemplates.has(tmpl.name) ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronRight size={14} className="text-muted-foreground" />}
                  </button>
                  {expandedTemplates.has(tmpl.name) && (
                    <div className="px-4 pb-4 space-y-3 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3 bg-muted/30 rounded-xl border border-border/50">
                          <div className="font-semibold text-foreground mb-1">Subject</div>
                          <span className="text-muted-foreground font-mono text-[10px]">{tmpl.subject}</span>
                        </div>
                        <div className="p-3 bg-muted/30 rounded-xl border border-border/50">
                          <div className="font-semibold text-foreground mb-1">When Sent</div>
                          <span className="text-muted-foreground text-[10px]">{tmpl.when}</span>
                        </div>
                      </div>

                      <div className="p-3 bg-muted/30 rounded-xl border border-border/50">
                        <div className="font-semibold text-foreground mb-2">Sections</div>
                        <ul className="space-y-1">
                          {tmpl.sections.map((s, i) => (
                            <li key={i} className="text-muted-foreground flex items-start gap-1.5 text-[10px]">
                              <span className="text-emerald-500 mt-0.5 shrink-0">✦</span> {s}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-3 bg-slate-50 dark:bg-slate-950/30 rounded-xl border border-border/50 overflow-x-auto">
                        <div className="font-semibold text-foreground mb-2 flex items-center gap-1.5"><Code size={12} /> HTML Skeleton</div>
                        <pre className="text-[9px] text-muted-foreground font-mono leading-relaxed whitespace-pre-wrap break-all">{tmpl.htmlSkeleton}</pre>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════
           CLIENT STATE MACHINE SECTION
           ══════════════════════════════════════════════════════════ */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <button onClick={() => toggleSection("state-machine")} className="w-full flex items-center justify-between p-5 hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 flex items-center justify-center"><Brain size={16} /></div>
              <div><h3 className="font-black text-foreground text-sm">Client State Machine ({FNH_STATES.length} states)</h3><p className="text-xs text-muted-foreground font-medium">All possible FNH client states, transitions, and triggers — from New Client through Active, Re-engagement, and Cancelled</p></div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={(e) => { e.stopPropagation(); copySection("state-machine"); }} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all" title="Copy section"><Copy size={14} /></button>
              {expandedSections.has("state-machine") ? <ChevronDown size={18} className="text-muted-foreground" /> : <ChevronRight size={18} className="text-muted-foreground" />}
            </div>
          </button>
          {expandedSections.has("state-machine") && (
            <div className="px-5 pb-5 space-y-3">
              {/* Flow diagram */}
              <div className="flex flex-wrap gap-2">
                {FNH_STATES.map((node, i) => (
                  <div key={node.state} className="flex items-start gap-1">
                    <div className="border border-border rounded-xl p-3 w-56 bg-card">
                      <div className="font-bold text-xs text-foreground">{node.state}</div>
                      <p className="text-[9px] text-muted-foreground mt-1 leading-relaxed">{node.description}</p>
                      <p className="text-[8px] text-muted-foreground/60 mt-1 italic">{node.details}</p>
                      {node.transitions.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-border/50">
                          {node.transitions.map((t) => (
                            <div key={t.to} className="flex items-start gap-1 text-[8px] text-muted-foreground mt-1">
                              <ArrowRight size={7} className="shrink-0 mt-0.5 text-primary" />
                              <div>
                                <span className="font-semibold text-foreground text-[9px]">{t.to}</span>
                                <span className="block text-muted-foreground/70">{t.via}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {i < FNH_STATES.length - 1 && (
                      <div className="hidden lg:flex items-center pt-6">
                        <ChevronRight size={12} className="text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════
           DATABASE TABLES SECTION
           ══════════════════════════════════════════════════════════ */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <button onClick={() => toggleSection("database")} className="w-full flex items-center justify-between p-5 hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 flex items-center justify-center"><Database size={16} /></div>
              <div><h3 className="font-black text-foreground text-sm">Database Tables ({DB_TABLES.length})</h3><p className="text-xs text-muted-foreground font-medium">Supabase tables used across all workflows and edge functions</p></div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={(e) => { e.stopPropagation(); copySection("database"); }} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all" title="Copy section"><Copy size={14} /></button>
              {expandedSections.has("database") ? <ChevronDown size={18} className="text-muted-foreground" /> : <ChevronRight size={18} className="text-muted-foreground" />}
            </div>
          </button>
          {expandedSections.has("database") && (
            <div className="px-5 pb-5 space-y-3">
              {/* Notion DBs */}
              <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
                <div className="font-semibold text-foreground text-xs mb-2 flex items-center gap-1.5"><BookOpen size={12} /> Notion Database IDs</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {NOTION_DB_IDS.map((ndb) => (
                    <div key={ndb.id} className="p-2 bg-background rounded-lg border border-border/50">
                      <div className="font-medium text-[10px] text-foreground">{ndb.name}</div>
                      <div className="text-[8px] font-mono text-muted-foreground mt-0.5">{ndb.id}</div>
                      <div className="text-[8px] text-muted-foreground/60">Used by: {ndb.usedBy}</div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Cal.com Event Types */}
              <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
                <div className="font-semibold text-foreground text-xs mb-2 flex items-center gap-1.5"><Calendar size={12} /> Cal.com Event Types</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {EVENT_TYPE_IDS.map((et) => (
                    <div key={et.id} className="p-2 bg-background rounded-lg border border-border/50">
                      <div className="font-medium text-[10px] text-foreground">{et.name}</div>
                      <div className="text-[8px] font-mono text-muted-foreground">ID: {et.id}</div>
                      <div className="text-[8px] text-muted-foreground">{et.price} · {et.system}</div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Supabase Tables */}
              {DB_TABLES.map((tbl) => (
                <div key={tbl.name} className="border border-border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Database size={14} className="text-purple-500" />
                    <span className="font-bold text-sm text-foreground">{tbl.name}</span>
                    <Badge className="bg-muted text-muted-foreground border-none text-[9px] font-semibold">{tbl.usedBy.length} functions</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{tbl.description}</p>
                  <div className="space-y-1 text-[10px]">
                    <div><span className="font-semibold text-foreground">Key fields:</span> <span className="text-muted-foreground font-mono">{tbl.keyFields.join(", ")}</span></div>
                    <div><span className="font-semibold text-foreground">Used by:</span> <span className="text-muted-foreground">{tbl.usedBy.join(", ")}</span></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════
           ENVIRONMENT VARIABLES SECTION
           ══════════════════════════════════════════════════════════ */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <button onClick={() => toggleSection("env-vars")} className="w-full flex items-center justify-between p-5 hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300 flex items-center justify-center"><Hash size={16} /></div>
              <div><h3 className="font-black text-foreground text-sm">Environment Variables ({ENV_VARS.length})</h3><p className="text-xs text-muted-foreground font-medium">All Supabase Edge Function secrets — API keys, OAuth credentials, and configuration</p></div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={(e) => { e.stopPropagation(); copySection("env-vars"); }} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all" title="Copy section"><Copy size={14} /></button>
              {expandedSections.has("env-vars") ? <ChevronDown size={18} className="text-muted-foreground" /> : <ChevronRight size={18} className="text-muted-foreground" />}
            </div>
          </button>
          {expandedSections.has("env-vars") && (
            <div className="px-5 pb-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {ENV_VARS.map((ev) => (
                  <div key={ev.name} className="border border-border rounded-xl p-3">
                    <div className="font-bold text-[10px] font-mono text-foreground break-all">{ev.name}</div>
                    <p className="text-[9px] text-muted-foreground mt-1">{ev.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {ev.usedBy.map((u) => <Badge key={u} className="bg-muted text-muted-foreground border-none text-[7px]">{u}</Badge>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════
           EXTERNAL APIS SECTION
           ══════════════════════════════════════════════════════════ */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <button onClick={() => toggleSection("external-apis")} className="w-full flex items-center justify-between p-5 hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 flex items-center justify-center"><Cloud size={16} /></div>
              <div><h3 className="font-black text-foreground text-sm">External APIs ({EXTERNAL_APIS.length})</h3><p className="text-xs text-muted-foreground font-medium">All third-party APIs integrated with the system</p></div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={(e) => { e.stopPropagation(); copySection("external-apis"); }} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all" title="Copy section"><Copy size={14} /></button>
              {expandedSections.has("external-apis") ? <ChevronDown size={18} className="text-muted-foreground" /> : <ChevronRight size={18} className="text-muted-foreground" />}
            </div>
          </button>
          {expandedSections.has("external-apis") && (
            <div className="px-5 pb-5 space-y-3">
              {EXTERNAL_APIS.map((api) => (
                <div key={api.name} className="border border-border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Cloud size={14} className="text-rose-500" />
                    <span className="font-bold text-sm text-foreground">{api.name}</span>
                    <Badge className="bg-muted text-muted-foreground border-none text-[9px] font-semibold">{api.usedBy.length} callers</Badge>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="font-semibold text-foreground">Endpoints:</div>
                    <ul className="space-y-0.5">
                      {api.endpoints.map((ep, i) => (
                        <li key={i} className="text-muted-foreground flex items-start gap-1.5 text-[10px]">
                          <ArrowRight size={8} className="shrink-0 mt-1 text-rose-400" />
                          <span className="font-mono">{ep}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-2"><span className="font-semibold text-foreground text-[10px]">Used by:</span> <span className="text-muted-foreground text-[10px]">{api.usedBy.join(", ")}</span></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default WorkflowDebuggerPage;
