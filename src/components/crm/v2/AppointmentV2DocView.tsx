import { useState, useCallback, useRef, useEffect, Fragment } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Printer,
  Target,
  Copy,
  Check,
} from "lucide-react";
import { format } from "date-fns";
import PathwayFindingsList from "@/components/crm/PathwayFindingsList";
import { ReflexQuickRow } from "@/components/crm/reflex-corrections/ReflexQuickRow";
import { useItemCorrections } from "@/components/crm/reflex-corrections/useItemCorrections";
import { ShowingLog, type CorrectionEntry } from "@/components/crm/ShowingLog";
import { RecheckSection } from "@/components/crm/RecheckSection";
import { CRANIAL_NERVES } from "@/data/cranial-nerve-data";
import { PRIMITIVE_REFLEXES } from "@/data/primitive-reflex-data";
import { MUSCLE_GROUPS, MIDLINE_MUSCLES } from "@/data/muscle-data";
import { getMuscleInfo } from "@/data/muscle-info-data";
import { AppointmentWithClient } from "@/types/crm";
import { cn } from "@/lib/utils";
import { PATHWAY_DIRECTION, directionForProcess, directionFromText } from "@/lib/pathway-direction";
import { safeParse } from "@/utils/safe-json";
import { supabase } from "@/integrations/supabase/client";
import { correctionDisplayText } from "@/lib/corrections";

interface DocViewProps {
  appointment: AppointmentWithClient;
  history: any[];
  onBack: () => void;
  saveField: (field: string, value: any) => Promise<void>;
  updatePriorityPattern: (category: string, itemName: string, status: any, side?: 'L' | 'R') => Promise<void>;
  hideToolbar?: boolean;
  editable?: boolean;
}

const SectionHeading = ({ num, label }: { num: string; label: string }) => (
  <div className="flex items-baseline gap-2 mb-3">
    <span className="text-[12px] font-bold text-foreground">{num}.</span>
    <h2 className="text-[12px] font-bold text-foreground">{label}</h2>
  </div>
);

const EmptySection = ({ message = "No data recorded" }: { message?: string }) => (
  <div className="flex items-center gap-2 py-3">
    <div className="w-1 h-6 rounded-full bg-border" />
    <p className="text-[11px] italic text-muted-foreground/40">{message}</p>
  </div>
);

const EditableField = ({ label, value, field, onSave, editable = false }: {
  label: string;
  value?: string | null;
  field: string;
  onSave?: (field: string, value: any) => Promise<void>;
  editable?: boolean;
}) => {
  const [draft, setDraft] = useState(value || "");
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editable && taRef.current) {
      taRef.current.style.height = 'auto';
      taRef.current.style.height = taRef.current.scrollHeight + 'px';
    }
  }, [editable, draft]);

  if (!editable) {
    return (
      <div className="mb-4 pb-4 border-b border-border/30 last:border-b-0">
        <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
        <p className="text-[13px] text-foreground leading-relaxed whitespace-pre-wrap">{value || "—"}</p>
      </div>
    );
  }

  return (
    <div className="mb-4 pb-4 border-b border-border/30 last:border-b-0">
      <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
      <textarea
        ref={taRef}
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          e.target.style.height = 'auto';
          e.target.style.height = e.target.scrollHeight + 'px';
        }}
        onBlur={() => onSave?.(field, draft)}
        rows={1}
        className="w-full bg-transparent text-[13px] text-foreground leading-relaxed border border-dashed border-border/40 rounded px-2 py-1.5 focus:outline-none focus:border-primary/50 focus:bg-muted/20 resize-none hover:border-border/80 transition-colors overflow-hidden"
        placeholder="Type here..."
      />
    </div>
  );
};

