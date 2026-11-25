import { useState, useMemo, useEffect, useRef } from "react";
import { Target, Plus, X, Check, ArrowRight, History } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import PathwayLogicWizard from "@/components/crm/PathwayLogicWizard";
import ProtocolLogSheet from "@/components/crm/corrections/ProtocolLogSheet";
import { PROTOCOL_FIELDS, PROTOCOL_STEP_MAP, summariseValues, type ProtocolLog, type ProtocolEntry } from "@/data/protocol-log";
import { getInhibitedFindings, findingLabel } from "@/components/crm/v2/v2-utils";
import { extractProtocolPathway } from "@/lib/client-log";
import { findingNameFromPathway } from "@/lib/pathway-finding";
import type { InhibitionPathwayStatus } from "@/components/crm/corrections/CorrectionDockContext";
import { safeParse } from "@/utils/safe-json";
import type { PhaseProps } from "@/components/crm/v2/v2-types";
import { useCorrectionDock, inhibitionPathwayLabel } from "@/components/crm/corrections/CorrectionDockContext";
import { appendManualCorrectionRecord, collectCorrectionRecords, correctionSummary, resolvePathwayIdentity } from "@/lib/corrections";
import {
  Card,
  Section,
  PrimaryButton,
  StatusBadge,
  EmptyState,
  ConfirmationFooter,
} from "./DesignSystem";

/** Every protocol with log fields, grouped the way the manual teaches them. */
const LOGGABLE = [
  { id: "mechanoreceptor", title: "Mechanoreceptor", group: "Afferent" },
  { id: "nociceptive", title: "Nociceptive", group: "Afferent" },
  { id: "physiological", title: "Physiological", group: "Afferent" },
  { id: "cortical", title: "Cortical (Top-Down)", group: "Efferent" },
  { id: "subcortical", title: "Subcortical (Autonomic)", group: "Efferent" },
  { id: "emotional", title: "Emotional (Pulse Point)", group: "Efferent" },
];

const hasLiveData = (log?: ProtocolLog) =>
  Object.values(log?.values ?? {}).some((v) =>
    Array.isArray(v) ? v.length > 0 : v !== null && v !== undefined && v !== ""
  ) || (log?.steps?.length ?? 0) > 0;

/** Anything worth showing: banked corrections count too. */
const hasData = (log?: ProtocolLog) =>
  (log?.entries?.length ?? 0) > 0 || hasLiveData(log);

/** Corrections recorded for a process: banked entries plus the live one. */
const countCorrections = (log?: ProtocolLog) =>
  (log?.entries?.length ?? 0) + (hasLiveData(log) ? 1 : 0);

const stepTotal = (processId: string) =>
  new Set(Object.values(PROTOCOL_STEP_MAP[processId] ?? {})).size;

const fmtTime = (iso?: string) => {
  if (!iso) return "";
  try {
    return format(new Date(iso), "h:mm a");
  } catch {
    return "";
  }
};

