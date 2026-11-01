import { useState, useEffect, useCallback, useRef } from "react";
import { Heart, Info, ChevronLeft, History, Eye, Zap, Sparkles, Brain, Settings, X, Trash2, ArrowLeft, Home, BookOpen, Clock, User, Download, Share2, RotateCcw, ChevronRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRIMARY_EMOTIONS, EYE_POSITIONS } from "@/data/emotion-data";
import LimitingBeliefsSelfWork from "@/components/crm/LimitingBeliefsSelfWork";

type Step = "home" | "timelineSelect" | "timelineAge" | "emotionSelect" | "organSelect" | "eyeSelect" | "result" | "result-saved" | "history" | "esrRef" | "organRef" | "eyeRef" | "limitingBeliefs";

interface SessionLog {
  id: string;
  timestamp: number;
  emotion: string;
  organ: string;
  eyePos: string;
  timeline?: string;
  age?: string;
}

const footerItems = [
  { id: "home", label: "Home", icon: Home, href: null },
  { id: "history", label: "History", icon: Clock, href: null },
  { id: "reference", label: "Reference", icon: BookOpen, href: null },
  { id: "profile", label: "Profile", icon: User, href: "/settings" },
] as const;

// ——— Color system ———
// Deep navy base with warm amber/gold accents for mobile-first readability
const C = {
  bg: "bg-[linear-gradient(180deg,#0a0d14_0%,#111827_50%,#0a0d14_100%)]",
  card: "bg-white/[0.03] backdrop-blur-md border-white/[0.03]",
  cardHover: "hover:bg-white/[0.05]",
  border: "border-white/[0.04]",
  accent: "bg-amber-500/15 border-amber-500/20 text-amber-300",
  accentSolid: "bg-amber-500 text-[#0a0d14]",
  accentHover: "hover:bg-amber-400",
  muted: "bg-white/[0.04] border-white/[0.06] text-white/60",
  mutedHover: "hover:bg-white/[0.06]",
  amber: "text-amber-300",
  amberBright: "text-amber-400",
  emerald: "text-emerald-300",
  text: "text-white",
  textMuted: "text-white/55",
  textDim: "text-white/30",
};

function Footer({ currentStep, onNavigate }: { currentStep: Step; onNavigate: (step: Step | "settings") => void }) {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-30 bg-[#0a0d14]/95 backdrop-blur-md border-t border-white/[0.06] pb-safe-area">
      <div className="grid grid-cols-4">
        {footerItems.map((item) => {
          const isActive =
            (item.id === "home" && currentStep === "home") ||
            (item.id === "history" && currentStep === "history") ||
            (item.id === "reference" && ["esrRef", "organRef", "eyeRef"].includes(currentStep));
          const Icon = item.icon;
          return (
            <button key={item.id} onClick={() => item.href ? window.location.href = item.href : onNavigate(item.id as Step)}
              className={cn("flex flex-col items-center gap-1 py-3 px-2 transition-all duration-200 min-h-[56px] active:scale-95", isActive ? "text-amber-300" : "text-white/40 hover:text-white/60")} aria-label={item.label}>
              <Icon size={20} />
              <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
            </button>
          );
        })}
      </div>
    </footer>
  );
}

