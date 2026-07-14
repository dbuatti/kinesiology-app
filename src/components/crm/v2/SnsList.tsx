import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Droplets, Heart, Zap, Wind, Activity,
  ChevronDown, Timer, Play, Pause, RotateCcw,
  CheckCircle2
} from "lucide-react";

interface SnsItemProps {
  id: string;
  title: string;
  subtitle: string;
  icon: any;
  iconColor: string;
  notes: string | null | undefined;
  notesField: string;
  hasTimer?: boolean;
  protocol?: string[];
  purpose?: string;
  onSaveField: (field: string, value: string | null) => Promise<void>;
}

const SnsItem = ({ title, subtitle, icon: Icon, iconColor, notes, notesField, hasTimer, protocol, purpose, onSaveField }: SnsItemProps) => {
  const [open, setOpen] = useState(false);
  const [localNotes, setLocalNotes] = useState(notes || "");
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isActive, setIsActive] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive && timeLeft !== null && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isActive, timeLeft]);

  const startTimer = (s: number) => { setTimeLeft(s); setIsActive(true); };
  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => { setIsActive(false); setTimeLeft(null); };
  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const hasNotes = !!notes;

  return (
    <div className="border-b border-border last:border-b-0">
      {/* Row header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 py-4 px-2 hover:bg-muted/30 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <Icon size={18} className={cn("shrink-0", iconColor)} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{title}</p>
            <p className="text-[10px] text-muted-foreground font-medium">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {hasNotes ? (
            <Badge variant="outline" className="text-[9px] font-medium uppercase tracking-wider bg-chart-emerald/10 text-chart-emerald border-chart-emerald/20">
              Recorded
            </Badge>
          ) : (
            <span className="text-[10px] text-muted-foreground/50">Not yet recorded</span>
          )}
          <ChevronDown size={16} className={cn("text-muted-foreground transition-transform", open && "rotate-180")} />
        </div>
      </button>

      {/* Expanded content */}
      {open && (
        <div className="px-2 pb-6 space-y-4 animate-in fade-in slide-in-from-top-1 duration-300">
          {purpose && (
            <p className="text-xs text-muted-foreground leading-relaxed pl-7">
              <span className="font-semibold text-foreground">Purpose:</span> {purpose}
            </p>
          )}

          {protocol && protocol.length > 0 && (
            <div className="pl-7">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Protocol</p>
              <ol className="space-y-1.5 text-xs text-muted-foreground list-decimal list-inside">
                {protocol.map((step, i) => (
                  <li key={i} className="leading-relaxed">{step}</li>
                ))}
              </ol>
            </div>
          )}

          {/* Timer */}
          {hasTimer && (
            <div className="pl-7 flex items-center gap-3">
              <Timer size={16} className="text-muted-foreground" />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => startTimer(45)} className="h-8 px-4 text-xs rounded-lg">45s</Button>
                <Button variant="outline" size="sm" onClick={() => startTimer(90)} className="h-8 px-4 text-xs rounded-lg">90s</Button>
              </div>
              {timeLeft !== null && (
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-2xl font-bold tabular-nums text-foreground">{fmt(timeLeft)}</span>
                  <Button variant="ghost" size="icon" onClick={toggleTimer} className="h-8 w-8 rounded-lg">
                    {isActive ? <Pause size={16} /> : <Play size={16} />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={resetTimer} className="h-8 w-8 rounded-lg">
                    <RotateCcw size={16} />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="pl-7">
            <Textarea
              value={localNotes}
              onChange={(e) => setLocalNotes(e.target.value)}
              onBlur={() => onSaveField(notesField, localNotes || null)}
              placeholder="Notes..."
              className="rounded-lg border-border min-h-[80px] text-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
};

interface SnsListProps {
  appointment: any;
  onSaveField: (field: string, value: string | null) => Promise<void>;
  onUpdate: () => void;
}

const SnsList = ({ appointment, onSaveField }: SnsListProps) => {
  return (
    <div className="divide-y divide-border">
      <SnsItem
        id="lymphatic"
        title="Lymphatic Cranial Reflex Zone"
        subtitle="FNH Foundations · Ease the System"
        icon={Droplets}
        iconColor="text-chart-primary"
        notes={appointment.lymphatic_notes}
        notesField="lymphatic_notes"
        hasTimer
        purpose="Clear lymphatic congestion flagged by the temporal-parietal suture glide test. The stuck side indicates which lymph zone is the priority."
        protocol={[
          "Glide test the temporal-parietal suture (halfway between top of ear and top of head).",
          "Client places fingertips on the tender/stuck point (same-side hand).",
          "Therapy-localize lymph zones neck-down — watch for indicator inhibition.",
          "Confirm priority via K27 (muscle re-facilitates).",
          "Ask permission to correct, then hold the position of ease for 45–90 seconds.",
          "Re-test suture for restored glide.",
        ]}
        onSaveField={onSaveField}
      />
      <SnsItem
        id="harmonic"
        title="Harmonic Rocking Protocol"
        subtitle="Nervous system down-regulation"
        icon={Heart}
        iconColor="text-chart-primary"
        notes={appointment.harmonic_rocking_notes}
        notesField="harmonic_rocking_notes"
        purpose="Shift the nervous system from a threatened (SNS/Dorsal Vagal) state back to a receptive (Socially Engaged) state."
        protocol={[
          "State: Permission to correct.",
          "If denied: gentle rocking motion with one hand on the belly button and the other on Kidney 27.",
          "Ask how many minutes (usually 3) or observe client dropping into a safe state.",
          "Signs of shift: diaphragmatic breathing improves, sigh, yawn, or felt relaxation.",
        ]}
        onSaveField={onSaveField}
      />
      <SnsItem
        id="t1"
        title="T1 (Sympathetic Chain Reset)"
        subtitle="Mechanical SNS integration"
        icon={Zap}
        iconColor="text-chart-destructive"
        notes={appointment.t1_reset_notes}
        notesField="t1_reset_notes"
        hasTimer
        purpose="The T1/First Rib position can mechanically irritate the SNS. This reset aims to shift the client out of a 'LOCKED ON' sympathetic state."
        protocol={[
          "Indicator Muscle (IM) shows as priority.",
          "Palpate bilateral anterior first rib (T1).",
          "Identify the restricted or tender side.",
          "Muscle test the contralateral Psoas.",
          "Monitor the tender spot and move the ipsilateral shoulder into external rotation until tenderness dissolves (45–90 seconds).",
          "Re-assess tenderness and Psoas.",
        ]}
        onSaveField={onSaveField}
      />
      <SnsItem
        id="diaphragm"
        title="Manual Reset of the Diaphragm"
        subtitle="Phrenic Nerve integration"
        icon={Wind}
        iconColor="text-chart-emerald"
        notes={appointment.diaphragm_reset_notes}
        notesField="diaphragm_reset_notes"
        hasTimer
        purpose="The Phrenic Nerve is the sole motor innervation to the diaphragm. This reset clears neurological interference and restores optimal breathing mechanics."
        protocol={[
          "Challenge tender points either side of sternum and test IM.",
          "If indicated, palpate tender point each side — one will be more tender.",
          "Palpate the muscle in the neck at C4 level (usually opposite to the sternum tender point).",
          "Move the ribcage up towards the neck and hold for 45–90 seconds. Release very slowly.",
        ]}
        onSaveField={onSaveField}
      />
      <SnsItem
        id="vagus"
        title="Vagus Nerve Process"
        subtitle="Screen & Reset"
        icon={Activity}
        iconColor="text-muted-foreground"
        notes={appointment.vagus_nerve_notes}
        notesField="vagus_nerve_notes"
        purpose="Screen and reset vagal nerve function to improve parasympathetic tone and social engagement."
        onSaveField={onSaveField}
      />
      <SnsItem
        id="other"
        title="Other Techniques"
        subtitle="ESR, additional notes"
        icon={CheckCircle2}
        iconColor="text-muted-foreground"
        notes={appointment.additional_notes}
        notesField="additional_notes"
        onSaveField={onSaveField}
      />
    </div>
  );
};

export default SnsList;