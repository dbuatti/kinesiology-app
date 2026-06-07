import { format, parseISO } from "date-fns";

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