function StepCard({ title, subtitle, children, className = "" }: { title: string; subtitle: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl p-4 border border-white/[0.04] backdrop-blur-sm transition-all duration-250", className)}>
      <div className="mb-4">
        <h2 className="text-xl font-serif font-bold mb-1 text-amber-400">{title}</h2>
        <p className="text-[11px] text-amber-300/80">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

export default function SelfWorkPage() {
  const [step, setStep] = useState<Step>("home");
  const [emotion, setEmotion] = useState<any>(null);
  const [organ, setOrgan] = useState<string>("");
  const [eyePos, setEyePos] = useState<string>("");
  const [history, setHistory] = useState<SessionLog[]>([]);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const swipeStartX = useRef<number | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [timeline, setTimeline] = useState<'Current' | 'Historic' | null>(null);
  const [age, setAge] = useState("");
  const [months, setMonths] = useState("");

  useEffect(() => {
    try { const stored = localStorage.getItem("selfWorkHistory"); if (stored) setHistory(JSON.parse(stored)); } catch {}
    setIsIOS(/iPhone|iPad|iPod/.test(navigator.userAgent));
    const handleBeforeInstall = (e: BeforeInstallPromptEvent) => { e.preventDefault(); setShowInstallPrompt(true); };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall as any);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall as any);
  }, []);

  const saveToHistory = useCallback((log: SessionLog) => {
    setHistory(prev => [log, ...prev].slice(0, 50));
    try { localStorage.setItem("selfWorkHistory", JSON.stringify([log, ...history].slice(0, 50))); } catch {}
  }, [history]);

  const haptic = (type: "light" | "medium" | "heavy" = "light") => {
    if ("vibrate" in navigator) navigator.vibrate(type === "light" ? 10 : type === "medium" ? 20 : 30);
  };

  const onTouchStart = (e: React.TouchEvent) => { swipeStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (swipeStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - swipeStartX.current;
    swipeStartX.current = null;
    if (dx > 80 && step !== "home") {
      haptic("light");
      setStep("home");
    }
  };

  const goHome = useCallback(() => { haptic("light"); setStep("home"); }, []);

  const navigateFooter = useCallback((target: Step | "settings") => {
    haptic("light");
    if (target === "settings") window.location.href = "/settings";
    else setStep(target);
  }, []);

  const exportHistory = () => {
    const data = JSON.stringify(history, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `self-work-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    haptic("medium");
  };

  const shareSession = async (log: SessionLog) => {
    const text = `Emotional Integration: ${log.emotion} → ${log.organ} → ${log.eyePos} (${new Date(log.timestamp).toLocaleDateString()})`;
    if (navigator.share) {
      try { await navigator.share({ title: "Self Work Session", text }); haptic("light"); } catch {}
    } else {
      try { await navigator.clipboard.writeText(text); haptic("light"); } catch {}
    }
  };

  // Reference content
  const esrContent = (
    <div className="space-y-4">
      <h3 className="text-lg font-serif font-semibold flex items-center gap-2"><Heart size={20} className={C.amberBright} /> ESR Indicator Check</h3>
      <div className={cn("rounded-xl p-4", C.card, C.border)}>
        <p className="text-[13px] leading-relaxed" style={{color: "rgba(255,255,255,0.85)"}}>Hold <strong>GB14 (forehead)</strong> ESR points bilaterally.</p>
        <div className="mt-3 grid grid-cols-2 gap-3 text-[12px]">
          <div className={cn("rounded-lg p-3", C.card, C.border)}><span className={C.amberBright}>Inhibits</span> → Indicator muscle goes weak</div>
          <div className={cn("rounded-lg p-3", C.card, C.border)}><span className={C.emerald}>Locks</span> → Weak muscle becomes strong</div>
        </div>
        <p className="mt-3 text-[12px]" style={{color: "rgba(255,255,255,0.6)"}}>Either response = emotional integration indicated.</p>
      </div>
    </div>
  );

  const eyeRefContent = (
    <div className="space-y-4">
      <h3 className="text-lg font-serif font-semibold flex items-center gap-2"><Eye size={20} className={C.amberBright} /> NLP Eye Accessing Cues</h3>
      <div className={cn("rounded-2xl overflow-hidden", C.card, C.border)}>
        <div className="aspect-video flex items-center justify-center p-4" style={{background: "rgba(255,255,255,0.02)"}}>
          <img loading="lazy" decoding="async" src="/images/eye-modes.png" alt="NLP Eye Accessing Cues Reference" className="max-w-full h-auto opacity-90 rounded-xl" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        </div>
      </div>
      <div className={cn("rounded-xl p-4", C.card, C.border)}>
        <p className="text-[12px] mb-3" style={{color: "rgba(255,255,255,0.7)"}}>Eye positions access different neurological pathways:</p>
        <div className="space-y-2">
          {EYE_POSITIONS.map((ep) => (
            <div key={ep.label} className="flex items-center gap-3 p-3 rounded-lg" style={{background: "rgba(255,255,255,0.03)"}}>
              <span className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{background: "rgba(255,215,100,0.15)", color: "rgba(255,215,100,1)"}}>{ep.pos}</span>
              <div className="flex-1 min-w-0">
                <span className="font-medium text-sm block">{ep.label}</span>
                <span className="text-[11px] block" style={{color: "rgba(255,255,255,0.5)"}}>{ep.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const organRefContent = (
    <div className="space-y-4">
      <h3 className="text-lg font-serif font-semibold flex items-center gap-2"><Sparkles size={20} className={C.amberBright} /> Emotion → Organ → Muscle Map</h3>
      <div className={cn("rounded-xl p-4", C.card, C.border)}>
        <div className="space-y-3">
          {PRIMARY_EMOTIONS.map((e) => (
            <div key={e.id} className="rounded-lg p-3" style={{background: "rgba(255,255,255,0.03)"}}>
              <div className="flex items-center gap-2 mb-2">
                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center text-white", "bg-amber-500", e.color)}><Heart size={12} className="fill-current" /></div>
                <span className="font-medium">{e.label}</span>
                <span className="text-[10px]" style={{color: "rgba(255,215,100,0.8)"}}>{e.element} Element</span>
              </div>
              <div className="ml-9 text-[11px] space-y-1" style={{color: "rgba(255,255,255,0.7)"}}>
                {e.organs?.map((org: string) => <div key={org} className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full" style={{background: "rgba(255,215,100,0.5)"}} /><span>{org}</span></div>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // HOME PAGE
  if (step === "home") {
    return (
      <section className={cn("min-h-screen text-white", C.bg, "pb-28")} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="max-w-xl mx-auto px-4 pt-6">
          <div className="mb-8 animate-in fade-in slide-in-from-top-2 duration-300">
            <h1 className="text-2xl font-serif font-bold tracking-wide text-amber-300">Self Work</h1>
            <p className="text-sm font-medium uppercase tracking-widest mb-2 text-amber-300/70">Emotional Integration</p>
          </div>

          {/* Primary CTA */}
          <div className="mb-4">
            <button onClick={() => { haptic(); setStep("timelineSelect"); }} className={cn("w-full rounded-2xl py-5 px-6 text-lg font-semibold uppercase tracking-wider transition-all min-h-[60px] flex items-center justify-center gap-3 bg-amber-600/10 border border-amber-500/20 text-amber-300 hover:bg-amber-600/20 hover:text-amber-400", "shadow-sm:focus-visible")}>
              <Heart size={24} className="shrink-0" />
              <span>Start Emotional Integration</span>
            </button>
          </div>

          {/* Secondary CTA */}
          <div className="mb-4">
            <button onClick={() => { haptic(); setStep("limitingBeliefs"); }} className={cn("w-full rounded-2xl py-5 px-6 text-lg font-semibold uppercase tracking-wider transition-all min-h-[60px] flex items-center justify-center gap-3 bg-white/5 border border-white/8 text-white/60 hover:bg-white/10 hover:text-white")}>
              <Brain size={24} className="shrink-0" />
              <span>Limiting Beliefs</span>
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button onClick={() => { haptic(); setStep("history"); }} className={cn("rounded-xl py-3 px-3 text-sm font-medium uppercase tracking-wider transition-all min-h-[44px]", C.muted, C.mutedHover)}><History size={14} className="shrink-0" /> History</button>
            <button onClick={() => { haptic(); setShowExport(true); }} className={cn("rounded-xl py-3 px-3 text-sm font-medium uppercase tracking-wider transition-all min-h-[44px]", C.muted, C.mutedHover)}><Download size={14} className="shrink-0" /> Export</button>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-1">
            <button onClick={() => { haptic(); setStep("esrRef"); }} className={cn("rounded-full py-2 px-1.5 text-[10px] font-medium transition-all flex flex-col items-center gap-0.5", C.muted, C.mutedHover)}><Zap size={12} className="shrink-0" /> ESR</button>
            <button onClick={() => { haptic(); setStep("organRef"); }} className={cn("rounded-full py-2 px-1.5 text-[10px] font-medium transition-all flex flex-col items-center gap-0.5", C.muted, C.mutedHover)}><Sparkles size={12} className="shrink-0" /> Organs</button>
            <button onClick={() => { haptic(); setStep("eyeRef"); }} className={cn("rounded-full py-2 px-1.5 text-[10px] font-medium transition-all flex flex-col items-center gap-0.5", C.muted, C.mutedHover)}><Eye size={12} className="shrink-0" /> Eyes</button>
          </div>
        </div>

        {showExport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-[#1a1410] border border-amber-500/30 rounded-2xl p-6 max-w-sm w-full space-y-4 animate-in zoom-in-95 duration-300">
              <h2 className="text-lg font-serif font-bold">Export Session History</h2>
              <p className="text-[12px]" style={{color: "rgba(255,255,255,0.7)"}}>Download your session history as JSON for backup or analysis.</p>
              <div className="flex gap-3">
                <button onClick={() => { exportHistory(); setShowExport(false); }} className={cn("flex-1 rounded-xl py-3 text-sm font-semibold uppercase tracking-wider transition-all min-h-[48px]", C.accentSolid, C.accentHover)}><Download size={16} className="mr-2" /> Export JSON</button>
                <button onClick={() => setShowExport(false)} className={cn("flex-1 rounded-xl py-3 text-sm font-semibold uppercase tracking-wider transition-all min-h-[48px]", C.muted, C.mutedHover)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        <Footer currentStep={step} onNavigate={(s) => { if (s === "history") setStep("history"); else if (s === "reference") setStep("esrRef"); else if (s === "settings") window.location.href = "/settings"; else setStep(s); }} />

        {showInstallPrompt && (
          <div className="fixed bottom-24 left-4 right-4 max-w-xl mx-auto animate-in slide-in-from-bottom-2 duration-300 z-50">
            <div className={cn("rounded-2xl p-4", C.accentSolid, "shadow-xl")}>
              <div className="flex items-center justify-between">
                <div><p className="font-semibold">Install Self Work</p><p className="text-[12px] opacity-90">Add to home screen for offline access</p></div>
                <button onClick={() => setShowInstallPrompt(false)} className="p-1 rounded opacity-70 hover:opacity-100"><X size={16} /></button>
              </div>
            </div>
          </div>
        )}
      </section>
    );
  }

  // HISTORY
  if (step === "history") {
    return (
      <section className={cn("min-h-screen text-white", C.bg, "pb-28")} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="max-w-xl mx-auto px-4 pt-6">
          <div className="flex items-center justify-between mb-6">
            <button onClick={goHome} className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-wider opacity-70 hover:opacity-100 transition-opacity min-h-[44px]"><ArrowLeft size={16} className="opacity-70" /> Back</button>
            <h1 className="text-2xl font-serif font-bold">Session History</h1>
            <button onClick={() => { if (confirm("Clear all history?")) { setHistory([]); localStorage.removeItem("selfWorkHistory"); haptic("heavy"); } }} className="p-2 rounded opacity-50 hover:opacity-100"><Trash2 size={16} /></button>
          </div>
          {history.length === 0 ? (
            <div className={cn("rounded-2xl p-8 text-center", C.card, C.border)}>
              <History size={48} className="mx-auto mb-3" style={{color: "rgba(255,255,255,0.3)"}} />
              <p className="text-[13px]" style={{color: "rgba(255,255,255,0.5)"}}>No sessions yet. Start your first integration.</p>
              <button onClick={goHome} className="mt-4" style={{color: "rgba(255,215,100,1)"}}>← Begin Integration</button>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((log) => (
                <article key={log.id} className={cn("rounded-xl p-4 transition-all", C.card, C.border)}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{log.emotion}</p>
                      <p className="text-[11px] mt-0.5" style={{color: "rgba(255,255,255,0.5)"}}>{log.organ} · {log.eyePos} · {new Date(log.timestamp).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => shareSession(log)} className="p-1 rounded opacity-50 hover:opacity-100"><Share2 size={14} /></button>
                      <button onClick={() => { haptic(); if (confirm("Delete this session?")) setHistory(h => h.filter(x => x.id !== log.id)); }} className="p-1 rounded opacity-50 hover:opacity-100"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
        <Footer currentStep={step} onNavigate={(s) => { if (s === "history") setStep("history"); else if (s === "reference") setStep("esrRef"); else if (s === "settings") window.location.href = "/settings"; else setStep(s); }} />
      </section>
    );
  }

  // LIMITING BELIEFS
  if (step === "limitingBeliefs") {
    return (
      <section className={cn("min-h-screen text-white overflow-x-hidden", C.bg, "pb-28")} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <header className="fixed top-0 left-0 right-0 z-20 px-4 py-3 flex items-center justify-between border-b" style={{borderColor: "rgba(255,255,255,0.08)", background: "linear-gradient(to bottom, rgba(12,10,9,0.95), transparent)"}}>
          <button onClick={goHome} className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-wider opacity-70 hover:opacity-100 transition-opacity min-h-[44px]" aria-label="Back"><ArrowLeft size={16} className="opacity-70" /><span className="hidden sm:inline">Back</span></button>
          <h1 className="text-lg font-serif font-bold">Limiting Beliefs</h1>
          <button onClick={() => { haptic(); setStep("history"); }} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors" aria-label="History"><History size={18} className={C.amberBright} /></button>
        </header>
        <main className="pt-16 pb-28 px-4 sm:px-6 max-w-2xl mx-auto">
          <LimitingBeliefsSelfWork
            onComplete={(summary) => {
              const log = { id: crypto.randomUUID(), timestamp: Date.now(), emotion: summary, organ: "Limiting Beliefs", eyePos: "N/A" };
              saveToHistory(log);
              setStep("result-saved");
            }}
            onCancel={goHome}
          />
        </main>
        <Footer currentStep={step} onNavigate={navigateFooter} />
      </section>
    );
  }

  // REFERENCE PAGES
  if (step === "esrRef") return <RefPage title="ESR Indicator Check" icon={<Zap size={20} />} content={esrContent} onBack={goHome} colors={C} onNavigate={(s: any) => { if (s === "settings") window.location.href = "/settings"; else setStep(s); }} currentStep={step} />;
  if (step === "organRef") return <RefPage title="Emotion → Organ Map" icon={<Sparkles size={20} />} content={organRefContent} onBack={goHome} colors={C} onNavigate={(s: any) => { if (s === "settings") window.location.href = "/settings"; else setStep(s); }} currentStep={step} />;
  if (step === "eyeRef") return <RefPage title="NLP Eye Positions" icon={<Eye size={20} />} content={eyeRefContent} onBack={goHome} colors={C} onNavigate={(s: any) => { if (s === "settings") window.location.href = "/settings"; else setStep(s); }} currentStep={step} />;

  // INTEGRATION FLOW
  return (
    <section className={cn("min-h-screen text-white overflow-x-hidden", C.bg, "pb-28")} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <header className="fixed top-0 left-0 right-0 z-20 px-4 py-3 flex items-center justify-between border-b" style={{borderColor: "rgba(255,255,255,0.08)", background: "linear-gradient(to bottom, rgba(12,10,9,0.95), transparent)"}}>
        <button onClick={goHome} className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-wider opacity-70 hover:opacity-100 transition-opacity min-h-[44px]" aria-label="Back"><ArrowLeft size={16} className="opacity-70" /><span className="hidden sm:inline">Back</span></button>
        <h1 className="text-lg font-serif font-bold">Emotional Integration</h1>
        <button onClick={() => { haptic(); setStep("history"); }} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors" aria-label="History"><History size={18} className={C.amberBright} /></button>
      </header>

      <main className="pt-16 pb-28 px-4 sm:px-6 max-w-2xl mx-auto">
        {/* Progress dots */}
        <div className="mb-5 flex items-center justify-center gap-3 px-2">
          {[
            { key: "timelineSelect", label: "Timeline" },
            { key: "emotionSelect", label: "Emotion" },
            { key: "organSelect", label: "Organ" },
            { key: "eyeSelect", label: "Eyes" },
            { key: "result", label: "Save" },
          ].map((s, i) => {
            const isActive = step === s.key || (step === "result-saved" && i < 4);
            const isPast = ["timelineSelect", "emotionSelect", "organSelect", "eyeSelect", "result"].indexOf(step) > i || (step === "result-saved" && i < 4);
            return (
              <div key={s.key} className="flex items-center gap-1.5">
                <div className="flex flex-col items-center gap-0.5">
                  <div className={cn(
                    "w-2.5 h-2.5 rounded-full transition-all duration-300",
                    isActive ? "bg-amber-400 scale-125 ring-2 ring-amber-400/20" : isPast ? "bg-amber-400/50" : "bg-white/10"
                  )} />
                  <span className={cn("text-[8px] tracking-wider font-medium", isActive ? "text-amber-300" : isPast ? "text-amber-300/70" : "text-white/20")}>{s.label}</span>
                </div>
                {i < 4 && <div className={cn("w-5 h-[1px] -mt-3", isPast ? "bg-amber-400/35" : "bg-white/8")} />}
              </div>
            );
          })}
        </div>

        {step === "timelineSelect" && (
          <StepCard title="Identify Timeline" subtitle="Is this emotional stress current or historic?">
            <div className="grid grid-cols-1 gap-3">
              <button onClick={() => { haptic(); setTimeline('Current'); setStep("emotionSelect"); }} className={cn("rounded-xl p-4 text-left transition-all min-h-[56px]", C.accent, C.accentHover)}>
                <div className="font-medium">Current</div>
                <div className="text-[11px] mt-0.5" style={{color: "rgba(255,215,100,0.9)"}}>Known stress or pattern</div>
              </button>
              <button onClick={() => { haptic(); setTimeline('Historic'); setStep("timelineAge"); }} className={cn("rounded-xl p-4 text-left transition-all min-h-[56px]", C.muted, C.mutedHover)}>
                <div className="font-medium">Historic</div>
                <div className="text-[11px] mt-0.5" style={{color: "rgba(255,255,255,0.6)"}}>Past event or trauma — age regression</div>
              </button>
            </div>
          </StepCard>
        )}

        {step === "timelineAge" && (
          <StepCard title="Timeline Regression" subtitle="Challenge the system for the specific age of origin.">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs" style={{color: "rgba(255,255,255,0.6)"}}>Age</label>
                <input type="number" placeholder="e.g. 5" className="w-full h-10 rounded-lg text-sm font-medium text-center bg-white/5 border border-white/10 text-white" value={age} onChange={(e) => setAge(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-xs" style={{color: "rgba(255,255,255,0.6)"}}>Months (Optional)</label>
                <input type="number" placeholder="e.g. 4" className="w-full h-10 rounded-lg text-sm font-medium text-center bg-white/5 border border-white/10 text-white" value={months} onChange={(e) => setMonths(e.target.value)} />
              </div>
            </div>
            <p className="mt-3 text-[11px]" style={{color: "rgba(255,255,255,0.5)"}}>Tip: Challenge in blocks (1-10, 10-20) then narrow down.</p>
            <div className="mt-4 flex gap-3">
              <button onClick={() => setStep("timelineSelect")} className={cn("flex-1 rounded-xl py-3 px-4 text-sm font-medium uppercase tracking-wider transition-all min-h-[48px]", C.muted, C.mutedHover)}>Back</button>
              <button disabled={!age} onClick={() => { setTimeline('Historic'); setStep("emotionSelect"); }} className={cn("flex-[2] rounded-xl py-3 px-4 text-sm font-medium uppercase tracking-wider transition-all min-h-[48px]", C.accentSolid, C.accentHover, !age && "opacity-50")}>Continue</button>
            </div>
          </StepCard>
        )}

        {step === "emotionSelect" && (
          <StepCard title="Primary Emotion" subtitle="Challenge for the priority emotion.">
            <div className="grid grid-cols-1 gap-2">
              {PRIMARY_EMOTIONS.map((e) => (
                <button key={e.id} onClick={() => { haptic(); setEmotion(e); setOrgan(""); setStep("organSelect"); }} className={cn("rounded-xl p-3 flex items-center gap-3 text-left transition-all min-h-[56px] border", emotion?.id === e.id ? "bg-amber-500/15 border-amber-500/30 text-amber-300" : "bg-white/3 border-white/5 text-white/70 hover:bg-white/5")}>
                  <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0", e.color)}><Heart size={16} className="fill-current" /></div>
                  <div className="flex-1"><span className="font-medium text-sm">{e.label}</span><span className="text-[10px] block mt-0.5 text-amber-300/80">{e.element} Element</span></div>
                </button>
              ))}
            </div>
          </StepCard>
        )}

        {step === "organSelect" && emotion && (
          <StepCard title={`Emotion: ${emotion.label}`} subtitle="Select the priority organ holding this emotion:">
            <div className="grid grid-cols-2 gap-2">
              {emotion.organs?.map((org: string) => (
                <button key={org} onClick={() => { haptic(); setOrgan(org); setStep("eyeSelect"); }} className={cn("rounded-xl py-3 px-3 text-sm font-medium uppercase tracking-wider transition-all min-h-[52px] bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/30")}>{org}</button>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-center" style={{color: "rgba(255,215,100,0.5)"}}><em>Tap an organ to continue</em></p>
          </StepCard>
        )}

        {step === "eyeSelect" && emotion && organ && (
          <StepCard title={`Organ: ${organ}`} subtitle={`Emotion: ${emotion.label} — Choose eye position:`}>
            <div className="grid grid-cols-2 gap-2">
              {EYE_POSITIONS.map((ep) => (
                <button key={ep.id} onClick={() => { haptic(); setEyePos(ep.label); setStep("result"); }} className={cn("rounded-xl py-3 px-3 text-sm font-medium uppercase tracking-wider transition-all min-h-[52px] bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/30")}>
                  <span className="font-medium">{ep.label}</span>
                  <span className="text-[10px] block mt-0.5" style={{color: "rgba(255,215,100,0.7)"}}>{ep.pos}</span>
                </button>
              ))}
            </div>
          </StepCard>
        )}

        {step === "result" && emotion && organ && (
          <StepCard title="Integration Complete" subtitle="Note shifts in awareness, emotion, or physical sensation." className="text-center">
            <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center" style={{background: "linear-gradient(135deg, rgba(255,215,100,0.2), rgba(255,215,100,0.05))", boxShadow: "0 0 40px rgba(255,215,100,0.15)"}}><Heart size={36} className={C.amberBright} /></div>
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between px-4 py-3 rounded-xl" style={{background: "rgba(255,255,255,0.03)"}}>
                <span className="text-[11px] uppercase tracking-wider" style={{color: "rgba(255,255,255,0.5)"}}>Emotion</span>
                <span className="font-medium">{emotion.label}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3 rounded-xl" style={{background: "rgba(255,255,255,0.03)"}}>
                <span className="text-[11px] uppercase tracking-wider" style={{color: "rgba(255,255,255,0.5)"}}>Organ</span>
                <span className="font-medium">{organ}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3 rounded-xl" style={{background: "rgba(255,255,255,0.03)"}}>
                <span className="text-[11px] uppercase tracking-wider" style={{color: "rgba(255,255,255,0.5)"}}>Eye Position</span>
                <span className="font-medium">{eyePos}</span>
              </div>
              {timeline && (
                <div className="flex items-center justify-between px-4 py-3 rounded-xl" style={{background: "rgba(255,255,255,0.03)"}}>
                  <span className="text-[11px] uppercase tracking-wider" style={{color: "rgba(255,255,255,0.5)"}}>Timeline</span>
                  <span className="font-medium">{timeline}{age ? ` — Age ${age}` : ""}</span>
                </div>
              )}
            </div>
            <button onClick={() => { haptic("medium"); const log = { id: crypto.randomUUID(), timestamp: Date.now(), emotion: emotion.label, organ, eyePos: eyePos, timeline: timeline || undefined, age: age || undefined }; saveToHistory(log); setStep("result-saved"); }} className={cn("w-full rounded-xl px-6 py-3.5 text-sm font-semibold uppercase tracking-wider transition-all min-h-[48px]", C.accentSolid, C.accentHover)}>Save to Session Log</button>
          </StepCard>
        )}

        {step === "result-saved" && (
          <StepCard title="Saved ✅" subtitle="Your session has been logged to history." className="text-center">
            <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center" style={{background: "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.05))", boxShadow: "0 0 40px rgba(16,185,129,0.15)"}}>
              <CheckCircle2 size={36} className="text-emerald-400" />
            </div>
            <div className="space-y-2 mb-6">
              <p className="text-[13px]" style={{color: "rgba(255,255,255,0.6)"}}>Emotional integration complete. ESR re-checked.</p>
              <p className="text-[11px]" style={{color: "rgba(255,255,255,0.4)"}}>Note any shifts in awareness, emotion, or physical sensation.</p>
            </div>
            <button onClick={goHome} className={cn("w-full rounded-xl px-6 py-3.5 text-sm font-semibold uppercase tracking-wider transition-all min-h-[48px]", C.accentSolid, C.accentHover)}>Another Session</button>
            <button onClick={() => { haptic(); setStep("history"); }} className="mt-3 w-full rounded-xl py-3 px-4 text-sm font-medium uppercase tracking-wider transition-all min-h-[48px] bg-white/10 border border-white/20 hover:bg-white/15">View History</button>
          </StepCard>
        )}
      </main>
      <Footer currentStep={step} onNavigate={navigateFooter} />
    </section>
  );
}



function RefPage({ title, icon, content, onBack, colors, onNavigate, currentStep }: { title: string; icon: React.ReactNode; content: React.ReactNode; onBack: () => void; colors: any; onNavigate: (step: Step | "settings") => void; currentStep: Step }) {
  return (
    <section className={cn("min-h-screen text-white", colors.bg, "pb-28")}>
      <div className="max-w-xl mx-auto px-4 pt-6">
        <div className="flex items-center justify-between mb-6"><button onClick={onBack} className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-wider opacity-70 hover:opacity-100 transition-opacity min-h-[44px]"><ArrowLeft size={16} className="opacity-70" /> Back</button><h1 className="text-lg font-serif font-bold">{title}</h1><div className="w-24" /></div>
        <div className={cn("rounded-2xl p-5", colors.card, colors.border)}>{content}</div>
      </div>
      <Footer currentStep={currentStep} onNavigate={onNavigate} />
    </section>
  );
}