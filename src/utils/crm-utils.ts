import { differenceInYears, format, intervalToDuration } from "date-fns";
import { Appointment } from "@/types/crm";

export const calculateAge = (born: Date): number => {
  return differenceInYears(new Date(), born);
};

export const getStarSign = (date: Date): string => {
  const month = date.getMonth() + 1;
  const day = date.getDate();

  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "Aries";
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "Taurus";
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return "Gemini";
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return "Cancer";
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "Leo";
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return "Virgo";
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return "Libra";
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return "Scorpio";
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return "Sagittarius";
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return "Capricorn";
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return "Aquarius";
  return "Pisces";
};

export const formatDuration = (seconds: number): string => {
  const duration = intervalToDuration({ start: 0, end: seconds * 1000 });
  const parts = [];
  if (duration.hours) parts.push(`${duration.hours}h`);
  if (duration.minutes) parts.push(`${duration.minutes}m`);
  if (duration.seconds || parts.length === 0) parts.push(`${duration.seconds}s`);
  return parts.join(" ");
};

export const getClientRollups = (appointments: Appointment[]) => {
  const sorted = [...appointments].sort((a, b) => b.date.getTime() - a.date.getTime());
  
  return {
    allAppointmentDates: appointments.map(a => format(a.date, "MMM d, yyyy")),
    lastAppointment: sorted[0]?.date ? format(sorted[0].date, "MMM d, yyyy") : "No sessions yet",
    totalSessions: appointments.length
  };
};

export const groupAppointmentsByMonth = <T extends Appointment>(appointments: T[]) => {
  const groups: Record<string, T[]> = {};
  
  appointments.forEach(app => {
    const key = format(app.date, "MMMM yyyy");
    if (!groups[key]) groups[key] = [];
    groups[key].push(app);
  });
  
  return Object.entries(groups).sort((a, b) => {
    return new Date(b[1][0].date).getTime() - new Date(a[1][0].date).getTime();
  }) as [string, T[]][];
};

export const isMeridianPeakNow = (peakTimeStr: string, currentHour: number): boolean => {
  if (!peakTimeStr || peakTimeStr === 'None') return false;
  
  const parts = peakTimeStr.toLowerCase().split('-').map(p => p.trim());
  
  const parseHour = (s: string) => {
    const hour = parseInt(s);
    if (s.includes('pm') && hour !== 12) return hour + 12;
    if (s.includes('am') && hour === 12) return 0;
    return hour;
  };

  try {
    const start = parseHour(parts[0]);
    const end = parseHour(parts[1]);

    if (start > end) {
      return currentHour >= start || currentHour < end;
    }
    return currentHour >= start && currentHour < end;
  } catch (e) {
    return false;
  }
};