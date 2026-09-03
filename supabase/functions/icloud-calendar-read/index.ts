// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { requireUser } from "../_shared/auth.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

/**
 * Phase 3 — read the practitioner's iCloud calendar directly.
 *
 * The real, authoritative calendar is an iCloud published webcal feed (teaching,
 * appointments, etc.), not the Google primary calendar. This function fetches
 * the published ICS, parses it into VEVENTs, filters to the requested window,
 * and returns them in the same shape the Timetable's DayCell expects.
 *
 * The feed URL is read from the ICLOUD_CALDAV_URL secret (defaults to the
 * practitioner's published feed below if the secret is not yet set).
 */
const DEFAULT_FEED_URL = "https://p46-caldav.icloud.com/published/2/MTA5MzQ4OTc5NjEwOTM0OGybPqlLZWhAMr-Hq93vMQ7IDLBwdRlweNMoYAU5yll3"

// Australia/Melbourne DST: AEST = +10, AEDT = +11.
// DST runs from first Sunday in October (02:00) to first Sunday in April (03:00).
function melbourneOffsetMs(year, month0, day) {
  const firstOct = new Date(Date.UTC(year, 9, 1))
  const dstStartSunday = firstOct.getUTCDay() === 0 ? 1 : 1 + (7 - firstOct.getUTCDay())
  const dstStart = Date.UTC(year, 9, dstStartSunday, 1, 0, 0) // +02:00 local = 01:00 UTC

  const firstApr = new Date(Date.UTC(year, 3, 1))
  const dstEndSunday = firstApr.getUTCDay() === 0 ? 1 : 1 + (7 - firstApr.getUTCDay())
  const dstEnd = Date.UTC(year, 3, dstEndSunday, 2, 0, 0) // +03:00 local = 02:00 UTC

  const t = Date.UTC(year, month0, day)
  const inDst = t >= dstStart && t < dstEnd
  return (inDst ? 11 : 10) * 60 * 60 * 1000
}

// Convert a DATE or DATE-TIME token (locale-dependent) to a UTC epoch ms.
// DATE-TIME may carry TZID=Australia/Melbourne (local) or trailing Z (UTC).
// All-day string like 20130828 (no time) → midnight UTC (calendar dates have no tz).
function toUtcMs(token) {
  if (!token) return null
  const value = token.value
  const valueDate = token.params?.VALUE?.[0] === "DATE"
  const m = value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/)
  if (!m) return null
  const [, y, mo, d, h, mi, s, z] = m
  if (valueDate || !h) {
    // All-day date, no timezone → midnight UTC.
    return Date.UTC(y, mo - 1, d)
  }
  if (z === "Z") return Date.UTC(y, mo - 1, d, h, mi, s)
  // Local wall-clock in Australia/Melbourne.
  const offset = melbourneOffsetMs(+y, +mo - 1, +d)
  return Date.UTC(y, mo - 1, d, h, mi, s) - offset
}

// Unescape an ICS property VALUE.
function unescapeICS(value) {
  return (value || "")
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\")
}

// Parse ICS text into a list of {fields}, each field keyed with [{value, params}].
function parseICSEvents(text) {
  const unfolded = text.replace(/\r?\n[ \t]/g, "")
  const vevents = []
  const re = /BEGIN:VEVENT\r?\n([\s\S]*?)\r?\nEND:VEVENT/g
  let m
  while ((m = re.exec(unfolded)) !== null) {
    const body = m[1]
    const fields = {}
    const fieldRe = /^([A-Z0-9\-]+)(?:;([^:]*))?:(.*)$/gm
    let f
    while ((f = fieldRe.exec(body)) !== null) {
      if (!(f[1] in fields)) fields[f[1]] = []
      const params = {}
      if (f[2]) {
        f[2].split(";").forEach((p) => {
          const eq = p.indexOf("=")
          const key = eq === -1 ? p : p.slice(0, eq)
          const val = eq === -1 ? "true" : p.slice(eq + 1)
          params[key] = val.split(",")
        })
      }
      fields[f[1]].push({ value: f[3], params })
    }
    vevents.push(fields)
  }
  return vevents
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const authErr = await requireUser(req, corsHeaders)
  if (authErr) return authErr

  try {
    const { start, end } = await req.json().catch(() => ({}))
    if (!start || !end) throw new Error("Missing start/end.")

    const startMs = new Date(start).getTime()
    const endMs = new Date(end).getTime()

    const feedUrl = Deno.env.get("ICLOUD_CALDAV_URL") || DEFAULT_FEED_URL

    const icsRes = await fetch(feedUrl)
    if (!icsRes.ok) {
      return new Response(JSON.stringify({
        status: 'error',
        message: `iCloud feed error ${icsRes.status}: ${icsRes.statusText}`,
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const icsText = await icsRes.text()

    const vevents = parseICSEvents(icsText)

    const items = []
    for (const v of vevents) {
      const dtstart = v["DTSTART"]?.[0]
      if (!dtstart) continue

      const isDateOnly = dtstart.params?.VALUE?.[0] === "DATE" || !dtstart.value.includes("T")
      const sMs = toUtcMs(dtstart)
      if (sMs === null) continue

      let startIso, endIso = null
      if (isDateOnly) {
        startIso = dtstart.value.slice(0, 8).replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3")
        if (v["DTEND"]?.[0]) {
          const eMs = toUtcMs(v["DTEND"][0])
          // ICS all-day DTEND is exclusive; subtract a day for display.
          const e = new Date(eMs - 86400000)
          endIso = `${e.getUTCFullYear()}-${String(e.getUTCMonth() + 1).padStart(2, "0")}-${String(e.getUTCDate()).padStart(2, "0")}`
        } else {
          endIso = startIso
        }
      } else {
        startIso = new Date(sMs).toISOString()
        if (v["DTEND"]?.[0]) {
          const eMs = toUtcMs(v["DTEND"][0])
          endIso = eMs !== null ? new Date(eMs).toISOString() : null
        }
        if (!endIso) endIso = startIso
      }

      if (!startIso) continue

      // Window overlap check against UTC instants / calendar dates.
      const evStart = isDateOnly ? new Date(`${startIso}T00:00:00Z`).getTime() : new Date(startIso).getTime()
      const evEnd = isDateOnly
        ? new Date(`${endIso || startIso}T23:59:59Z`).getTime()
        : new Date(endIso || startIso).getTime()

      if (evEnd < startMs || evStart > endMs) continue

      items.push({
        source: 'icloud',
        id: v["UID"]?.[0]?.value || `ev${items.length}`,
        summary: unescapeICS(v["SUMMARY"]?.[0]?.value) || 'Busy',
        start: startIso,
        end: endIso,
        allDay: isDateOnly,
        location: unescapeICS(v["LOCATION"]?.[0]?.value) || null,
        transparent: false,
      })
    }

    items.sort((a, b) => (a.start > b.start ? 1 : a.start < b.start ? -1 : 0))

    return new Response(JSON.stringify({
      status: 'success',
      items,
      total: items.length,
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    console.error("[icloud-calendar-read] Error:", error.message)
    return new Response(JSON.stringify({ status: 'error', message: error.message }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
