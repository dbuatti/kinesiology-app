// @ts-nocheck
/**
 * Correction display text for Notion export.
 *
 * Mirrors the app's normalized correction model closely enough for export:
 * item corrections, metadata.corrections and protocol-log entries are preferred;
 * the legacy free-text `modes_balances` list is only a fallback.
 */

const isObj = (v: unknown): v is Record<string, any> =>
  !!v && typeof v === "object" && !Array.isArray(v);

const parse = (raw: unknown): any => {
  if (typeof raw !== "string") return raw ?? {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

const summaryFromDetails = (details: Record<string, any>): string => {
  const parts: string[] = [];
  const z1 = isObj(details.zone1) ? details.zone1 : null;
  const z2 = isObj(details.zone2) ? details.zone2 : null;
  if (z1?.name) parts.push(`Z1 ${z1.name}${z1.side ? ` (${z1.side})` : ""}`);
  if (z2?.name) parts.push(`Z2 ${z2.name}${z2.side ? ` (${z2.side})` : ""}`);
  if (typeof details.method === "string" && details.method) parts.push(details.method);
  if (details.correctionTimerMinutes) {
    parts.push(`${details.correctionTimerMinutes} min${details.correctionTimerCompleted ? " done" : ""}`);
  }
  if (details.retest) parts.push(String(details.retest));
  if (details.emotion) parts.push(String(details.emotion));
  if (details.organ) parts.push(String(details.organ));
  if (typeof details.note === "string" && details.note && parts.length === 0) parts.push(details.note);
  return parts.join(" · ");
};

const findingLabel = (name?: string | null, side?: string | null): string =>
  name ? `${name}${side ? ` (${side})` : ""}` : "";

export function correctionDisplayText(appointment: any): string {
  const pattern = parse(appointment?.priority_pattern);
  const metadata = parse(appointment?.metadata);
  const lines: string[] = [];
  const seen = new Set<string>();

  const add = (id: unknown, text: unknown) => {
    const line = String(text ?? "").trim();
    if (!line) return;
    const key = String(id ?? line);
    if (seen.has(key)) return;
    seen.add(key);
    lines.push(line);
  };

  const itemCorrections = isObj(pattern?.itemCorrections) ? pattern.itemCorrections : {};
  for (const [key, list] of Object.entries(itemCorrections)) {
    if (!Array.isArray(list)) continue;
    for (const c of list) {
      if (!isObj(c)) continue;
      const finding = findingLabel(c.finding || c.name, c.side) || key.split(":").slice(1).join(":");
      const detail = summaryFromDetails(isObj(c.details) ? c.details : {});
      add(c.id, [finding, detail, c.note].filter(Boolean).join(" — ") || "Correction");
    }
  }

  const metaCorrections = Array.isArray(metadata?.corrections) ? metadata.corrections : [];
  for (const c of metaCorrections) {
    if (!isObj(c)) continue;
    const detail = summaryFromDetails(isObj(c.details) ? c.details : {});
    add(c.id, c.summary || [c.finding || c.pathway, detail].filter(Boolean).join(" — ") || "Correction");
  }

  const logs = isObj(metadata?.protocol_logs) ? metadata.protocol_logs : {};
  for (const [processId, log] of Object.entries(logs)) {
    if (!isObj(log)) continue;
    const entries = Array.isArray(log.entries) ? log.entries : [];
    for (const entry of entries) {
      if (!isObj(entry)) continue;
      const values = isObj(entry.values) ? entry.values : {};
      const detail = summaryFromDetails(values);
      add(entry.id, [entry.pathway || values.finding || processId, detail].filter(Boolean).join(" — ") || "Logged correction");
    }
    if (entries.length === 0 && isObj(log.values) && Object.keys(log.values).length > 0) {
      const detail = summaryFromDetails(log.values);
      add(`${processId}-live`, [log.finding || processId, detail].filter(Boolean).join(" — ") || "In progress");
    }
  }

  if (lines.length > 0) return lines.join("\n");

  if (typeof appointment?.modes_balances === "string") {
    return appointment.modes_balances
      .split("\n")
      .map((line: string) => line.replace(/^\s*[-*•]\s*/, "").trim())
      .filter(Boolean)
      .join("\n");
  }
  return "";
}