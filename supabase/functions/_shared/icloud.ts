// @ts-nocheck
/**
 * Shared iCloud published-calendar helper.
 *
 * The practitioner's authoritative calendar is an iCloud published webcal feed
 * (teaching, FNH, voice, appointments, personal). These helpers fetch and parse
 * that feed into plain events so edge functions (timetable read, schedule
 * email) can consume the same data without duplicating parsing logic.
 */

export const DEFAULT_FEED_URL = "https://p46-caldav.icloud.com/published/2/MTA5MzQ4OTc5NjEwOTM0OGybPqlLZWhAMr-Hq93vMQ7IDLBwdRlweNMoYAU5yll3"

export function feedUrl(): string {
  return Deno.env.get("ICLOUD_CALDAV_URL") || DEFAULT_FEED_URL
}

// Australia/Melbourne DST: AEST = +10, AEDT = +11. DST from first Sunday in
// October (02:00) to first Sunday in April (03:00).
function melbourneOffsetMs(year, month0, day) {
  const firstOct = new Date(Date.UTC(year, 9, 1))
  const dstStartSunday = firstOct.getUTCDay() === 0 ? 1 : 1 + (7 - firstOct.getUTCDay())
  const dstStart = Date.UTC(year, 9, dstStartSunday, 1, 0, 0)
  const firstApr = new Date(Date.UTC(year, 3, 1))
  const dstEndSunday = firstApr.getUTCDay() === 0 ? 1 : 1 + (7 - firstApr.getUTCDay())
  const dstEnd = Date.UTC(year, 3, dstEndSunday, 2, 0, 0)
  const t = Date.UTC(year, month0, day)
  const inDst = t >= dstStart && t < dstEnd
  return (inDst ? 11 : 10) * 60 * 60 * 1000
}

// Convert a DATE or DATE-TIME token to a UTC epoch ms. DATE-TIME may carry
// TZID=Australia/Melbourne (local) or a trailing Z (UTC). All-day DATEs are
// interpreted as midnight UTC.
function toUtcMs(token) {
  if (!token) return null
  const value = token.value
  const valueDate = token.params?.VALUE?.[0] === "DATE"
  const m = value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/)
  if (!m) return null
  const [, y, mo, d, h, mi, s, z] = m
  if (valueDate || !h) return Date.UTC(y, mo - 1, d)
  if (z === "Z") return Date.UTC(y, mo - 1, d, h, mi, s)
  const offset = melbourneOffsetMs(+y, +mo - 1, +d)
  return Date.UTC(y, mo - 1, d, h, mi, s) - offset
}

export function unescapeICS(value) {
  return (value || "")
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\")
}

// Parse ICS text into a list of {fields}, each keyed with [{value, params}].
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

export interface IcloudEvent {
  id: string
  summary: string
  start: string        // ISO string for timed, "yyyy-MM-dd" for all-day
  end: string | null
  allDay: boolean
  location: string | null
  startMs: number
  endMs: number
  isDateOnly: boolean
}

/**
 * Fetch and parse the iCloud feed into events overlapping [startMs, endMs].
 * Returns normalized events including computed UTC instants for the window
 * check.
 */
export async function fetchIcloudEvents(startMs: number, endMs: number): Promise<{
  events: IcloudEvent[]
  parseCount: number
  feedBytes: number
}> {
  const icsRes = await fetch(feedUrl())
  if (!icsRes.ok) {
    throw new Error(`iCloud feed error ${icsRes.status}: ${icsRes.statusText}`)
  }
  const icsText = await icsRes.text()

  const vevents = parseICSEvents(icsText)
  const events: IcloudEvent[] = []

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

    const evStart = isDateOnly ? new Date(`${startIso}T00:00:00Z`).getTime() : new Date(startIso).getTime()
    const evEnd = isDateOnly
      ? new Date(`${endIso || startIso}T23:59:59Z`).getTime()
      : new Date(endIso || startIso).getTime()

    if (evEnd < startMs || evStart > endMs) continue

    events.push({
      id: v["UID"]?.[0]?.value || `ev${events.length}`,
      summary: unescapeICS(v["SUMMARY"]?.[0]?.value) || "Busy",
      start: startIso,
      end: endIso,
      allDay: isDateOnly,
      location: unescapeICS(v["LOCATION"]?.[0]?.value) || null,
      startMs: evStart,
      endMs: evEnd,
      isDateOnly,
    })
  }

  events.sort((a, b) => (a.start > b.start ? 1 : a.start < b.start ? -1 : 0))
  return { events, parseCount: vevents.length, feedBytes: icsText.length }
}