const CorrectPhaseV3 = ({ appointment, onUpdate, saveField, updatePriorityPattern, onJumpToPhase }: PhaseProps) => {
  const {
    protocolLogs,
    logProtocol,
    inhibitionPathway,
    inhibitionPathwayState,
    setInhibitionStatus,
  } = useCorrectionDock();
  const pathwayLabel = inhibitionPathwayLabel(inhibitionPathway);
  const [acuInput, setAcuInput] = useState("");
  const [draft, setDraft] = useState(appointment.modes_balances ?? "");
  const sheetRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const meta = useMemo(() => {
    if (!appointment.metadata) return {};
    if (typeof appointment.metadata === 'string') return safeParse(appointment.metadata, {});
    return appointment.metadata;
  }, [appointment.metadata]);

  const priorityPathway = (meta as Record<string, unknown>)?.priority_pathway as string || "";

  /**
   * The pathway string stamped on corrections: the dock's selected inhibition
   * pathway when there is one, otherwise the priority pathway chosen here.
   */
  const stampedPathway =
    pathwayLabel ?? (priorityPathway && priorityPathway !== 'CUSTOM' ? priorityPathway : undefined);

  // Keep the composer in sync when the note changes elsewhere (wizard saves).
  useEffect(() => {
    setDraft(appointment.modes_balances ?? "");
  }, [appointment.modes_balances]);

  const pathwayFindings = useMemo(() => {
    return getInhibitedFindings(appointment.priority_pattern).map(f => ({
      value: findingLabel(f.catKey, f.baseName, f.side),
      category: f.catKey,
    }));
  }, [appointment.priority_pattern]);

  // Processes with saved data reopen automatically; the picker adds more.
  const [openIds, setOpenIds] = useState<string[]>(() =>
    LOGGABLE.map(l => l.id).filter(id => hasData(protocolLogs?.[id]))
  );
  const loggedCount = LOGGABLE.reduce((sum, l) => sum + countCorrections(protocolLogs?.[l.id]), 0);
  void loggedCount;

  /**
   * Every correction recorded this session — banked entries first, then the
   * live form — flattened so the practitioner can read back exactly what was
   * done to which pathway, in order.
   */
  const appliedCorrections = useMemo(() => {
    const rows: Array<{
      key: string;
      id: string;
      processId: string;
      processTitle: string;
      group: string;
      pathway?: string;
      summary: string;
      savedAt?: string;
      entry?: ProtocolEntry;
      live: boolean;
    }> = [];
    const seen = new Set<string>();

    for (const proc of LOGGABLE) {
      const matchingLogs = Object.entries(protocolLogs ?? {}).filter(([key, log]) => {
        if (key === proc.id) return true;
        return String((log as any)?.process ?? "").toLowerCase() === proc.id.toLowerCase();
      });

      for (const [logKey, rawLog] of matchingLogs) {
        const log = rawLog as ProtocolLog;
        for (const entry of (log.entries ?? []) as any[]) {
          const entryKey = String(entry?.id ?? `${logKey}-${rows.length}`);
          if (seen.has(entryKey)) continue;
          seen.add(entryKey);
          const values = (entry?.values ?? {}) as Record<string, unknown>;
          const pathway = entry?.pathway ?? (typeof values.finding === "string" ? values.finding : undefined) ?? extractProtocolPathway(proc.id, values);
          const summary = summariseValues(proc.id, values).join(" · ") || (typeof values.note === "string" && values.note) || "Logged";
          rows.push({
            key: `${proc.id}-${entryKey}`,
            id: entryKey,
            processId: proc.id,
            processTitle: proc.title,
            group: proc.group,
            pathway,
            summary,
            savedAt: entry?.savedAt,
            entry,
            live: false,
          });
        }

        if (logKey === proc.id && hasLiveData(log)) {
          rows.push({
            key: `${proc.id}-live`,
            id: `${proc.id}-live`,
            processId: proc.id,
            processTitle: proc.title,
            group: proc.group,
            pathway: stampedPathway ?? extractProtocolPathway(proc.id, log.values),
            summary: summariseValues(proc.id, log.values ?? {}).join(" · ") || "In progress",
            savedAt: log.updatedAt,
            live: true,
          });
        }
      }
    }

    // Fallback for corrections not represented in protocol logs (quick/manual/legacy).
    const normalized = collectCorrectionRecords({ priority_pattern: appointment.priority_pattern, metadata: appointment.metadata });
    for (const c of normalized) {
      const pathwayId = String(c.pathway || c.processId || "").toLowerCase();
      const proc = LOGGABLE.find(l => l.id === pathwayId);
      if (!proc) continue;
      const id = String(c.id || `${proc.id}-${c.timestamp || rows.length}`);
      if (seen.has(id)) continue;
      seen.add(id);
      rows.push({
        key: `${proc.id}-${id}`,
        id,
        processId: proc.id,
        processTitle: proc.title,
        group: proc.group,
        pathway: c.finding || c.pathway,
        summary: correctionSummary(c),
        savedAt: c.timestamp || c.updatedAt || c.createdAt,
        live: false,
      });
    }

    const bankedSummaries = new Set(rows.filter(r => !r.live).map(r => r.summary));
    return rows
      .filter(r => (r.live ? !bankedSummaries.has(r.summary) : true))
      .sort((a, b) => (a.savedAt ?? "").localeCompare(b.savedAt ?? ""));
  }, [protocolLogs, stampedPathway, meta]);

  /** What the corrections cluster into — the practitioner reads the pattern. */
  const patterns = useMemo(() => {
    const counts = new Map<string, { title: string; group: string; count: number }>();
    for (const row of appliedCorrections) {
      const cur = counts.get(row.processId);
      if (cur) cur.count += 1;
      else counts.set(row.processId, { title: row.processTitle, group: row.group, count: 1 });
    }
    return [...counts.values()].sort((a, b) => b.count - a.count);
  }, [appliedCorrections]);

  /** Pathways touched this session — keyed by resolved process IDs, never synthetic when avoidable. */
  const touchedPathways = useMemo(() => {
    const byName = new Map<string, { name: string; processId: string }>();
    for (const row of appliedCorrections) {
      if (!row.pathway) continue;
      const resolved = resolvePathwayIdentity({
        name: row.pathway,
        processId: row.processId,
        pathway: row.pathway,
        notes: row.pathway,
        correctionId: row.id,
      });
      const existing = byName.get(row.pathway);
      const processId = existing?.processId && !existing.processId.startsWith("pathway:") ? existing.processId : resolved.processId;
      byName.set(row.pathway, { name: row.pathway, processId });
    }
    return Array.from(byName.values());
  }, [appliedCorrections]);

  const pathwayStatusKey = (name: string) =>
    `pathway:${name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-:]/g, "")}`;

  const linkedPathwayState = (name: string, preferredProcessId?: string) => {
    const syntheticId = pathwayStatusKey(name);
    const resolved = resolvePathwayIdentity({ name, processId: preferredProcessId, pathway: name, notes: name });
    const candidates = [preferredProcessId, resolved.processId, syntheticId].filter(Boolean) as string[];
    for (const id of new Set(candidates)) {
      const st = inhibitionPathwayState?.[id];
      if (st) return { id, state: st };
    }
    const lower = name.toLowerCase();
    for (const [pid, st] of Object.entries(inhibitionPathwayState ?? {})) {
      if ((st?.pathway?.notes || "").toLowerCase() === lower) return { id: pid, state: st };
    }
    return { id: resolved.processId || preferredProcessId || syntheticId, state: undefined };
  };

  const pathwayStatus = (name: string, preferredProcessId?: string): InhibitionPathwayStatus | "none" => {
    return (linkedPathwayState(name, preferredProcessId).state?.status as InhibitionPathwayStatus) ?? "none";
  };

  const setPathwayStatus = (name: string, status: Exclude<InhibitionPathwayStatus, "priority" | "primary_priority"> | "none", preferredProcessId?: string) => {
    const { id, state } = linkedPathwayState(name, preferredProcessId);
    const last = [...appliedCorrections].reverse().find((r) => r.pathway === name);
    const resolved = resolvePathwayIdentity({ name, processId: state?.pathway?.processId || preferredProcessId || id, pathway: name, notes: name, correctionId: last?.id });
    const processId = resolved.processId || id;
    setInhibitionStatus(
      processId,
      state?.pathway ? { ...state.pathway, processId } : { processId, phase: "other", side: "midline", notes: name },
      status === "none" ? "inhibited" : status,
      state?.priorityStep,
      last ? { correctionId: last.id, entryId: last.id } : state?.correctionId || state?.entryId ? { correctionId: state.correctionId, entryId: state.entryId } : undefined,
    );
  };

  const corrections = useMemo(
    () => ((((meta as Record<string, unknown>)?.corrections || []) as { pathway: string; summary: string; timestamp: string; details?: any; finding?: string }[])),
    [meta]
  );

  const fmtDetailValue = (v: any): string => {
    if (v == null || v === "") return "";
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v);
    if (Array.isArray(v)) return v.map(fmtDetailValue).filter(Boolean).join(", ");
    if (typeof v === "object") {
      if (v.name) return `${v.name}${v.side ? ` (${v.side})` : v.category ? ` · ${v.category}` : ""}`;
      return Object.entries(v).filter(([, x]) => x != null && x !== "").map(([k, x]) => `${k}: ${fmtDetailValue(x)}`).join(", ");
    }
    return String(v);
  };
  const fmtCorrectionSummary = (c: { summary?: string; details?: any; finding?: string }) => {
    const d = c.details || {};
    const parts: string[] = [];
    if (c.finding) parts.push(c.finding);
    if (d.zone1?.name) parts.push(`Z1 ${d.zone1.name}${d.zone1.side ? ` (${d.zone1.side})` : ""}`);
    if (d.zone2?.name) parts.push(`Z2 ${d.zone2.name}${d.zone2.side ? ` (${d.zone2.side})` : ""}`);
    const method = typeof d.method === "string" ? d.method : "";
    const timer = d.correctionTimerMinutes ? `${d.correctionTimerMinutes} min${d.correctionTimerCompleted ? " done" : ""}` : "";
    if (method && timer && method !== timer) parts.push(method, timer);
    else if (method || timer) parts.push(method || timer);
    if (d.retest) parts.push(String(d.retest));
    if (d.emotion) parts.push(String(d.emotion));
    if (d.organ) parts.push(String(d.organ));
    if (parts.length) return parts.join(" · ");
    const s = c.summary || "";
    if (!s.includes('{"') && !s.includes("zone1:")) return s;
    return Object.entries(d)
      .filter(([k, v]) => v != null && v !== "" && !(Array.isArray(v) && v.length === 0) && !["correctionTimerMinutes", "correctionTimerRemainingSeconds", "correctionTimerCompleted"].includes(k))
      .map(([k, v]) => `${k}: ${fmtDetailValue(v)}`)
      .join(" · ") || s;
  };

  /** The latest logged note for this pathway — recording the same text twice adds noise, not information. */
  const lastLogged = useMemo(() => {
    const mine = corrections.filter(c => c.pathway === priorityPathway);
    return mine.length > 0 ? mine[mine.length - 1].summary : null;
  }, [corrections, priorityPathway]);
  const isDuplicate = draft.trim() !== '' && draft.trim() === (lastLogged ?? '').trim();

  const acuTags = useMemo(
    () => String(appointment.acupoints ?? "").split(/[,\n]/).map(s => s.trim()).filter(Boolean),
    [appointment.acupoints]
  );

  /** The wizard dropdown is the single place that changes the correction target. */
  const changeWizardFinding = async (findingName: string) => {
    if (!findingName) return;
    const pathway = pathwayFindings.find(f => findingNameFromPathway(f.value) === findingName)?.value
      ?? findingName;
    await saveField('metadata', { ...meta, priority_pathway: pathway });
    onUpdate();
  };

  /** One write path for wizard completions and the manual Record button. */
  const logCorrection = async (summary: string) => {
    const clean = summary.trim();
    if (!clean) return;
    await saveField('modes_balances', clean);
    if (priorityPathway) {
      const next = appendManualCorrectionRecord({
        appointment: { priority_pattern: appointment.priority_pattern, metadata: appointment.metadata },
        pathway: priorityPathway,
        summary: clean,
      });
      await saveField('metadata', JSON.stringify(next.metadata));
      if (next.pattern && JSON.stringify(next.pattern) !== JSON.stringify(safeParse(appointment.priority_pattern, {}))) {
        await saveField('priority_pattern', JSON.stringify(next.pattern));
      }
    }
    onUpdate();
  };

  const persistDraft = async () => {
    if ((draft ?? "") !== (appointment.modes_balances ?? "")) {
      await saveField('modes_balances', draft || null);
      onUpdate();
    }
  };

  const saveAcuTags = async (tags: string[]) => {
    await saveField('acupoints', tags.join(', ') || null);
    onUpdate();
  };

  const addAcuTag = async () => {
    const v = acuInput.trim().replace(/,$/, "");
    if (!v || acuTags.includes(v)) return;
    setAcuInput("");
    await saveAcuTags([...acuTags, v]);
  };

  const removeAcuTag = async (tag: string) => {
    await saveAcuTags(acuTags.filter(t => t !== tag));
  };

  return (
    <>
    <Section className="space-y-5">

        {/* Read-only reminder — the wizard dropdown is the single editor. */}
        <div className="sticky top-[108px] z-20 -mx-1 border-b border-border/60 bg-background/90 px-1 py-2 backdrop-blur-xl">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary-strong">
              <Target size={15} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Priority pathway
              </p>
              <p className="text-[13px] font-semibold leading-snug text-foreground">
                {priorityPathway && priorityPathway !== 'CUSTOM' ? priorityPathway : 'None selected'}
              </p>
            </div>
          </div>
        </div>

        {/* Correction wizard */}
        <PathwayLogicWizard
          onSave={logCorrection}
          onClearItem={() => onUpdate()}
          priorityPattern={appointment.priority_pattern}
          initialFinding={priorityPathway || undefined}
          appointmentId={appointment.id}
          updatePriorityPattern={updatePriorityPattern}
          onChangeFinding={(name) => void changeWizardFinding(name)}
        />

        {/* Corrections applied — log as many processes as the session needs */}
        <Card padding="comfortable" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-card-title">Corrections applied</p>
              <p className="text-meta">
                Recorded corrections from protocol logs and quick corrections.
              </p>
            </div>
            <StatusBadge variant={appliedCorrections.length > 0 ? 'recorded' : 'pending'}>
              {appliedCorrections.length} logged
            </StatusBadge>
          </div>

          {/* Patterns — what the corrections cluster into */}
          {patterns.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {patterns.map(p => (
                <span
                  key={p.title}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-2.5 py-1 text-[11px] shadow-xs"
                >
                  <span className="font-semibold text-primary-strong">{p.title}</span>
                  <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70">{p.group}</span>
                  <span className="rounded-full bg-primary/10 px-1.5 text-[10px] font-bold tabular-nums text-primary-strong">
                    ×{p.count}
                  </span>
                </span>
              ))}
            </div>
          )}

          {/* Everything recorded this session, newest last */}
          {appliedCorrections.length > 0 ? (
            <ul className="space-y-2">
              {appliedCorrections.map((row) => (
                <li
                  key={row.key}
                  className="flex items-start gap-3 rounded-xl border border-border/70 bg-background px-4 py-3"
                >
                  <span
                    className={cn(
                      'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
                      row.live
                        ? 'bg-primary/15 text-primary-strong'
                        : 'bg-primary/15 text-primary-strong'
                    )}
                  >
                    <Check size={12} strokeWidth={3} />
                  </span>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    {row.pathway ? (
                      <p className="break-words text-[14px] font-semibold leading-snug text-foreground">
                        {row.pathway}
                      </p>
                    ) : (
                      <p className="text-[13px] font-medium italic leading-snug text-muted-foreground/60">
                        Pathway not recorded
                      </p>
                    )}
                    <p className="text-[11px] font-medium text-muted-foreground">
                      {row.processTitle}
                      <span className="ml-1.5 uppercase tracking-wide">{row.group}</span>
                      {row.live && (
                        <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          in progress
                        </span>
                      )}
                    </p>
                    <p className="break-words text-[12px] leading-relaxed text-muted-foreground">
                      {row.summary}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {row.savedAt && (
                      <span className="text-[10px] tabular-nums text-muted-foreground/70">
                        {fmtTime(row.savedAt)}
                      </span>
                    )}
                    {!row.live && row.entry && (
                      <button
                        type="button"
                        onClick={() => {
                          if (!window.confirm("Delete this correction entry?")) return;
                          logProtocol(row.processId, (previous) => ({
                            entries: (previous.entries ?? []).filter((e) => e.id !== row.entry!.id),
                          }));
                        }}
                        aria-label="Delete this correction"
                        className="rounded p-0.5 text-muted-foreground/60 transition-colors hover:bg-destructive/10 hover:text-destructive-strong"
                      >
                        <X size={11} />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={History}
              title="No corrections logged yet"
              description="Pick a process below — its step-by-step log opens here, and every correction you save is listed back here with the pathway and method."
            />
          )}

          {/* Pathway status — state it once; Align, Embed and the dock read the same record */}
          {touchedPathways.length > 0 && (
            <div className="space-y-2 rounded-xl border border-border/70 bg-muted/20 p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-card-title">Pathway status</p>
                <p className="text-meta">State each touched pathway once after re-testing.</p>
              </div>
              {touchedPathways.map(({ name, processId }) => {
                const status = pathwayStatus(name, processId);
                const normalizedStatus = status === "holding" ? "clear" : status;
                const options = [
                  { key: "inhibited" as const, label: "Not holding", glyph: "↓", active: "bg-card text-rose-700 dark:text-rose-300 shadow-xs" },
                  { key: "clear" as const, label: "Clear", glyph: "✓", active: "bg-card text-primary-strong dark:text-primary shadow-xs" },
                ];
                const last = [...appliedCorrections].reverse().find(r => r.pathway === name);
                const linked = linkedPathwayState(name, processId).state;
                return (
                  <div
                    key={`${processId || "unknown"}:${name}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-background px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-foreground">{name}</p>
                      {last && <p className="truncate text-[11px] text-muted-foreground">{last.processTitle}{last.savedAt ? ` · ${fmtTime(last.savedAt)}` : ""}{(linked?.correctionId || last.id) ? ` · ${String(linked?.correctionId || last.id).slice(0, 8)}` : ""}</p>}
                    </div>
                    <div className="inline-flex items-center rounded-lg bg-muted/60 p-0.5">
                      {options.map(o => (
                        <button
                          key={o.key}
                          type="button"
                          onClick={() => setPathwayStatus(name, o.key, processId)}
                          aria-pressed={normalizedStatus === o.key}
                          title={
                            o.key === "inhibited"
                              ? "Still not holding — needs more work"
                              : "Cleared on re-test"
                          }
                          className={cn(
                            "flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[11px] font-semibold transition-colors",
                            normalizedStatus === o.key ? o.active : "text-muted-foreground hover:text-foreground",
                          )}
                        >
                          <span aria-hidden>{o.glyph}</span> {o.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Process picker */}
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Log another process
            </p>
            {(['Afferent', 'Efferent'] as const).map(group => (
              <div key={group} className="flex flex-wrap items-center gap-2">
                <span className="w-16 shrink-0 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  {group}
                </span>
                {LOGGABLE.filter(l => l.group === group).map(proc => {
                  const open = openIds.includes(proc.id);
                  const count = countCorrections(protocolLogs?.[proc.id]);
                  const done = count > 0;
                  return (
                    <button
                      key={proc.id}
                      type="button"
                      aria-pressed={open}
                      title={open ? `Close ${proc.title} log` : `Open ${proc.title} log`}
                      onClick={() => {
                        setOpenIds(prev => {
                          const isOpen = prev.includes(proc.id);
                          if (isOpen) return prev.filter(id => id !== proc.id);
                          requestAnimationFrame(() => {
                            sheetRefs.current[proc.id]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                          });
                          return [...prev, proc.id];
                        });
                      }}
                      className={cn(
                        'flex h-8 items-center gap-2 whitespace-nowrap rounded-md border px-2 text-xs font-medium transition-colors',
                        open
                          ? 'border-primary/40 bg-primary/10 text-primary-strong'
                          : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
                      )}
                    >
                      {done && <Check size={12} strokeWidth={3} />}
                      {proc.title}
                      {count > 0 && (
                        <span className="rounded-full bg-primary/15 px-1.5 text-[10px] font-bold tabular-nums text-primary-strong">
                          {count}
                        </span>
                      )}
                      {open ? <X size={12} className="opacity-70" /> : <Plus size={12} className="opacity-70" />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Open process logs */}
          {openIds.length > 0 ? (
            <div className="space-y-3">
              {openIds.map(pid => {
                const proc = LOGGABLE.find(l => l.id === pid);
                if (!proc) return null;
                const log = protocolLogs?.[pid];
                const doneSteps = log?.steps?.length ?? 0;
                const totalSteps = stepTotal(pid);
                return (
                  <div key={pid} ref={(el) => { sheetRefs.current[pid] = el; }} className="overflow-hidden rounded-xl border border-border/70 bg-background scroll-mt-28">
                    <div className="flex items-center justify-between gap-2 border-b border-border/60 bg-muted/30 px-4 py-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <p className="text-[13px] font-semibold leading-snug text-foreground">{proc.title}</p>
                        <span className="shrink-0 rounded-full bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground">
                          {proc.group}
                        </span>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {totalSteps > 0 && (
                          <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
                            {doneSteps}/{totalSteps} steps
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => setOpenIds(prev => prev.filter(id => id !== pid))}
                          aria-label={`Close ${proc.title} log`}
                          className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                    <div className="p-4">
                      <ProtocolLogSheet
                        processId={pid}
                        fields={PROTOCOL_FIELDS[pid] ?? []}
                        log={log}
                        onChange={(patch) => logProtocol(pid, patch)}
                        pathwayLabel={stampedPathway}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </Card>

        {/* Running clinical note */}
        <Card padding="comfortable" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-card-title">Clinical note (manual)</p>
              <p className="text-meta">Optional narrative note; structured corrections are logged above.</p>
            </div>
            {corrections.length > 0 && (
              <StatusBadge variant="recorded">{corrections.length} entries</StatusBadge>
            )}
          </div>

          {corrections.length > 0 && (
            <div className="space-y-2">
              {corrections.map((c, i) => (
                <div key={i} className="flex gap-2 rounded-xl border border-border/60 bg-background px-4 py-3">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary/50" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="text-[13px] font-semibold text-foreground">{c.pathway}</span>
                      {c.timestamp && (
                        <span className="text-[11px] tabular-nums text-muted-foreground">{fmtTime(c.timestamp)}</span>
                      )}
                    </div>
                    <div className="mt-1 space-y-1 text-[13px] leading-relaxed text-foreground/80">
                      {c.finding && <p className="font-medium text-foreground/90">{c.finding}</p>}
                      {(c.details?.zone1?.name || c.details?.zone2?.name) ? (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {[
                            { key: "Zone 1", z: c.details?.zone1 },
                            { key: "Zone 2", z: c.details?.zone2 },
                          ].filter((x) => x.z?.name).map(({ key, z }) => {
                            const cat = z.category === "Subcortical" ? "Subcortical" : "Cortical";
                            const tone = cat === "Cortical"
                              ? "bg-efferent/10 border-efferent/25 text-efferent-strong"
                              : "bg-efferent/[0.07] border-efferent/20 text-efferent";
                            return (
                              <span key={key} className={cn("inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium", tone)}>
                                <span className="uppercase tracking-[0.08em] opacity-70">{key}</span>
                                <span>{z.name}{z.side ? ` (${z.side})` : ""}</span>
                                <span className="opacity-70">· {cat}</span>
                              </span>
                            );
                          })}
                        </div>
                      ) : null}
                      {(() => {
                        const d = c.details || {};
                        const method = typeof d.method === "string" ? d.method : "";
                        const timer = d.correctionTimerMinutes ? `${d.correctionTimerMinutes} min${d.correctionTimerCompleted ? " done" : ""}` : "";
                        const bits = [method && timer && method !== timer ? method : null, method && timer && method !== timer ? timer : (method || timer || null), d.retest, d.emotion, d.organ].filter(Boolean) as string[];
                        const fallback = !bits.length && !c.details?.zone1?.name && !c.details?.zone2?.name ? fmtCorrectionSummary(c) : null;
                        return bits.length ? <p className="text-muted-foreground">{bits.join(" · ")}</p> : fallback ? <p>{fallback}</p> : null;
                      })()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={persistDraft}
            placeholder="Document the coordinates, polarity, and methods applied…"
            rows={4}
            className="textarea min-h-[120px]"
          />
          <div className="flex justify-end">
            <PrimaryButton
              onClick={() => logCorrection(draft)}
              disabled={!draft.trim() || isDuplicate}
              title={isDuplicate ? "This note is already the latest entry" : "Log this note as a correction entry"}
              className="h-10 text-sm"
            >
              <Check size={15} /> Record correction
            </PrimaryButton>
          </div>
        </Card>

        {/* Acupoints */}
        <Card padding="comfortable" className="space-y-3">
          <div>
            <p className="text-card-title">Acupoints</p>
            <p className="text-meta">Any points held or needled — type a point, press Enter.</p>
          </div>
          {acuTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {acuTags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-primary/10 py-1 pl-3 pr-2 text-[11px] font-semibold text-primary-strong"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeAcuTag(tag)}
                    aria-label={`Remove ${tag}`}
                    className="flex h-4 w-4 items-center justify-center rounded-full transition-colors hover:bg-primary/20"
                  >
                    <X size={10} strokeWidth={3} />
                  </button>
                </span>
              ))}
            </div>
          )}
          <input
            value={acuInput}
            onChange={(e) => setAcuInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAcuTag(); } }}
            onBlur={() => { if (acuInput.trim()) addAcuTag(); }}
            placeholder="e.g. LI4, LV3…"
            className="input"
          />
        </Card>

        {onJumpToPhase && (
          <ConfirmationFooter
            title="Done with Correct?"
            description={appliedCorrections.length > 0 ? "Next, re-challenge and embed." : "Log at least one correction before moving to Embed."}
            action={
              <PrimaryButton onClick={() => onJumpToPhase(4)} disabled={appliedCorrections.length === 0} className="h-10 gap-2 px-4 text-sm font-medium">
                Continue to Embed <ArrowRight size={14} />
              </PrimaryButton>
            }
          />
        )}
      </Section>

    </>
  );
};

export default CorrectPhaseV3;
