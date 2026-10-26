import { useState, useEffect, useRef, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  Droplets, Heart, Zap, Wind, Activity, CheckCircle2,
  Timer, Play, Pause, RotateCcw, Check, ArrowRight, ListChecks,
} from "lucide-react";
import { safeParse } from "@/utils/safe-json";
import type { PhaseProps } from "@/components/crm/v2/v2-types";
import {
  Card,
  Section,
  CardTitle,
  PrimaryButton,
  SecondaryButton,
  GhostButton,
  StatusBadge,
  AlertBanner,
  ConfirmationFooter,
} from "./DesignSystem";

const SNS_KEYS = ['lymphatic', 'harmonic', 't1', 'diaphragm', 'vagus', 'other'] as const;
type SnsKey = (typeof SNS_KEYS)[number];

interface Technique {
  key: SnsKey;
  title: string;
  purpose: string;
  icon: any;
  notesField: string;
  hasTimer?: boolean;
  protocol?: string[];
  group: 'mechanical' | 'neuro';
}

const TECHNIQUES: Technique[] = [
  {
    key: 'lymphatic',
    title: 'Lymphatic Cranial Reflex Zone',
    purpose: 'Clear lymphatic congestion flagged by the temporal-parietal suture glide test.',
    icon: Droplets,
    notesField: 'lymphatic_notes',
    hasTimer: true,
    group: 'mechanical',
    protocol: [
      'Glide test the temporal-parietal suture (halfway between top of ear and top of head).',
      'Client places fingertips on the tender/stuck point (same-side hand).',
      'Therapy-localize lymph zones neck-down — watch for indicator inhibition.',
      'Confirm priority via K27 (muscle re-facilitates).',
      'Ask permission to correct, then hold the position of ease for 45–90 seconds.',
      'Re-test suture for restored glide.',
    ],
  },
  {
    key: 't1',
    title: 'T1 (Sympathetic Chain Reset)',
    purpose: 'Release mechanical SNS irritation at T1 / first rib to exit a locked-on state.',
    icon: Zap,
    notesField: 't1_reset_notes',
    hasTimer: true,
    group: 'mechanical',
    protocol: [
      'Indicator muscle shows as priority.',
      'Palpate bilateral anterior first rib (T1).',
      'Identify the restricted or tender side.',
      'Muscle test the contralateral Psoas.',
      'Monitor the tender spot; move the ipsilateral shoulder into external rotation until tenderness dissolves (45–90 seconds).',
      'Re-assess tenderness and Psoas.',
    ],
  },
  {
    key: 'diaphragm',
    title: 'Manual Reset of the Diaphragm',
    purpose: 'Clear phrenic nerve interference and restore optimal breathing mechanics.',
    icon: Wind,
    notesField: 'diaphragm_reset_notes',
    hasTimer: true,
    group: 'mechanical',
    protocol: [
      'Challenge tender points either side of sternum and test indicator muscle.',
      'If indicated, palpate tender point each side — one will be more tender.',
      'Palpate the muscle in the neck at C4 level (usually opposite to the sternum tender point).',
      'Move the ribcage up towards the neck and hold for 45–90 seconds. Release very slowly.',
    ],
  },
  {
    key: 'harmonic',
    title: 'Harmonic Rocking Protocol',
    purpose: 'Shift the nervous system from a threatened state back to socially engaged.',
    icon: Heart,
    notesField: 'harmonic_rocking_notes',
    group: 'neuro',
    protocol: [
      'State: permission to correct.',
      'If denied: gentle rocking with one hand on the belly button, the other on K27.',
      'Ask how many minutes (usually 3) or observe the client dropping into a safe state.',
      'Signs of shift: diaphragmatic breathing improves, sigh, yawn, or felt relaxation.',
    ],
  },
  {
    key: 'vagus',
    title: 'Vagus Nerve Process',
    purpose: 'Screen and reset vagal function to improve parasympathetic tone.',
    icon: Activity,
    notesField: 'vagus_nerve_notes',
    group: 'neuro',
  },
  {
    key: 'other',
    title: 'Other Techniques',
    purpose: 'ESR holds and any additional down-regulation work used this session.',
    icon: CheckCircle2,
    notesField: 'additional_notes',
    group: 'neuro',
  },
];

