import { useState, useEffect, useCallback, useRef } from "react";
import { Heart, Info, ChevronLeft, History, Eye, Zap, Sparkles, Brain, Settings, X, Save, Trash2, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRIMARY_EMOTIONS, EYE_POSITIONS } from "@/data/emotion-data";

type Step = "home" | "organSelect" | "eyeSelect" | "result" | "result-saved" | "history" | "esrRef" | "organRef" | "eyeRef";

interface SessionLog {
  id: string;
  timestamp: number;
  emotion: string;
  organ: string;
  eyePos: string;
  timeline?: string;
  age?: string;
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
    try {
      const stored = localStorage.getItem("selfWorkHistory");
      if (stored) setHistory(JSON.parse(stored));
    } catch {}
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
      if (["organSelect", "eyeSelect", "result"].includes(step)) setStep("home");
      else if (["history", "esrRef", "organRef", "eyeRef"].includes(step)) setStep("home");
    }
  };

  const goHome = useCallback(() => { haptic("light"); setStep("home"); }, []);
  const goBack = useCallback(() => { haptic("light"); if (["organSelect", "eyeSelect", "result"].includes(step)) setStep("home"); else setStep("home"); }, [step]);

  // Reference content
  const esrContent = (
    <div className="space-y-4">
      <h3 className="text-lg font-serif font-semibold flex items-center gap-2"><Heart size={20} className={colors.amberBright} /> ESR Indicator Check</h3>
      <div className={cn("rounded-xl p-4", colors.card, colors.border)}>
        <p className="text-[13px] leading-relaxed" style={{color: "rgba(255,255,255,0.85)"}}>Hold <strong>GB14 (forehead)</strong> ESR points bilaterally.</p>
        <div className="mt-3 grid grid-cols-2 gap-3 text-[12px]">
          <div className={cn("rounded-lg p-3", colors.card, colors.border)}><span className={colors.amberBright} font-medium>Inhibits</span> → Indicator muscle goes weak</div>
          <div className={cn("rounded-lg p-3", colors.card, colors.border)}><span className={colors.emerald} font-medium>Locks</span> → Weak muscle becomes strong</div>
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
      <section className={cn("min-h-screen text-white", colors.bg, "pb-20")} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="max-w-xl mx-auto px-4 pt-6">
          <div className="mb-8 animate-in fade-in slide-in-from-top-2 duration-300">
            <h1 className="text-3xl font-serif font-bold tracking-wider">Self Work</h1>
            <p className="text-[12px] font-medium uppercase tracking-widest mt-1" style={{color: "rgba(255,255,255,0.4)"}}>Emotional Integration</p>
          </div>

          <div className="space-y-3">
            <article className={cn("rounded-2xl p-5 transition-all", colors.card, colors.border, colors.cardHover)}>
              <h2 className="text-base font-serif font-semibold mb-2 flex items-center gap-2"><Heart size={18} className={colors.amberBright} /> ESR Indicator Check</h2>
              <p className="text-[12px] leading-relaxed" style={{color: "rgba(255,255,255,0.85)"}}>Hold <strong>GB14 (forehead)</strong> ESR points. If indicator muscle <span className={cn("underline", colors.amberBright)}>inhibits</span> or weak muscle <span className={cn("underline", colors.emerald)}>locks</span> → emotional integration indicated.</p>
            </article>

            <article className={cn("rounded-2xl p-5", colors.card, colors.border)}>
              <h2 className="text-base font-serif font-semibold mb-2 flex items-center gap-2"><Sparkles size={18} className={colors.amberBright} /> Quick Flow</h2>
              <ol className="text-[12px] space-y-1.5" style={{color: "rgba(255,255,255,0.7)"}}>
                <li className="flex items-center gap-2"><span className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center text-[10px] font-medium">1</span>Permission? No → Harmonic Rocking</li>
                <li className="flex items-center gap-2"><span className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center text-[10px] font-medium">2</span>Timeline: Current or Historic (age regression)</li>
                <li className="flex items-center gap-2"><span className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center text-[10px] font-medium">3</span>Primary Emotion (5 elements)</li>
                <li className="flex items-center gap-2"><span className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center text-[10px] font-medium">4</span>Priority Organ (linked to emotion)</li>
                <li className="flex items-center gap-2"><span className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center text-[10px] font-medium">5</span>Eye Position → Re-check ESR</li>
              </ol>
            </article>
          </div>

          {/* MAIN CTA - EMOTIONS BUTTON */}
          <button onClick={() => { haptic(); setStep("organSelect"); }} className={cn("mt-6 w-full rounded-2xl py-5 px-6 text-base font-semibold uppercase tracking-wider transition-all min-h-[56px]", colors.accentSolid, colors.accentHover)}>
            <Heart size={20} className="inline mr-2" /> Start Emotional Integration
          </button>

          {/* Secondary actions */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button onClick={() => { haptic(); setStep("history"); }} className={cn("rounded-2xl py-4 px-6 text-sm font-semibold uppercase tracking-wider transition-all min-h-[52px]", colors.muted, colors.mutedHover)}>
              <History size={16} className="mr-2" /> Session History
            </button>
          </div>

          {/* Reference shortcuts */}
          <div className="mt-6 grid grid-cols-3 gap-2">
            <button onClick={() => { haptic(); setStep("esrRef"); }} className={cn("rounded-xl py-3 px-2 text-[11px] font-medium transition-all", colors.muted, colors.mutedHover)}><Zap size={14} className="mx-auto mb-1" /> ESR</button>
            <button onClick={() => { haptic(); setStep("organRef"); }} className={cn("rounded-xl py-3 px-2 text-[11px] font-medium transition-all", colors.muted, colors.mutedHover)}><Sparkles size={14} className="mx-auto mb-1" /> Organs</button>
            <button onClick={() => { haptic(); setStep("eyeRef"); }} className={cn("rounded-xl py-3 px-2 text-[11px] font-medium transition-all", colors.muted, colors.mutedHover)}><Eye size={14} className="mx-auto mb-1" /> Eyes</button>
          </div>
        </div>

        {showInstallPrompt && (
          <div className="fixed bottom-4 left-4 right-4 max-w-xl mx-auto animate-in slide-in-from-bottom-2 duration-300 z-50">
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
      <section className={cn("min-h-screen text-white", colors.bg, "pb-20")} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="max-w-xl mx-auto px-4 pt-6">
          <div className="flex items-center justify-between mb-6">
            <button onClick={goHome} className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-wider opacity-70 hover:opacity-100 transition-opacity min-h-[44px]"><ArrowLeft size={16} className="opacity-70" /> Back</button>
            <h1 className="text-2xl font-serif font-bold">Session History</h1>
            <div className="w-24" />
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
                      {log.timeline && log.age && <p className="text-[10px] mt-1" style={{color: "rgba(255,215,100,0.6)"}}>{log.timeline} — Age {log.age}</p>}
                    </div>
                    <button onClick={() => { haptic(); if (confirm("Delete this session?")) setHistory(h => h.filter(x => x.id !== log.id)); }} className="p-1 rounded opacity-50 hover:opacity-100 text-[10px]"><Trash2 size={14} /></button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }

  // REFERENCE PAGES
  if (step === "esrRef") return <RefPage title="ESR Indicator Check" icon={<Zap size={20} />} content={esrContent} onBack={goHome} colors={colors} />;
  if (step === "organRef") return <RefPage title="Emotion → Organ Map" icon={<Sparkles size={20} />} content={organRefContent} onBack={goHome} colors={colors} />;
  if (step === "eyeRef") return <RefPage title="NLP Eye Positions" icon={<Eye size={20} />} content={eyeRefContent} onBack={goHome} colors={colors} />;

  // INTEGRATION FLOW: organSelect → eyeSelect → result → result-saved
  return (
    <section className={cn("min-h-screen text-white overflow-x-hidden", colors.bg)} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <header className="fixed top-0 left-0 right-0 z-20 px-4 py-3 flex items-center justify-between border-b" style={{borderColor: "rgba(255,255,255,0.08)", background: "linear-gradient(to bottom, rgba(12,10,9,0.95), transparent)"}}>
        <button onClick={goBack} className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-wider opacity-70 hover:opacity-100 transition-opacity min-h-[44px]" aria-label="Back"><ArrowLeft size={16} className="opacity-70" /><span className="hidden sm:inline">Back</span></button>
        <h1 className="text-lg font-serif font-bold">Emotional Integration</h1>
        <button onClick={() => { haptic(); setStep("history"); }} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors" aria-label="History"><History size={18} className={colors.amberBright} /></button>
      </header>

      <main className="pt-16 pb-24 px-4 sm:px-6 max-w-2xl mx-auto">
        <div className="mb-6 flex items-center justify-center gap-1">
          {["organSelect", "eyeSelect", "result"].map((s, i) => (
            <div key={s} className={cn("w-2 h-2 rounded-full transition-all", step === s || (step === "result-saved" && i < 2) ? "bg-amber-400" : "bg-white/10")} />
          ))}
        </div>

        {/* STEP 1: SELECT EMOTION + ORGAN */}
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

        {/* STEP 2: SELECT ORGAN */}
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

        {/* STEP 3: EYE POSITION */}
        {step === "eyeSelect" && emotion && organ && (
          <StepCard title={`Organ: ${organ}`} subtitle={`Emotion: ${emotion.label} — Choose eye position:`}>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => { haptic(); setEyePos("default"); setStep("result"); }} className={cn("rounded-xl py-3 px-4 text-sm font-medium uppercase tracking-wider transition-all min-h-[48px]", colors.accent, colors.accentHover)}>Default / Natural</button>
              <button onClick={() => { haptic(); setEyePos("up"); setStep("result"); }} className={cn("rounded-xl py-3 px-4 text-sm font-medium uppercase tracking-wider transition-all min-h-[48px]", colors.accent, colors.accentHover)}>Look Up</button>
              <button onClick={() => { haptic(); setEyePos("down"); setStep("result"); }} className={cn("rounded-xl py-3 px-4 text-sm font-medium uppercase tracking-wider transition-all min-h-[48px]", colors.accent, colors.accentHover)}>Look Down</button>
            </div>
          </StepCard>
        )}

        {/* STEP 4: RESULT */}
        {step === "result" && emotion && organ && (
          <StepCard title="Integration Complete" subtitle="Note shifts in awareness, emotion, or physical sensation." className="text-center">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{background: "rgba(255,215,100,0.15)"}}><Heart size={32} className={colors.amberBright} /></div>
            <p className="text-[12px] mb-6" style={{color: "rgba(255,215,100,0.6)"}}>Emotion: <span className="font-medium">{emotion.label}</span> · Organ: <span className="font-medium">{organ}</span> · Eye: <span className="font-medium">{eyePos}</span></p>
            <button onClick={() => { haptic("medium"); const log = { id: crypto.randomUUID(), timestamp: Date.now(), emotion: emotion.label, organ, eyePos: eyePos }; saveToHistory(log); setStep("result-saved"); }} className={cn("w-full rounded-xl px-6 py-3.5 text-sm font-semibold uppercase tracking-wider transition-all min-h-[48px]", colors.accentSolid, colors.accentHover)}>Save to Session Log</button>
          </StepCard>
        )}

        {/* STEP 5: SAVED */}
        {step === "result-saved" && (
          <StepCard title="Saved ✅" subtitle="Your session has been logged to history." className="text-center">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-amber-600/20"><Heart size={32} className={colors.amberBright} /></div>
            <p className="text-[13px] mb-6" style={{color: "rgba(255,255,255,0.6)"}}>Emotional integration complete. ESR re-checked.</p>
            <button onClick={goHome} className={cn("w-full rounded-xl px-6 py-3.5 text-sm font-semibold uppercase tracking-wider transition-all min-h-[48px]", colors.accentSolid, colors.accentHover)}>Another Session</button>
            <button onClick={() => { haptic(); setStep("history"); }} className="mt-3 w-full rounded-xl py-3 px-4 text-sm font-medium uppercase tracking-wider transition-all min-h-[48px] bg-white/10 border border-white/20 hover:bg-white/15">View History</button>
          </StepCard>
        )}
      </main>
    </section>
  );
}

