
import {
  Activity, Eye, Droplets, ShieldAlert, Brain, Zap, Heart, Layers,
  ArrowDownCircle, ArrowUpCircle, Info, BookOpen, CheckCircle2,
  Lightbulb, AlertTriangle, RefreshCw, Target, Sparkles
} from "lucide-react";
import AppLayout from "@/components/crm/AppLayout";
import { AFFERENT_PATHWAYS, EFFERENT_PATHWAYS, CORRECTION_METHODS, CLINICAL_PEARLS } from "@/data/pathway-logic-data";
import { cn } from "@/lib/utils";

interface ProtocolBlockProps {
  title: string;
  icon: any;
  gradient: string;
  badge: string;
  badgeColor: string;
  desc: string;
  steps: string[];
  confirmationTest?: string;
  children?: React.ReactNode;
}

const ProtocolBlock = ({ title, icon: Icon, gradient, badge, badgeColor, desc, steps, confirmationTest, children }: ProtocolBlockProps) => (
  <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
    <div className={cn("px-5 py-3 flex items-center gap-3", gradient)}>
      <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center ring-1 ring-white/10">
        <Icon size={16} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold text-white tracking-tight">{title}</h3>
      </div>
      <span className={cn("text-[9px] font-black uppercase tracking-wider text-white bg-white/10 px-2.5 py-1 rounded-md", badgeColor)}>{badge}</span>
    </div>
    <div className="px-5 py-4 space-y-4">
      <p className="text-xs leading-relaxed text-foreground/80">{desc}</p>
      <div className="space-y-2">
        {steps.map((step, i) => (
          <div key={i} className="flex items-start gap-3 text-xs text-foreground/85">
            <span className="w-5 h-5 rounded-full bg-muted text-muted-foreground flex items-center justify-center shrink-0 mt-0.5 text-[9px] font-bold">{i + 1}</span>
            <span className="leading-relaxed">{step}</span>
          </div>
        ))}
      </div>
      {confirmationTest && (
        <div className="flex items-start gap-2.5 bg-emerald-50 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-900/30 p-3.5 rounded-xl text-xs">
          <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
          <span className="text-emerald-800 dark:text-emerald-300 font-medium leading-relaxed">{confirmationTest}</span>
        </div>
      )}
      {children}
    </div>
  </div>
);

const SectionHeader = ({ icon: Icon, gradient, label, children }: { icon: any; gradient: string; label: string; children: React.ReactNode }) => (
  <div className="flex items-center gap-3 border-b border-border pb-3">
    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", gradient)}>
      <Icon size={18} className="text-white" />
    </div>
    <h2 className="text-lg font-black text-foreground tracking-tight">{label}</h2>
    <span className="ml-auto">{children}</span>
  </div>
);

const CorrectionMethodCard = ({ method }: { method: typeof CORRECTION_METHODS[0] }) => (
  <div className="bg-card border border-border rounded-xl p-4 space-y-2.5 hover:shadow-md transition-shadow">
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
        <method.icon size={15} className="text-indigo-600 dark:text-indigo-400" />
      </div>
      <div>
        <h4 className="text-sm font-bold text-foreground">{method.name}</h4>
        <p className="text-[10px] text-muted-foreground font-medium">{method.bestFor}</p>
      </div>
    </div>
    <p className="text-xs text-muted-foreground leading-relaxed">{method.description}</p>
  </div>
);

