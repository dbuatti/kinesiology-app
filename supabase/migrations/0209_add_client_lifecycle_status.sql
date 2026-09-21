-- Client conversion-funnel status (Lead / Active / At Risk / Lapsed). Distinct
-- from the existing `status` column (programme-tracking: Active/On Hold/Completed
-- Programme/Inactive) and from `reengagement_tag` (warm/cold/lost, ClientAuditPage's
-- own separate weekly-triage signal) — neither is touched by this migration.
-- Computed live by src/lib/clientStatus.ts; these columns exist to hold a manual
-- override, not as the primary read path (appointment data drifts daily).
alter table public.clients
  add column if not exists lifecycle_status text
    check (lifecycle_status in ('lead','active','at_risk','lapsed')),
  add column if not exists lifecycle_status_reason text,
  add column if not exists lifecycle_status_manual boolean not null default false,
  add column if not exists lifecycle_status_updated_at timestamptz;
