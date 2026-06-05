"use client";

export interface ClientJournalData {
  notes: string;
  rate_increase_contacted?: boolean;
  rate_increase_contacted_at?: string | null;
  upgrade_count?: number;
  last_contacted_at?: string | null;
  last_sms_at?: string | null;
  last_sms_template?: string | null;
}

export function parseClientJournal(raw: string | null | undefined): ClientJournalData {
  if (!raw) return { notes: "" };
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && ('notes' in parsed || 'rate_increase_contacted' in parsed || 'upgrade_count' in parsed || 'last_contacted_at' in parsed)) {
      return {
        notes: parsed.notes || "",
        rate_increase_contacted: parsed.rate_increase_contacted || false,
        rate_increase_contacted_at: parsed.rate_increase_contacted_at || null,
        upgrade_count: parsed.upgrade_count || 0,
        last_contacted_at: parsed.last_contacted_at || null,
        last_sms_at: parsed.last_sms_at || null,
        last_sms_template: parsed.last_sms_template || null,
      };
    }
  } catch (e) {
    // Not JSON, treat as raw notes
  }
  return { notes: raw || "", rate_increase_contacted: false, rate_increase_contacted_at: null, upgrade_count: 0, last_contacted_at: null, last_sms_at: null, last_sms_template: null };
}

export function stringifyClientJournal(data: ClientJournalData): string {
  return JSON.stringify(data);
}