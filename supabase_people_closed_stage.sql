-- Phase 5, step 4: one stage per person, now including "closed" (set by hand:
-- "Close — don't follow up"). Replaces Client audit's warm/cold/lost tag:
-- anyone tagged "lost" becomes closed; warm/cold are no longer used (the
-- computed stage — lead / active / at risk / lapsed — already says that).
-- Safe to run more than once. reengagement_tag is left in place for now.

alter table clients drop constraint if exists clients_lifecycle_status_check;
alter table clients add constraint clients_lifecycle_status_check
  check (lifecycle_status in ('lead', 'active', 'at_risk', 'lapsed', 'closed'));

update clients
set lifecycle_status = 'closed',
    lifecycle_status_manual = true,
    lifecycle_status_reason = 'Closed — don''t follow up (was "lost" in Client audit)',
    lifecycle_status_updated_at = now()
where reengagement_tag = 'lost'
  and not coalesce(lifecycle_status_manual, false);
