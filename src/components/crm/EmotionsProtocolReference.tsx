
import { 
  Heart, 
  ShieldCheck, 
  History, 
  Zap, 
  Eye, 
  Activity, 
  Sparkles,
  Info,
  ArrowRight,
  CheckCircle2,
  Clock,
  Target,
  Hand
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const STEPS = [
  { 
    id: 1, 
    title: "ESR Indicator Check", 
    desc: "Hold Frontal Lobe (ESR) points (GB14) to see if the system is ready for emotional work.",
    icon: Activity,
    color: "text-indigo-600",
    bg: "bg-indigo-50"
  },
  { 
    id: 2, 
    title: "Permission Check", 
    desc: "Always ask: 'Do we have permission to correct this?' If denied, perform Harmonic Rocking first.",
    icon: ShieldCheck,
    color: "text-primary",
    bg: "bg-primary/5"
  },
  { 
    id: 3, 
    title: "Timeline Selection", 
    desc: "Determine if the stress is Current (happening now) or Historic (past event).",
    icon: History,
    color: "text-purple-600",
    bg: "bg-purple-50"
  },
  { 
    id: 4, 
    title: "Timeline Regression", 
    desc: "If historic, narrow down the specific age and month of origin using the indicator muscle.",
    icon: Zap,
    color: "text-amber-600",
    bg: "bg-amber-50"
  },
  { 
    id: 5, 
    title: "Primary Emotion", 
    desc: "Identify the core feeling: Hurt (Fire), Worry (Earth), Sadness (Metal), Fear (Water), or Anger (Wood).",
    icon: Heart,
    color: "text-rose-600",
    bg: "bg-rose-50"
  },
  { 
    id: 6, 
    title: "Priority Organ", 
    desc: "Find the organ acting as a surrogate for the charge. This MUST be an organ related to the emotion's element from Step 5:",
    icon: Activity,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    details: [
      { label: "Wood (Anger)", items: "Liver / Gallbladder" },
      { label: "Fire (Hurt)", items: "Heart / Small Intestine" },
      { label: "Earth (Worry)", items: "Spleen / Stomach" },
      { label: "Metal (Sadness)", items: "Lung / Large Intestine" },
      { label: "Water (Fear)", items: "Kidney / Bladder" }
    ]
  },
  { 
    id: 7, 
    title: "Energy Polarity", 
    desc: "Challenge for Energy IN (+) or Energy OUT (-). Usually OUT to release stress.",
    icon: Zap,
    color: "text-orange-600",
    bg: "bg-orange-50"
  },
  { 
    id: 8, 
    title: "Eye Position (NLP Logic)", 
    desc: "Identify the sensory access point for the stress:",
    icon: Eye,
    color: "text-cyan-600",
    bg: "bg-cyan-50",
    details: [
      { label: "Up & Left", items: "Visual Memory", sub: "Seeing a scene from the past." },
      { label: "Horizontal Left", items: "Auditory Memory", sub: "Hearing sounds or words from the past." },
      { label: "Down & Left", items: "Internal Monologue", sub: "What you say to yourself (e.g. 'I am not lovable')." },
      { label: "Up & Right", items: "Visual Constructed", sub: "Predicting what you think you will see." },
      { label: "Horizontal Right", items: "Auditory Constructed", sub: "Predicting what you think you will hear." },
      { label: "Down & Right", items: "Kinesthetic / Felt Sense", sub: "Physical sensation or body association." }
    ]
  },
  { 
    id: 9, 
    title: "Correction & Upload", 
    desc: "Hold ESR + Pulse Point + Eye Position. Replay stress until shift, then upload positive state.",
    icon: Sparkles,
    color: "text-indigo-600",
    bg: "bg-indigo-50"
  }
];

const EmotionsProtocolReference = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
      {/* Protocol Header */}
      <div className="border-b border-border/50 pb-6 mb-8">
        <h1 className="text-3xl font-serif font-bold text-foreground">Neuro-Emotional Integration</h1>
        <p className="text-sm text-muted-foreground font-medium mt-1">Standard 9-Step Clinical Protocol</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Steps List */}
        <div className="lg:col-span-7 space-y-4">
          {STEPS.map((step) => (
            <div 
              key={step.id} 
              className="p-5 rounded-2xl border border-border/50 bg-card shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex items-start gap-6">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black text-sm shadow-sm transition-transform group-hover:scale-105",
                  step.bg, step.color
                )}>
                  {step.id}
                </div>
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="font-serif font-bold text-xl text-foreground">
                      {step.title}
                    </h4>
                    <Badge variant="outline" className="border-border/50 text-muted-foreground font-black text-[7px] uppercase tracking-widest px-1.5 py-0 rounded-none">
                      Step {step.id}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                    {step.desc}
                  </p>
                  
                  {step.details && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      {step.details.map((detail, idx) => (
                        <div key={idx} className="flex flex-col p-3 rounded-xl bg-muted/50 border border-border/50">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="bg-card border-border text-[8px] font-black uppercase tracking-widest px-1.5 py-0 rounded-none">
                              {detail.label}
                            </Badge>
                            <span className="text-xs font-bold text-foreground">{detail.items}</span>
                          </div>
                          {detail.sub && (
                            <p className="text-[10px] text-muted-foreground font-medium leading-tight italic">
                              {detail.sub}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right: Visual References */}
        <div className="lg:col-span-5 space-y-8">
          <div className="sticky top-8 space-y-8">
            {/* Pulse Points Reference */}
            <Card className="border-none shadow-xl rounded-[2.5rem] bg-card overflow-hidden border-2 border-indigo-100">
              <CardHeader className="bg-indigo-600 p-6 text-primary-foreground">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-card/20 flex items-center justify-center shadow-inner">
                    <Hand size={20} />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-black">Organ Pulse Points</CardTitle>
                    <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest">TCM Diagnostic Reference</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="aspect-square rounded-2xl overflow-hidden bg-muted/50 border border-border/50 shadow-inner flex items-center justify-center p-4">
                  <img 
                    src="/images/pulse-points.png" 
                    alt="Organ Pulse Points Reference" 
                    className="max-w-full h-auto rounded-lg"
                    onError={(e) => {
                      // Fallback if image is missing
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentElement;
                      if (parent) {
                        const placeholder = document.createElement('div');
                        placeholder.className = "flex flex-col items-center text-muted-foreground/60 gap-2";
                        placeholder.innerHTML = '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg><p class="text-[10px] font-black uppercase tracking-widest">Pulse Points Diagram</p>';
                        parent.appendChild(placeholder);
                      }
                    }}
                  />
                </div>
                <div className="mt-6 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Info size={14} className="text-indigo-600" />
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Clinical Tip</span>
                  </div>
                  <p className="text-xs text-indigo-900 font-medium leading-relaxed">
                    Hold the pulse point corresponding to the priority organ identified in Step 6. Use light pressure for Yang organs and deep pressure for Yin organs.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Eye Accessing Cues */}
            <Card className="border-none shadow-lg rounded-[2.5rem] bg-foreground text-primary-foreground overflow-hidden">
              <CardHeader className="p-6 pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
                  <Eye size={14} /> Eye Accessing Cues (NLP)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="aspect-video rounded-2xl overflow-hidden bg-card/5 border border-primary-foreground/10 flex items-center justify-center p-4">
                  <img 
                    src="/images/eye-modes.png" 
                    alt="Eye Accessing Cues Reference" 
                    className="max-w-full h-auto opacity-80"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Clinical Note */}
      <div className="mt-12 p-8 bg-muted/50 rounded-[2rem] border border-border/50 flex items-start gap-6">
        <div className="w-12 h-12 rounded-2xl bg-card flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
          <Info size={24} />
        </div>
        <div className="space-y-2">
          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em]">Clinical Mastery Note</p>
          <p className="text-sm text-muted-foreground font-medium leading-relaxed italic">
            "The shift occurs when the client can distinguish between the 'me' (the observer) and the 'not-me' (the identity/emotion). 
            Always wait for a clear parasympathetic response: Yawning, Sighing, Swallowing, Gurgling, or a spontaneous Deep Breath before proceeding to the Positive Upload."
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmotionsProtocolReference;