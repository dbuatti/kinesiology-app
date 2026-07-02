
import { useState } from 'react';
import {
  Heart,
  Zap,
  Search,
  Activity,
  Dumbbell,
  Sparkles,
  RefreshCw,
  Info,
  BookOpen,
  Lightbulb,
  Hand,
  Printer,
  Shield,
  Layers,
  Brain,
  Eye,
  ChevronDown,
  ChevronUp,
  Volume2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EMOTION_CODE_CHART, ROW_DATA } from '@/data/emotion-code-data';
import { Link } from 'react-router-dom';

type CollapsibleSectionProps = {
  title: string;
  icon: typeof Heart;
  color: string;
  desc: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
};

const CollapsibleSection = ({ title, icon: Icon, color, desc, defaultOpen = false, children }: CollapsibleSectionProps) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0", color)}>
            <Icon size={14} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">{title}</h4>
            <p className="text-[10px] text-muted-foreground font-medium">{desc}</p>
          </div>
        </div>
        {open ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
};

const HeartWallProtocol = () => {
  const [selectedRow, setSelectedRow] = useState<number | null>(null);

  const SectionTitle = ({ children, icon: Icon, color }: any) => (
    <div className="flex items-center gap-4 border-b border-border pb-2 mb-4 mt-8 first:mt-0">
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-primary-foreground shadow-sm", color)}>
        <Icon size={16} />
      </div>
      <h2 className="text-2xl font-medium text-foreground">{children}</h2>
    </div>
  );

  return (
    <div
      className="w-full py-2 px-2 animate-in fade-in duration-700 pb-20"
      style={{ fontFamily: 'Georgia, serif' }}
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="space-y-2">
          <Badge className="bg-chart-destructive/10 text-chart-destructive border-none font-semibold text-[10px] uppercase tracking-wider px-4 py-1 rounded-full">
            Clinical Reference
          </Badge>
          <h1 className="text-4xl font-medium text-foreground tracking-tight">Heart Wall Protocol</h1>
          <p className="text-lg text-muted-foreground">Subconscious Barrier Release Process</p>
        </div>
        <Button asChild variant="outline" className="rounded-xl h-12 px-6 font-medium border-chart-destructive/20 text-chart-destructive hover:bg-muted">
          <Link to="/resources/heart-wall/print">
            <Printer size={18} className="mr-2" /> Print Reference Sheet
          </Link>
        </Button>
      </div>

      {/* 0. Screen — How to identify Heart Wall */}
      <section>
        <SectionTitle icon={Shield} color="bg-chart-destructive">Screen — Is a Heart Wall Present?</SectionTitle>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="p-6 bg-muted rounded-xl border border-border space-y-4">
              <div className="flex items-center gap-3">
                <Hand size={20} className="text-chart-destructive shrink-0" />
                <p className="text-sm font-bold leading-relaxed">
                  <span className="text-chart-destructive">1.</span> Qualify an indicator muscle.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Heart size={20} className="text-chart-destructive shrink-0" />
                <p className="text-sm font-bold leading-relaxed">
                  <span className="text-chart-destructive">2.</span> Ask the client to focus on their heart and imagine <span className="underline decoration-chart-destructive/40 underline-offset-2">receiving</span> — love, money, acceptance, care, or whatever is relevant to their situation.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Activity size={20} className="text-chart-destructive shrink-0 mt-0.5" />
                <p className="text-sm font-bold leading-relaxed">
                  <span className="text-chart-destructive">3.</span> If the muscle inhibits (weakens), the Heart Wall is present. The word <span className="italic">"receiving"</span> is key — it directly challenges the protective barrier.
                </p>
              </div>
            </div>
            <div className="p-5 bg-rose-50 rounded-xl border border-rose-200">
              <p className="text-xs font-bold text-rose-800 leading-relaxed">
                <span className="uppercase tracking-widest text-[8px]">Tip:</span> If the client is unaware of what the Heart Wall is, briefly explain:
                "You know when you've been through something and you can feel yourself shut down so it doesn't happen again?
                Those physiological responses take a lot of bandwidth from the nervous system. We can calibrate that so your system doesn't have to compensate."
                I haven't met anyone yet that didn't resonate with this explanation.
              </p>
            </div>
          </div>

          {/* Core Wisdom Quote */}
          <div className="p-6 bg-indigo-900 text-white rounded-xl flex items-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10"><Brain size={100} /></div>
            <div className="space-y-3 relative z-10">
              <p className="text-sm italic font-medium text-indigo-200 leading-relaxed">
                "As the heart perceives, the brain receives, the gut produces the feeling, and the mind thinks about it.
                The heart is the governor. The heart is the emperor. It holds the keys to the brain.
                The brain holds the keys to the gut, and vice versa."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 1. Assessment Flow */}
      <section className="mt-8">
        <SectionTitle icon={Search} color="bg-primary">Assessment Flow</SectionTitle>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-4">
            <CollapsibleSection title="1. Permission to Assess" icon={Shield} color="bg-chart-destructive" desc="Confirm the system is ready." defaultOpen>
              <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                Ask the body: "Do we have permission to assess the Heart Wall?"
                If the system isn't ready, respect the boundary — the wall was built for a reason.
                Perform Harmonic Rocking first to down-regulate, then re-ask.
              </p>
            </CollapsibleSection>

            <CollapsibleSection title="2. Count Layers" icon={Layers} color="bg-chart-primary" desc="Establish the baseline number." defaultOpen>
              <div className="space-y-2 text-sm">
                <p className="font-medium leading-relaxed">
                  Ask the subconscious: "How many layers are present?"
                </p>
                <div className="p-3 bg-muted rounded-lg text-xs space-y-1">
                  <p className="font-bold text-foreground">Challenge in sequence:</p>
                  <p>More than 5? More than 10? More than 15? More than 20? More than 25?</p>
                  <p className="text-muted-foreground">Then narrow: "21? 22? 23?" until you land on the exact number.</p>
                </div>
                <p className="text-muted-foreground font-medium">
                  Average is 5–25 layers. More trauma = more layers. This baseline lets you measure progress later.
                </p>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="3. Find Emotion (Priority Primary)" icon={Heart} color="bg-rose-600" desc="Use pulse points to locate the organ then scan the chart." defaultOpen>
              <div className="space-y-3 text-sm">
                <p className="font-medium leading-relaxed">
                  Challenge "Mission to assess for priority primary" — this finds the single highest-impact layer in the stack. Clearing it can knock out 5–10 layers at once.
                </p>
                <div className="p-3 bg-muted rounded-lg space-y-2">
                  <p className="font-bold text-foreground text-xs">Pulse Point Scan Pattern (as demonstrated):</p>
                  <ol className="space-y-1 text-xs pl-4 list-decimal text-muted-foreground">
                    <li>Challenge right pulse points</li>
                    <li>Challenge deep touch — this tells you the Yin organ</li>
                    <li>If deep on right → check deep left for Liver/Gallbladder</li>
                    <li>Once organ is identified, go directly to that organ's row in the Emotion Chart</li>
                    <li>Scan the emotions: "Is it in column A? Column B? Top half? This one?"</li>
                  </ol>
                  <p className="text-[10px] font-medium text-muted-foreground">
                    Alternatively, you can scan with intention or use the chart directly.
                  </p>
                </div>
                <p className="font-medium leading-relaxed">
                  <Badge className="bg-amber-100 text-amber-800 border-none mr-1 text-[9px]">Shortcut</Badge>
                  The pulse points tell you the organ instantly. Once you know the organ, you know which row in the chart to use.
                </p>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="4. Assess Related Muscles" icon={Dumbbell} color="bg-emerald-600" desc="Verify the finding by testing associated muscles." defaultOpen>
              <div className="space-y-2 text-sm">
                <p className="font-medium leading-relaxed">
                  Every emotion row has correlated muscles. Test them — they <span className="italic">will</span> come up inhibited.
                </p>
                <p className="text-xs text-muted-foreground">
                  This confirms the circuit is active and gives you a direct feedback mechanism for the correction.
                </p>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="5. Find Efferent Coordinates" icon={Brain} color="bg-indigo-600" desc="Identify the brain zones involved." defaultOpen>
              <div className="space-y-2 text-sm">
                <p className="font-medium leading-relaxed">
                  As you normally would: challenge Cortical → Subcortical → Cerebellum → Limbic, etc.
                  Find which specific brain zones are involved and write them down.
                </p>
                <div className="p-3 bg-indigo-50 rounded-lg">
                  <p className="text-xs font-bold text-indigo-800">From the demo: "Cortical → Subcortical → Cerebellum → Thalamus"</p>
                </div>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="6. Gather Context (CH)" icon={Info} color="bg-amber-600" desc="Only if the system indicates more context is needed.">
              <div className="space-y-3 text-sm">
                <p className="font-medium leading-relaxed">
                  Challenge: "Do we need more context?" If no, skip this entirely — don't get bogged down.
                  If yes, the hierarchy is:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Age", desc: "Narrow with blocks: first/last half, decade, 5yr block, specific year." },
                    { label: "Life Event", desc: "Is there a specific event associated?" },
                    { label: "Absorbed or Inherited?", desc: "From someone else's energy field." },
                    { label: "From Mom or Dad?", desc: "If inherited, which parent?" },
                  ].map(item => (
                    <div key={item.label} className="p-3 bg-muted rounded-lg">
                      <p className="font-bold text-xs text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground italic">
                  Don't share all of this with the client unless you have the skills to navigate it.
                  Gather the information yourself.
                </p>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="7. Priority Primary Confirmed" icon={Sparkles} color="bg-amber-500" desc="You now have the full circuit.">
              <div className="space-y-2 text-sm">
                <p className="font-medium leading-relaxed">
                  You've gathered: the emotion, the organ, the related muscles, the brain zones, and optionally the context.
                  This is your priority primary Heart Wall layer.
                </p>
                <p className="text-xs text-muted-foreground">
                  One correction on this can clear 5–10 layers from the total. That's why thorough assessment matters.
                </p>
              </div>
            </CollapsibleSection>
          </div>
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 bg-card rounded-xl border border-border shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 mb-4 px-2">
                <Hand size={14} className="text-chart-primary" />
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Pulse Point Reference</span>
              </div>
              <img
                src="/images/pulse-points.png"
                alt="Pulse Points Reference"
                className="w-full h-auto rounded-xl"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>

            <div className="p-4 bg-card rounded-xl border border-border shadow-sm">
              <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Pulse Point Order (Demo Reference)</h4>
              <div className="space-y-1.5 text-xs">
                {[
                  "Right pulse points — Deep touch → Lung / Colon",
                  "Left pulse points — Deep touch → Liver / Gallbladder",
                  "Test: Was it Liver? Frustration came up.",
                  "→ Go directly to Row 4 (Liver / Gallbladder) emotions.",
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="font-bold text-chart-primary tabular-nums shrink-0">{i + 1}.</span>
                    <span className="text-muted-foreground font-medium">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. The Master Chart */}
      <section className="mt-12">
        <SectionTitle icon={Heart} color="bg-rose-600">The Emotion & Muscle Chart</SectionTitle>

        <div className="overflow-hidden rounded-xl border border-border shadow-sm bg-card">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-card text-card-foreground">
                <th className="p-4 text-left uppercase tracking-wider text-[10px] border-r border-border w-1/4">Organ</th>
                <th className="p-4 text-left uppercase tracking-wider text-[10px] border-r border-border w-1/2">Emotions</th>
                <th className="p-4 text-left uppercase tracking-wider text-[10px] w-1/4">Muscles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[1, 2, 3, 4, 5, 6].map((rowNum) => (
                <tr
                  key={rowNum}
                  className={cn(
                    "transition-all cursor-pointer hover:bg-muted",
                    selectedRow === rowNum ? "bg-muted ring-2 ring-inset ring-chart-primary" : ""
                  )}
                  onClick={() => setSelectedRow(selectedRow === rowNum ? null : rowNum)}
                >
                  <td className="p-4 border-r border-border align-top">
                    <p className="font-medium text-chart-primary text-base leading-tight">
                      {ROW_DATA[rowNum].organ}
                    </p>
                  </td>
                  <td className="p-4 border-r border-border align-top">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                      {[...EMOTION_CODE_CHART[rowNum].columnA, ...EMOTION_CODE_CHART[rowNum].columnB].map(e => (
                        <div key={e} className="text-foreground font-medium text-sm">{e}</div>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 align-top">
                    <div className="space-y-2">
                      {ROW_DATA[rowNum].muscles.split('; ').map((group, i) => {
                        const [organ, list] = group.split(': ');
                        return (
                          <p key={i} className="text-xs text-muted-foreground leading-relaxed">
                            <span className="font-semibold text-foreground">{organ}:</span> {list}
                          </p>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedRow && (
          <div className="mt-4 p-6 bg-card text-card-foreground rounded-xl shadow-sm animate-in zoom-in-95 duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Sparkles size={80} /></div>
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="space-y-0.5">
                <p className="text-[10px] font-semibold text-chart-primary uppercase tracking-wider">Active Focus</p>
                <h4 className="text-2xl font-medium">{ROW_DATA[selectedRow].organ}</h4>
              </div>
              <button onClick={() => setSelectedRow(null)} className="text-chart-primary/60 hover:text-card-foreground h-8 flex items-center gap-2">
                <RefreshCw size={14} /> Clear
              </button>
            </div>
            <div className="space-y-4 relative z-10">
              <div className="flex items-start gap-3">
                <Dumbbell size={16} className="text-chart-primary shrink-0 mt-1" />
                <div className="text-base font-medium text-muted-foreground leading-relaxed">
                  <p className="mb-2">Test these muscles to verify the finding:</p>
                  <div className="space-y-1">
                    {ROW_DATA[selectedRow].muscles.split('; ').map((group, i) => {
                      const [organ, list] = group.split(': ');
                      return (
                        <div key={i}>
                          <span className="font-semibold text-card-foreground">{organ}:</span> {list}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
          <p className="text-xs font-medium text-amber-800 leading-relaxed">
            <strong>Shortcut:</strong> Use the pulse points to find the organ first (right/left, light/deep),
            then jump directly to that row. For example: deep touch left → Liver → go straight to Row 4 → scan for Frustration, Anger, Resentment, etc.
          </p>
        </div>
      </section>

      {/* 3. Correction Flow */}
      <section className="mt-12">
        <SectionTitle icon={Zap} color="bg-primary">Correction</SectionTitle>

        <div className="space-y-4">
          <CollapsibleSection title="1. Permission to Correct" icon={Shield} color="bg-emerald-600" desc="Confirm readiness before proceeding." defaultOpen>
            <p className="text-sm text-muted-foreground leading-relaxed font-medium">
              Ask: "Do we have permission to correct the priority primary Heart Wall layer?"
              If yes, proceed.
            </p>
          </CollapsibleSection>

          <CollapsibleSection title="2. Stim Heart Visceral Referral Zone" icon={Activity} color="bg-chart-destructive" desc="Always the first step of any Heart Wall correction." defaultOpen>
            <div className="space-y-3 text-sm">
              <p className="font-medium leading-relaxed">
                Lightly rub along the Heart Visceral Referral Zone — from the chest, over the shoulder, and down the ulnar (pinky) side of the arm.
                This stimulates the heart at the neurological level, signalling to the brain that we are working on the Heart Wall.
              </p>
              <div className="p-3 bg-muted rounded-lg text-xs">
                <p className="font-bold text-foreground mb-1">Primary Referral Areas:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Left Chest / Precordium</li>
                  <li className="font-bold text-foreground">→ Left Shoulder & Upper Back</li>
                  <li className="font-bold text-foreground">→ Medial aspect of Left Arm (ulnar/pinky side all the way through)</li>
                  <li>• Jaw / Neck (occasionally)</li>
                </ul>
              </div>
              <div className="flex items-start gap-3 p-3 bg-indigo-50 rounded-lg">
                <Brain size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                <p className="text-xs font-medium text-indigo-800 leading-relaxed">
                  <strong>Intention cue:</strong> While holding the points, state in your mind:
                  {`"Heart wall, {organ}, {emotion}, inherited from {parent}."`}
                  Keep repeating this over the 3-minute period — it anchors the correction.
                </p>
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="3. Hold Organ Pulse Point or Squeeze Muscle" icon={Hand} color="bg-chart-primary" desc="Touch the organ point linked to the emotion." defaultOpen>
            <div className="space-y-3 text-sm">
              <p className="font-medium leading-relaxed">
                Touch and hold the organ-specific pulse point identified during assessment.
                Because the organ and its muscle are on the same circuit, you can also squeeze the associated muscle (e.g. for Lung → squeeze Posterior Deltoid).
              </p>
              <div className="p-3 bg-amber-50 rounded-lg">
                <p className="text-xs font-medium text-amber-800">
                  <strong>Optional — Client Self-Help:</strong> Ask the client to place one hand on their heart and the other on the organ.
                  "Let them be friends again." This allows the client to participate in their own healing.
                </p>
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="4. Tap Efferent Zones" icon={Brain} color="bg-indigo-600" desc="Collapse the circuit through the brain coordinates." defaultOpen>
            <div className="space-y-3 text-sm">
              <p className="font-medium leading-relaxed">
                Tap the identified brain zones (e.g. Right Prefrontal Cortex + Pons, or Cerebellum + Thalamus).
                Tap them simultaneously while holding the pulse point.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-bold text-xs text-foreground">Standard (3 swipes)</p>
                  <p className="text-xs text-muted-foreground">Three firm swipes/taps on each zone simultaneously.</p>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="font-bold text-xs text-amber-800">If Inherited (10 swipes)</p>
                  <p className="text-xs text-amber-700">Tap 10 times if the emotion was inherited from a parent. The extra stimulus helps clear the lineage pattern.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-slate-900 text-white rounded-lg">
                <Volume2 size={16} className="text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs font-medium leading-relaxed">
                  <strong>Alternative — Rocking:</strong> If you prefer not to hold points for 3 minutes, you can activate the brain circuits
                  ("activate, activate, activate") and then do Harmonic Rocking. Rocking embodies the correction and often generates
                  a stronger somatic release.
                </p>
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="5. Recheck Muscles & Count Remaining Layers" icon={RefreshCw} color="bg-emerald-600" desc="Confirm the shift and measure progress." defaultOpen>
            <div className="space-y-3 text-sm">
              <p className="font-medium leading-relaxed">
                Re-test the associated muscles — they should now lock (strong).
                This is often a big eye-opener for clients: they see a very obvious weakness transform into strength.
              </p>
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-bold text-xs text-foreground">Challenge the emotion:</p>
                <p className="text-xs text-muted-foreground mt-1">
                  State the emotion again — the indicator should lock. Then challenge:
                  "How many layers remain?" Re-count using the same sequence (more than 10? more than 20? 21, 22?).
                  Track the reduction: e.g. 36 layers → 22 layers after one priority primary correction.
                </p>
              </div>
              <p className="text-xs text-muted-foreground italic">
                Wait for a parasympathetic shift before re-testing — sigh, yawn, gurgle, or the client reporting
                "a wave came up" or "I can feel something leaving."
              </p>
            </div>
          </CollapsibleSection>
        </div>
      </section>

      {/* 4. Visceral Referral */}
      <section className="mt-12">
        <SectionTitle icon={Activity} color="bg-destructive">Visceral Referral Zone — Detail</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="aspect-video rounded-xl overflow-hidden bg-muted border border-border shadow-inner flex items-center justify-center p-4">
            <img
              src="/images/heart-referral.png"
              alt="Heart Visceral Referral Zones"
              className="max-w-full h-auto rounded-lg"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
          <div className="space-y-4">
            <div className="p-6 bg-muted rounded-xl border border-border space-y-4">
              <h4 className="text-[10px] font-semibold text-chart-destructive uppercase tracking-wider">Primary Referral Areas</h4>
              <ul className="space-y-2 text-base font-medium text-foreground">
                <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-chart-destructive" /> Left Chest / Precordium</li>
                <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-chart-destructive" /> Left Shoulder & Upper Back</li>
                <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-chart-destructive" /> <strong>Medial aspect of Left Arm → ulnar/pinky side all the way through</strong></li>
                <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-chart-destructive" /> Jaw / Neck (occasionally)</li>
              </ul>
            </div>
            <div className="p-4 bg-rose-50 rounded-xl border border-rose-200">
              <p className="text-xs font-bold text-rose-800 leading-relaxed">
                <strong>Always</strong> stimulate this zone first in every Heart Wall correction.
                It tells the brain "we are working on the Heart Wall" and sets the context for the rest of the correction.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Somatic Responses & Aftercare */}
      <section className="mt-12">
        <SectionTitle icon={Sparkles} color="bg-amber-500">Somatic Responses & Aftercare</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-muted rounded-xl border border-border space-y-4">
            <h4 className="text-[10px] font-semibold text-chart-amber uppercase tracking-wider">What Clients May Feel</h4>
            <ul className="space-y-2 text-sm font-medium text-foreground">
              <li className="flex items-start gap-3"><div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" /> A wave or energy moving through the body</li>
              <li className="flex items-start gap-3"><div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" /> Feeling of something "leaving"</li>
              <li className="flex items-start gap-3"><div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" /> Electrical signals changing ("could be just electrical signals changing from the body to the brain")</li>
              <li className="flex items-start gap-3"><div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" /> Yawning, sighing, swallowing, gurgling (parasympathetic shifts)</li>
              <li className="flex items-start gap-3"><div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" /> Tears or emotional release</li>
            </ul>
          </div>
          <div className="space-y-4">
            <div className="p-6 bg-card rounded-xl border border-border shadow-sm space-y-3">
              <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">After the Correction</h4>
              <p className="text-sm font-medium text-foreground leading-relaxed">
                Give the client a few minutes to rest. Let them drift — their body is doing its thing,
                replaying and integrating. Use this time to tap notes.
              </p>
              <p className="text-sm font-medium text-foreground leading-relaxed">
                "And just like that, do its thing, it's like they're friends again."
              </p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
              <p className="text-xs font-bold text-emerald-800 leading-relaxed">
                <strong>Client Instruction:</strong> Place one hand on heart, other on the organ.
                Let them rest. The hands create a self-soothing circuit.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Hidden Heart Wall */}
      <section className="mt-12">
        <SectionTitle icon={Eye} color="bg-indigo-600">Hidden Heart Wall</SectionTitle>
        <div className="p-6 bg-indigo-50 rounded-xl border border-indigo-200 space-y-4">
          <p className="text-sm font-bold text-indigo-900 leading-relaxed">
            After the main Heart Wall is cleared, a <span className="underline decoration-indigo-400/40 underline-offset-2">hidden Heart Wall</span> may appear within a few days or weeks.
            It will usually have fewer layers than the original.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white rounded-lg space-y-2">
              <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Timeline</p>
              <p className="text-xs text-indigo-800 font-medium leading-relaxed">
                Hidden Heart Wall will not show for a few days, maybe weeks afterwards.
                Screen for it in follow-up sessions using the same protocol.
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg space-y-2">
              <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Why It Exists</p>
              <p className="text-xs text-indigo-800 font-medium leading-relaxed">
                The subconscious may hold deeper layers back until the system is ready.
                "At the point of recording this, I still had one layer of the hidden Heart Wall left."
              </p>
            </div>
          </div>
          <div className="p-3 bg-indigo-200/50 rounded-lg">
            <p className="text-xs font-bold text-indigo-900">
              Protocol: Same assessment and correction process as the main Heart Wall.
              Just screen for it again in subsequent sessions.
            </p>
          </div>
        </div>
      </section>

      {/* 7. Client Education */}
      <section className="mt-12">
        <SectionTitle icon={BookOpen} color="bg-primary">Client Education</SectionTitle>
        <div className="p-8 bg-muted rounded-xl border border-border space-y-6">
          <p className="text-lg font-medium text-foreground leading-relaxed">
            "A Heart Wall is made of one or more trapped emotions that the subconscious mind uses to surround the heart as a protective barrier against emotional pain."
          </p>
          <div className="space-y-3">
            {[
              "Each trapped emotion in the Heart Wall is known as a Heart Wall emotion.",
              "A Heart Wall emotion is one layer in the collective Heart Wall. When all Heart Wall emotions have been removed, the Heart Wall is gone.",
              "The Heart Wall is usually created in response to emotional distress. The subconscious mind then uses pre-existing trapped emotions to form the wall.",
              "Heart Wall emotions may be from any time in your own life and they can also be inherited.",
              "Most individuals have a Heart Wall consisting of between 5 and 25 Heart Wall emotions.",
              "A Heart Wall may cause you to feel disconnected from others, lonely, sad, anxious, and unmotivated.",
              "Physical symptoms such as neck and shoulder discomfort may be present.",
              "When the Heart Wall clears: emotions flow, feelings return, you feel lighter, money starts to flow, different opportunities arise.",
            ].map((point, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-1 h-1 rounded-full bg-chart-primary mt-2 shrink-0" />
                <p className="text-sm text-foreground font-medium leading-relaxed">{point}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. When to Check */}
      <section className="mt-12">
        <SectionTitle icon={RefreshCw} color="bg-emerald-600">When to Check the Heart Wall</SectionTitle>
        <div className="p-6 bg-emerald-50 rounded-xl border border-emerald-200">
          <p className="text-sm font-bold text-emerald-900 leading-relaxed">
            The question isn't when — it's <span className="underline decoration-emerald-500/30 underline-offset-4">when do you not check the Heart Wall?</span>
          </p>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { t: "New Clients", d: "One of the top things to work through, alongside primitive reflexes and cranial nerves." },
              { t: "Returning Clients", d: "Always screen — more layers may have surfaced since the last session." },
              { t: "Self-Practice", d: "Work through your own Heart Wall online. You will notice a huge difference." },
            ].map(item => (
              <div key={item.t} className="p-4 bg-white rounded-lg border border-emerald-100">
                <p className="font-bold text-xs text-emerald-700">{item.t}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Clinical Note */}
      <div className="mt-12 p-8 bg-card text-card-foreground rounded-xl flex items-start gap-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10"><Info size={100} /></div>
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm shrink-0 relative z-10">
          <Lightbulb size={24} />
        </div>
        <div className="space-y-1 relative z-10">
          <p className="text-[10px] font-semibold text-chart-primary uppercase tracking-wider">Clinical Mastery Note</p>
          <p className="text-base text-muted-foreground/60 font-medium leading-relaxed">
            "The shift occurs when the client can distinguish between the 'me' (the observer) and the 'not-me' (the identity/emotion). Dismantle the wall with respect — it was built for a reason."
          </p>
        </div>
      </div>
    </div>
  );
};

export default HeartWallProtocol;