const TechniqueCard = ({
  technique,
  notes,
  completed,
  recorded,
  onToggleComplete,
  onSaveField,
}: {
  technique: Technique;
  notes: string | null | undefined;
  completed: boolean;
  recorded: boolean;
  onToggleComplete: () => void;
  onSaveField: (field: string, value: string | null) => Promise<void>;
}) => {
  const Icon = technique.icon;
  const [localNotes, setLocalNotes] = useState(notes || '');
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

  // Phone widths have no room for the badge beside the title, so it renders
  // under the purpose instead (same badge, one definition).
  const statusBadge = (
    <StatusBadge variant={recorded ? 'recorded' : 'pending'}>
      {recorded ? 'Recorded' : 'Pending'}
    </StatusBadge>
  );

  return (
    <Card
      padding="comfortable"
      className={cn(
        'transition-colors',
        recorded && 'border-l-2 border-l-primary/70'
      )}
    >
      {/* Header row: icon + name + purpose | badge + timer chips + tick */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
            recorded ? 'bg-primary/10 text-primary' : 'bg-muted/60 text-muted-foreground'
          )}>
            <Icon size={17} strokeWidth={1.75} />
          </div>
          <div className="min-w-0 pt-1">
            <CardTitle className="leading-tight">{technique.title}</CardTitle>
            <p className="mt-1 line-clamp-2 text-meta" title={technique.purpose}>
              {technique.purpose}
            </p>
            <div className="mt-1.5 sm:hidden">{statusBadge}</div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 pt-1">
          {technique.hasTimer && (
            <div className="hidden items-center gap-2 sm:flex">
              <button
                type="button"
                onClick={() => startTimer(45)}
                className="h-7 rounded-md border border-border bg-background px-2 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                45s
              </button>
              <button
                type="button"
                onClick={() => startTimer(90)}
                className="h-7 rounded-md border border-border bg-background px-2 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                90s
              </button>
            </div>
          )}
          <div className="hidden sm:block">{statusBadge}</div>
          <button
            type="button"
            onClick={onToggleComplete}
            title={completed ? 'Mark as not completed in this session' : 'Mark as completed in this session'}
            aria-label={`${completed ? 'Un-tick' : 'Tick'} ${technique.title} as completed`}
            className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all',
              completed
                ? 'border-success bg-success text-white'
                : 'border-border text-transparent hover:border-success hover:bg-success/10'
            )}
          >
            <Check size={13} strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* Timer countdown (when running) */}
      {technique.hasTimer && timeLeft !== null && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-muted/40 px-3 py-2">
          <Timer size={14} className="text-muted-foreground" />
          <span className="text-lg font-semibold tabular-nums text-foreground">{fmt(timeLeft)}</span>
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={toggleTimer}
              aria-label={isActive ? 'Pause timer' : 'Resume timer'}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
            >
              {isActive ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <button
              type="button"
              onClick={resetTimer}
              aria-label="Reset timer"
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Protocol steps */}
      {technique.protocol && technique.protocol.length > 0 && (
        <ol className="mt-3 space-y-2 border-t border-border/60 pt-3">
          {technique.protocol.map((step, i) => (
            <li key={i} className="flex gap-2">
              <span className="w-4 shrink-0 text-right text-[13px] font-semibold tabular-nums text-primary">
                {i + 1}
              </span>
              <p className="text-[13px] leading-snug text-foreground/80">{step}</p>
            </li>
          ))}
        </ol>
      )}

      {/* Notes — always visible, visually light */}
      <textarea
        value={localNotes}
        onChange={(e) => setLocalNotes(e.target.value)}
        onBlur={() => onSaveField(technique.notesField, localNotes || null)}
        placeholder="Clinical notes…"
        rows={2}
        className="textarea mt-3 min-h-[64px] border-border/70 bg-muted/20 text-[13px] placeholder:text-muted-foreground/60 focus:bg-background"
      />
    </Card>
  );
};