const EditableNumberField = ({ label, value, field, onSave, editable = false, suffix = "" }: {
  label: string;
  value?: number | null;
  field: string;
  onSave?: (field: string, value: any) => Promise<void>;
  editable?: boolean;
  suffix?: string;
}) => {
  const [draft, setDraft] = useState(value != null ? String(value) : "");

  if (!editable || value == null) {
    if (value == null && !editable) return null;
    return (
      <div className="p-2.5 bg-muted/50 rounded border border-border text-center">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-sm font-bold text-foreground">{value}{suffix}</p>
      </div>
    );
  }

  return (
    <div className="p-2.5 bg-muted/50 rounded border border-border text-center">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <input
        type="number"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          const num = draft === "" ? null : parseFloat(draft);
          onSave?.(field, num);
        }}
        className="w-full bg-transparent text-sm font-bold text-foreground text-center border-b border-dashed border-border/40 focus:outline-none focus:border-primary/50"
        placeholder="—"
        step="any"
      />
    </div>
  );
};

const AppointmentV2DocView = ({ appointment, history, onBack, hideToolbar, editable = false, saveField, updatePriorityPattern }: DocViewProps) => {
  const handlePrint = () => window.print();
  const [clientName, setClientName] = useState(appointment.clients?.name || "");
  const [copied, setCopied] = useState(false);
  const [correctionEntries, setCorrectionEntries] = useState<CorrectionEntry[]>(() => {
    const meta = safeParse(appointment.metadata, {} as any);
    return (meta?.corrections || []).map((c: any) => ({
      finding: c.finding || c.pathway || 'Unknown',
      summary: c.summary || '',
      timestamp: c.timestamp || new Date().toISOString(),
      status: c.status || 'pending',
      recheckTimestamp: c.recheckTimestamp,
    }));
  });

  const handleSaveClientName = async () => {
    if (!clientName.trim() || clientName === appointment.clients?.name) return;
    const clientId = appointment.clients?.id;
    if (!clientId) return;
    const { error } = await supabase
      .from('clients')
      .update({ name: clientName.trim() })
      .eq('id', clientId);
    if (error) {
      console.error("Failed to save client name:", error);
      return;
    }
    // Update local appointment state
    saveField('clients', { ...appointment.clients, name: clientName.trim() });
  };

  const pattern = safeParse(appointment.priority_pattern, {} as Record<string, Record<string, string>>);
  
    const inhibitedCount = Object.values(pattern).reduce((acc, cat) => {
        return acc + Object.values(cat).filter((s) => s === 'Inhibited' || s === 'Inhibition' || s === 'Hypertonic').length;
      }, 0);
    const clearedCount = Object.values(pattern).reduce((acc, cat) => {
        return acc + Object.values(cat).filter((s) => s === 'Inhibited_Cleared' || s === 'Inhibition_Cleared' || s === 'Hypertonic_Cleared').length;
      }, 0);

  const hasAnyVitals = appointment.bolt_score != null || appointment.coherence_score != null || appointment.heart_rate != null || appointment.breath_rate != null;
  const hasAnyCogs = appointment.sagittal_plane_notes || appointment.frontal_plane_notes || appointment.transverse_plane_notes;
  const hasAnyNeuro = appointment.fakuda_notes || appointment.sharpened_rhombergs_notes || appointment.frontal_lobe_notes || appointment.righting_reflex_notes;
  const hasAnySns = appointment.harmonic_rocking_notes || appointment.t1_reset_notes || appointment.diaphragm_reset_notes || appointment.vagus_nerve_notes || appointment.lymphatic_notes;

  const metadata = safeParse<Record<string, any>>(appointment.metadata, {});
    const priorityPathway = (metadata?.priority_pathway as string) || "";

  const muscleDesc = (name: string) => {
    const info = getMuscleInfo(name);
    return info.meridian || undefined;
  };
  const muscleTestPos = (name: string) => {
    const info = getMuscleInfo(name);
    return info.testingPosition || undefined;
  };
  const correctionsHistory = metadata?.corrections || [];
  const correctionText = correctionDisplayText(appointment);

  const hasAnyAlign = inhibitedCount > 0 || clearedCount > 0 || !!priorityPathway || !!appointment.emotion_primary_selection;
  const hasAnyCorrect = !!correctionText || !!appointment.acupoints || correctionsHistory.length > 0;
  const hasAnyEmbed = !!appointment.session_north_star || !!appointment.next_session_note || (metadata?.cleared_findings?.length > 0);

  const sb = useCallback((field: string, value: any) => saveField?.(field, value), [saveField]);

  const handleAssessmentToggle = useCallback((category: string, name: string, nextStatus: string, side?: 'L' | 'R') => {
    updatePriorityPattern(category, name, nextStatus === 'Clear' ? null : nextStatus, side);
  }, [updatePriorityPattern]);
  const corr = useItemCorrections(appointment, saveField ?? (async () => {}), () => {});
  const { getCorrections, isPriority, getPriorityTier, togglePriority, setPriorityTier, addCorrection, updateCorrection, toggleHolding, removeCorrection } = corr;

  const handleCorrectionStatusChange = useCallback(async (index: number, status: 'cleared' | 'still_showing') => {
    setCorrectionEntries(prev => {
      const next = [...prev];
      next[index] = { ...next[index], status, recheckTimestamp: new Date().toISOString() };
      // Persist back to metadata
      const meta = safeParse(appointment.metadata, {} as any);
      const corrections = (meta?.corrections || []).map((c: any, i: number) => {
        if (i === index) return { ...c, status, recheckTimestamp: new Date().toISOString() };
        return c;
      });
      saveField('metadata', { ...meta, corrections });
      return next;
    });
  }, [appointment.metadata, saveField]);

  const handleRecheckSetPriority = useCallback(async (finding: string) => {
    await saveField('metadata', {
      ...safeParse(appointment.metadata, {}),
      priority_pathway: finding,
    });
  }, [appointment.metadata, saveField]);

  const handleRecheckResolved = useCallback(async (finding: string) => {
    const meta = safeParse(appointment.metadata, {} as any);
    const cleared = [...(meta?.cleared_findings || [])];
    if (!cleared.includes(finding)) cleared.push(finding);
    await saveField('metadata', { ...meta, cleared_findings: cleared });
  }, [appointment.metadata, saveField]);

  const hasPatternCategory = (cat: string) => {
    const entries = pattern?.[cat];
    return entries && typeof entries === 'object' && Object.keys(entries).length > 0;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky toolbar */}
      {!hideToolbar && (
        <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border print:hidden shadow-sm">
          <div className="px-4 md:px-8 h-12 flex items-center justify-between gap-4">
            <Button variant="ghost" size="sm" onClick={onBack} className="rounded-lg text-muted-foreground h-8">
              <ArrowLeft size={15} className="mr-1.5" /> Back to Session
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-lg h-8 gap-1.5"
                onClick={async () => {
                  const parts = [
                    appointment.clients?.name,
                    appointment.date ? new Date(appointment.date).toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "",
                    appointment.goal ? `Goal: ${appointment.goal}` : "",
                    appointment.issue ? `Concern: ${appointment.issue}` : "",
                    appointment.notes ? `Notes: ${appointment.notes}` : "",
                  ].filter(Boolean);
                  try {
                    await navigator.clipboard.writeText(parts.join("\\n\\n"));
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  } catch {
                    // Clipboard blocked by the browser — nothing to recover.
                  }
                }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied" : "Copy all"}
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint} className="rounded-lg h-8">
                <Printer size={15} className="mr-1.5" /> Print Document
              </Button>
            </div>
          </div>
        </header>
      )}

      {/* Document page */}
      <div className="max-w-[210mm] mx-auto px-8 md:px-12 py-12 print:py-0">
        <div className="bg-card shadow-sm border border-border rounded-xl print-doc p-10 md:p-14 print-doc-body animate-in fade-in duration-500">

          {/* ── DOCUMENT HEADER ── */}
          <div className="pb-6 mb-8 border-b-2 border-foreground/15">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Clinical Session Notes</p>
                <h1 className="text-[22px] font-bold tracking-tight text-foreground leading-tight">
                  {editable ? (
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      onBlur={handleSaveClientName}
                      onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                      className="w-full bg-transparent border-b-2 border-dashed border-border/40 focus:outline-none focus:border-primary/50 transition-colors"
                      placeholder="Client name"
                    />
                  ) : (
                    appointment.clients?.name || "Client Session"
                  )}
                </h1>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span>{format(new Date(appointment.date), "EEEE, MMMM d, yyyy")}</span>
                  <span className="text-border/40">|</span>
                  <span>{format(new Date(appointment.date), "h:mm a")}</span>
                  {appointment.display_id && (
                    <>
                      <span className="text-border/40">|</span>
                      <span className="font-mono">#{appointment.display_id}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="hidden print:block text-right">
                <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Resonance Kinesiology</p>
              </div>
            </div>
          </div>

          {/* Recheck Previous Findings */}
          {history.length > 0 && (
            <div className="mb-8 print:hidden">
              <RecheckSection
                currentAppointment={appointment}
                history={history}
                onSetPriority={handleRecheckSetPriority}
                onMarkResolved={handleRecheckResolved}
              />
            </div>
          )}

          {/* ════════════════════════════════════════
             1 — PRELIMINARY ASSESSMENT
             ════════════════════════════════════════ */}
          <div className="mb-10 no-break">
            <SectionHeading num="1" label="Preliminary Assessment" />

            <EditableField label="Session Goal" value={appointment.goal} field="goal" onSave={sb} editable={editable} />
            <EditableField label="Primary Concern" value={appointment.issue} field="issue" onSave={sb} editable={editable} />

            {/* Baseline Vitals */}
            {(hasAnyVitals || editable) && (
              <div className="mb-4 pb-4 border-b border-border/30">
                <p className="text-xs font-medium text-muted-foreground mb-2">Baseline Vitals</p>
                <div className="grid grid-cols-4 gap-2">
                  <EditableNumberField label="BOLT" value={appointment.bolt_score} field="bolt_score" onSave={sb} editable={editable} suffix="s" />
                  <EditableNumberField label="Coherence" value={appointment.coherence_score} field="coherence_score" onSave={sb} editable={editable} />
                  <EditableNumberField label="HR" value={appointment.heart_rate} field="heart_rate" onSave={sb} editable={editable} suffix=" bpm" />
                  <EditableNumberField label="Breath" value={appointment.breath_rate} field="breath_rate" onSave={sb} editable={editable} suffix=" rpm" />
                </div>
              </div>
            )}

            {/* COGS */}
            {(hasAnyCogs || editable) && (
              <div className="mb-4 pb-4 border-b border-border/30">
                <p className="text-xs font-medium text-muted-foreground mb-2">COGS — Visual Assessment</p>
                <div className="space-y-1.5">
                  <EditableField label="Sagittal" value={appointment.sagittal_plane_notes} field="sagittal_plane_notes" onSave={sb} editable={editable} />
                  <EditableField label="Frontal" value={appointment.frontal_plane_notes} field="frontal_plane_notes" onSave={sb} editable={editable} />
                  <EditableField label="Transverse" value={appointment.transverse_plane_notes} field="transverse_plane_notes" onSave={sb} editable={editable} />
                </div>
              </div>
            )}

            {/* Neurological Baseline */}
            {(hasAnyNeuro || editable) && (
              <div className="mb-4 pb-4 border-b border-border/30">
                <p className="text-xs font-medium text-muted-foreground mb-2">Neurological Baseline</p>
                <div className="space-y-1.5">
                  <EditableField label="Fukuda Step Test" value={appointment.fakuda_notes} field="fakuda_notes" onSave={sb} editable={editable} />
                  <EditableField label="Sharpened Rhomberg's" value={appointment.sharpened_rhombergs_notes} field="sharpened_rhombergs_notes" onSave={sb} editable={editable} />
                  <EditableField label="Frontal Lobe Signs" value={appointment.frontal_lobe_notes} field="frontal_lobe_notes" onSave={sb} editable={editable} />
                  <EditableField label="Righting Reflex" value={appointment.righting_reflex_notes} field="righting_reflex_notes" onSave={sb} editable={editable} />
                </div>
              </div>
            )}

            {/* Cranial Nerve Assessment */}
            {(editable || hasPatternCategory('cranialNerves')) && (
              <div className="mb-4 pb-4 border-b border-border/30">
                <p className="text-xs font-medium text-muted-foreground mb-2">Cranial Nerve Assessment</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5">
                  {CRANIAL_NERVES.map(n => {
                    const nerveName = `${n.name}: ${n.latinName}`;
                    return n.isLateralized ? (
                      <Fragment key={n.name}>
                        <ReflexQuickRow category="cranialNerves" name={nerveName} side="L" pattern={pattern} onToggle={handleAssessmentToggle} corrections={getCorrections("cranialNerves", nerveName, "L")} isPriority={isPriority("cranialNerves", nerveName, "L")} priorityTier={getPriorityTier("cranialNerves", nerveName, "L")} onSetPriorityTier={(t)=>setPriorityTier("cranialNerves", nerveName, "L", t)} onTogglePriority={()=>togglePriority("cranialNerves", nerveName, "L")} onAddCorrection={(c)=>addCorrection("cranialNerves", nerveName, c, "L")} onUpdateCorrection={(c)=>updateCorrection("cranialNerves", nerveName, c, "L")} onToggleHolding={(id)=>toggleHolding("cranialNerves", nerveName, id, "L")} onRemoveCorrection={(id)=>removeCorrection("cranialNerves", nerveName, id, "L")} />
                        <ReflexQuickRow category="cranialNerves" name={nerveName} side="R" pattern={pattern} onToggle={handleAssessmentToggle} corrections={getCorrections("cranialNerves", nerveName, "R")} isPriority={isPriority("cranialNerves", nerveName, "R")} priorityTier={getPriorityTier("cranialNerves", nerveName, "R")} onSetPriorityTier={(t)=>setPriorityTier("cranialNerves", nerveName, "R", t)} onTogglePriority={()=>togglePriority("cranialNerves", nerveName, "R")} onAddCorrection={(c)=>addCorrection("cranialNerves", nerveName, c, "R")} onUpdateCorrection={(c)=>updateCorrection("cranialNerves", nerveName, c, "R")} onToggleHolding={(id)=>toggleHolding("cranialNerves", nerveName, id, "R")} onRemoveCorrection={(id)=>removeCorrection("cranialNerves", nerveName, id, "R")} />
                      </Fragment>
                    ) : (
                      <ReflexQuickRow key={n.name} category="cranialNerves" name={nerveName} pattern={pattern} onToggle={handleAssessmentToggle} corrections={getCorrections("cranialNerves", nerveName)} isPriority={isPriority("cranialNerves", nerveName)} priorityTier={getPriorityTier("cranialNerves", nerveName)} onSetPriorityTier={(t)=>setPriorityTier("cranialNerves", nerveName, undefined, t)} onTogglePriority={()=>togglePriority("cranialNerves", nerveName)} onAddCorrection={(c)=>addCorrection("cranialNerves", nerveName, c)} onUpdateCorrection={(c)=>updateCorrection("cranialNerves", nerveName, c)} onToggleHolding={(id)=>toggleHolding("cranialNerves", nerveName, id)} onRemoveCorrection={(id)=>removeCorrection("cranialNerves", nerveName, id)} />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Primitive Reflex Assessment */}
            {(editable || hasPatternCategory('primitiveReflexes')) && (
              <div className="mb-4 pb-4 border-b border-border/30">
                <p className="text-xs font-medium text-muted-foreground mb-2">Primitive Reflex Assessment</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5">
                  {PRIMITIVE_REFLEXES.map(r => r.isLateralized ? (
                    <Fragment key={r.id}>
                      <ReflexQuickRow category="primitiveReflexes" name={r.name} side="L" pattern={pattern} onToggle={handleAssessmentToggle} corrections={getCorrections("primitiveReflexes", r.name, "L")} isPriority={isPriority("primitiveReflexes", r.name, "L")} priorityTier={getPriorityTier("primitiveReflexes", r.name, "L")} onSetPriorityTier={(t)=>setPriorityTier("primitiveReflexes", r.name, "L", t)} onTogglePriority={()=>togglePriority("primitiveReflexes", r.name, "L")} onAddCorrection={(c)=>addCorrection("primitiveReflexes", r.name, c, "L")} onUpdateCorrection={(c)=>updateCorrection("primitiveReflexes", r.name, c, "L")} onToggleHolding={(id)=>toggleHolding("primitiveReflexes", r.name, id, "L")} onRemoveCorrection={(id)=>removeCorrection("primitiveReflexes", r.name, id, "L")} />
                      <ReflexQuickRow category="primitiveReflexes" name={r.name} side="R" pattern={pattern} onToggle={handleAssessmentToggle} corrections={getCorrections("primitiveReflexes", r.name, "R")} isPriority={isPriority("primitiveReflexes", r.name, "R")} priorityTier={getPriorityTier("primitiveReflexes", r.name, "R")} onSetPriorityTier={(t)=>setPriorityTier("primitiveReflexes", r.name, "R", t)} onTogglePriority={()=>togglePriority("primitiveReflexes", r.name, "R")} onAddCorrection={(c)=>addCorrection("primitiveReflexes", r.name, c, "R")} onUpdateCorrection={(c)=>updateCorrection("primitiveReflexes", r.name, c, "R")} onToggleHolding={(id)=>toggleHolding("primitiveReflexes", r.name, id, "R")} onRemoveCorrection={(id)=>removeCorrection("primitiveReflexes", r.name, id, "R")} />
                    </Fragment>
                  ) : (
                    <ReflexQuickRow key={r.id} category="primitiveReflexes" name={r.name} pattern={pattern} onToggle={handleAssessmentToggle} corrections={getCorrections("primitiveReflexes", r.name)} isPriority={isPriority("primitiveReflexes", r.name)} priorityTier={getPriorityTier("primitiveReflexes", r.name)} onSetPriorityTier={(t)=>setPriorityTier("primitiveReflexes", r.name, undefined, t)} onTogglePriority={()=>togglePriority("primitiveReflexes", r.name)} onAddCorrection={(c)=>addCorrection("primitiveReflexes", r.name, c)} onUpdateCorrection={(c)=>updateCorrection("primitiveReflexes", r.name, c)} onToggleHolding={(id)=>toggleHolding("primitiveReflexes", r.name, id)} onRemoveCorrection={(id)=>removeCorrection("primitiveReflexes", r.name, id)} />
                  ))}
                </div>
              </div>
            )}

            {/* Muscle Assessment — Intrinsic Stabilisation */}
            {(editable || hasPatternCategory('muscles')) && (
              <div className="mb-4 pb-4 border-b border-border/30">
                <p className="text-xs font-medium text-muted-foreground mb-2">Muscle Assessment — Intrinsic Stabilisation</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5">
                  {(MUSCLE_GROUPS['Intrinsic Stabilisation'] || []).map(m => MIDLINE_MUSCLES.includes(m) ? (
                    <Fragment key={m}>
                      <ReflexQuickRow category="muscles" name={m} pattern={pattern} onToggle={handleAssessmentToggle} corrections={getCorrections("muscles", m)} isPriority={isPriority("muscles", m)} priorityTier={getPriorityTier("muscles", m)} onSetPriorityTier={(t)=>setPriorityTier("muscles", m, undefined, t)} onTogglePriority={()=>togglePriority("muscles", m)} onAddCorrection={(c)=>addCorrection("muscles", m, c)} onUpdateCorrection={(c)=>updateCorrection("muscles", m, c)} onToggleHolding={(id)=>toggleHolding("muscles", m, id)} onRemoveCorrection={(id)=>removeCorrection("muscles", m, id)} />
                    </Fragment>
                  ) : (
                    <Fragment key={m}>
                      <ReflexQuickRow category="muscles" name={m} side="L" pattern={pattern} onToggle={handleAssessmentToggle} corrections={getCorrections("muscles", m, "L")} isPriority={isPriority("muscles", m, "L")} priorityTier={getPriorityTier("muscles", m, "L")} onSetPriorityTier={(t)=>setPriorityTier("muscles", m, "L", t)} onTogglePriority={()=>togglePriority("muscles", m, "L")} onAddCorrection={(c)=>addCorrection("muscles", m, c, "L")} onUpdateCorrection={(c)=>updateCorrection("muscles", m, c, "L")} onToggleHolding={(id)=>toggleHolding("muscles", m, id, "L")} onRemoveCorrection={(id)=>removeCorrection("muscles", m, id, "L")} />
                      <ReflexQuickRow category="muscles" name={m} side="R" pattern={pattern} onToggle={handleAssessmentToggle} corrections={getCorrections("muscles", m, "R")} isPriority={isPriority("muscles", m, "R")} priorityTier={getPriorityTier("muscles", m, "R")} onSetPriorityTier={(t)=>setPriorityTier("muscles", m, "R", t)} onTogglePriority={()=>togglePriority("muscles", m, "R")} onAddCorrection={(c)=>addCorrection("muscles", m, c, "R")} onUpdateCorrection={(c)=>updateCorrection("muscles", m, c, "R")} onToggleHolding={(id)=>toggleHolding("muscles", m, id, "R")} onRemoveCorrection={(id)=>removeCorrection("muscles", m, id, "R")} />
                    </Fragment>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ════════════════════════════════════════
             2 — EASE (SNS DOWN-REGULATION)
             ════════════════════════════════════════ */}
          <div className="mb-10">
            <SectionHeading num="2" label="Ease — SNS Down-Regulation" />
            {(hasAnySns || editable) ? (
              <div className="space-y-1.5">
                <EditableField label="Lymphatic" value={appointment.lymphatic_notes} field="lymphatic_notes" onSave={sb} editable={editable} />
                <EditableField label="Harmonic Rocking" value={appointment.harmonic_rocking_notes} field="harmonic_rocking_notes" onSave={sb} editable={editable} />
                <EditableField label="T1 Reset" value={appointment.t1_reset_notes} field="t1_reset_notes" onSave={sb} editable={editable} />
                <EditableField label="Diaphragm Reset" value={appointment.diaphragm_reset_notes} field="diaphragm_reset_notes" onSave={sb} editable={editable} />
                <EditableField label="Vagus Nerve" value={appointment.vagus_nerve_notes} field="vagus_nerve_notes" onSave={sb} editable={editable} />
              </div>
            ) : (
              <EmptySection />
            )}
          </div>

          {/* ════════════════════════════════════════
             3 — ALIGN (FINDINGS)
             ════════════════════════════════════════ */}
          <div className="mb-10">
            <SectionHeading num="3" label="Align — Findings & Emotional Context" />
            {(hasAnyAlign || editable) ? (
              <>
                {priorityPathway && (
                  <div className="mb-4 pb-4 border-b border-border/30">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Priority Pathway</p>
                    <div className="flex items-center gap-2 p-2.5 bg-destructive/10 border border-destructive/20 rounded">
                      <Target size={13} className="text-destructive shrink-0" />
                      <p className="text-[12px] font-semibold text-destructive">{priorityPathway}</p>
                    </div>
                  </div>
                )}

                {inhibitedCount > 0 && (
                  <div className="mb-4 pb-4 border-b border-border/30">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Active Findings ({inhibitedCount})</p>
                    <PathwayFindingsList priorityPattern={appointment.priority_pattern} showOnlyInhibited />
                  </div>
                )}

                {clearedCount > 0 && (
                  <div className="mb-4 pb-4 border-b border-border/30">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Cleared Findings ({clearedCount})</p>
                    <PathwayFindingsList priorityPattern={appointment.priority_pattern} showOnlyInhibited={false} />
                  </div>
                )}

                <EditableField label="Emotion (Primary)" value={appointment.emotion_primary_selection} field="emotion_primary_selection" onSave={sb} editable={editable} />
                <EditableField label="Emotion Notes" value={appointment.emotion_notes} field="emotion_notes" onSave={sb} editable={editable} />
              </>
            ) : (
              <EmptySection />
            )}
          </div>

          {/* ════════════════════════════════════════
             4 — CORRECT (CORRECTIONS APPLIED)
             ════════════════════════════════════════ */}
          <div className="mb-10">
            <SectionHeading num="4" label="Correct — Corrections Applied" />
            {(hasAnyCorrect || editable) ? (
              <>
                {correctionsHistory.length > 0 && (
                  <div className="mb-4 pb-4 border-b border-border/30 space-y-3">
                    {correctionsHistory.map((c: any, i: number) => {
                      const direction = directionForProcess(c.process || '', c.processId)
                        ?? directionFromText(`${c.pathway || ''} ${c.process || ''}`);
                      const dirStyle = direction ? PATHWAY_DIRECTION[direction] : null;
                      const DirectionIcon = dirStyle?.Icon;
                      return (
                        <div
                          key={c.timestamp ? `${c.timestamp}-${i}` : `corr-${i}`}
                          className={cn(
                            "p-3 rounded border transition-all animate-in fade-in slide-in-from-top-2 duration-300",
                            dirStyle ? dirStyle.tint : "bg-muted/50 border-border",
                          )}
                          style={{ animationDelay: `${i * 60}ms` }}
                        >
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Correction #{i + 1}</span>
                            {dirStyle && DirectionIcon && (
                              <span className={cn("inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium", dirStyle.soft, dirStyle.strong)}>
                                <DirectionIcon size={10} /> {dirStyle.label}
                              </span>
                            )}
                            <span className="text-[12px] font-semibold text-foreground truncate">{c.pathway}</span>
                            {c.timestamp && (
                              <>
                                <span className="text-[10px] text-muted-foreground/50">·</span>
                                <span className="text-[10px] tabular-nums text-muted-foreground/70">{format(new Date(c.timestamp), "h:mm a")}</span>
                              </>
                            )}
                          </div>
                          <p className="text-[12px] leading-relaxed whitespace-pre-wrap text-muted-foreground">{c.summary}</p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Showing Log */}
                {correctionEntries.length > 0 && (
                  <div className="mb-4 print:hidden">
                    <ShowingLog
                      corrections={correctionEntries}
                      onStatusChange={handleCorrectionStatusChange}
                    />
                  </div>
                )}

                <EditableField label="Corrections Summary" value={editable ? appointment.modes_balances : correctionDisplayText(appointment)} field="modes_balances" onSave={sb} editable={editable} />
                <EditableField label="Acupoints" value={appointment.acupoints} field="acupoints" onSave={sb} editable={editable} />
              </>
            ) : (
              <EmptySection />
            )}
          </div>

          {/* ════════════════════════════════════════
             5 — EMBED (INTEGRATION & PLANNING)
             ════════════════════════════════════════ */}
          <div className="mb-10">
            <SectionHeading num="5" label="Embed — Integration & Planning" />
            {(hasAnyEmbed || editable) ? (
              <>
                <EditableField label="Integration Notes / Homework" value={appointment.session_north_star} field="session_north_star" onSave={sb} editable={editable} />
                <EditableField label="Next Session Focus" value={appointment.next_session_note} field="next_session_note" onSave={sb} editable={editable} />
              </>
            ) : (
              <EmptySection />
            )}
          </div>

          {/* ════════════════════════════════════════
             6 — PRACTITIONER JOURNAL
             ════════════════════════════════════════ */}
          <div className="mb-10">
            <SectionHeading num="6" label="Practitioner Journal" />
            {editable ? (
              <EditableField label="" value={appointment.journal} field="journal" onSave={sb} editable={editable} />
            ) : appointment.journal ? (
              <p className="text-[12px] text-foreground/85 leading-relaxed whitespace-pre-wrap italic">{appointment.journal}</p>
            ) : (
              <EmptySection />
            )}
          </div>

          {/* ════════════════════════════════════════
             SESSION SUMMARY STRIP
             ════════════════════════════════════════ */}
          <div className="pt-6 border-t border-border/40">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Findings</p>
                <p className="text-[13px] font-bold text-foreground mt-0.5">{inhibitedCount} active</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Corrections</p>
                <p className="text-[13px] font-bold text-foreground mt-0.5">{correctionsHistory.length || (correctionText ? 1 : 0)} applied</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Status</p>
                <p className="text-[13px] font-bold text-foreground mt-0.5">
                  {appointment.status === "Completed" ? "Complete" : appointment.status}
                </p>
              </div>
            </div>
          </div>

          {/* Document footer */}
          <div className="pt-8 text-center">
            <p className="text-[8px] font-medium text-muted-foreground/30 uppercase tracking-[0.14em]">
              — End of Session Notes —
            </p>
            <p className="text-[8px] text-muted-foreground/25 mt-2">
              Generated by Resonance Kinesiology Practice Suite · {format(new Date(), "MMMM d, yyyy 'at' h:mm a")}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AppointmentV2DocView;
