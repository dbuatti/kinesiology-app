import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Printer, CheckCircle2, GitBranch, Zap, Activity, Target, ClipboardCheck
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

const AppointmentV2DocView = ({ appointment, onBack }: DocViewProps) => {
  const handlePrint = () => window.print();

  const pattern = safeParse(appointment.priority_pattern, {} as any);
  const inhibitedCount = Object.values(pattern).reduce((acc: number, cat: any) => {
    return acc + Object.values(cat).filter((s: any) => s === 'Inhibited' || s === 'Inhibition' || s === 'Hypertonic').length;
  }, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border print:hidden">
        <div className="px-4 md:px-8 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Button variant="ghost" size="sm" onClick={onBack} className="rounded-xl text-muted-foreground">
              <ArrowLeft size={16} className="mr-1.5" /> Back to Session
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={handlePrint} className="rounded-xl text-muted-foreground">
            <Printer size={16} className="mr-1.5" /> Print
          </Button>
        </div>
      </header>

      {/* Doc body */}
      <div className="max-w-3xl mx-auto px-6 md:px-12 py-12 space-y-12 print:py-0 print:px-0 print:max-w-none">
        {/* Title */}
        <div className="pb-6 border-b border-border">
          <h1 className="text-3xl font-bold tracking-tight">Session Notes</h1>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-sm text-muted-foreground font-medium">{appointment.clients?.name}</p>
            <span className="text-muted-foreground/30">·</span>
            <p className="text-sm text-muted-foreground font-medium">{format(new Date(appointment.date), "EEEE, MMMM d, yyyy")}</p>
            <span className="text-muted-foreground/30">·</span>
            <p className="text-sm text-muted-foreground font-medium">{format(new Date(appointment.date), "h:mm a")}</p>
          </div>
        </div>

        {/* Goal & Concern */}
        {(appointment.goal || appointment.issue) && (
          <div className="space-y-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Intake</h2>
            {appointment.goal && (
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Session Goal</p>
                <p className="text-sm text-foreground leading-relaxed">{appointment.goal}</p>
              </div>
            )}
            {appointment.issue && (
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Primary Concern</p>
                <p className="text-sm text-foreground leading-relaxed">{appointment.issue}</p>
              </div>
            )}
          </div>
        )}

        {/* Vitals */}
        {(appointment.bolt_score || appointment.coherence_score) && (
          <div className="space-y-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Baseline Vitals</h2>
            <div className="grid grid-cols-2 gap-4">
              {appointment.bolt_score != null && (
                <div className="p-4 bg-muted rounded-xl border border-border text-center">
                  <p className="text-[10px] font-medium text-muted-foreground mb-1">BOLT</p>
                  <p className="text-xl font-bold text-chart-primary">{appointment.bolt_score}s</p>
                </div>
              )}
              {appointment.coherence_score != null && (
                <div className="p-4 bg-muted rounded-xl border border-border text-center">
                  <p className="text-[10px] font-medium text-muted-foreground mb-1">Coherence</p>
                  <p className="text-xl font-bold text-chart-destructive">{appointment.coherence_score.toFixed(2)}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SNS */}
        {(appointment.harmonic_rocking_notes || appointment.t1_reset_notes || appointment.diaphragm_reset_notes || appointment.vagus_nerve_notes || appointment.lymphatic_notes) && (
          <div className="space-y-3">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">SNS Down-Regulation</h2>
            {appointment.lymphatic_notes && <p className="text-sm text-muted-foreground"><b>Lymphatic:</b> {appointment.lymphatic_notes}</p>}
            {appointment.harmonic_rocking_notes && <p className="text-sm text-muted-foreground"><b>Harmonic Rocking:</b> {appointment.harmonic_rocking_notes}</p>}
            {appointment.t1_reset_notes && <p className="text-sm text-muted-foreground"><b>T1 Reset:</b> {appointment.t1_reset_notes}</p>}
            {appointment.diaphragm_reset_notes && <p className="text-sm text-muted-foreground"><b>Diaphragm Reset:</b> {appointment.diaphragm_reset_notes}</p>}
            {appointment.vagus_nerve_notes && <p className="text-sm text-muted-foreground"><b>Vagus Nerve:</b> {appointment.vagus_nerve_notes}</p>}
          </div>
        )}

        {/* Findings */}
        {inhibitedCount > 0 && (
          <div className="space-y-3">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Findings ({inhibitedCount})</h2>
            <PathwayFindingsList
              priorityPattern={appointment.priority_pattern}
              showOnlyInhibited
            />
          </div>
        )}

        {/* Corrections */}
        {appointment.modes_balances && (
          <div className="space-y-3">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Corrections Applied</h2>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{appointment.modes_balances}</p>
          </div>
        )}

        {appointment.acupoints && (
          <div className="space-y-3">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Acupoints</h2>
            <p className="text-sm text-chart-primary font-medium">{appointment.acupoints}</p>
          </div>
        )}

        {/* Embed notes */}
        {(appointment.session_north_star || appointment.next_session_note) && (
          <div className="space-y-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Embed</h2>
            {appointment.session_north_star && (
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Integration Notes</p>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{appointment.session_north_star}</p>
              </div>
            )}
            {appointment.next_session_note && (
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Next Session Focus</p>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{appointment.next_session_note}</p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="pt-8 border-t border-border text-center">
          <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Session Complete</p>
        </div>
      </div>
    </div>
  );
};

export default AppointmentV2DocView;