const GROUP_META = [
  { id: 'mechanical' as const, label: 'Mechanical resets', hint: 'Timed holds · 45–90 seconds' },
  { id: 'neuro' as const, label: 'Neurological down-regulation', hint: 'State shift · parasympathetic tone' },
];

const EasePhaseV3 = ({ appointment, saveField, onJumpToPhase }: PhaseProps) => {
  const metadata = useMemo(() => safeParse<{ sns_resets?: Record<string, boolean> }>(appointment.metadata, {}), [appointment.metadata]);
  const resets = metadata?.sns_resets || {};
  const done = SNS_KEYS.filter((key) => resets[key]).length;
  const total = SNS_KEYS.length;
  const allDone = done === total;

  const notesFor = (field: string): string | null => (appointment as any)?.[field] ?? null;

  const toggleComplete = async (key: SnsKey, current: boolean) => {
    const next = { ...metadata, sns_resets: { ...resets, [key]: !current } };
    await saveField('metadata', next as any);
  };

  const markAllDone = async () => {
    const next = {
      ...metadata,
      sns_resets: { ...resets, ...Object.fromEntries(SNS_KEYS.map((k) => [k, true])) },
    };
    await saveField('metadata', next as any);
  };

  const clearAll = async () => {
    const next = {
      ...metadata,
      sns_resets: { ...resets, ...Object.fromEntries(SNS_KEYS.map((k) => [k, false])) },
    };
    await saveField('metadata', next as any);
  };

  return (
    <Section className="space-y-5">

        {/* Sticky progress header */}
        <div className="sticky top-[108px] z-20 -mx-1 border-b border-border/60 bg-background/90 px-1 py-2 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-card-title leading-tight">SNS down-regulation</p>
              <p className="text-meta">Run at least one technique, then move on.</p>
            </div>
            <span className={cn(
              'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums',
              allDone ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
            )}>
              {done}/{total} complete
            </span>
          </div>
          {/* Progress bar */}
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
            <div
              className={cn('h-full rounded-full transition-all duration-500', allDone ? 'bg-success' : 'bg-primary')}
              style={{ width: `${(done / total) * 100}%` }}
            />
          </div>
        </div>

        {/* Technique groups */}
        {GROUP_META.map((group) => (
          <div key={group.id} className="space-y-3">
            <div className="flex items-baseline justify-between gap-3 px-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                {group.label}
              </p>
              <p className="text-[11px] text-muted-foreground/70">{group.hint}</p>
            </div>
            {TECHNIQUES.filter((t) => t.group === group.id).map((technique) => {
              const completed = !!resets[technique.key];
              const hasNotes = !!notesFor(technique.notesField);
              return (
                <TechniqueCard
                  key={technique.key}
                  technique={technique}
                  notes={notesFor(technique.notesField)}
                  completed={completed}
                  recorded={completed || hasNotes}
                  onToggleComplete={() => toggleComplete(technique.key, completed)}
                  onSaveField={saveField}
                />
              );
            })}
          </div>
        ))}

        {/* Progress summary + mark all */}
        <Card padding="comfortable">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-card-title">
                {allDone ? 'All techniques recorded' : `${total - done} technique${total - done === 1 ? '' : 's'} remaining`}
              </p>
              <p className="text-meta">
                {allDone
                  ? 'The nervous system should be down-regulated. Continue when ready.'
                  : 'One technique is enough — the rest are optional.'}
              </p>
            </div>
            {allDone ? (
              <GhostButton onClick={clearAll} className="h-9 text-[13px]">
                Reset progress
              </GhostButton>
            ) : (
              <SecondaryButton onClick={markAllDone} className="h-9 text-[13px]">
                <Check size={14} /> Mark all remaining as done
              </SecondaryButton>
            )}
          </div>
        </Card>

        {onJumpToPhase && (
          <ConfirmationFooter
            title="Done with Ease?"
            description="Next, map the priority findings."
            action={
              <PrimaryButton onClick={() => onJumpToPhase(2)} className="h-10 gap-2 px-4 text-sm font-medium">
                Continue to Align <ArrowRight size={14} />
              </PrimaryButton>
            }
          />
        )}
    </Section>
  );
};

export default EasePhaseV3;
