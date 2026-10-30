import { useState, useEffect, useRef, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Droplets,
  Heart,
  Zap,
  Wind,
  Activity,
  Timer,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Check,
} from "lucide-react";
import { safeParse } from "@/utils/safe-json";

interface SnsItemProps {
  title: string;
  subtitle: string;
  icon: any;
  iconColor: string;
  notes: string | null | undefined;
  notesField: string;
  hasTimer?: boolean;
  protocol?: string[];
  purpose?: string;
  completed?: boolean;
  onToggleComplete?: () => void;
  onSaveField: (field: string, value: string | null) => Promise<void>;
}

const SnsItem = ({ title, subtitle, icon: Icon, iconColor, notes, notesField, hasTimer, protocol, purpose, completed, onToggleComplete, onSaveField }: SnsItemProps) => {
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
      <div className="flex items-center justify-between gap-4 py-3 px-1">
        <div className="flex items-center gap-3 min-w-0">
          <Icon size={16} className={cn("shrink-0", iconColor)} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{title}</p>
            <p className="text-[10px] text-muted-foreground font-medium">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {onToggleComplete && (
            <button
              type="button"
              onClick={onToggleComplete}
              title={completed ? "Mark as not completed in this session" : "Mark as completed in this session"}
              aria-label={`${completed ? "Un-tick" : "Tick"} ${title} as completed`}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all shrink-0",
                completed
                  ? "bg-chart-emerald border-chart-emerald text-white"
                  : "border-border text-transparent hover:border-chart-emerald hover:bg-chart-emerald/10"
              )}
            >
              <Check size={13} strokeWidth={3} />
            </button>
          )}
          {hasNotes && (
            <span className="text-[10px] font-medium uppercase tracking-wider text-chart-emerald">Recorded</span>
          )}
        </div>
      </div>

      {/* Content (always expanded) — two columns on wide screens */}
      <div className="px-1 pb-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            {purpose && (
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground">Purpose:</span> {purpose}
              </p>
            )}
            {protocol && protocol.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">Protocol</p>
                <ol className="space-y-1 text-xs text-muted-foreground list-decimal list-inside">
                  {protocol.map((step, i) => (
                    <li key={i} className="leading-relaxed">{step}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>
          <div className="space-y-3">
            {hasTimer && (
              <div className="flex items-center gap-3">
                <Timer size={14} className="text-muted-foreground" />
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => startTimer(45)} className="h-7 px-3 text-xs rounded-md">45s</Button>
                  <Button variant="outline" size="sm" onClick={() => startTimer(90)} className="h-7 px-3 text-xs rounded-md">90s</Button>
                </div>
                {timeLeft !== null && (
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-xl font-bold tabular-nums text-foreground">{fmt(timeLeft)}</span>
                    <Button variant="ghost" size="icon" onClick={toggleTimer} className="h-7 w-7 rounded-md">
                      {isActive ? <Pause size={14} /> : <Play size={14} />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={resetTimer} className="h-7 w-7 rounded-md">
                      <RotateCcw size={14} />
                    </Button>
                  </div>
                )}
              </div>
            )}
            <Textarea
              value={localNotes}
              onChange={(e) => setLocalNotes(e.target.value)}
              onBlur={() => onSaveField(notesField, localNotes || null)}
              placeholder="Notes..."
              className="rounded-md border-border min-h-[80px] text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

interface SnsListProps {
  appointment: any;
  onSaveField: (field: string, value: string | null) => Promise<void>;
}

const SnsList = ({ appointment, onSaveField }: SnsListProps) => {
  const metadata = useMemo(() => {
    if (!appointment.metadata) return {};
    if (typeof appointment.metadata === 'string') return safeParse(appointment.metadata, {});
    return appointment.metadata;
  }, [appointment.metadata]);

  const completedMap: Record<string, boolean> = metadata.sns_resets || {};

  const toggleComplete = async (key: string, current: boolean) => {
    const next = { ...metadata, sns_resets: { ...completedMap, [key]: !current } };
    await onSaveField('metadata', next as any);
  };

  return (
    <div className="divide-y divide-border">
      <SnsItem
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
        completed={!!completedMap.lymphatic}
        onToggleComplete={() => toggleComplete('lymphatic', !!completedMap.lymphatic)}
        onSaveField={onSaveField}
      />
      <SnsItem
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
        completed={!!completedMap.harmonic}
        onToggleComplete={() => toggleComplete('harmonic', !!completedMap.harmonic)}
        onSaveField={onSaveField}
      />
      <SnsItem
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
        completed={!!completedMap.t1}
        onToggleComplete={() => toggleComplete('t1', !!completedMap.t1)}
        onSaveField={onSaveField}
      />
      <SnsItem
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
        completed={!!completedMap.diaphragm}
        onToggleComplete={() => toggleComplete('diaphragm', !!completedMap.diaphragm)}
        onSaveField={onSaveField}
      />
      <SnsItem
        title="Vagus Nerve Process"
        subtitle="Screen & Reset"
        icon={Activity}
        iconColor="text-muted-foreground"
        notes={appointment.vagus_nerve_notes}
        notesField="vagus_nerve_notes"
        purpose="Screen and reset vagal nerve function to improve parasympathetic tone and social engagement."
        completed={!!completedMap.vagus}
        onToggleComplete={() => toggleComplete('vagus', !!completedMap.vagus)}
        onSaveField={onSaveField}
      />
      <SnsItem
        title="Other Techniques"
        subtitle="ESR, additional notes"
        icon={CheckCircle2}
        iconColor="text-muted-foreground"
        notes={appointment.additional_notes}
        notesField="additional_notes"
        completed={!!completedMap.other}
        onToggleComplete={() => toggleComplete('other', !!completedMap.other)}
        onSaveField={onSaveField}
      />
    </div>
  );
};

export default SnsList;