import { format, parseISO } from "date-fns";

export function formatVoiceTime(date: string, time: string): string | null {
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return null;

  const isUTC = /UTC/i.test(time);

  const parts = time.split("–").map((s) => s.trim());
  if (parts.length !== 2) {
    const cleaned = time.replace(/UTC/i, "").trim();
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
    const cleaned = s.replace(/UTC/i, "").trim();
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

function parseTime(dateStr: string, timeIso: string): Date {
  return parseISO(timeIso);
}

function formatClock(d: Date): string {
  const h = d.getHours() % 12 || 12;
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

export function formatSlotRanges(slotTimes: string[]): string {
  if (slotTimes.length === 0) return "";
  if (slotTimes.length === 1) return format(parseISO(slotTimes[0]), "h:mm a");

  const times = slotTimes.map((t) => parseISO(t)).sort((a, b) => a.getTime() - b.getTime());

  const ranges: { start: Date; end: Date }[] = [];
  let start = times[0];
  let prev = times[0];

  for (let i = 1; i < times.length; i++) {
    const diff = (times[i].getTime() - prev.getTime()) / (1000 * 60);
    if (diff <= 45) {
      prev = times[i];
    } else {
      ranges.push({ start, end: prev });
      start = times[i];
      prev = times[i];
    }
  }
  ranges.push({ start, end: prev });

  return ranges
    .map((r) => {
      const startAMPM = r.start.getHours() < 12 ? "AM" : "PM";
      const endAMPM = r.end.getHours() < 12 ? "AM" : "PM";
      if (r.start.getTime() === r.end.getTime()) {
        return `${formatClock(r.start)} ${startAMPM}`;
      }
      if (startAMPM === endAMPM) {
        return `${formatClock(r.start)}–${formatClock(r.end)} ${startAMPM}`;
      }
      return `${formatClock(r.start)} ${startAMPM}–${formatClock(r.end)} ${endAMPM}`;
    })
    .join(", ");
}

export function formatDateLine(dateKey: string, slotTimes: string[]): string {
  const ranges = formatSlotRanges(slotTimes);
  const dayName = format(parseISO(dateKey), "EEEE, MMMM d");
  return `${dayName} — ${ranges}`;
}
