import { useState, useCallback, useRef, useEffect, Fragment } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Printer, Target
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import PathwayFindingsList from "@/components/crm/PathwayFindingsList";
import CheckItem from "@/components/crm/document-view/CheckItem";
import { CRANIAL_NERVES } from "@/data/cranial-nerve-data";
import { PRIMITIVE_REFLEXES } from "@/data/primitive-reflex-data";
import { PRIMARY_14_MUSCLES } from "@/data/muscle-data";
import { getMuscleInfo } from "@/data/muscle-info-data";
import { AppointmentWithClient } from "@/types/crm";
import { safeParse } from "@/utils/safe-json";

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
  <div className="flex items-baseline gap-2 mb-5">
    <span className="text-[13px] font-bold text-foreground">{num}.</span>
    <h2 className="text-[13px] font-bold text-foreground">{label}</h2>
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
        <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1">{label}</p>
        <p className="text-[12.5px] text-foreground leading-relaxed whitespace-pre-wrap">{value || "—"}</p>
      </div>
    );
  }

  return (
    <div className="mb-4 pb-4 border-b border-border/30 last:border-b-0">
      <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1">{label}</p>
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
        className="w-full bg-transparent text-[12.5px] text-foreground leading-relaxed border border-dashed border-border/40 rounded px-2 py-1.5 focus:outline-none focus:border-primary/50 focus:bg-muted/20 resize-none hover:border-border/80 transition-colors overflow-hidden"
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
        <p className="text-[8px] font-semibold text-muted-foreground uppercase">{label}</p>
        <p className="text-sm font-bold text-foreground">{value}{suffix}</p>
      </div>
    );
  }

  return (
    <div className="p-2.5 bg-muted/50 rounded border border-border text-center">
      <p className="text-[8px] font-semibold text-muted-foreground uppercase">{label}</p>
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

const AppointmentV2DocView = ({ appointment, onBack, hideToolbar, editable = false, saveField, updatePriorityPattern }: DocViewProps) => {
  const handlePrint = () => window.print();

  const pattern = safeParse(appointment.priority_pattern, {} as any);

  const inhibitedCount = Object.values(pattern).reduce((acc: number, cat: any) => {
    return acc + Object.values(cat).filter((s: any) => s === 'Inhibited' || s === 'Inhibition' || s === 'Hypertonic').length;
  }, 0);

  const clearedCount = Object.values(pattern).reduce((acc: number, cat: any) => {
    return acc + Object.values(cat).filter((s: any) => s === 'Inhibited_Cleared' || s === 'Inhibition_Cleared' || s === 'Hypertonic_Cleared').length;
  }, 0);

  const hasAnyVitals = appointment.bolt_score != null || appointment.coherence_score != null || appointment.heart_rate != null || appointment.breath_rate != null;
  const hasAnyCogs = appointment.sagittal_plane_notes || appointment.frontal_plane_notes || appointment.transverse_plane_notes;
  const hasAnyNeuro = appointment.fakuda_notes || appointment.sharpened_rhombergs_notes || appointment.frontal_lobe_notes || appointment.righting_reflex_notes;
  const hasAnySns = appointment.harmonic_rocking_notes || appointment.t1_reset_notes || appointment.diaphragm_reset_notes || appointment.vagus_nerve_notes || appointment.lymphatic_notes;

  const metadata = safeParse(appointment.metadata, {} as any);
  const priorityPathway = metadata?.priority_pathway || "";

  const muscleDesc = (name: string) => {
    const info = getMuscleInfo(name);
    return info.meridian || undefined;
  };
  const correctionsHistory = metadata?.corrections || [];

  const hasAnyAlign = inhibitedCount > 0 || clearedCount > 0 || !!priorityPathway || !!appointment.emotion_primary_selection;
  const hasAnyCorrect = !!appointment.modes_balances || !!appointment.acupoints || correctionsHistory.length > 0;
  const hasAnyEmbed = !!appointment.session_north_star || !!appointment.next_session_note || (metadata?.cleared_findings?.length > 0);

  const sb = useCallback((field: string, value: any) => saveField?.(field, value), [saveField]);

  const handleAssessmentToggle = useCallback((category: string, name: string, nextStatus: string, side?: 'L' | 'R') => {
    updatePriorityPattern(category, name, nextStatus === 'Clear' ? null : nextStatus, side);
  }, [updatePriorityPattern]);

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
            <Button variant="outline" size="sm" onClick={handlePrint} className="rounded-lg h-8">
              <Printer size={15} className="mr-1.5" /> Print Document
            </Button>
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
                <p className="text-[8px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Clinical Session Notes</p>
                <h1 className="text-[22px] font-bold tracking-tight text-foreground leading-tight">
                  {appointment.clients?.name || "Client Session"}
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
                <p className="text-[7px] font-bold uppercase tracking-wider text-muted-foreground">Resonance Kinesiology</p>
              </div>
            </div>
          </div>

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
                <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-2">Baseline Vitals</p>
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
                <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-2">COGS — Visual Assessment</p>
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
                <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-2">Neurological Baseline</p>
                <div className="space-y-1.5">
                  <EditableField label="Fukuda Step Test" value={appointment.fakuda_notes} field="fakuda_notes" onSave={sb} editable={editable} />
                  <EditableField label="Sharpened Rhomberg's" value={appointment.sharpened_rhombergs_notes} field="sharpened_rhombergs_notes" onSave={sb} editable={editable} />
                  <EditableField label="Frontal Lobe Signs" value={appointment.frontal_lobe_notes} field="frontal_lobe_notes" onSave={sb} editable={editable} />
                  <EditableField label="Righting Reflex" value={appointment.righting_reflex_notes} field="righting_reflex_notes" onSave={sb} editable={editable} />
                </div>
              </div>
            )}

            {/* Cranial Nerve Assessment */}
            {(editable || hasPatternCategory('cranial_nerves')) && (
              <div className="mb-4 pb-4 border-b border-border/30">
                <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-2">Cranial Nerve Assessment</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5">
                  {CRANIAL_NERVES.map(n => n.isLateralized ? (
                    <Fragment key={n.name}>
                      <CheckItem category="cranial_nerves" name={n.name} side="L" pattern={pattern} onToggle={handleAssessmentToggle} />
                      <CheckItem category="cranial_nerves" name={n.name} side="R" pattern={pattern} onToggle={handleAssessmentToggle} />
                    </Fragment>
                  ) : (
                    <CheckItem key={n.name} category="cranial_nerves" name={n.name} pattern={pattern} onToggle={handleAssessmentToggle} />
                  ))}
                </div>
              </div>
            )}

            {/* Primitive Reflex Assessment */}
            {(editable || hasPatternCategory('primitive_reflexes')) && (
              <div className="mb-4 pb-4 border-b border-border/30">
                <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-2">Primitive Reflex Assessment</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5">
                  {PRIMITIVE_REFLEXES.map(r => r.isLateralized ? (
                    <Fragment key={r.id}>
                      <CheckItem category="primitive_reflexes" name={r.name} side="L" pattern={pattern} onToggle={handleAssessmentToggle} />
                      <CheckItem category="primitive_reflexes" name={r.name} side="R" pattern={pattern} onToggle={handleAssessmentToggle} />
                    </Fragment>
                  ) : (
                    <CheckItem key={r.id} category="primitive_reflexes" name={r.name} pattern={pattern} onToggle={handleAssessmentToggle} />
                  ))}
                </div>
              </div>
            )}

            {/* Muscle Assessment — Primary 14 */}
            {(editable || hasPatternCategory('muscles')) && (
              <div className="mb-4 pb-4 border-b border-border/30">
                <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-2">Muscle Assessment — Primary 14</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5">
                  {PRIMARY_14_MUSCLES.map(m => (
                    <Fragment key={m}>
                      <CheckItem category="muscles" name={m} side="L" pattern={pattern} description={muscleDesc(m)} onToggle={handleAssessmentToggle} />
                      <CheckItem category="muscles" name={m} side="R" pattern={pattern} description={muscleDesc(m)} onToggle={handleAssessmentToggle} />
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
                    <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1">Priority Pathway</p>
                    <div className="flex items-center gap-2 p-2.5 bg-destructive/10 border border-destructive/20 rounded">
                      <Target size={13} className="text-destructive shrink-0" />
                      <p className="text-[12px] font-semibold text-destructive">{priorityPathway}</p>
                    </div>
                  </div>
                )}

                {inhibitedCount > 0 && (
                  <div className="mb-4 pb-4 border-b border-border/30">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1">Active Findings ({inhibitedCount})</p>
                    <PathwayFindingsList priorityPattern={appointment.priority_pattern} showOnlyInhibited />
                  </div>
                )}

                {clearedCount > 0 && (
                  <div className="mb-4 pb-4 border-b border-border/30">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1">Cleared Findings ({clearedCount})</p>
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
                    {correctionsHistory.map((c: any, i: number) => (
                      <div key={c.timestamp ? `${c.timestamp}-${i}` : `corr-${i}`} className="p-3 bg-amber-500/10 border border-amber-500/20 rounded transition-all hover:bg-amber-500/15 animate-in fade-in slide-in-from-top-2 duration-300" style={{ animationDelay: `${i * 60}ms` }}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[8px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Correction #{i + 1}</span>
                          <span className="text-[8px] text-amber-600/40">·</span>
                          <span className="text-[8px] font-medium text-amber-600 dark:text-amber-400 truncate">{c.pathway}</span>
                          {c.timestamp && (
                            <>
                              <span className="text-[8px] text-amber-600/40">·</span>
                              <span className="text-[8px] text-amber-600/40">{format(new Date(c.timestamp), "h:mm a")}</span>
                            </>
                          )}
                        </div>
                        <p className="text-[12px] text-amber-900 dark:text-amber-100 leading-relaxed whitespace-pre-wrap">{c.summary}</p>
                      </div>
                    ))}
                  </div>
                )}

                <EditableField label="Corrections Summary" value={appointment.modes_balances} field="modes_balances" onSave={sb} editable={editable} />
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
                <p className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground">Findings</p>
                <p className="text-[13px] font-bold text-foreground mt-0.5">{inhibitedCount} active</p>
              </div>
              <div>
                <p className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground">Corrections</p>
                <p className="text-[13px] font-bold text-foreground mt-0.5">{correctionsHistory.length || (appointment.modes_balances ? 1 : 0)} applied</p>
              </div>
              <div>
                <p className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground">Status</p>
                <p className="text-[13px] font-bold text-foreground mt-0.5">
                  {appointment.status === "Completed" ? "Complete" : appointment.status}
                </p>
              </div>
            </div>
          </div>

          {/* Document footer */}
          <div className="pt-8 text-center">
            <p className="text-[7px] font-medium text-muted-foreground/30 uppercase tracking-[0.35em]">
              — End of Session Notes —
            </p>
            <p className="text-[7px] text-muted-foreground/25 mt-2">
              Generated by Resonance Kinesiology Practice Suite · {format(new Date(), "MMMM d, yyyy 'at' h:mm a")}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AppointmentV2DocView;
