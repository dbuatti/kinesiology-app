import { safeParse } from "@/utils/safe-json";
import { itemCorrectionKey, type ItemCorrection } from "@/components/crm/reflex-corrections/types";
import { normalizeFindingPriority, type FindingPriority } from "@/components/crm/v2/v2-utils";
import { directionForProcess, directionFromText, type PathwayDirection } from "@/lib/pathway-direction";
import { summariseValues, type ProtocolLog, type ProtocolLogPatch } from "@/data/protocol-log";
import type { InhibitionPathwayState, InhibitionPathwayStatus } from "@/components/crm/corrections/CorrectionDockContext";

export const CORRECTION_MODEL_VERSION = 2;

type Pattern = Record<string, any>;
type Meta = Record<string, any>;

export type CorrectionSource = "item" | "metadata" | "protocol" | "manual";

export interface CorrectionRecord {
  id: string;
  category?: string;
  name?: string;
  side?: "L" | "R";
  finding?: string;
  direction?: PathwayDirection;
  pathway?: string;
  processId?: string;
  holding?: boolean;
  status?: "clear" | "pending" | "holding" | "not_holding";
  note?: string;
  summary?: string;
  details?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  timestamp?: string;
  source: CorrectionSource;
}

export interface CorrectionStores {
  pattern: Pattern;
  metadata: Meta;
  itemCorrections: Record<string, ItemCorrection[]>;
  priorities: Record<string, string | undefined>;
}

const isObj = (v: unknown): v is Record<string, any> => !!v && typeof v === "object" && !Array.isArray(v);
const asArray = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

export function parseCorrectionStores(appointment: { priority_pattern?: string | null; metadata?: string | null }): CorrectionStores {
  const pattern = safeParse<Pattern>(appointment.priority_pattern, {});
  const metadata = safeParse<Meta>(appointment.metadata, {});
  return {
    pattern,
    metadata,
    itemCorrections: (isObj(pattern.itemCorrections) ? pattern.itemCorrections : {}) as Record<string, ItemCorrection[]>,
    priorities: (isObj(pattern.priorities) ? pattern.priorities : {}) as Record<string, string | undefined>,
  };
}

export function getCorrectionModelVersion(meta: Meta): number {
  const v = Number(meta?.correction_model_version ?? 0);
  return Number.isFinite(v) ? v : 0;
}

export function buildLegacyMirrors(records: CorrectionRecord[]) {
  const corrections: any[] = [];
  const byPathway: Record<string, any> = {};
  for (const r of records) {
    const details = isObj(r.details) ? r.details : {};
    const ts = r.timestamp || r.updatedAt || r.createdAt || new Date().toISOString();
    const finding = r.finding || findingFromCategoryName(r.name || "", r.side);
    const pathway = r.pathway || r.processId || "correction";
    corrections.push({
      id: r.id,
      processId: r.processId || (r.source === "item" ? `quick:${r.id}` : undefined),
      finding,
      pathway,
      direction: r.direction,
      summary: correctionSummary(r),
      timestamp: ts,
      status: r.status === "clear" || r.holding ? "clear" : "pending",
      source: r.source === "item" ? "quick-correction" : r.source,
      category: r.category,
      details,
    });
    const log = byPathway[pathway] ?? { entries: [] };
    const entries = Array.isArray(log.entries) ? [...log.entries] : [];
    if (!entries.some((e: any) => e?.id === r.id)) {
      entries.push({
        id: r.id,
        values: { ...details, finding, direction: r.direction, note: r.note ?? "", status: r.status === "clear" || r.holding ? "clear" : undefined },
        savedAt: ts,
        source: r.source === "item" ? "quick-correction" : r.source,
      });
    }
    byPathway[pathway] = { ...log, entries, updatedAt: ts };
  }
  return { corrections, byPathway };
}

