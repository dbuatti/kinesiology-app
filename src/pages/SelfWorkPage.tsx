import { useState } from "react";
import { Heart, Info, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRIMARY_EMOTIONS } from "@/data/emotion-data";

export default function SelfWorkPage() {
  const [step, setStep] = useState<"reference" | "organSelect" | "eyeSelect" | "result" | "result-saved">("reference");
  const [emotion, setEmotion] = useState<any>(null);
  const [organ, setOrgan] = useState<string>("");
  const [eyePos, setEyePos] = useState<string>("");

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
    text: "text-white",
    textMuted: "text-white/60",
    textDim: "text-white/40",
    amber: "text-amber-300",
    amberBright: "text-amber-400",
    emerald: "text-emerald-400",
  };

  const goBack = () => setStep("reference");

  if (step === "reference") {
    return (
      <section className={cn("min-h-screen text-white", colors.bg, "p-4 sm:p-6 pb-20")}>
        <div className="max-w-xl mx-auto">
          <header className="flex items-center justify-between mb-10 animate-in fade-in slide-in-from-top-2 duration-300">
            <div>
              <h1 className="text-3xl font-serif font-bold tracking-wider">Self Work</h1>
              <p className="text-[12px] font-medium uppercase tracking-widest mt-1" style={{color: "rgba(255,255,255,0.4)"}}>Emotional Integration Reference</p>
            </div>
            <button
              onClick={() => alert("ESR Check: Hold GB14 (forehead). If indicator muscle inhibits or weak muscle locks → emotional work indicated.\n\nPermission: Always ask. If denied → Harmonic Rocking first.\n\nTimeline: Current (known) or Historic (age regression).\n\nEmotion → Organ → Eye Position → Re-check ESR.")}
              className="rounded-xl bg-white/10 p-2 hover:bg-white/20 transition-colors"
              aria-label="Quick reference"
            >
              <Info size={20} className="text-amber-400" />
            </button>
          </header>

          <div className="space-y-3">
            <article className={cn("rounded-2xl p-5 transition-all", colors.card, colors.border, colors.cardHover)}>
              <h2 className="text-base font-serif font-semibold mb-2 flex items-center gap-2">
                <Heart size={18} className={colors.amberBright} />
                ESR Indicator Check
              </h2>
              <p className="text-[12px] leading-relaxed" style={{color: "rgba(255,255,255,0.8)"}}>
                Hold <strong>GB14 (forehead)</strong> ESR points. If indicator muscle <span className={cn("underline", colors.amberBright)}>inhibits</span> or weak muscle <span className={cn("underline", colors.emerald)}>locks</span> → emotional integration indicated.
              </p>
            </article>

            <article className={cn("rounded-2xl p-5", colors.card, colors.border)}>
              <h2 className="text-base font-serif font-semibold mb-2 flex items-center gap-2">
                <Heart size={18} className={colors.amberBright} />
                Flow
              </h2>
              <ol className="text-[12px] space-y-1.5" style={{color: "rgba(255,255,255,0.7)"}}>
                <li className="flex items-center gap-2"><span className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center text-[10px] font-medium">1</span>Permission to correct? No → Harmonic Rocking</li>
                <li className="flex items-center gap-2"><span className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center text-[10px] font-medium">2</span>Timeline: Current or Historic (age regression)</li>
                <li className="flex items-center gap-2"><span className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center text-[10px] font-medium">3</span>Primary Emotion (5 elements)</li>
                <li className="flex items-center gap-2"><span className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center text-[10px] font-medium">4</span>Priority Organ (linked to emotion)</li>
                <li className="flex items-center gap-2"><span className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center text-[10px] font-medium">5</span>Eye Position → Re-check ESR</li>
              </ol>
            </article>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => setStep("organSelect")}
              className={cn("rounded-2xl py-4 px-6 text-sm font-semibold uppercase tracking-wider transition-all min-h-[52px]", colors.accent, colors.accentHover)}
            >
              Start Integration
            </button>
            <a
              href="/settings"
              className={cn("rounded-2xl py-4 px-6 text-sm font-semibold uppercase tracking-wider transition-all min-h-[52px] flex items-center justify-center", colors.muted, colors.mutedHover)}
            >
              Back to Settings
            </a>
          </div>
        </div>
      </section>
    );
  }

  // Integration flow (organ → eye → save)
  return (
    <section className={cn("min-h-screen text-white overflow-x-hidden", colors.bg)}>
      <header className="fixed top-0 left-0 right-0 z-20 px-4 py-3 flex items-center justify-between border-b" style={{borderColor: "rgba(255,255,255,0.08)", background: "linear-gradient(to bottom, rgba(12,10,9,0.9), transparent)"}}>
        <button
          onClick={goBack}
          className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-wider opacity-70 hover:opacity-100 transition-opacity min-h-[44px]"
          aria-label="Back"
        >
          <ChevronLeft size={16} className="opacity-70" />
          <span className="hidden sm:inline">Back</span>
        </button>
        <h1 className="text-lg font-serif font-bold">Emotional Integration</h1>
        <div className="w-10" />
      </header>

      <main className="pt-16 pb-24 px-4 sm:px-6 max-w-2xl mx-auto">
        {/* Progress dots */}
        <div className="mb-6 flex items-center justify-center gap-1">
          {["organSelect", "eyeSelect", "result"].map((s, i) => (
            <div
              key={s}
              className={cn("w-2 h-2 rounded-full transition-all", step === s || (step === "result-saved" && i < 2) ? "bg-amber-400" : "bg-white/10")}
            />
          ))}
        </div>

        {step === "organSelect" && (
          <StepCard title="Select Primary Emotion" subtitle="Challenge for the priority emotion, then pick the linked organ.">
            <div className="grid grid-cols-1 gap-2">
              {PRIMARY_EMOTIONS.map((e) => (
                <button
                  key={e.id}
                  onClick={() => { setEmotion(e); setOrgan(""); setStep("eyeSelect"); }}
                  className={cn(
                    "rounded-xl p-3 flex items-center gap-3 text-left transition-all min-h-[52px]",
                    emotion?.id === e.id ? colors.accent : colors.card,
                    colors.border,
                    "hover:bg-white/10"
                  )}
                >
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white", "bg-amber-500", e.color)}>
                    <Heart size={14} className="fill-current" />
                  </div>
                  <div>
                    <span className="font-medium text-sm">{e.label}</span>
                    <span className="text-[10px] block mt-0.5" style={{color: "rgba(255,215,100,0.9)"}}>{e.element} Element</span>
                  </div>
                </button>
              ))}
            </div>
          </StepCard>
        )}

        {step === "eyeSelect" && emotion && (
          <StepCard title={`Organ: ${organ || "Select organ first"}`} subtitle={`Emotion: ${emotion.label} — Choose eye position:`}>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { setEyePos("default"); setStep("result"); }}
                className={cn("rounded-xl py-3 px-4 text-sm font-medium uppercase tracking-wider transition-all min-h-[48px]", colors.accent, colors.accentHover)}
              >
                Default / Natural
              </button>
              <button
                onClick={() => { setEyePos("up"); setStep("result"); }}
                className={cn("rounded-xl py-3 px-4 text-sm font-medium uppercase tracking-wider transition-all min-h-[48px]", colors.accent, colors.accentHover)}
              >
                Look Up
              </button>
              <button
                onClick={() => { setEyePos("down"); setStep("result"); }}
                className={cn("rounded-xl py-3 px-4 text-sm font-medium uppercase tracking-wider transition-all min-h-[48px]", colors.accent, colors.accentHover)}
              >
                Look Down
              </button>
            </div>
          </StepCard>
        )}

        {step === "result" && emotion && organ && (
          <StepCard title="Integration Complete" subtitle="Note shifts in awareness, emotion, or physical sensation." className="text-center">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{background: "rgba(255,215,100,0.15)"}}>
              <Heart size={32} className={colors.amberBright} />
            </div>
            <p className="text-[12px] mb-6" style={{color: "rgba(255,215,100,0.6)"}}>
              Emotion: <span className="font-medium">{emotion.label}</span> · Organ: <span className="font-medium">{organ}</span> · Eye: <span className="font-medium">{eyePos}</span>
            </p>
            <button
              onClick={() => setStep("result-saved")}
              className={cn("w-full rounded-xl px-6 py-3.5 text-sm font-semibold uppercase tracking-wider transition-all min-h-[48px]", colors.accentSolid, colors.accentHover)}
            >
              Save to Session Log
            </button>
          </StepCard>
        )}

        <div className="mt-6 text-center text-[10px]" style={{color: "rgba(255,255,255,0.3)"}}>
          <a href="/settings" className="underline hover:opacity-80 transition-opacity">← Back to Settings</a>
        </div>
      </main>
    </section>
  );
}

function StepCard({ title, subtitle, children, className = "" }: { title: string; subtitle: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl p-5", "bg-white/5", "border border-white/10", "backdrop-blur-sm", className)}>
      <div className="mb-4">
        <h2 className="text-xl font-serif font-bold mb-1">{title}</h2>
        <p className="text-[12px]" style={{color: "rgba(255,255,255,0.5)"}}>{subtitle}</p>
      </div>
      {children}
    </div>
  );
}