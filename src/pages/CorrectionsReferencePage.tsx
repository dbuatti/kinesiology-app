import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  Brain,
  Heart,
  Activity,
  Eye,
  Droplets,
  Target,
  CheckCircle2,
  Lightbulb,
  Layers,
  ArrowUp,
  ArrowDown,
  ShieldCheck,
  BookOpen
} from "lucide-react";
import AppLayout from "@/components/crm/AppLayout";
import { AFFERENT_PATHWAYS, EFFERENT_PATHWAYS, CORRECTION_METHODS } from "@/data/pathway-logic-data";

const CorrectionsReferencePage = () => {
  return (
    <AppLayout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* Hero Section */}
        <div className="relative rounded-xl overflow-hidden bg-card border border-border p-8 shadow-sm group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-card to-muted/40" />
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <Target size={200} />
          </div>
          <div className="relative z-10 flex flex-col items-start space-y-6">
            <Badge className="bg-muted/20 text-chart-primary border-primary/30 font-semibold text-[10px] uppercase tracking-wider px-4 py-1">
              FNH Living Manual • 2026 Gold Standard
            </Badge>
            <h1 className="text-5xl md:text-6xl font-semibold tracking-tighter">Corrections</h1>
            <p className="text-xl text-muted-foreground/60 font-medium max-w-2xl leading-relaxed">
              A correction is any input the nervous system uses to reorganise itself. The framework is universal — the same logic applies whether you are working with primitive reflexes, cranial nerves, muscles, or brain zones.
            </p>
            <div className="p-6 bg-card/5 border border-white/10 rounded-3xl mt-4 max-w-3xl backdrop-blur-md">
              <p className="text-lg italic font-medium text-muted-foreground/40">
                "A correction is a correction. The pathway determines the target, not the method."
              </p>
            </div>
          </div>
        </div>

        {/* Core Principle */}
        <div className="p-8 bg-card text-card-foreground border border-border rounded-xl flex items-start gap-6 shadow-sm">
          <div className="w-16 h-16 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm shrink-0">
            <ShieldCheck size={32} />
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold text-foreground">Corrections Are Universal</h2>
            <p className="text-muted-foreground font-medium leading-relaxed text-base">
              The correction itself follows the same structure regardless of the pathway. You identify a target (brain zone, mechanoreceptor point, etc.), apply a method (tapping, holding, tuning fork), and reassess. What changes is <em>what</em> you are targeting — not <em>how</em> you correct it.
            </p>
            <p className="text-muted-foreground font-medium leading-relaxed text-base">
              The first step is always determining whether the finding is afferent (bottom-up) or efferent (top-down). You do this by stating each direction against the inhibition pattern and seeing which one locks the inhibited muscle.
            </p>
          </div>
        </div>

        {/* Determining the Direction */}
        <div className="space-y-6">
          <div className="flex items-center gap-4 px-2">
            <div className="w-12 h-12 rounded-xl bg-card text-card-foreground border border-border flex items-center justify-center shadow-sm">
              <Layers size={24} />
            </div>
            <div>
              <h2 className="text-3xl font-semibold text-foreground">Step 1: Determine Afferent or Efferent</h2>
              <p className="text-muted-foreground font-medium">Every correction begins with knowing which direction the nervous system wants to go.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-2 border-blue-500/30 shadow-sm rounded-xl bg-card overflow-hidden">
              <CardHeader className="p-6 pb-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <ArrowDown size={20} className="text-blue-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold">Afferent (Bottom-Up)</CardTitle>
                    <p className="text-sm text-muted-foreground">Sensory input driving the brain</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                <p className="text-sm text-muted-foreground font-medium">
                  The body is sending threat signals <em>to</em> the brain. The correction will target mechanoreceptors, vestibular/ocular input, or physiological/biochemical signals.
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Mechanoreceptor', 'Vestibular / Ocular', 'Physiological'].map(s => (
                    <Badge key={s} variant="outline" className="text-blue-500 border-blue-500/30">{s}</Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground/60 italic">
                  Lock test: reproduce the inhibition, state "Afferent" — if the inhibited muscle locks, the correction is afferent.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-500/30 shadow-sm rounded-xl bg-card overflow-hidden">
              <CardHeader className="p-6 pb-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <ArrowUp size={20} className="text-purple-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold">Efferent (Top-Down)</CardTitle>
                    <p className="text-sm text-muted-foreground">The brain driving the body</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                <p className="text-sm text-muted-foreground font-medium">
                  The brain is sending dysfunctional signals <em>to</em> the body. The correction will target cortical, subcortical, or emotional brain zones.
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Cortical', 'Subcortical', 'Emotional'].map(s => (
                    <Badge key={s} variant="outline" className="text-purple-500 border-purple-500/30">{s}</Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground/60 italic">
                  Lock test: reproduce the inhibition, state "Efferent" — if the inhibited muscle locks, the correction is efferent.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="p-6 bg-card border border-border rounded-lg">
            <div className="flex items-start gap-4">
              <Lightbulb size={20} className="text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm mb-1">Working within a narrow testing window</h4>
                <p className="text-sm text-muted-foreground font-medium">
                  For primitive reflexes where the inhibition pattern only appears with the head in a specific position (ATNR, STNR, TLR), you have a 5&ndash;10 second window after positioning the head. State afferent or efferent within that window. Whichever direction locks the inhibited muscle determines the pathway. You can then switch to an indicator muscle and continue testing.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Choose the System */}
        <div className="space-y-6">
          <div className="flex items-center gap-4 px-2">
            <div className="w-12 h-12 rounded-xl bg-card text-card-foreground border border-border flex items-center justify-center shadow-sm">
              <Target size={24} />
            </div>
            <div>
              <h2 className="text-3xl font-semibold text-foreground">Step 2: Choose the System</h2>
              <p className="text-muted-foreground font-medium">Once you know the direction, you identify which specific system is involved.</p>
            </div>
          </div>

          {/* Afferent Systems */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-blue-500 flex items-center gap-2 px-2">
              <ArrowDown size={18} /> Afferent Systems
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {AFFERENT_PATHWAYS.map((pathway) => {
                const Icon = pathway.icon;
                return (
                  <Card key={pathway.id} className="border border-border shadow-sm rounded-xl bg-card overflow-hidden">
                    <CardHeader className="p-5 pb-3 border-b border-border">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg bg-muted flex items-center justify-center ${pathway.color}`}>
                          <Icon size={18} />
                        </div>
                        <CardTitle className="text-sm font-semibold">{pathway.label}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-5 space-y-3">
                      <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                        {pathway.description}
                      </p>
                      {pathway.protocols.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">Protocol</p>
                          {pathway.protocols.map((p, i) => (
                            <p key={i} className="text-xs text-muted-foreground font-medium">— {p}</p>
                          ))}
                        </div>
                      )}
                      {pathway.confirmationTest && (
                        <p className="text-xs text-muted-foreground/60 italic border-t border-border pt-2">
                          {pathway.confirmationTest}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Efferent Systems */}
          <div className="space-y-3 pt-4">
            <h3 className="text-lg font-semibold text-purple-500 flex items-center gap-2 px-2">
              <ArrowUp size={18} /> Efferent Systems
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {EFFERENT_PATHWAYS.map((pathway) => {
                const Icon = pathway.icon;
                return (
                  <Card key={pathway.id} className="border border-border shadow-sm rounded-xl bg-card overflow-hidden">
                    <CardHeader className="p-5 pb-3 border-b border-border">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg bg-muted flex items-center justify-center ${pathway.color}`}>
                          <Icon size={18} />
                        </div>
                        <CardTitle className="text-sm font-semibold">{pathway.label}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-5 space-y-3">
                      <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                        {pathway.description}
                      </p>
                      {pathway.protocols.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">Protocol</p>
                          {pathway.protocols.map((p, i) => (
                            <p key={i} className="text-xs text-muted-foreground font-medium">— {p}</p>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        {/* Step 3: Coordinates, Polarity, Method */}
        <div className="space-y-6">
          <div className="flex items-center gap-4 px-2">
            <div className="w-12 h-12 rounded-xl bg-card text-card-foreground border border-border flex items-center justify-center shadow-sm">
              <Zap size={24} />
            </div>
            <div>
              <h2 className="text-3xl font-semibold text-foreground">Step 3: Apply the Correction</h2>
              <p className="text-muted-foreground font-medium">A complete correction has four components: coordinates, polarity, method, and verification.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Coordinates */}
            <Card className="border border-border shadow-sm rounded-xl bg-card">
              <CardHeader className="p-5 pb-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                    <Brain size={18} className="text-chart-primary" />
                  </div>
                  <CardTitle className="text-sm font-semibold">Coordinates</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-3">
                <p className="text-sm text-muted-foreground font-medium">
                  One or two brain zones (cortical or subcortical), each lateralized to Left, Right, or Bilateral.
                </p>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">Lateralization Rules</p>
                  <ul className="space-y-1.5">
                    <li className="flex items-start gap-2 text-xs text-muted-foreground font-medium">
                      <CheckCircle2 size={14} className="text-purple-500 shrink-0 mt-0.5" />
                      <span><strong>Cortical:</strong> Contralateral — right cortex controls left body</span>
                    </li>
                    <li className="flex items-start gap-2 text-xs text-muted-foreground font-medium">
                      <CheckCircle2 size={14} className="text-amber-500 shrink-0 mt-0.5" />
                      <span><strong>Subcortical:</strong> Ipsilateral — left cerebellum controls left body</span>
                    </li>
                    <li className="flex items-start gap-2 text-xs text-muted-foreground font-medium">
                      <CheckCircle2 size={14} className="text-rose-500 shrink-0 mt-0.5" />
                      <span><strong>Limbic:</strong> Left = historical/past trauma, Right = current emotional processing</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Polarity */}
            <Card className="border border-border shadow-sm rounded-xl bg-card">
              <CardHeader className="p-5 pb-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                    <Activity size={18} className="text-chart-emerald" />
                  </div>
                  <CardTitle className="text-sm font-semibold">Polarity</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-3">
                <p className="text-sm text-muted-foreground font-medium">
                  Energy direction for the correction: IN (+) or OUT (&minus;).
                </p>
                <ul className="space-y-1.5">
                  <li className="flex items-start gap-2 text-xs text-muted-foreground font-medium">
                    <CheckCircle2 size={14} className="text-chart-emerald shrink-0 mt-0.5" />
                    <span><strong>IN (+):</strong> Receiving, integrating, calming</span>
                  </li>
                  <li className="flex items-start gap-2 text-xs text-muted-foreground font-medium">
                    <CheckCircle2 size={14} className="text-chart-destructive shrink-0 mt-0.5" />
                    <span><strong>OUT (&minus;):</strong> Releasing, discharging, clearing</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Method */}
            <Card className="border border-border shadow-sm rounded-xl bg-card">
              <CardHeader className="p-5 pb-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                    <Zap size={18} className="text-chart-primary" />
                  </div>
                  <CardTitle className="text-sm font-semibold">Method</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-3">
                <p className="text-sm text-muted-foreground font-medium">
                  How you deliver the correction to the coordinates.
                </p>
                <div className="space-y-2">
                  {CORRECTION_METHODS.map(method => {
                    const MethodIcon = method.icon;
                    return (
                      <div key={method.id} className="flex items-start gap-3 p-2 rounded-lg bg-muted/30">
                        <MethodIcon size={16} className="text-muted-foreground shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold">{method.name}</p>
                          <p className="text-xs text-muted-foreground">{method.bestFor}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Verification */}
            <Card className="border border-border shadow-sm rounded-xl bg-card">
              <CardHeader className="p-5 pb-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                    <CheckCircle2 size={18} className="text-chart-emerald" />
                  </div>
                  <CardTitle className="text-sm font-semibold">Verification Step</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-3">
                <p className="text-sm text-muted-foreground font-medium">
                  Before committing to the full correction, you can test-fire the proposed correction to confirm you are on the right track.
                </p>
                <ol className="space-y-1.5 text-xs text-muted-foreground font-medium">
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[10px] font-semibold shrink-0 mt-0.5">1</span>
                    <span>Reproduce the inhibition (stimulus + head position if needed)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[10px] font-semibold shrink-0 mt-0.5">2</span>
                    <span>State the proposed correction direction and system</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[10px] font-semibold shrink-0 mt-0.5">3</span>
                    <span>Briefly hold the zone(s) for 1&ndash;2 seconds</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[10px] font-semibold shrink-0 mt-0.5">4</span>
                    <span>Re-test the original inhibition — if it clears, proceed with the full correction</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[10px] font-semibold shrink-0 mt-0.5">5</span>
                    <span>If still inhibited, apply the full correction method (tapping, holding, or tuning fork) and reassess</span>
                  </li>
                </ol>
                <p className="text-xs text-muted-foreground/60 italic border-t border-border pt-2">
                  This is not a shortcut — it is a precision check to confirm you have the right target before investing in the full correction sequence.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Special Case: Primitive Reflexes */}
        <div className="space-y-6 pt-4">
          <div className="flex items-center gap-4 px-2">
            <div className="w-12 h-12 rounded-xl bg-card text-card-foreground border border-border flex items-center justify-center shadow-sm">
              <BookOpen size={24} />
            </div>
            <div>
              <h2 className="text-3xl font-semibold text-foreground">Primitive Reflexes & Corrections</h2>
              <p className="text-muted-foreground font-medium">Head-position-dependent reflexes require working within a narrow window.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border border-border shadow-sm rounded-xl bg-card">
              <CardContent className="p-5 space-y-2">
                <h4 className="font-semibold text-sm">ATNR</h4>
                <p className="text-xs text-muted-foreground font-medium">Inhibition pattern appears when the head is rotated. Test afferent/efferent within that window, then switch to an indicator muscle.</p>
              </CardContent>
            </Card>
            <Card className="border border-border shadow-sm rounded-xl bg-card">
              <CardContent className="p-5 space-y-2">
                <h4 className="font-semibold text-sm">STNR</h4>
                <p className="text-xs text-muted-foreground font-medium">Inhibition pattern appears with the head in flexion or extension. Same approach — state direction while the head is held in position.</p>
              </CardContent>
            </Card>
            <Card className="border border-border shadow-sm rounded-xl bg-card">
              <CardContent className="p-5 space-y-2">
                <h4 className="font-semibold text-sm">TLR</h4>
                <p className="text-xs text-muted-foreground font-medium">Inhibition pattern appears with the head in flexion or extension. If efferent is the correction, repeat the stimulus and use an indicator to identify the relevant brain zones.</p>
              </CardContent>
            </Card>
          </div>

          <div className="p-6 bg-card border border-border rounded-lg">
            <div className="flex items-start gap-3">
              <Lightbulb size={18} className="text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm text-muted-foreground font-medium">
                <p>
                  <strong>Multiple layers:</strong> If a reflex remains inhibited after correction, it does not necessarily mean the correction was wrong. Primitive reflexes that have been active for years may require multiple correction sessions to fully integrate.
                </p>
                <p>
                  <strong>Fractal cascade:</strong> Correcting a higher-priority reflex (e.g., Fear Paralysis) may automatically resolve lower-priority reflexes (e.g., Moro, Startle). Always re-test after each correction.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Clinical Pearls */}
        <div className="p-8 bg-card text-card-foreground border border-border rounded-xl shadow-sm mt-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Lightbulb size={24} />
            </div>
            <div>
              <h3 className="text-xl font-semibold">Clinical Pearls</h3>
              <p className="text-sm text-muted-foreground font-medium">Core principles to guide your correction work.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/30 border border-border">
              <p className="text-sm font-medium">Expect 5&ndash;15+ layers in complex cases. Each layer reveals deeper compensation patterns.</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30 border border-border">
              <p className="text-sm font-medium">Always re-test the original stimulus. If still inhibited, there is a deeper layer.</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30 border border-border">
              <p className="text-sm font-medium">Never suggest memories or emotions. Let the nervous system guide you.</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30 border border-border">
              <p className="text-sm font-medium">The joint may not be related to the symptom site — it is where the brain needs proprioceptive input to reduce threat.</p>
            </div>
          </div>
        </div>

      </div>
    </AppLayout>
  );
};

export default CorrectionsReferencePage;