export function backfillCorrectionModel(appointment: { priority_pattern?: string | null; metadata?: string | null }) {
  const { pattern, metadata } = parseCorrectionStores(appointment);
  const version = getCorrectionModelVersion(metadata);
  if (version >= CORRECTION_MODEL_VERSION) return null;
  const records = collectCorrectionRecords({ priority_pattern: appointment.priority_pattern, metadata: appointment.metadata });
  const mirrors = buildLegacyMirrors(records);
  const protocolLogs = { ...(isObj(metadata.protocol_logs) ? metadata.protocol_logs : {}) };
  for (const [k, v] of Object.entries(mirrors.byPathway)) {
    const prev = isObj(protocolLogs[k]) ? protocolLogs[k] : {};
    const prevEntries = Array.isArray((prev as any).entries) ? (prev as any).entries : [];
    const nextEntries = Array.isArray((v as any).entries) ? (v as any).entries : [];
    const byId = new Map<string, any>();
    for (const e of [...prevEntries, ...nextEntries]) if (e?.id) byId.set(String(e.id), { ...(byId.get(String(e.id)) ?? {}), ...e });
    protocolLogs[k] = { ...prev, ...v, entries: [...byId.values()] };
  }
  const metaCorrections = Array.isArray(metadata.corrections) ? metadata.corrections : [];
  const byId = new Map<string, any>();
  for (const c of [...metaCorrections, ...mirrors.corrections]) if (c?.id) byId.set(String(c.id), { ...(byId.get(String(c.id)) ?? {}), ...c });
  return {
    priority_pattern: JSON.stringify({ ...pattern, correction_model_version: CORRECTION_MODEL_VERSION }),
    metadata: JSON.stringify({
      ...metadata,
      correction_model_version: CORRECTION_MODEL_VERSION,
      corrections: [...byId.values()],
      protocol_logs: protocolLogs,
    }),
  };
}

export function findingFromCategoryName(name: string, side?: "L" | "R") {
  return side ? `${name} (${side})` : name;
}

export function parseFindingLabel(label?: string): { name: string; side?: "L" | "R" } {
  const raw = String(label || "").trim();
  const m = raw.match(/^(.*)\s+\(([LR])\)$/);
  if (!m) return { name: raw };
  return { name: m[1].trim(), side: m[2] as "L" | "R" };
}

export function getPriorityTier(priorities: Record<string, string | undefined>, category: string, name: string, side?: "L" | "R"): FindingPriority | null {
  return normalizeFindingPriority(priorities[`priority:${itemCorrectionKey(category, name, side)}`]);
}

export function getItemCorrectionsForFinding(itemCorrections: Record<string, ItemCorrection[]>, category: string, name: string, side?: "L" | "R"): ItemCorrection[] {
  const direct = itemCorrections[itemCorrectionKey(category, name, side)];
  if (Array.isArray(direct)) return direct.filter(isObj) as ItemCorrection[];
  if (category === "cranialNerves" && !side) {
    const legacyMid = itemCorrections[itemCorrectionKey(category, name)];
    if (Array.isArray(legacyMid)) return legacyMid.filter(isObj) as ItemCorrection[];
  }
  return [];
}

