
export interface ContactLogEntry {
  timestamp: string;
  note: string;
}

export interface ClientJournalData {
  notes: string;
  rate_increase_contacted?: boolean;
  rate_increase_contacted_at?: string | null;
  upgrade_count?: number;
  last_contacted_at?: string | null;
  last_sms_at?: string | null;
  last_sms_template?: string | null;
  contact_log?: ContactLogEntry[];
}

export function parseClientJournal(raw: string | null | undefined): ClientJournalData {
  if (!raw) return { notes: "", contact_log: [] };
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
        contact_log: parsed.contact_log || [],
      };
    }
  } catch (e) {
    // Not JSON, treat as raw notes
  }
  return { notes: raw || "", contact_log: [] };
}

export function stringifyClientJournal(data: ClientJournalData): string {
  return JSON.stringify(data);
}

export function addContactLogEntry(journal: string | null | undefined, note: string): string {
  const data = parseClientJournal(journal);
  const entry: ContactLogEntry = {
    timestamp: new Date().toISOString(),
    note: note.trim(),
  };
  return stringifyClientJournal({
    ...data,
    last_contacted_at: entry.timestamp,
    contact_log: [...(data.contact_log || []), entry],
  });
}