function StepCard({ title, subtitle, children, className = "" }: { title: string; subtitle: string; children: React.ReactNode; className?: string }) {
  const c = { card: "bg-white/5 backdrop-blur-sm", border: "border-white/10" };
  return <div className={cn("rounded-2xl p-5", c.card, c.border, className)}><div className="mb-4"><h2 className="text-xl font-serif font-bold mb-1">{title}</h2><p className="text-[12px]" style={{color: "rgba(255,255,255,0.5)"}}>{subtitle}</p></div>{children}</div>;
}

function RefPage({ title, icon, content, onBack, colors }: { title: string; icon: React.ReactNode; content: React.ReactNode; onBack: () => void; colors: any }) {
  return (
    <section className={cn("min-h-screen text-white", colors.bg, "pb-20")} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="max-w-xl mx-auto px-4 pt-6">
        <div className="flex items-center justify-between mb-6"><button onClick={onBack} className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-wider opacity-70 hover:opacity-100 transition-opacity min-h-[44px]"><ArrowLeft size={16} className="opacity-70" /> Back</button><h1 className="text-lg font-serif font-bold">{title}</h1><div className="w-24" /></div>
        <div className={cn("rounded-2xl p-5", colors.card, colors.border)}>{content}</div>
      </div>
    </section>
  );
}