export function summarizeCorrectionDetails(details?: Record<string, unknown>): string {
  if (!isObj(details)) return "";
  return Object.entries(details)
    .filter(([, v]) => v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0))
    .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`)
    .join("; ");
}

export function correctionSummary(c: Partial<CorrectionRecord> | Partial<ItemCorrection> | any): string {
  const d = isObj(c?.details) ? c.details : (isObj(c?.values) ? c.values : {});
  const finding = typeof c?.finding === "string" ? c.finding : undefined;
  const parts: string[] = [];
  if (finding) parts.push(finding);
  const z1 = isObj((d as any).zone1) ? (d as any).zone1 : null;
  const z2 = isObj((d as any).zone2) ? (d as any).zone2 : null;
  if (z1?.name) parts.push(`Z1 ${z1.name}${z1.side ? ` (${z1.side})` : ""}`);
  if (z2?.name) parts.push(`Z2 ${z2.name}${z2.side ? ` (${z2.side})` : ""}`);
  const method = typeof (d as any).method === "string" ? String((d as any).method) : "";
  const timer = (d as any).correctionTimerMinutes ? `${(d as any).correctionTimerMinutes} min${(d as any).correctionTimerCompleted ? " done" : ""}` : "";
  if (method && timer && method !== timer) parts.push(method, timer);
  else if (method || timer) parts.push(method || timer);
  if ((d as any).retest) parts.push(String((d as any).retest));
  if ((d as any).emotion) parts.push(String((d as any).emotion));
  if ((d as any).organ) parts.push(String((d as any).organ));
  if (parts.length) return parts.join(" · ");
  const s = typeof c?.summary === "string" ? c.summary : "";
  if (s && !s.includes("{") && !s.includes("zone1:")) return s;
  return summarizeCorrectionDetails(d as Record<string, unknown>) || s || (typeof c?.pathway === "string" ? `${c.pathway} correction` : "Logged correction");
}

export function normalizeDirection(c: Partial<CorrectionRecord> | any): PathwayDirection | undefined {
  const explicit = c?.direction;
  if (explicit === "afferent" || explicit === "efferent") return explicit;
  const byProcess = directionForProcess(String(c?.pathway ?? c?.process ?? ""), String(c?.processId ?? c?.pathway ?? ""));
  if (byProcess) return byProcess;
  const text = [c?.pathway, c?.process, c?.summary, c?.note].filter(Boolean).join(" ");
  return directionFromText(text) ?? undefined;
}

function normalizeStatus(c: any): CorrectionRecord["status"] {
  const s = String(c?.status ?? "").toLowerCase();
  if (s === "clear" || s === "holding" || c?.holding === true) return "clear";
  if (s === "pending" || s === "not_holding" || c?.holding === false) return "pending";
  return undefined;
}

function recordFromItem(category: string, rawName: string, item: ItemCorrection): CorrectionRecord {
  const { name, side } = parseFindingLabel(rawName.replace(`${category}:`, ""));
  const c: any = item;
  return {
    id: String(c.id),
    category,
    name,
    side,
    finding: findingFromCategoryName(name, side),
    direction: normalizeDirection(c),
    pathway: c.pathway,
    holding: !!c.holding,
    status: normalizeStatus(c),
    note: c.note,
    details: isObj(c.details) ? c.details : {},
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    timestamp: c.updatedAt || c.createdAt,
    source: "item",
  };
}

function recordFromMetadata(c: any): CorrectionRecord | null {
  if (!isObj(c)) return null;
  const findingLabel = typeof c.finding === "string" ? c.finding : typeof c.name === "string" ? c.name : "";
  const parsed = parseFindingLabel(findingLabel);
  const details = isObj(c.details) ? c.details : (isObj(c.values) ? c.values : {});
  return {
    id: String(c.id ?? c.processId ?? `meta-${Math.random().toString(36).slice(2)}`),
    category: typeof c.category === "string" ? c.category : undefined,
    name: parsed.name || undefined,
    side: parsed.side,
    finding: findingLabel || undefined,
    direction: normalizeDirection(c),
    pathway: typeof c.pathway === "string" ? c.pathway : typeof c.process === "string" ? c.process : undefined,
    processId: typeof c.processId === "string" ? c.processId : undefined,
    holding: normalizeStatus(c) === "clear",
    status: normalizeStatus(c),
    note: typeof c.note === "string" ? c.note : undefined,
    summary: typeof c.summary === "string" ? c.summary : undefined,
    details,
    createdAt: c.createdAt || c.timestamp || c.savedAt,
    updatedAt: c.updatedAt || c.timestamp || c.savedAt,
    timestamp: c.timestamp || c.updatedAt || c.savedAt || c.createdAt,
    source: c.source === "quick-correction" ? "item" : "metadata",
  };
}

function recordFromProtocol(processId: string, log: ProtocolLog, entry: any, live = false): CorrectionRecord | null {
  if (!isObj(entry)) return null;
  const values = isObj(entry.values) ? entry.values : {};
  const finding = typeof values.finding === "string" ? values.finding : typeof entry.pathway === "string" ? entry.pathway : undefined;
  const parsed = parseFindingLabel(finding);
  const summary = summariseValues(processId, values).join(" · ") || (typeof values.note === "string" ? values.note : "") || "Logged";
  return {
    id: String(entry.id ?? `${processId}-${entry.savedAt ?? "live"}`),
    category: typeof (entry as any).category === "string" ? (entry as any).category : undefined,
    name: parsed.name || undefined,
    side: parsed.side,
    finding,
    direction: normalizeDirection({ ...values, processId, pathway: processId }),
    pathway: typeof (entry as any).pathway === "string" ? (entry as any).pathway : processId,
    processId,
    holding: String((values as any).status ?? "").toLowerCase() === "clear",
    status: String((values as any).status ?? "").toLowerCase() === "clear" ? "clear" : undefined,
    note: typeof values.note === "string" ? values.note : undefined,
    summary,
    details: values,
    createdAt: entry.savedAt,
    updatedAt: entry.savedAt || log.updatedAt,
    timestamp: entry.savedAt || log.updatedAt,
    source: "protocol",
  };
}

function dedupeRecords(records: CorrectionRecord[]): CorrectionRecord[] {
  const byId = new Map<string, CorrectionRecord>();
  for (const r of records) {
    const id = String(r.id || "");
    if (!id) continue;
    const prev = byId.get(id);
    if (!prev) { byId.set(id, r); continue; }
    // Prefer item/protocol over metadata, and richer details.
    const score = (x: CorrectionRecord) => (x.source === "item" ? 3 : x.source === "protocol" ? 2 : 1) + (x.details && Object.keys(x.details).length ? 1 : 0) + (x.summary ? 1 : 0);
    byId.set(id, score(r) >= score(prev) ? { ...prev, ...r, details: { ...(prev.details ?? {}), ...(r.details ?? {}) } } : prev);
  }
  return [...byId.values()].sort((a, b) => String(a.timestamp ?? a.updatedAt ?? a.createdAt ?? "").localeCompare(String(b.timestamp ?? b.updatedAt ?? b.createdAt ?? "")));
}

export function collectCorrectionRecords(appointment: { priority_pattern?: string | null; metadata?: string | null }): CorrectionRecord[] {
  const { pattern, metadata, itemCorrections } = parseCorrectionStores(appointment);
  const records: CorrectionRecord[] = [];

  for (const [key, list] of Object.entries(itemCorrections)) {
    if (!Array.isArray(list)) continue;
    const [category, ...rest] = key.split(":");
    const rawName = rest.join(":");
    for (const item of list) {
      if (isObj(item)) records.push(recordFromItem(category, `${category}:${rawName}`, item as ItemCorrection));
    }
  }

  for (const c of asArray<any>(metadata?.corrections)) {
    const rec = recordFromMetadata(c);
    if (rec) records.push(rec);
  }

  const logs = isObj(metadata?.protocol_logs) ? metadata.protocol_logs as Record<string, ProtocolLog> : {};
  for (const [processId, log] of Object.entries(logs)) {
    if (!isObj(log)) continue;
    for (const entry of asArray<any>((log as any).entries)) {
      const rec = recordFromProtocol(processId, log as ProtocolLog, entry);
      if (rec) records.push(rec);
    }
    if (isObj((log as any).values) && Object.keys((log as any).values).length > 0) {
      const rec = recordFromProtocol(processId, log as ProtocolLog, { id: `${processId}-live`, values: (log as any).values, savedAt: (log as any).updatedAt }, true);
      if (rec) records.push(rec);
    }
  }

  return dedupeRecords(records);
}

export function correctionsForFinding(appointment: { priority_pattern?: string | null; metadata?: string | null }, category: string, name: string, side?: "L" | "R"): CorrectionRecord[] {
  const want = findingFromCategoryName(name, side);
  return collectCorrectionRecords(appointment).filter((c) => {
    if (c.category && c.category !== category) return false;
    const cf = c.finding || findingFromCategoryName(c.name || "", c.side);
    return cf === want || c.name === name;
  });
}

type WriteStores = { pattern: Pattern; metadata: Meta };

function ensureWriteStores(appointment: { priority_pattern?: string | null; metadata?: string | null }): WriteStores {
  const { pattern, metadata } = parseCorrectionStores(appointment);
  return {
    pattern: { ...pattern, itemCorrections: { ...(pattern.itemCorrections ?? {}) }, priorities: { ...(pattern.priorities ?? {}) } },
    metadata: { ...metadata, corrections: Array.isArray(metadata.corrections) ? [...metadata.corrections] : [], protocol_logs: { ...(metadata.protocol_logs ?? {}) } },
  };
}

function upsertById<T extends Record<string, any>>(arr: T[], item: T): T[] {
  const idx = arr.findIndex((x) => String(x?.id) === String(item?.id));
  if (idx >= 0) { const next = [...arr]; next[idx] = { ...next[idx], ...item }; return next; }
  return [...arr, item];
}

export function upsertQuickCorrectionRecord(args: {
  appointment: { priority_pattern?: string | null; metadata?: string | null };
  category: string;
  name: string;
  side?: "L" | "R";
  correction: ItemCorrection;
  previousPathway?: string;
}) {
  const { category, name, side, correction, previousPathway } = args;
  const { pattern, metadata } = ensureWriteStores(args.appointment);
  const key = itemCorrectionKey(category, name, side);
  const list = Array.isArray(pattern.itemCorrections[key]) ? [...pattern.itemCorrections[key]] : [];
  pattern.itemCorrections[key] = upsertById(list as any[], { ...correction, updatedAt: correction.updatedAt || new Date().toISOString() }) as any;

  const finding = findingFromCategoryName(name, side);
  const ts = correction.updatedAt || correction.createdAt || new Date().toISOString();
  const details = isObj(correction.details) ? correction.details : {};
  const summary = correctionSummary({ ...correction, finding, category, details });
  const metaEntry = {
    id: correction.id,
    processId: `quick:${correction.id}`,
    finding,
    pathway: correction.pathway,
    direction: correction.direction,
    summary,
    timestamp: ts,
    status: correction.holding ? "clear" : "pending",
    source: "quick-correction",
    category,
    details,
  };
  metadata.corrections = upsertById(metadata.corrections, metaEntry);

  const protocolLogs = { ...(metadata.protocol_logs ?? {}) };
  protocolLogs[`quick:${correction.id}`] = {
    ...(protocolLogs[`quick:${correction.id}`] ?? {}),
    processId: `quick:${correction.id}`,
    process: correction.pathway,
    finding,
    category,
    direction: correction.direction,
    details,
    status: correction.holding ? "clear" : "pending",
    updatedAt: ts,
    source: "quick-correction",
  };
  if (previousPathway && previousPathway !== correction.pathway) {
    const oldLog = protocolLogs[previousPathway];
    if (oldLog && Array.isArray((oldLog as any).entries)) {
      protocolLogs[previousPathway] = { ...oldLog, entries: (oldLog as any).entries.filter((e: any) => e?.id !== correction.id), updatedAt: ts };
    }
  }
  const pathwayLog = { ...(protocolLogs[correction.pathway] ?? {}) };
  const entries = Array.isArray((pathwayLog as any).entries) ? [...(pathwayLog as any).entries] : [];
  const pEntry = { id: correction.id, values: { ...details, finding, direction: correction.direction, note: correction.note ?? "", status: correction.holding ? "clear" : undefined }, steps: Array.isArray((pathwayLog as any).steps) ? (pathwayLog as any).steps : [], savedAt: correction.createdAt || ts, source: "quick-correction" };
  const eidx = entries.findIndex((e: any) => e?.id === correction.id);
  if (eidx >= 0) entries[eidx] = { ...entries[eidx], ...pEntry }; else entries.push(pEntry);
  protocolLogs[correction.pathway] = { ...pathwayLog, entries, updatedAt: ts };
  metadata.protocol_logs = protocolLogs;
  metadata.correction_model_version = CORRECTION_MODEL_VERSION;
  pattern.correction_model_version = CORRECTION_MODEL_VERSION;
  return { pattern, metadata: enrichInhibitionLinks(metadata, correction.pathway ? [resolvePathwayIdentity({ name: correction.pathway, pathway: correction.pathway, notes: correction.pathway, correctionId: correction.id }).processId] : []) };
}

export function removeQuickCorrectionRecord(args: {
  appointment: { priority_pattern?: string | null; metadata?: string | null };
  category: string;
  name: string;
  side?: "L" | "R";
  correctionId: string;
}) {
  const { category, name, side, correctionId } = args;
  const { pattern, metadata } = ensureWriteStores(args.appointment);
  const key = itemCorrectionKey(category, name, side);
  const list = Array.isArray(pattern.itemCorrections[key]) ? pattern.itemCorrections[key].filter((c: any) => c?.id !== correctionId) : [];
  if (list.length) pattern.itemCorrections[key] = list; else delete pattern.itemCorrections[key];
  metadata.corrections = (metadata.corrections as any[]).filter((c: any) => c?.id !== correctionId && c?.processId !== `quick:${correctionId}`);
  const protocolLogs = { ...(metadata.protocol_logs ?? {}) };
  delete protocolLogs[`quick:${correctionId}`];
  for (const [k, v] of Object.entries(protocolLogs)) {
    if (!v || !Array.isArray((v as any).entries)) continue;
    const entries = (v as any).entries.filter((e: any) => e?.id !== correctionId);
    if (entries.length !== (v as any).entries.length) protocolLogs[k] = { ...(v as any), entries, updatedAt: new Date().toISOString() };
  }
  metadata.protocol_logs = protocolLogs;
  metadata.correction_model_version = CORRECTION_MODEL_VERSION;
  pattern.correction_model_version = CORRECTION_MODEL_VERSION;
  return { pattern, metadata: enrichInhibitionLinks(metadata) };
}

export function appendManualCorrectionRecord(args: {
  appointment: { priority_pattern?: string | null; metadata?: string | null };
  pathway: string;
  summary: string;
  finding?: string;
}) {
  const { pattern, metadata } = ensureWriteStores(args.appointment);
  const ts = new Date().toISOString();
  const summary = args.summary.trim();
  if (!summary) return { pattern, metadata };
  const entry = {
    id: `manual:${Date.now()}`,
    processId: args.pathway,
    pathway: args.pathway,
    finding: args.finding || "",
    summary,
    timestamp: ts,
    status: "clear",
    source: "manual",
    details: { note: summary },
  };
  metadata.corrections = upsertById(metadata.corrections as any[], entry as any);
  metadata.correction_model_version = CORRECTION_MODEL_VERSION;
  pattern.correction_model_version = CORRECTION_MODEL_VERSION;
  return { pattern, metadata: enrichInhibitionLinks(metadata, args.pathway ? [resolvePathwayIdentity({ name: args.pathway, pathway: args.pathway, notes: args.pathway, correctionId: entry.id }).processId] : []), entry };
}

export function mergeProtocolLogCorrections(metadata: Meta, processId: string, log: ProtocolLog): Meta {
  const entries = Array.isArray((log as any).entries) ? (log as any).entries : [];
  const liveHasValues = isObj((log as any).values) && Object.keys((log as any).values).length > 0;
  let corrections = Array.isArray(metadata.corrections) ? [...metadata.corrections] : [];

  const keepIds = new Set<string>(entries.map((e: any) => String(e?.id)).filter(Boolean));
  if (entries.length === 0 && liveHasValues) keepIds.add(`${processId}-live`);
  corrections = corrections.filter((c: any) => {
    if (String(c?.source) !== "protocol-log") return true;
    if (String(c?.processId ?? "") !== String(processId)) return true;
    return keepIds.has(String(c?.id));
  });

  for (const entry of entries) {
    const rec = recordFromProtocol(processId, log as ProtocolLog, entry);
    if (!rec) continue;
    corrections = upsertById(corrections as any[], {
      id: rec.id,
      processId,
      finding: rec.finding,
      pathway: rec.pathway || processId,
      direction: rec.direction,
      summary: rec.summary,
      timestamp: rec.timestamp,
      status: rec.status || "pending",
      source: "protocol-log",
      details: rec.details,
      category: rec.category,
    } as any);
  }
  if (entries.length === 0 && liveHasValues) {
    const rec = recordFromProtocol(processId, log as ProtocolLog, { id: `${processId}-live`, values: (log as any).values, savedAt: (log as any).updatedAt }, true);
    if (rec) corrections = upsertById(corrections as any[], {
      id: rec.id, processId, finding: rec.finding, pathway: rec.pathway || processId, direction: rec.direction, summary: rec.summary,
      timestamp: rec.timestamp, status: rec.status || "pending", source: "protocol-log", details: rec.details, category: rec.category,
    } as any);
  }
  return { ...metadata, corrections, correction_model_version: CORRECTION_MODEL_VERSION };
}

export function applyProtocolLogPatch(args: {
  metadata: Meta;
  processId: string;
  patch: ProtocolLogPatch;
  activeInhibitionPathway?: InhibitionPathwayState | null;
}) {
  const metadata = { ...(args.metadata ?? {}) };
  const logs = { ...((metadata.protocol_logs as Record<string, ProtocolLog>) ?? {}) };
  const previous = logs[args.processId] ?? {};
  const resolved = typeof args.patch === "function" ? args.patch(previous) : args.patch;
  const nextLog: ProtocolLog = {
    ...previous,
    ...resolved,
    updatedAt: new Date().toISOString(),
  };
  logs[args.processId] = nextLog;

  const prevEntries = Array.isArray((previous as any).entries) ? (previous as any).entries : [];
  const nextEntries = Array.isArray((nextLog as any).entries) ? (nextLog as any).entries : [];
  const prevIds = new Set(prevEntries.map((e: any) => String(e?.id)));
  const added = nextEntries.filter((e: any) => e?.id && !prevIds.has(String(e.id)));
  const lastAdded = added.length > 0 ? added[added.length - 1] : null;
  const linkId = lastAdded ? String((lastAdded as any).correctionId || (lastAdded as any).id) : undefined;

  const inhState = { ...((metadata.inhibition_pathway_state as Record<string, InhibitionPathwayState>) ?? {}) };
  let inhibitionPathway = (metadata.inhibition_pathway as InhibitionPathwayState | null | undefined) ?? args.activeInhibitionPathway ?? null;

  if (linkId && inhState[args.processId]) {
    inhState[args.processId] = {
      ...inhState[args.processId],
      correctionId: inhState[args.processId].correctionId || linkId,
      entryId: linkId,
      updatedAt: nextLog.updatedAt,
    };
  }
  if (linkId && inhibitionPathway?.pathway?.processId === args.processId) {
    inhibitionPathway = {
      ...inhibitionPathway,
      correctionId: inhibitionPathway.correctionId || linkId,
      entryId: linkId,
      updatedAt: nextLog.updatedAt,
    };
  }

  const merged = mergeProtocolLogCorrections(
    { ...metadata, protocol_logs: logs, inhibition_pathway_state: inhState, inhibition_pathway: inhibitionPathway },
    args.processId,
    nextLog,
  );

  const finalMetadata = enrichInhibitionLinks({
    ...merged,
    protocol_logs: logs,
    inhibition_pathway_state: inhState,
    inhibition_pathway: inhibitionPathway,
    correction_model_version: CORRECTION_MODEL_VERSION,
  } as any, linkId ? [resolvePathwayIdentity({ name: undefined, processId: args.processId, pathway: inhibitionPathway?.pathway?.processId, notes: inhibitionPathway?.pathway?.notes, correctionId: linkId || undefined }).processId] : []);

  return {
    metadata: finalMetadata,
    log: nextLog,
    linkId,
  };
}

export function canonicalProcessIdForPathway(name?: string | null, hints?: { processId?: string | null; pathway?: string | null; notes?: string | null }): string | undefined {
  const processList: Array<{ id: string; label: string }> = [
    { id: "mechanoreceptor", label: "Mechanoreceptor" },
    { id: "nociceptive", label: "Nociceptive" },
    { id: "physiological", label: "Physiological" },
    { id: "cortical", label: "Cortical (Top-Down)" },
    { id: "subcortical", label: "Subcortical (Autonomic)" },
    { id: "emotional", label: "Emotional (Pulse Point)" },
  ];
  const candidates = [hints?.processId, hints?.pathway, hints?.notes, name]
    .filter(Boolean)
    .map((v) => String(v).trim().toLowerCase())
    .filter(Boolean);
  for (const raw of candidates) {
    const compact = raw.replace(/[^a-z0-9]+/g, " ").trim();
    const first = compact.split(/\s+/)[0];
    const exact = processList.find((p) => p.id === raw || p.label.toLowerCase() === raw);
    if (exact) return exact.id;
    const loose = processList.find((p) => {
      const id = p.id;
      const label = p.label.toLowerCase();
      return raw.includes(id) || compact.includes(id) || (first && first === id) || label === compact || compact.startsWith(label);
    });
    if (loose) return loose.id;
  }
  return undefined;
}

export function resolvePathwayIdentity(args: {
  name?: string | null;
  processId?: string | null;
  pathway?: string | null;
  notes?: string | null;
  correctionId?: string | null;
  finding?: string | null;
}): { processId: string; synthetic: boolean } {
  const candidates = [args.processId, args.pathway, args.finding, args.notes, args.name]
    .filter(Boolean)
    .map((v) => String(v).trim().toLowerCase())
    .filter(Boolean);
  for (const raw of candidates) {
    if (raw.startsWith("quick:")) {
      const id = raw.slice(6);
      if (id) return { processId: id, synthetic: false };
    }
  }
  const canonical = canonicalProcessIdForPathway(args.name, args);
  if (canonical) return { processId: canonical, synthetic: false };
  const explicit = args.processId && !String(args.processId).startsWith("pathway:") ? String(args.processId) : undefined;
  if (explicit) return { processId: explicit, synthetic: false };
  const name = String(args.name || args.notes || args.pathway || args.correctionId || "unknown").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-:]/g, "");
  return { processId: `pathway:${name || "unknown"}`, synthetic: true };
}

export function latestCorrectionLinkForProcess(metadata: Meta, processId: string, pathwayName?: string) {
  const logs = isObj(metadata?.protocol_logs) ? (metadata.protocol_logs as Record<string, any>) : {};
  const log = logs[processId];
  const entries = Array.isArray(log?.entries) ? log.entries : [];
  const lastEntry = entries.length > 0 ? entries[entries.length - 1] : null;
  if (lastEntry?.id) return { correctionId: String(lastEntry.correctionId || lastEntry.id), entryId: String(lastEntry.id) };
  if (log && isObj(log.values) && Object.keys(log.values).length > 0) return { correctionId: `${processId}-live`, entryId: `${processId}-live` };
  const corrections = Array.isArray(metadata?.corrections) ? (metadata.corrections as any[]) : [];
  const name = (pathwayName || "").toLowerCase();
  for (let i = corrections.length - 1; i >= 0; i--) {
    const c = corrections[i];
    const pid = String(c?.processId || "");
    const p = String(c?.pathway || "").toLowerCase();
    const finding = String(c?.finding || "").toLowerCase();
    if (pid === processId || (name && (p === name || finding.toLowerCase() === name))) {
      const id = String(c?.id || c?.processId || "");
      if (id) return { correctionId: id, entryId: id };
    }
  }
  return undefined;
}

export function enrichInhibitionLinks(metadata: Meta, stampProcessIds: string[] = []) {
  const inhState = { ...((isObj(metadata?.inhibition_pathway_state) ? metadata.inhibition_pathway_state : {}) as Record<string, InhibitionPathwayState>) };
  let changed = false;
  const stamp = new Set(stampProcessIds.filter(Boolean));

  for (const [oldProcessId, st] of Object.entries(inhState)) {
    if (!st) continue;
    const resolved = resolvePathwayIdentity({
      name: st.pathway?.notes,
      processId: oldProcessId.startsWith("pathway:") ? undefined : oldProcessId,
      pathway: st.pathway?.processId,
      notes: st.pathway?.notes,
      correctionId: st.correctionId,
    });
    if (resolved.processId === oldProcessId) continue;
    const prev = inhState[resolved.processId];
    inhState[resolved.processId] = {
      ...(prev || {}),
      ...st,
      pathway: { ...(st.pathway || { processId: resolved.processId, phase: "other", side: "midline", notes: st.pathway?.notes || "" }), processId: resolved.processId },
      correctionId: st.correctionId ?? prev?.correctionId,
      entryId: st.entryId ?? prev?.entryId,
    };
    delete inhState[oldProcessId];
    changed = true;
  }

  for (const [processId, st] of Object.entries(inhState)) {
    if (!st) continue;
    const shouldStamp = stamp.has(processId);
    if (!shouldStamp && st.correctionId && st.entryId) continue;
    const link = latestCorrectionLinkForProcess(metadata, processId, st.pathway?.notes);
    if (link) {
      const next = shouldStamp
        ? { ...st, correctionId: link.correctionId, entryId: link.entryId, updatedAt: st.updatedAt || new Date().toISOString() }
        : { ...st, correctionId: st.correctionId || link.correctionId, entryId: st.entryId || link.entryId };
      if (next.correctionId !== st.correctionId || next.entryId !== st.entryId || next.updatedAt !== st.updatedAt) {
        inhState[processId] = next;
        changed = true;
      }
    }
  }

  let active = (metadata?.inhibition_pathway as InhibitionPathwayState | null | undefined) ?? null;
  if (active?.pathway?.processId?.startsWith("pathway:")) {
    const resolved = resolvePathwayIdentity({ name: active.pathway.notes, processId: active.pathway.processId, notes: active.pathway.notes });
    active = {
      ...active,
      pathway: { ...active.pathway, processId: resolved.processId },
    };
    changed = true;
  }
  if (active?.pathway?.processId) {
    const pid = active.pathway.processId;
    const cur = inhState[pid];
    const shouldStamp = stamp.has(pid);
    const link = (shouldStamp || !active.correctionId || !active.entryId) ? latestCorrectionLinkForProcess(metadata, pid, active.pathway?.notes) : undefined;
    const nextActive = {
      ...active,
      correctionId: shouldStamp ? (link?.correctionId ?? active.correctionId) : (active.correctionId || cur?.correctionId || link?.correctionId),
      entryId: shouldStamp ? (link?.entryId ?? active.entryId) : (active.entryId || cur?.entryId || link?.entryId),
    };
    if (nextActive.correctionId !== active.correctionId || nextActive.entryId !== active.entryId) { active = nextActive; changed = true; }
    if (cur && (cur.correctionId !== nextActive.correctionId || cur.entryId !== nextActive.entryId)) {
      inhState[pid] = { ...cur, correctionId: nextActive.correctionId || cur.correctionId, entryId: nextActive.entryId || cur.entryId };
      changed = true;
    }
  }

  if (!changed) return metadata;
  return { ...metadata, inhibition_pathway_state: inhState, inhibition_pathway: active, correction_model_version: CORRECTION_MODEL_VERSION };
}

export function linkInhibitionStatus(args: {
  metadata: Meta;
  processId: string;
  pathway: InhibitionPathwayState["pathway"];
  status: InhibitionPathwayStatus;
  priorityStep?: number;
  correctionId?: string;
  entryId?: string;
  activeInhibitionPathway?: InhibitionPathwayState | null;
}) {
  const metadata = { ...(args.metadata ?? {}) };
  const inhState = { ...((metadata.inhibition_pathway_state as Record<string, InhibitionPathwayState>) ?? {}) };
  const prev = inhState[args.processId];
  const ts = new Date().toISOString();
  const inferred = args.correctionId ? undefined : latestCorrectionLinkForProcess(metadata, args.processId, args.pathway?.notes);
  const nextState: InhibitionPathwayState = {
    pathway: args.pathway,
    status: args.status,
    priorityStep: args.priorityStep,
    correctionId: args.correctionId ?? prev?.correctionId ?? inferred?.correctionId,
    entryId: args.entryId ?? prev?.entryId ?? inferred?.entryId ?? `${args.processId}:${ts}`,
    updatedAt: ts,
    ...(args.status === "clear" ? { clearedAt: ts } : {}),
  };
  inhState[args.processId] = nextState;
  const active = (metadata.inhibition_pathway as InhibitionPathwayState | null | undefined) ?? args.activeInhibitionPathway ?? null;
  const inhibitionPathway = active?.pathway?.processId === args.processId ? nextState : active;
  return {
    metadata: {
      ...metadata,
      inhibition_pathway_state: inhState,
      inhibition_pathway: inhibitionPathway,
      correction_model_version: CORRECTION_MODEL_VERSION,
    },
    state: nextState,
  };
}
