import { useState, useEffect, useCallback, useRef } from "react";
import { Heart, Info, ChevronLeft, History, Eye, Zap, Sparkles, Brain, Settings, X, Trash2, ArrowLeft, Home, BookOpen, Clock, User, Download, Share2, RotateCcw, ChevronRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRIMARY_EMOTIONS, EYE_POSITIONS } from "@/data/emotion-data";

type Step = "home" | "timelineSelect" | "timelineAge" | "emotionSelect" | "organSelect" | "eyeSelect" | "result" | "result-saved" | "history" | "esrRef" | "organRef" | "eyeRef";

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

function Footer({ currentStep, onNavigate }: { currentStep: Step; onNavigate: (step: Step | "settings") => void }) {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-30 bg-white/5 backdrop-blur-sm border-t border-white/10 pb-safe-area" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
      <div className="grid grid-cols-4">
        {footerItems.map((item) => {
          const isActive =
            (item.id === "home" && currentStep === "home") ||
            (item.id === "history" && currentStep === "history") ||
            (item.id === "reference" && ["esrRef", "organRef", "eyeRef"].includes(currentStep));
          const Icon = item.icon;
          return (
            <button key={item.id} onClick={() => item.href ? window.location.href = item.href : onNavigate(item.id as Step)}
              className={cn("flex flex-col items-center gap-1 py-3 px-2 transition-colors min-h-[56px] active:scale-95", isActive ? "text-amber-400" : "text-white/50 hover:text-white/70")} aria-label={item.label}>
              <Icon size={22} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </footer>
  );
}

function StepCard({ title, subtitle, children, className = "" }: { title: string; subtitle: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl p-5 bg-white/5 border border-white/10 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 duration-300", className)}>
      <div className="mb-4">
        <h2 className="text-xl font-serif font-bold mb-1">{title}</h2>
        <p className="text-[12px]" style={{color: "rgba(255,255,255,0.5)"}}>{subtitle}</p>
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
  const [timeline, setTimeline] = useState<'Current' | 'Historic' | null>(null);
  const [age, setAge] = useState("");
  const [months, setMonths] = useState("");
  const [history, setHistory] = useState<SessionLog[]>([]);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const swipeStartX = useRef<number | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const colors = {
    bg: "bg-[linear-gradient(180deg,#0c0a09_0%,#151110_50%,#0c0a09_100%)]",
    card: "bg-white/5 backdrop-blur-sm",
    cardHover: "hover:bg-white/10",
    border: "border-white/10",
    accent: "bg-amber-600/20 border-amber-400/30 text-amber-300",
    accentSolid: "bg-amber-600 text-white",
    accentHover: "hover:bg-amber-500",
    muted: "bg-white/10 border-white/20 text-white/80",
    mutedHover: "hover:bg-white/15",
    amber: "text-amber-300",
    amberBright: "text-amber-400",
    emerald: "text-emerald-400",
  };

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
  const goBack = useCallback(() => { haptic("light"); setStep("home"); }, []);

  // Reference content
  const esrContent = (
    <div className="space-y-4">
      <h3 className="text-lg font-serif font-semibold flex items-center gap-2"><Heart size={20} className={colors.amberBright} /> ESR Indicator Check</h3>
      <div className={cn("rounded-xl p-4", colors.card, colors.border)}>
        <p className="text-[13px] leading-relaxed" style={{color: "rgba(255,255,255,0.85)"}}>Hold <strong>GB14 (forehead)</strong> ESR points bilaterally.</p>
        <div className="mt-3 grid grid-cols-2 gap-3 text-[12px]">
          <div className={cn("rounded-lg p-3", colors.card, colors.border)}><span className={colors.amberBright}>Inhibits</span> → Indicator muscle goes weak</div>
          <div className={cn("rounded-lg p-3", colors.card, colors.border)}><span className={colors.emerald}>Locks</span> → Weak muscle becomes strong</div>
        </div>
        <p className="mt-3 text-[12px]" style={{color: "rgba(255,255,255,0.6)"}}>Either response = emotional integration indicated. Proceed to Permission.</p>
      </div>
    </div>
  );

  const eyeRefContent = (
    <div className="space-y-4">
      <h3 className="text-lg font-serif font-semibold flex items-center gap-2"><Eye size={20} className={colors.amberBright} /> NLP Eye Accessing Cues</h3>
      <div className={cn("rounded-xl p-4", colors.card, colors.border)}>
        <p className="text-[12px] mb-3" style={{color: "rgba(255,255,255,0.7)"}}>Eye positions access different neurological pathways:</p>
        <div className="space-y-2">
          {EYE_POSITIONS.map((ep) => (
            <div key={ep.label} className="flex items-center gap-3 p-3 rounded-lg" style={{background: "rgba(255,255,255,0.03)"}}>
              <span className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold" style={{background: "rgba(255,215,100,0.2)", color: "rgba(255,215,100,1)"}}>{ep.pos}</span>
              <div className="flex-1"><span className="font-medium text-sm">{ep.label}</span><span className="text-[11px] block" style={{color: "rgba(255,255,255,0.5)"}}>{ep.desc}</span></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const organRefContent = (
    <div className="space-y-4">
      <h3 className="text-lg font-serif font-semibold flex items-center gap-2"><Sparkles size={20} className={colors.amberBright} /> Emotion → Organ → Muscle Map</h3>
      <div className={cn("rounded-xl p-4", colors.card, colors.border)}>
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
      <section className={cn("min-h-screen text-white", colors.bg, "pb-28")} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="max-w-xl mx-auto px-4 pt-6">
          <div className="mb-8 animate-in fade-in slide-in-from-top-2 duration-300">
            <h1 className="text-3xl font-serif font-bold tracking-wider">Self Work</h1>
            <p className="text-[12px] font-medium uppercase tracking-widest mt-1" style={{color: "rgba(255,255,255,0.4)"}}>Emotional Integration</p>
          </div>

          <div className="flex flex-col gap-4">
            <button onClick={() => { haptic(); setStep("timelineSelect"); }} className={cn("w-full rounded-2xl py-8 px-6 text-lg font-semibold uppercase tracking-wider transition-all min-h-[80px]", colors.accentSolid, colors.accentHover)}>
              <Heart size={24} className="inline mr-3" /> Emotions
            </button>
          </div>
        </div>

        {showExport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-[#1a1410] border border-amber-500/30 rounded-2xl p-6 max-w-sm w-full space-y-4 animate-in zoom-in-95 duration-300">
              <h2 className="text-lg font-serif font-bold">Export Session History</h2>
              <p className="text-[12px]" style={{color: "rgba(255,255,255,0.7)"}}>Download your session history as JSON for backup or analysis.</p>
              <div className="flex gap-3">
                <button onClick={() => { exportHistory(); setShowExport(false); }} className={cn("flex-1 rounded-xl py-3 text-sm font-semibold uppercase tracking-wider transition-all min-h-[48px]", colors.accentSolid, colors.accentHover)}><Download size={16} className="mr-2" /> Export JSON</button>
                <button onClick={() => setShowExport(false)} className={cn("flex-1 rounded-xl py-3 text-sm font-semibold uppercase tracking-wider transition-all min-h-[48px]", colors.muted, colors.mutedHover)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        <Footer currentStep={step} onNavigate={(s) => { if (s === "history") setStep("history"); else if (s === "reference") setStep("esrRef"); else if (s === "settings") window.location.href = "/settings"; else setStep(s); }} />

        {showInstallPrompt && (
          <div className="fixed bottom-24 left-4 right-4 max-w-xl mx-auto animate-in slide-in-from-bottom-2 duration-300 z-50">
            <div className={cn("rounded-2xl p-4", colors.accentSolid, "shadow-xl")}>
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
      <section className={cn("min-h-screen text-white", colors.bg, "pb-28")} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="max-w-xl mx-auto px-4 pt-6">
          <div className="flex items-center justify-between mb-6">
            <button onClick={goHome} className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-wider opacity-70 hover:opacity-100 transition-opacity min-h-[44px]"><ArrowLeft size={16} className="opacity-70" /> Back</button>
            <h1 className="text-2xl font-serif font-bold">Session History</h1>
            <button onClick={() => { if (confirm("Clear all history?")) { setHistory([]); localStorage.removeItem("selfWorkHistory"); haptic("heavy"); } }} className="p-2 rounded opacity-50 hover:opacity-100"><Trash2 size={16} /></button>
          </div>
          {history.length === 0 ? (
            <div className={cn("rounded-2xl p-8 text-center", colors.card, colors.border)}>
              <History size={48} className="mx-auto mb-3" style={{color: "rgba(255,255,255,0.3)"}} />
              <p className="text-[13px]" style={{color: "rgba(255,255,255,0.5)"}}>No sessions yet. Start your first integration.</p>
              <button onClick={goHome} className="mt-4" style={{color: "rgba(255,215,100,1)"}}>← Begin Integration</button>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((log) => (
                <article key={log.id} className={cn("rounded-xl p-4 transition-all", colors.card, colors.border)}>
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

  // REFERENCE PAGES
  if (step === "esrRef") return <RefPage title="ESR Indicator Check" icon={<Zap size={20} />} content={esrContent} onBack={goHome} colors={colors} onNavigate={(s: any) => { if (s === "settings") window.location.href = "/settings"; else setStep(s); }} />;
  if (step === "organRef") return <RefPage title="Emotion → Organ Map" icon={<Sparkles size={20} />} content={organRefContent} onBack={goHome} colors={colors} onNavigate={(s: any) => { if (s === "settings") window.location.href = "/settings"; else setStep(s); }} />;
  if (step === "eyeRef") return <RefPage title="NLP Eye Positions" icon={<Eye size={20} />} content={eyeRefContent} onBack={goHome} colors={colors} onNavigate={(s: any) => { if (s === "settings") window.location.href = "/settings"; else setStep(s); }} />;

  // INTEGRATION FLOW
  return (
    <section className={cn("min-h-screen text-white overflow-x-hidden", colors.bg, "pb-28")} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <header className="fixed top-0 left-0 right-0 z-20 px-4 py-3 flex items-center justify-between border-b" style={{borderColor: "rgba(255,255,255,0.08)", background: "linear-gradient(to bottom, rgba(12,10,9,0.95), transparent)"}}>
        <button onClick={goBack} className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-wider opacity-70 hover:opacity-100 transition-opacity min-h-[44px]" aria-label="Back"><ArrowLeft size={16} className="opacity-70" /><span className="hidden sm:inline">Back</span></button>
        <h1 className="text-lg font-serif font-bold">Emotional Integration</h1>
        <button onClick={() => { haptic(); setStep("history"); }} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors" aria-label="History"><History size={18} className={colors.amberBright} /></button>
      </header>

      <main className="pt-16 pb-28 px-4 sm:px-6 max-w-2xl mx-auto">
        <div className="mb-6 flex items-center justify-center gap-1">
          {["timelineSelect", "emotionSelect", "organSelect", "eyeSelect", "result"].map((s, i) => (
            <div key={s} className={cn("w-2 h-2 rounded-full transition-all", step === s || (step === "result-saved" && i < 4) ? "bg-amber-400" : "bg-white/10")} />
          ))}
        </div>

        {step === "timelineSelect" && (
          <StepCard title="Identify Timeline" subtitle="Is this emotional stress current or historic?">
            <div className="grid grid-cols-1 gap-3">
              <button onClick={() => { haptic(); setTimeline('Current'); setStep("emotionSelect"); }} className={cn("rounded-xl p-4 text-left transition-all min-h-[56px]", colors.accent, colors.accentHover)}>
                <div className="font-medium">Current</div>
                <div className="text-[11px] mt-0.5" style={{color: "rgba(255,215,100,0.9)"}}>Known stress or pattern</div>
              </button>
              <button onClick={() => { haptic(); setTimeline('Historic'); setStep("timelineAge"); }} className={cn("rounded-xl p-4 text-left transition-all min-h-[56px]", colors.muted, colors.mutedHover)}>
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
              <button onClick={() => setStep("timelineSelect")} className={cn("flex-1 rounded-xl py-3 px-4 text-sm font-medium uppercase tracking-wider transition-all min-h-[48px]", colors.muted, colors.mutedHover)}>Back</button>
              <button disabled={!age} onClick={() => { setTimeline('Historic'); setStep("emotionSelect"); }} className={cn("flex-[2] rounded-xl py-3 px-4 text-sm font-medium uppercase tracking-wider transition-all min-h-[48px]", colors.accentSolid, colors.accentHover, !age && "opacity-50")}>Continue</button>
            </div>
          </StepCard>
        )}

        {step === "emotionSelect" && (
          <StepCard title="Primary Emotion" subtitle="Challenge for the priority emotion.">
            <div className="grid grid-cols-1 gap-2">
              {PRIMARY_EMOTIONS.map((e) => (
                <button key={e.id} onClick={() => { haptic(); setEmotion(e); setOrgan(""); setStep("organSelect"); }} className={cn("rounded-xl p-3 flex items-center gap-3 text-left transition-all min-h-[52px]", emotion?.id === e.id ? colors.accent : colors.card, colors.border, "hover:bg-white/10")}>
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white", "bg-amber-500", e.color)}><Heart size={14} className="fill-current" /></div>
                  <div><span className="font-medium text-sm">{e.label}</span><span className="text-[10px] block mt-0.5" style={{color: "rgba(255,215,100,0.9)"}}>{e.element} Element</span></div>
                </button>
              ))}
            </div>
          </StepCard>
        )}

        {step === "organSelect" && (
          <StepCard title="Primary Emotion" subtitle="Challenge for the priority emotion.">
            <div className="grid grid-cols-1 gap-2">
              {PRIMARY_EMOTIONS.map((e) => (
                <button key={e.id} onClick={() => { haptic(); setEmotion(e); setOrgan(""); setStep("eyeSelect"); }} className={cn("rounded-xl p-3 flex items-center gap-3 text-left transition-all min-h-[52px]", emotion?.id === e.id ? colors.accent : colors.card, colors.border, "hover:bg-white/10")}>
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white", "bg-amber-500", e.color)}><Heart size={14} className="fill-current" /></div>
                  <div><span className="font-medium text-sm">{e.label}</span><span className="text-[10px] block mt-0.5" style={{color: "rgba(255,215,100,0.9)"}}>{e.element} Element</span></div>
                </button>
              ))}
            </div>
          </StepCard>
        )}

        {step === "eyeSelect" && emotion && !organ && (
          <StepCard title={`Emotion: ${emotion.label}`} subtitle="Select the priority organ holding this emotion:">
            <div className="grid grid-cols-2 gap-2">
              {emotion.organs?.map((org: string) => (
                <button key={org} onClick={() => { haptic(); setOrgan(org); setStep("eyeSelect"); }} className={cn("rounded-xl py-3 px-4 text-sm font-medium uppercase tracking-wider transition-all min-h-[48px]", colors.accent, colors.accentHover)}>{org}</button>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-center" style={{color: "rgba(255,215,100,0.5)"}}><em>Tap an organ to continue</em></p>
          </StepCard>
        )}

        {step === "eyeSelect" && emotion && organ && (
          <StepCard title={`Organ: ${organ}`} subtitle={`Emotion: ${emotion.label} — Choose eye position:`}>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => { haptic(); setEyePos("default"); setStep("result"); }} className={cn("rounded-xl py-3 px-4 text-sm font-medium uppercase tracking-wider transition-all min-h-[48px]", colors.accent, colors.accentHover)}>Default / Natural</button>
              <button onClick={() => { haptic(); setEyePos("up"); setStep("result"); }} className={cn("rounded-xl py-3 px-4 text-sm font-medium uppercase tracking-wider transition-all min-h-[48px]", colors.accent, colors.accentHover)}>Look Up</button>
              <button onClick={() => { haptic(); setEyePos("down"); setStep("result"); }} className={cn("rounded-xl py-3 px-4 text-sm font-medium uppercase tracking-wider transition-all min-h-[48px]", colors.accent, colors.accentHover)}>Look Down</button>
            </div>
          </StepCard>
        )}

        {step === "result" && emotion && organ && (
          <StepCard title="Integration Complete" subtitle="Note shifts in awareness, emotion, or physical sensation." className="text-center">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{background: "rgba(255,215,100,0.15)"}}><Heart size={32} className={colors.amberBright} /></div>
            <p className="text-[12px] mb-6" style={{color: "rgba(255,215,100,0.6)"}}>Emotion: <span className="font-medium">{emotion.label}</span> · Organ: <span className="font-medium">{organ}</span> · Eye: <span className="font-medium">{eyePos}</span></p>
            <button onClick={() => { haptic("medium"); const log = { id: crypto.randomUUID(), timestamp: Date.now(), emotion: emotion.label, organ, eyePos: eyePos }; saveToHistory(log); setStep("result-saved"); }} className={cn("w-full rounded-xl px-6 py-3.5 text-sm font-semibold uppercase tracking-wider transition-all min-h-[48px]", colors.accentSolid, colors.accentHover)}>Save to Session Log</button>
          </StepCard>
        )}

        {step === "result-saved" && (
          <StepCard title="Saved ✅" subtitle="Your session has been logged to history." className="text-center">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-amber-600/20"><Heart size={32} className={colors.amberBright} /></div>
            <p className="text-[13px] mb-6" style={{color: "rgba(255,255,255,0.6)"}}>Emotional integration complete. ESR re-checked.</p>
            <button onClick={goHome} className={cn("w-full rounded-xl px-6 py-3.5 text-sm font-semibold uppercase tracking-wider transition-all min-h-[48px]", colors.accentSolid, colors.accentHover)}>Another Session</button>
            <button onClick={() => { haptic(); setStep("history"); }} className="mt-3 w-full rounded-xl py-3 px-4 text-sm font-medium uppercase tracking-wider transition-all min-h-[48px] bg-white/10 border border-white/20 hover:bg-white/15">View History</button>
          </StepCard>
        )}
      </main>
      <Footer currentStep={step} onNavigate={navigateFooter} />
    </section>
  );
}



function RefPage({ title, icon, content, onBack, colors, onNavigate }: { title: string; icon: React.ReactNode; content: React.ReactNode; onBack: () => void; colors: any; onNavigate: (step: Step | "settings") => void }) {
  return (
    <section className={cn("min-h-screen text-white", colors.bg, "pb-28")}>
      <div className="max-w-xl mx-auto px-4 pt-6">
        <div className="flex items-center justify-between mb-6"><button onClick={onBack} className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-wider opacity-70 hover:opacity-100 transition-opacity min-h-[44px]"><ArrowLeft size={16} className="opacity-70" /> Back</button><h1 className="text-lg font-serif font-bold">{title}</h1><div className="w-24" /></div>
        <div className={cn("rounded-2xl p-5", colors.card, colors.border)}>{content}</div>
      </div>
      <Footer currentStep={step} onNavigate={onNavigate} />
    </section>
  );
}