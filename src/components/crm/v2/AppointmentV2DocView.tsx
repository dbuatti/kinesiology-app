import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Printer, CheckCircle2, Target
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import PathwayFindingsList from "@/components/crm/PathwayFindingsList";
import { AppointmentWithClient } from "@/types/crm";
import { safeParse } from "@/utils/safe-json";

interface DocViewProps {
  appointment: AppointmentWithClient;
  history: any[];
  onBack: () => void;
  saveField: (field: string, value: any) => Promise<void>;
  updatePriorityPattern: (category: string, itemName: string, status: any, side?: 'L' | 'R') => Promise<void>;
}

const SectionNumber = ({ num }: { num: string }) => (
  <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-primary text-primary-foreground text-[10px] font-bold mr-2 shrink-0">
    {num}
  </span>
);

const FieldLabel = ({ label }: { label: string }) => (
  <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-1.5">{label}</p>
);

const FieldValue = ({ value, emptyText = "—" }: { value?: string | null; emptyText?: string }) => (
  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{value || emptyText}</p>
);

const Divider = () => <hr className="border-t border-border/60 my-10" />;

const AppointmentV2DocView = ({ appointment, onBack }: DocViewProps) => {
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
  const hasAnyEmbed = appointment.session_north_star || appointment.next_session_note;

  const metadata = safeParse(appointment.metadata, {} as any);
  const priorityPathway = metadata?.priority_pathway || "";
  const correctionsHistory = metadata?.corrections || [];

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Sticky toolbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 print:hidden shadow-sm">
        <div className="px-4 md:px-8 h-12 flex items-center justify-between gap-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="rounded-lg text-muted-foreground h-8">
            <ArrowLeft size={15} className="mr-1.5" /> Back to Session
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint} className="rounded-lg h-8">
            <Printer size={15} className="mr-1.5" /> Print Document
          </Button>
        </div>
      </header>

      {/* Document page */}
      <div className="max-w-[210mm] mx-auto px-8 md:px-12 py-12 print:py-8">
        <div className="bg-white shadow-sm border border-gray-200 rounded-xl print:rounded-none print:shadow-none print:border-none p-10 md:p-14 print:p-8 space-y-2">

          {/* ── DOCUMENT HEADER ── */}
          <div className="pb-8 border-b-2 border-gray-900">
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-muted-foreground">Clinical Session Notes</p>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                  {appointment.clients?.name || "Client Session"}
                </h1>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{format(new Date(appointment.date), "EEEE, MMMM d, yyyy")}</span>
                  <span className="text-gray-300">|</span>
                  <span>{format(new Date(appointment.date), "h:mm a")}</span>
                  {appointment.display_id && (
                    <>
                      <span className="text-gray-300">|</span>
                      <span className="font-mono text-[10px]">#{appointment.display_id}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="hidden print:block text-right">
                <p className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground">Resonance Kinesiology</p>
              </div>
            </div>
          </div>

          {/* ════════════════════════════════════════
             P — PRELIMINARY
             ════════════════════════════════════════ */}
          <div className="pt-6">
            <div className="flex items-center gap-1 mb-6">
              <SectionNumber num="P" />
              <h2 className="text-sm font-bold tracking-tight text-gray-900">Preliminary Assessment</h2>
            </div>

            {/* Intake */}
            <div className="mb-8">
              <FieldLabel label="Session Goal" />
              <FieldValue value={appointment.goal} emptyText="Not recorded" />
            </div>

            <div className="mb-8">
              <FieldLabel label="Primary Concern" />
              <FieldValue value={appointment.issue} emptyText="Not recorded" />
            </div>

            {/* Baseline Vitals */}
            {hasAnyVitals && (
              <div className="mb-8">
                <FieldLabel label="Baseline Vitals" />
                <div className="grid grid-cols-4 gap-3">
                  {appointment.bolt_score != null && (
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-center">
                      <p className="text-[9px] font-semibold text-muted-foreground">BOLT</p>
                      <p className="text-lg font-bold text-gray-900">{appointment.bolt_score}s</p>
                    </div>
                  )}
                  {appointment.coherence_score != null && (
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-center">
                      <p className="text-[9px] font-semibold text-muted-foreground">Coherence</p>
                      <p className="text-lg font-bold text-gray-900">{appointment.coherence_score.toFixed(2)}</p>
                    </div>
                  )}
                  {appointment.heart_rate != null && (
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-center">
                      <p className="text-[9px] font-semibold text-muted-foreground">HR</p>
                      <p className="text-lg font-bold text-gray-900">{appointment.heart_rate} bpm</p>
                    </div>
                  )}
                  {appointment.breath_rate != null && (
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-center">
                      <p className="text-[9px] font-semibold text-muted-foreground">Breath</p>
                      <p className="text-lg font-bold text-gray-900">{appointment.breath_rate} rpm</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* COGS */}
            {hasAnyCogs && (
              <div className="mb-8">
                <FieldLabel label="COGS — Visual Assessment" />
                <div className="space-y-2">
                  {appointment.sagittal_plane_notes && (
                    <div className="flex gap-2 text-xs">
                      <span className="font-semibold text-muted-foreground w-20 shrink-0">Sagittal:</span>
                      <span className="text-gray-700">{appointment.sagittal_plane_notes}</span>
                    </div>
                  )}
                  {appointment.frontal_plane_notes && (
                    <div className="flex gap-2 text-xs">
                      <span className="font-semibold text-muted-foreground w-20 shrink-0">Frontal:</span>
                      <span className="text-gray-700">{appointment.frontal_plane_notes}</span>
                    </div>
                  )}
                  {appointment.transverse_plane_notes && (
                    <div className="flex gap-2 text-xs">
                      <span className="font-semibold text-muted-foreground w-20 shrink-0">Transverse:</span>
                      <span className="text-gray-700">{appointment.transverse_plane_notes}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Neurological Baseline */}
            {hasAnyNeuro && (
              <div className="mb-8">
                <FieldLabel label="Neurological Baseline" />
                <div className="space-y-2">
                  {appointment.fakuda_notes && (
                    <div className="flex gap-2 text-xs">
                      <span className="font-semibold text-muted-foreground w-28 shrink-0">Fukuda Step Test:</span>
                      <span className="text-gray-700">{appointment.fakuda_notes}</span>
                    </div>
                  )}
                  {appointment.sharpened_rhombergs_notes && (
                    <div className="flex gap-2 text-xs">
                      <span className="font-semibold text-muted-foreground w-28 shrink-0">Sharpened Rhomberg's:</span>
                      <span className="text-gray-700">{appointment.sharpened_rhombergs_notes}</span>
                    </div>
                  )}
                  {appointment.frontal_lobe_notes && (
                    <div className="flex gap-2 text-xs">
                      <span className="font-semibold text-muted-foreground w-28 shrink-0">Frontal Lobe Signs:</span>
                      <span className="text-gray-700">{appointment.frontal_lobe_notes}</span>
                    </div>
                  )}
                  {appointment.righting_reflex_notes && (
                    <div className="flex gap-2 text-xs">
                      <span className="font-semibold text-muted-foreground w-28 shrink-0">Righting Reflex:</span>
                      <span className="text-gray-700">{appointment.righting_reflex_notes}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Intrinsic Muscles */}
            {appointment.intrinsic_muscle_findings && appointment.intrinsic_muscle_findings !== "{}" && (
              <div className="mb-8">
                <FieldLabel label="Intrinsic Muscle Findings" />
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-700 whitespace-pre-wrap font-mono">{appointment.intrinsic_muscle_findings}</p>
                </div>
              </div>
            )}
          </div>

          {/* ════════════════════════════════════════
             E1 — EASE
             ════════════════════════════════════════ */}
          {hasAnySns && (
            <>
              <div className="flex items-center gap-1 mb-6">
                <SectionNumber num="E" />
                <h2 className="text-sm font-bold tracking-tight text-gray-900">Ease — SNS Down-Regulation</h2>
              </div>

              <div className="space-y-2 mb-8">
                {appointment.lymphatic_notes && (
                  <div className="flex gap-2 text-xs">
                    <span className="font-semibold text-muted-foreground w-28 shrink-0">Lymphatic:</span>
                    <span className="text-gray-700">{appointment.lymphatic_notes}</span>
                  </div>
                )}
                {appointment.harmonic_rocking_notes && (
                  <div className="flex gap-2 text-xs">
                    <span className="font-semibold text-muted-foreground w-28 shrink-0">Harmonic Rocking:</span>
                    <span className="text-gray-700">{appointment.harmonic_rocking_notes}</span>
                  </div>
                )}
                {appointment.t1_reset_notes && (
                  <div className="flex gap-2 text-xs">
                    <span className="font-semibold text-muted-foreground w-28 shrink-0">T1 Reset:</span>
                    <span className="text-gray-700">{appointment.t1_reset_notes}</span>
                  </div>
                )}
                {appointment.diaphragm_reset_notes && (
                  <div className="flex gap-2 text-xs">
                    <span className="font-semibold text-muted-foreground w-28 shrink-0">Diaphragm Reset:</span>
                    <span className="text-gray-700">{appointment.diaphragm_reset_notes}</span>
                  </div>
                )}
                {appointment.vagus_nerve_notes && (
                  <div className="flex gap-2 text-xs">
                    <span className="font-semibold text-muted-foreground w-28 shrink-0">Vagus Nerve:</span>
                    <span className="text-gray-700">{appointment.vagus_nerve_notes}</span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ════════════════════════════════════════
             A — ALIGN
             ════════════════════════════════════════ */}
          {(inhibitedCount > 0 || clearedCount > 0) && (
            <>
              <div className="flex items-center gap-1 mb-6">
                <SectionNumber num="A" />
                <h2 className="text-sm font-bold tracking-tight text-gray-900">Align — Findings</h2>
              </div>

              {priorityPathway && (
                <div className="mb-4">
                  <FieldLabel label="Priority Pathway" />
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <Target size={14} className="text-red-500 shrink-0" />
                    <p className="text-xs font-semibold text-red-800">{priorityPathway}</p>
                  </div>
                </div>
              )}

              {inhibitedCount > 0 && (
                <div className="mb-4">
                  <FieldLabel label={`Active Findings (${inhibitedCount})`} />
                  <PathwayFindingsList
                    priorityPattern={appointment.priority_pattern}
                    showOnlyInhibited
                  />
                </div>
              )}

              {clearedCount > 0 && (
                <div className="mb-8">
                  <FieldLabel label={`Cleared Findings (${clearedCount})`} />
                  <PathwayFindingsList
                    priorityPattern={appointment.priority_pattern}
                    showOnlyInhibited={false}
                  />
                </div>
              )}

              {/* Emotion Context */}
              {appointment.emotion_primary_selection && (
                <div className="mb-8">
                  <FieldLabel label="Emotional Context" />
                  <Badge className="bg-primary text-primary-foreground border-none font-medium text-[10px] mb-1">
                    {appointment.emotion_primary_selection}
                  </Badge>
                  {appointment.emotion_secondary_selection && appointment.emotion_secondary_selection.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {appointment.emotion_secondary_selection.map((e, i) => (
                        <Badge key={i} variant="outline" className="text-[9px] font-medium border-border text-muted-foreground">{e}</Badge>
                      ))}
                    </div>
                  )}
                  {appointment.emotion_notes && (
                    <p className="text-xs text-muted-foreground italic mt-1">"{appointment.emotion_notes}"</p>
                  )}
                </div>
              )}
            </>
          )}

          {/* ════════════════════════════════════════
             C — CORRECT
             ════════════════════════════════════════ */}
          {(appointment.modes_balances || appointment.acupoints || correctionsHistory.length > 0) && (
            <>
              <div className="flex items-center gap-1 mb-6">
                <SectionNumber num="C" />
                <h2 className="text-sm font-bold tracking-tight text-gray-900">Correct — Corrections Applied</h2>
              </div>

              {/* Pathway corrections history */}
              {correctionsHistory.length > 0 && (
                <div className="mb-6 space-y-3">
                  {correctionsHistory.map((c: any, i: number) => (
                    <div key={i} className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700">Correction #{i + 1}</span>
                        <span className="text-[9px] text-amber-600/60">·</span>
                        <span className="text-[9px] font-medium text-amber-700 truncate">{c.pathway}</span>
                        {c.timestamp && (
                          <>
                            <span className="text-[9px] text-amber-600/60">·</span>
                            <span className="text-[9px] text-amber-600/60">{format(new Date(c.timestamp), "h:mm a")}</span>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-amber-900 leading-relaxed whitespace-pre-wrap">{c.summary}</p>
                    </div>
                  ))}
                </div>
              )}

              {appointment.modes_balances && (
                <div className="mb-6">
                  <FieldLabel label="Corrections Summary" />
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{appointment.modes_balances}</p>
                  </div>
                </div>
              )}

              {appointment.acupoints && (
                <div className="mb-8">
                  <FieldLabel label="Acupoints" />
                  <p className="text-xs text-gray-700 font-medium whitespace-pre-wrap">{appointment.acupoints}</p>
                </div>
              )}
            </>
          )}

          {/* ════════════════════════════════════════
             E2 — EMBED
             ════════════════════════════════════════ */}
          {hasAnyEmbed && (
            <>
              <div className="flex items-center gap-1 mb-6">
                <SectionNumber num="E" />
                <h2 className="text-sm font-bold tracking-tight text-gray-900">Embed — Integration & Planning</h2>
              </div>

              {/* Cleared findings from verification */}
              {metadata?.cleared_findings && metadata.cleared_findings.length > 0 && (
                <div className="mb-4">
                  <FieldLabel label="Verified Clear" />
                  <div className="flex flex-wrap gap-1.5">
                    {metadata.cleared_findings.map((id: string, i: number) => (
                      <Badge key={i} variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px] font-medium">
                        <CheckCircle2 size={10} className="mr-1" /> {id}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {appointment.session_north_star && (
                <div className="mb-6">
                  <FieldLabel label="Integration Notes / Homework" />
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <p className="text-xs text-emerald-900 leading-relaxed whitespace-pre-wrap">{appointment.session_north_star}</p>
                  </div>
                </div>
              )}

              {appointment.next_session_note && (
                <div className="mb-8">
                  <FieldLabel label="Next Session Focus" />
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-900 leading-relaxed whitespace-pre-wrap">{appointment.next_session_note}</p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ════════════════════════════════════════
             JOURNAL / PRACTITIONER NOTES
             ════════════════════════════════════════ */}
          {appointment.journal && (
            <>
              <div className="flex items-center gap-1 mb-6">
                <SectionNumber num="J" />
                <h2 className="text-sm font-bold tracking-tight text-gray-900">Practitioner Journal</h2>
              </div>
              <div className="mb-8">
                <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap italic">{appointment.journal}</p>
              </div>
            </>
          )}

          {/* ════════════════════════════════════════
             SESSION SUMMARY STRIP
             ════════════════════════════════════════ */}
          <div className="pt-6 border-t border-gray-300">
            <div className="grid grid-cols-3 gap-4 text-center text-[10px]">
              <div>
                <p className="font-bold text-muted-foreground uppercase tracking-wider">Findings</p>
                <p className="text-sm font-semibold text-gray-900 mt-1">{inhibitedCount} active</p>
              </div>
              <div>
                <p className="font-bold text-muted-foreground uppercase tracking-wider">Corrections</p>
                <p className="text-sm font-semibold text-gray-900 mt-1">{correctionsHistory.length || (appointment.modes_balances ? 1 : 0)} applied</p>
              </div>
              <div>
                <p className="font-bold text-muted-foreground uppercase tracking-wider">Status</p>
                <p className="text-sm font-semibold text-gray-900 mt-1">
                  {appointment.status === "Completed" ? "Complete" : appointment.status}
                </p>
              </div>
            </div>
          </div>

          {/* Document footer */}
          <div className="pt-8 text-center">
            <p className="text-[8px] font-medium text-muted-foreground/40 uppercase tracking-[0.3em]">
              — End of Session Notes —
            </p>
            <p className="text-[8px] text-muted-foreground/30 mt-2">
              Generated by Resonance Kinesiology Practice Suite · {format(new Date(), "MMMM d, yyyy 'at' h:mm a")}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AppointmentV2DocView;