const CorrectionsReferencePage = () => {
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-10 pb-20">
        {/* Header */}
        <div>
          <div className="flex items-center gap-4 mb-3">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 via-purple-600 to-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-950">
              <Target size={26} />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-foreground">Corrections Reference</h1>
              <p className="text-muted-foreground font-medium text-sm">Afferent &amp; Efferent pathway protocols — full clinical detail</p>
            </div>
          </div>
          <div className="h-px bg-gradient-to-r from-border via-border to-transparent" />
        </div>

        {/* Clinical Workflow Overview */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white space-y-5 shadow-lg shadow-slate-200/50 dark:shadow-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center">
              <RefreshCw size={14} className="text-indigo-400" />
            </div>
            <h2 className="text-sm font-black uppercase tracking-wider text-indigo-300">Clinical Workflow</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {[
              { step: "L", label: "LOFI Calibration", desc: "Establish baseline. Find initial indicator response vs clear." },
              { step: "O", label: "Observe & Challenge", desc: "Test suspect systems. Isolate the inhibited finding." },
              { step: "F", label: "Find Direction", desc: "Choose Afferent (Bottom-Up) or Efferent (Top-Down)." },
              { step: "I", label: "Integrate & Correct", desc: "Apply protocol. Re-test. Layer as needed." },
            ].map(({ step, label, desc }) => (
              <div key={step} className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-300 font-black text-sm">{step}</div>
                <h3 className="text-sm font-bold text-white">{label}</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl">
            <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-200 leading-relaxed">
              <strong className="text-amber-300">Core decision:</strong> If the finding inhibits on challenge, determine <strong>Direction</strong> first. Afferent targets physical input pathways (mechanoreceptors, vestibular, physiology). Efferent targets output pathways (cortical, subcortical, emotional). Wrong direction = no correction.
            </div>
          </div>
        </div>

        {/* Afferent Section */}
        <div className="space-y-5">
          <SectionHeader icon={ArrowDownCircle} gradient="bg-gradient-to-r from-blue-600 to-blue-500" label="Afferent (Bottom-Up) Pathways">
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 rounded-full">From body → brain</span>
          </SectionHeader>
          <div className="grid grid-cols-1 gap-4">
            <ProtocolBlock
              title="Mechanoreceptor (Joint/Muscle)"
              icon={Activity}
              gradient="bg-gradient-to-r from-blue-600 to-blue-500"
              badge="Primary pathway"
              badgeColor="bg-blue-500/20 text-blue-200"
              desc="Physical input from joints, muscles, and skin receptors. 15% conscious (DCML to S1), 85% unconscious (Spinocerebellar to Cerebellum)."
              confirmationTest="X-pattern facilitates → Mechanoreceptive confirmed"
              steps={[
                "CONSCIOUS PATHWAY (15%): TL opposing sensory cortex → Isometric contraction (30-40% effort, 3-5 seconds) + Nasal breathing on release",
                "UNCONSCIOUS PATHWAY (85%): Hold GV16 → Locate tight/weak ligament → Apply gentle stretch + Tuning fork on cranium (3-5 seconds)",
                "Re-test the original pathway after each layer to confirm clearance",
                "If IM remains inhibited, investigate the next layer — joint may not be the symptom site but where the brain needs proprioceptive input"
              ]}
            />
            <ProtocolBlock
              title="Vestibular / Ocular"
              icon={Eye}
              gradient="bg-gradient-to-r from-cyan-600 to-cyan-500"
              badge="Balance system"
              badgeColor="bg-cyan-500/20 text-cyan-200"
              desc="Balance and visual system inputs to the cerebellum. Critical for spatial orientation, postural control, and gaze stabilisation."
              steps={[
                "Assess VOR (Vestibulo-Ocular Reflex): Hold head still, move target horizontally — test IM",
                "Assess saccadic eye movements: Quick horizontal or vertical shifts — test IM",
                "Use head rotations or balance challenges (standing, eyes closed) to provoke the system",
                "Integrate with specific eye positions (up/left, down/right, etc.) based on NLP eye-accessing cues",
                "Hold correction with nasal breathing until therapeutic pulse is felt",
                "Re-test original finding — if clear, move on; if still inhibited, consider deeper layer or switch to Efferent"
              ]}
            />
            <ProtocolBlock
              title="Physiological"
              icon={Droplets}
              gradient="bg-gradient-to-r from-emerald-600 to-emerald-500"
              badge="Biochemical"
              badgeColor="bg-emerald-500/20 text-emerald-200"
              desc="Biochemical, nutritional, and organ-based signals. Addresses systemic imbalances detected through meridian or organ reflex testing."
              steps={[
                "Identify specific biochemical or organ-system involvement via NMR (NeuroMuscular Reflex) testing",
                "Challenge suspected system: TL relevant organ reflex point or meridian alarm point",
                "Check for nutritional or hydration priorities — test common deficiencies (B vitamins, magnesium, zinc, vitamin D)",
                "Apply correction via specific neurolymphatic or neurovascular points for the involved organ",
                "Consider meridian-based corrections (TCM 5-Element theory) for chronic patterns",
                "Re-test original pathway — if clear, proceed; if not, layer deeper or re-evaluate direction"
              ]}
            />
            <ProtocolBlock
              title="Nociceptive Threat"
              icon={ShieldAlert}
              gradient="bg-gradient-to-r from-orange-600 to-orange-500"
              badge="Threat clearing"
              badgeColor="bg-orange-500/20 text-orange-200"
              desc="Clearing threat from scars, old injuries, or specific movements. The nervous system holds threat memory in tissue; nociceptive clearing resolves this."
              steps={[
                "IDENTIFY: Locate the threat — scar tissue, old injury site, specific movement, or visualized memory",
                "STIMULATE: Prod, rub, or move the area (or visualise the memory) to activate the threat response",
                "TEST: Check Indicator Muscle (IM) — should inhibit (go weak) under threat stimulation",
                "DIRECTION: Determine correction path — Afferent (physical input) or Efferent (cognitive/emotional)",
                "CORRECT: Apply the appropriate pathway protocol (Mechanoreceptor, Vestibular, Cortical, etc.)",
                "REASSESS: Re-stimulate the threat and test IM — should now remain clear (facilitated)",
                "If still inhibited after correction, layer through deeper protocols or switch to Efferent"
              ]}
            />
          </div>
        </div>

        {/* Efferent Section */}
        <div className="space-y-5">
          <SectionHeader icon={ArrowUpCircle} gradient="bg-gradient-to-r from-purple-600 to-purple-500" label="Efferent (Top-Down) Pathways">
            <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2.5 py-1 rounded-full">From brain → body</span>
          </SectionHeader>
          <div className="grid grid-cols-1 gap-4">
            <ProtocolBlock
              title="Cortical (Top-Down)"
              icon={Brain}
              gradient="bg-gradient-to-r from-purple-600 to-purple-500"
              badge="Contralateral"
              badgeColor="bg-purple-500/20 text-purple-200"
              desc="Intentional, cognitive, and motor planning processes. Contralateral logic: right cortex controls left body. Targets the conscious, volitional brain."
              steps={[
                "Identify PRIMARY cortical zone involved: PFC (executive), M1 (motor), S1 (sensory), PMC (planning), SMA (sequencing), Parietal (integration)",
                "LATERALIZE: Determine side — right cortex = left body, left cortex = right body. Test with IM to confirm.",
                "Identify SECONDARY zone — can be another cortical area or a subcortical structure (Limbic, Cerebellum, Brainstem)",
                "SELECT CORRECTION METHOD: Tapping (3-5s for fast integration), Holding + Intention (until pulse for deep work), or Tuning Fork (for vibrational reset)",
                "APPLY: Hold both zones simultaneously (e.g., TL Right PFC + Left Psoas). During intention, name the pathway clearly: 'Right PFC + Left Psoas, clear'",
                "Re-test IM — if clear, proceed. If still inhibited, ensure you have the correct lateralisation or switch to Subcortical"
              ]}
            />
            <ProtocolBlock
              title="Subcortical (Autonomic)"
              icon={Layers}
              gradient="bg-gradient-to-r from-amber-600 to-amber-500"
              badge="Ipsilateral"
              badgeColor="bg-amber-500/20 text-amber-200"
              desc="Automatic, reflexive, and autonomic regulation. Ipsilateral logic: left cerebellum controls left body. Targets the unconscious, regulatory brain."
              steps={[
                "Identify SUBCORTICAL zone: Limbic (emotion), Cerebellum (coordination), Hypothalamus (autonomic), Basal Ganglia (habit), Thalamus (relay), Brainstem (survival)",
                "LATERALIZE response: Left side involvement = historical trauma / past patterning; Right side = current processing / recent stress",
                "ASSESS autonomic state: Is the system in SNS (sympathetic / stress) or PNS (parasympathetic / rest)? Correct accordingly.",
                "Use rhythmic movements or breathing patterns to entrain the subcortical system (e.g., slow diaphragmatic breathing for PNS activation)",
                "SELECT CORRECTION METHOD: Tapping (fast), Holding + Intention (deep), or Tuning Fork (vibrational)",
                "APPLY: hold both zones, intend the connection, wait for therapeutic pulse (yawn, sigh, swallow, gurgle, deep breath)",
                "Re-test — if still inhibited, investigate contralateral cortical pairing or escalate to Emotional pathway"
              ]}
            />
            <ProtocolBlock
              title="Emotional (Neuro-Emotional Integration)"
              icon={Heart}
              gradient="bg-gradient-to-r from-rose-600 to-rose-500"
              badge="9-Step Protocol"
              badgeColor="bg-rose-500/20 text-rose-200"
              desc="Full clinical protocol to identify, process, and clear trapped emotional charges held in the body-mind. Standard 9-step process."
              steps={[
                'ESR READINESS: Hold Frontal Lobe (ESR) points (GB14 / BL2 area). Check IM — if it clears, the system is ready for emotional work. If not, do NOT proceed — go back to Afferent/Efferent physical corrections first.',
                'PERMISSION: Ask clearly: "Do we have permission to correct this?" Test IM. If denied, perform Harmonic Rocking (hold ESR points, rock client gently side to side for 3-5 breaths) and re-ask.',
                'TIMELINE: Is this stress CURRENT (happening now / recent <6 months) or HISTORIC (past event)? Test with IM to determine.',
                'REGRESSION (if historic): Narrow down the age using IM. Start broad (decade) then narrow (year, month). E.g., "Was this at age 20-30?" No → "10-20?" Yes → "10-15?" No → "15-20?" Yes. Pinpoint the specific month.',
                "PRIMARY EMOTION: Identify the core feeling using 5-Element framework: Hurt = Fire, Worry = Earth, Sadness = Metal, Fear = Water, Anger = Wood. Test each with IM until one facilitates.",
                "PRIORITY ORGAN: The emotion's element determines which organ acts as surrogate: Wood = LV/GB, Fire = HT/SI, Earth = SP/ST, Metal = LU/LI, Water = KI/BL. Test each to find the specific organ holding the charge.",
                "ENERGY POLARITY: Challenge for Energy IN (+) or Energy OUT (-). Chronic stress is almost always Energy OUT (release). Test with IM to confirm.",
                "EYE POSITION (NLP): Identify sensory access: Up/Left = Visual Memory, Horizontal/Left = Auditory Memory, Down/Left = Internal Monologue, Up/Right = Visual Constructed, Horizontal/Right = Auditory Constructed, Down/Right = Kinesthetic / Felt Sense. Test each to find the active position.",
                'CORRECTION & UPLOAD: Hold ESR points + Pulse Point (of the priority organ from Step 6) + Maintain Eye Position. Gently replay the stress event or feeling. Wait for a clear parasympathetic shift: yawn, sigh, swallow, gurgle, or deep breath. Then IMMEDIATELY upload a positive state (ask client to recall a peaceful memory while continuing to hold points). Re-test IM.'
              ]}
            >
              <div className="mt-2 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/20 rounded-xl border border-indigo-200 dark:border-indigo-900/30 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-indigo-600 dark:text-indigo-400" />
                  <span className="font-bold uppercase text-[10px] tracking-wider text-indigo-600 dark:text-indigo-400">Clinical Mastery Note</span>
                </div>
                <div className="text-[11px] leading-relaxed text-slate-700 dark:text-slate-300 space-y-2">
                  <p className="italic border-l-2 border-indigo-300 dark:border-indigo-700 pl-3">
                    &ldquo;The shift occurs when the client can distinguish between the &lsquo;me&rsquo; (the observer) and the &lsquo;not-me&rsquo; (the identity/emotion). Always wait for a clear parasympathetic response &mdash; yawning, sighing, swallowing, gurgling, or a spontaneous deep breath &mdash; before proceeding to the Positive Upload.&rdquo;
                  </p>
                  <p className="text-xs">
                    <strong>Pulse Point Tip:</strong> Hold the pulse point corresponding to the priority organ identified in Step 6. Use light pressure for Yang organs and deep pressure for Yin organs.
                  </p>
                </div>
              </div>
            </ProtocolBlock>
          </div>
        </div>

        {/* Correction Methods */}
        <div className="space-y-5">
          <SectionHeader icon={Zap} gradient="bg-gradient-to-r from-indigo-600 to-indigo-500" label="Correction Methods" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {CORRECTION_METHODS.map((method) => (
              <CorrectionMethodCard key={method.id} method={method} />
            ))}
          </div>
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-xl p-4 text-xs text-amber-800 dark:text-amber-300 leading-relaxed flex items-start gap-3">
            <Info size={14} className="text-amber-500 shrink-0 mt-0.5" />
            <span><strong>Protocol:</strong> After selecting a method, always intend the pathway clearly during application. E.g., &ldquo;Left Psoas + Right PFC, integrating now.&rdquo; Hold until you feel a therapeutic pulse or the client shows a release response. Then re-test.</span>
          </div>
        </div>

        {/* Clinical Pearls */}
        <div className="space-y-5">
          <SectionHeader icon={Lightbulb} gradient="bg-gradient-to-r from-emerald-600 to-emerald-500" label="Clinical Pearls" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-xl p-5 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Lateralization</h4>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p className="bg-indigo-50 dark:bg-indigo-950/20 p-3 rounded-lg"><strong className="text-foreground">Cortical:</strong> {CLINICAL_PEARLS.lateralization.cortical}</p>
                <p className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg"><strong className="text-foreground">Subcortical:</strong> {CLINICAL_PEARLS.lateralization.subcortical}</p>
                <p className="bg-rose-50 dark:bg-rose-950/20 p-3 rounded-lg"><strong className="text-foreground">Limbic:</strong> {CLINICAL_PEARLS.lateralization.limbic}</p>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-5 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Mechanoreceptive</h4>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg"><strong className="text-foreground">Conscious (15%):</strong> {CLINICAL_PEARLS.mechanoreceptive.conscious}</p>
                <p className="bg-emerald-50 dark:bg-emerald-950/20 p-3 rounded-lg"><strong className="text-foreground">Unconscious (85%):</strong> {CLINICAL_PEARLS.mechanoreceptive.unconscious}</p>
                <p className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg"><strong className="text-foreground">Clinical Rule:</strong> {CLINICAL_PEARLS.mechanoreceptive.rule}</p>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-5 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">General Practice</h4>
              <div className="space-y-2 text-xs">
                <div className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/50 dark:border-amber-900/20 p-3 rounded-lg space-y-0.5">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-amber-600 dark:text-amber-400">Layers</span>
                  <p className="text-foreground/75">{CLINICAL_PEARLS.general.layers}</p>
                </div>
                <div className="bg-blue-50/50 dark:bg-blue-950/10 border border-blue-200/50 dark:border-blue-900/20 p-3 rounded-lg space-y-0.5">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-blue-600 dark:text-blue-400">Reassessment</span>
                  <p className="text-foreground/75">{CLINICAL_PEARLS.general.reassessment}</p>
                </div>
                <div className="bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-200/50 dark:border-emerald-900/20 p-3 rounded-lg space-y-0.5">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-600 dark:text-emerald-400">Experience</span>
                  <p className="text-foreground/75">{CLINICAL_PEARLS.general.accuracy}</p>
                </div>
                <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 p-3 rounded-lg">
                  <span className="text-rose-700 dark:text-rose-300 font-bold text-[10px] uppercase tracking-wider">⚠ Bias Warning</span>
                  <p className="text-rose-600 dark:text-rose-400 mt-1">{CLINICAL_PEARLS.general.bias}</p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-5 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">Emotional Safety</h4>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-start gap-2.5 bg-card border border-border p-3 rounded-lg">
                  <Info size={12} className="text-rose-500 shrink-0 mt-0.5" />
                  <span>Never suggest memories or emotions. Let the nervous system guide you.</span>
                </div>
                <div className="flex items-start gap-2.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 p-3 rounded-lg">
                  <CheckCircle2 size={12} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span>Always check ESR readiness (Step 1) before emotional work. If denied, use Harmonic Rocking.</span>
                </div>
                <div className="flex items-start gap-2.5 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30 p-3 rounded-lg">
                  <Sparkles size={12} className="text-blue-600 shrink-0 mt-0.5" />
                  <span>Always upload a positive state after clearing — the nervous system needs a new reference point.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Decision Flow */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white space-y-4 shadow-lg">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center">
              <BookOpen size={14} className="text-indigo-400" />
            </div>
            <h2 className="text-sm font-black uppercase tracking-wider text-indigo-300">Quick Decision Flow</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle size={12} className="text-amber-400" />
                <span className="text-xs font-bold text-white">Finding inhibited?</span>
              </div>
              <p className="text-[11px] text-slate-400 pl-5">Challenge to confirm → Choose direction.</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-2">
              <div className="flex items-center gap-2">
                <ArrowDownCircle size={12} className="text-blue-400" />
                <span className="text-xs font-bold text-white">Physical / structural / sensory?</span>
              </div>
              <p className="text-[11px] text-slate-400 pl-5">Start <strong className="text-blue-400">Afferent</strong>: Mechano → Vestibular → Physio → Nociceptive.</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-2">
              <div className="flex items-center gap-2">
                <ArrowUpCircle size={12} className="text-purple-400" />
                <span className="text-xs font-bold text-white">Cognitive / intentional / emotional?</span>
              </div>
              <p className="text-[11px] text-slate-400 pl-5">Start <strong className="text-purple-400">Efferent</strong>: Cortical → Subcortical → Emotional.</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-2">
              <div className="flex items-center gap-2">
                <RefreshCw size={12} className="text-amber-400" />
                <span className="text-xs font-bold text-white">Still inhibited after 3 layers?</span>
              </div>
              <p className="text-[11px] text-slate-400 pl-5">Switch direction (Afferent ↔ Efferent) or calm SNS first.</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default CorrectionsReferencePage;
