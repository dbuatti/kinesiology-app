import { useState, useMemo, useEffect } from "react";
import { Target, Plus, X, Check, ArrowRight, History } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PathwayLogicWizard from "@/components/crm/PathwayLogicWizard";
import ProtocolLogSheet from "@/components/crm/corrections/ProtocolLogSheet";
import { PROTOCOL_FIELDS, PROTOCOL_STEP_MAP } from "@/data/protocol-log";
import { getInhibitedFindings, findingLabel } from "@/components/crm/v2/v2-utils";
import { safeParse } from "@/utils/safe-json";
import type { PhaseProps } from "@/components/crm/v2/v2-types";
import { useCorrectionDock } from "@/components/crm/corrections/CorrectionDockContext";
import {
  Card,
  Section,
  PrimaryButton,
  GhostButton,
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

const hasData = (values?: Record<string, unknown>, steps?: number[]) =>
  Object.values(values ?? {}).some((v) =>
    Array.isArray(v) ? v.length > 0 : v !== null && v !== undefined && v !== ""
  ) || (steps?.length ?? 0) > 0;

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

const CorrectPhaseV3 = ({ appointment, onUpdate, saveField, onJumpToPhase }: PhaseProps) => {
  const { protocolLogs, logProtocol } = useCorrectionDock();
  const [pathModalOpen, setPathModalOpen] = useState(false);
  const [customPathway, setCustomPathway] = useState("");
  const [customMode, setCustomMode] = useState(false);
  const [acuInput, setAcuInput] = useState("");
  const [draft, setDraft] = useState(appointment.modes_balances ?? "");

  const meta = useMemo(() => {
    if (!appointment.metadata) return {};
    if (typeof appointment.metadata === 'string') return safeParse(appointment.metadata, {});
    return appointment.metadata;
  }, [appointment.metadata]);

  const priorityPathway = (meta as any)?.priority_pathway || "";
  const isCustom = priorityPathway === 'CUSTOM';

  useEffect(() => {
    if (priorityPathway && priorityPathway !== 'CUSTOM') {
      setCustomPathway(priorityPathway);
    }
  }, [priorityPathway]);

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

  const initialFinding = useMemo(() => {
    if (!priorityPathway) return undefined;
    return priorityPathway.split(' — ')[0];
  }, [priorityPathway]);

  // Processes with saved data reopen automatically; the picker adds more.
  const [openIds, setOpenIds] = useState<string[]>(() =>
    LOGGABLE.map(l => l.id).filter(id => hasData(protocolLogs?.[id]?.values, protocolLogs?.[id]?.steps))
  );
  const loggedCount = LOGGABLE.filter(l => hasData(protocolLogs?.[l.id]?.values, protocolLogs?.[l.id]?.steps)).length;

  const corrections = useMemo(
    () => (((meta as any)?.corrections || []) as { pathway: string; summary: string; timestamp: string }[]),
    [meta]
  );

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

  const selectPathway = async (val: string) => {
    if (val === 'CUSTOM') {
      setCustomMode(true);
      return;
    }
    setCustomMode(false);
    await saveField('metadata', { ...meta, priority_pathway: val });
    onUpdate();
  };

  const saveCustom = async () => {
    if (!customPathway.trim()) return;
    setCustomMode(false);
    await saveField('metadata', { ...meta, priority_pathway: customPathway.trim() });
    onUpdate();
  };

  /** One write path for wizard completions and the manual Record button. */
  const logCorrection = async (summary: string) => {
    const clean = summary.trim();
    if (!clean) return;
    await saveField('modes_balances', clean);
    if (priorityPathway) {
      const next = [...corrections, { pathway: priorityPathway, summary: clean, timestamp: new Date().toISOString() }];
      await saveField('metadata', { ...meta, corrections: next });
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

        {/* Sticky pathway reminder (compact) */}
        <div className="sticky top-[108px] z-20 -mx-1 border-b border-border/60 bg-background/90 px-1 py-2 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
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
            <GhostButton onClick={() => setPathModalOpen(true)} className="h-9 shrink-0 text-[13px]">
              Change
            </GhostButton>
          </div>
        </div>

        {/* Finding selector (until a real pathway is set) */}
        {pathwayFindings.length > 0 && (!priorityPathway || isCustom || customMode) && (
          <Card padding="comfortable" className="space-y-3">
            <p className="text-card-title">Select finding to correct</p>
            <Select
              value={priorityPathway && priorityPathway !== 'CUSTOM' ? priorityPathway : ''}
              onValueChange={selectPathway}
            >
              <SelectTrigger className="h-10 w-full rounded-md border-border bg-background text-sm">
                <SelectValue placeholder="Choose an inhibited finding…" />
              </SelectTrigger>
              <SelectContent className="max-h-[200px] rounded-xl border-border">
                {pathwayFindings.map(f => (
                  <SelectItem key={f.value} value={f.value} className="rounded-md py-2 text-[13px] font-medium">
                    {f.value}
                  </SelectItem>
                ))}
                <SelectItem value="CUSTOM" className="rounded-md py-2 text-[13px] font-medium text-primary">
                  <Plus size={12} className="mr-2 inline" /> Custom entry
                </SelectItem>
              </SelectContent>
            </Select>
            {(isCustom || customMode) && (
              <div className="flex items-center gap-2">
                <input
                  value={customPathway}
                  onChange={e => setCustomPathway(e.target.value)}
                  placeholder="e.g. Startle Reflex — Primitive Reflex"
                  className="input"
                  autoFocus
                />
                <PrimaryButton
                  disabled={!customPathway.trim()}
                  onClick={saveCustom}
                  className="h-10 shrink-0 px-4 text-[13px]"
                >
                  Save
                </PrimaryButton>
              </div>
            )}
          </Card>
        )}

        {/* Correction wizard */}
        <PathwayLogicWizard
          onSave={logCorrection}
          onClearItem={() => onUpdate()}
          priorityPattern={appointment.priority_pattern}
          initialFinding={initialFinding}
          appointmentId={appointment.id}
        />

        {/* Corrections applied — log as many processes as the session needs */}
        <Card padding="comfortable" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-card-title">Corrections applied</p>
              <p className="text-meta">Open a process to log its steps — add as many as you correct.</p>
            </div>
            <StatusBadge variant={loggedCount > 0 ? 'recorded' : 'pending'}>
              {loggedCount} logged
            </StatusBadge>
          </div>

          {/* Process picker */}
          <div className="space-y-2">
            {(['Afferent', 'Efferent'] as const).map(group => (
              <div key={group} className="flex flex-wrap items-center gap-2">
                <span className="w-16 shrink-0 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  {group}
                </span>
                {LOGGABLE.filter(l => l.group === group).map(proc => {
                  const open = openIds.includes(proc.id);
                  const done = hasData(protocolLogs?.[proc.id]?.values, protocolLogs?.[proc.id]?.steps);
                  return (
                    <button
                      key={proc.id}
                      type="button"
                      onClick={() => setOpenIds(prev => prev.includes(proc.id) ? prev : [...prev, proc.id])}
                      className={cn(
                        'flex h-8 items-center gap-2 whitespace-nowrap rounded-md border px-2 text-xs font-medium transition-colors',
                        open
                          ? 'border-primary/40 bg-primary/10 text-primary-strong'
                          : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
                      )}
                    >
                      {done && <Check size={12} strokeWidth={3} />}
                      {proc.title}
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
                  <div key={pid} className="overflow-hidden rounded-xl border border-border/70 bg-background">
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
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={History}
              title="No corrections logged yet"
              description="Pick a process above — its step-by-step log opens here, and you can log as many as the session needs."
            />
          )}
        </Card>

        {/* Running clinical note */}
        <Card padding="comfortable" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-card-title">Corrections &amp; balances note</p>
              <p className="text-meta">Coordinates, polarity and method — the running record.</p>
            </div>
            {corrections.length > 0 && (
              <StatusBadge variant="recorded">{corrections.length} entries</StatusBadge>
            )}
          </div>

          {corrections.length > 0 && (
            <div className="space-y-2">
              {corrections.map((c, i) => (
                <div key={i} className="flex gap-2 rounded-xl border border-border/60 bg-background px-4 py-3">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-success" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="text-[13px] font-semibold text-foreground">{c.pathway}</span>
                      {c.timestamp && (
                        <span className="text-[11px] tabular-nums text-muted-foreground">{fmtTime(c.timestamp)}</span>
                      )}
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-foreground/80">
                      {c.summary}
                    </p>
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
            description="Next, re-challenge and embed."
            action={
              <PrimaryButton onClick={() => onJumpToPhase(4)} className="h-10 gap-2 px-4 text-sm font-medium">
                Continue to Embed <ArrowRight size={14} />
              </PrimaryButton>
            }
          />
        )}
      </Section>

      {/* Priority pathway modal */}
      <Dialog open={pathModalOpen} onOpenChange={setPathModalOpen}>
        <DialogContent className="mx-4 flex max-h-[85vh] w-[calc(100%-2rem)] flex-col rounded-2xl p-0 sm:max-w-[500px]">
          <DialogHeader className="shrink-0 border-b border-border px-6 pb-4 pt-6">
            <DialogTitle className="flex items-center gap-2 text-[15px] font-semibold">
              <Target size={17} className="text-primary" /> Priority pathway
            </DialogTitle>
          </DialogHeader>
          <div className="min-w-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
            <div className="space-y-2">
              <p className="text-card-title">Correction target</p>
              <Select
                value={priorityPathway && priorityPathway !== 'CUSTOM' ? priorityPathway : ''}
                onValueChange={(val) => {
                  setCustomPathway("");
                  selectPathway(val);
                }}
              >
                <SelectTrigger className="h-10 w-full rounded-md border-border text-sm">
                  <SelectValue placeholder="Select the priority finding…" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border">
                  {pathwayFindings.map(f => (
                    <SelectItem key={f.value} value={f.value} className="rounded-md py-2 text-[13px] font-medium">
                      {f.value}
                    </SelectItem>
                  ))}
                  <SelectItem value="CUSTOM" className="rounded-md py-2 text-[13px] font-medium text-primary">
                    <Plus size={13} className="mr-2 inline" /> Custom entry
                  </SelectItem>
                </SelectContent>
              </Select>
              {(isCustom || customMode) && (
                <div className="mt-2 flex items-center gap-2">
                  <input
                    value={customPathway}
                    onChange={e => setCustomPathway(e.target.value)}
                    placeholder="e.g. Startle Reflex — Primitive Reflex"
                    className="input"
                    autoFocus
                  />
                  <PrimaryButton
                    disabled={!customPathway.trim()}
                    onClick={saveCustom}
                    className="h-10 shrink-0 px-4 text-[13px]"
                  >
                    Save
                  </PrimaryButton>
                </div>
              )}
            </div>
            {priorityPathway && priorityPathway !== 'CUSTOM' && (
              <div className="space-y-3">
                <div className="space-y-2 rounded-xl border border-border bg-muted/40 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Priority pathway</p>
                  <p className="text-sm font-semibold text-foreground">{priorityPathway}</p>
                </div>
                {(() => {
                  const pathwayCorrections = corrections.filter(c => c.pathway === priorityPathway);
                  const list = pathwayCorrections.length > 0 ? pathwayCorrections
                    : appointment.modes_balances
                      ? [{ pathway: priorityPathway, summary: appointment.modes_balances, timestamp: "" }]
                      : [];
                  return list.length > 0 ? (
                    <div className="space-y-2">
                      <p className="px-1 text-xs font-medium text-muted-foreground">
                        Corrections linked to {priorityPathway}
                      </p>
                      {list.map((c, i) => (
                        <div key={i} className="space-y-2 rounded-xl border border-border bg-muted/40 p-4">
                          {list.length > 1 && (
                            <p className="text-xs font-medium text-muted-foreground">Correction #{i + 1}</p>
                          )}
                          <p className="text-sm font-medium leading-relaxed text-foreground">{c.summary}</p>
                          <div className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground">
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                            Linked to {c.pathway}
                            {c.timestamp && <span className="tabular-nums">· {fmtTime(c.timestamp)}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null;
                })()}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CorrectPhaseV3;
