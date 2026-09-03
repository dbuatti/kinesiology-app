#!/usr/bin/env bash
# lookup-client.sh — fetch today's upcoming clients from Supabase
# Usage: source this file, then call: lookup_client
# Falls back silently to manual input on any failure.

lookup_client() {
  local SUPABASE_URL="https://xebtjnvfkroiplyzftas.supabase.co"
  local API_KEY="sb_publishable_5SQI-COoQmCX2oM1CBiUHw_NnGOvWqJ"
  local NOW_UTC
  NOW_UTC=$(date -u +%Y-%m-%dT%H:%M:%SZ)

  # Fetch today's upcoming appointments (non-cancelled, non-practitioner)
  local RESPONSE
  RESPONSE=$(curl -s --max-time 3 \
    "${SUPABASE_URL}/rest/v1/appointments?select=id,date,status,clients!inner(name)&status=neq.Cancelled&date=gte.${NOW_UTC}&order=date.asc&limit=5" \
    -H "apikey: ${API_KEY}" \
    -H "Authorization: Bearer ${API_KEY}" 2>/dev/null)

  # Bail on empty or error
  if [[ -z "$RESPONSE" || "$RESPONSE" == "[]" || "$RESPONSE" == "null" ]]; then
    return 1
  fi

  # Parse JSON and filter to today only
  local TODAY
  TODAY=$(date +%Y-%m-%d)

  local CLIENTS
  CLIENTS=$(echo "$RESPONSE" | python3 -c "
import sys, json
from datetime import datetime

data = json.load(sys.stdin)
today = '${TODAY}'
results = []
for item in data:
    name = item.get('clients', {}).get('name', '')
    dt = item.get('date', '')
    if not name or not dt:
        continue
    # Parse ISO date and compare local date
    try:
        appt_date = datetime.fromisoformat(dt.replace('Z', '+00:00'))
        appt_local = appt_date.astimezone()
        if appt_local.strftime('%Y-%m-%d') == today:
            diff = (appt_date - datetime.now(appt_date.tzinfo)).total_seconds() / 60
            label = 'NOW' if diff <= 0 else f'{int(diff)}m'
            results.append(f'{name} ({label})')
    except Exception:
        continue
for r in results:
    print(r)
" 2>/dev/null)

  if [[ -z "$CLIENTS" ]]; then
    return 1
  fi

  echo "$CLIENTS"
  return 0
}
