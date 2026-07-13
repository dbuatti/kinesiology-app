import { format, parseISO } from "date-fns";

function formatClockTime(isoString: string): string {
  const m = isoString.match(/T(\d{2}):(\d{2})/);
  if (!m) return format(parseISO(isoString), "h:mm a");
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const period = h < 12 ? "am" : "pm";
  const h12 = h % 12 || 12;
  return `${h12}${min === 0 ? "" : `:${min.toString().padStart(2, "0")}`}${period}`;
}

export function formatSlotRanges(slotTimes: string[]): string {
  if (slotTimes.length === 0) return "";
  return [...slotTimes].sort().map(formatClockTime).join(", ");
}

export function formatVoiceTime(date: string, time: string): string | null {
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return null;

  const stripTz = (s: string) => s.replace(/(?:UTC|AEST|AEDT|GMT[+-]\d+|EST|EDST?|ACST|ACDT|AWST|AWDT)\b/gi, "").trim();
  const isUTC = /UTC/i.test(time);

  const parts = time.split("–").map((s) => s.trim());
  if (parts.length !== 2) {
    const cleaned = stripTz(time);
    const m = cleaned.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
    if (!m) return null;
    let h = parseInt(m[1]);
    const min = parseInt(m[2]);
    if (m[3].toUpperCase() === "PM" && h !== 12) h += 12;
    if (m[3].toUpperCase() === "AM" && h === 12) h = 0;
    const d = isUTC
      ? new Date(Date.UTC(year, month - 1, day, h, min))
      : new Date(year, month - 1, day, h, min);
    return format(d, "h:mm a");
  }

  const parseTime = (s: string) => {
    const cleaned = stripTz(s);
    const match = cleaned.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
    if (!match) return null;
    let h = parseInt(match[1]);
    const m = parseInt(match[2]);
    if (match[3].toUpperCase() === "PM" && h !== 12) h += 12;
    if (match[3].toUpperCase() === "AM" && h === 12) h = 0;
    return { h, m };
  };

  const start = parseTime(parts[0]);
  const end = parseTime(parts[1]);
  if (!start || !end) return null;

  const startDate = isUTC
    ? new Date(Date.UTC(year, month - 1, day, start.h, start.m))
    : new Date(year, month - 1, day, start.h, start.m);
  const endDate = isUTC
    ? new Date(Date.UTC(year, month - 1, day, end.h, end.m))
    : new Date(year, month - 1, day, end.h, end.m);

  return `${format(startDate, "h:mm a")} – ${format(endDate, "h:mm a")}`;
}

export function formatDateLine(dateKey: string, slotTimes: string[]): string {
  const ranges = formatSlotRanges(slotTimes);
  const dayName = format(parseISO(dateKey), "EEEE, MMMM d");
  return `${dayName} — ${ranges}`;
}
