import { useState } from "react";
import { Heart, Info, Zap, ChevronRight, ChevronLeft, Sparkles, Brain, ShieldCheck, Eye, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRIMARY_EMOTIONS } from "@/data/emotion-data";

export default function SelfWorkPage() {
  const [step, setStep] = useState<"knowledge" | "permission" | "timeline" | "emotionSelect" | "organSelect" | "eyeSelect" | "result" | "result-saved">("knowledge");
  const [showInfo, setShowInfo] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [emotion, setEmotion] = useState<any>(null);
  const [organ, setOrgan] = useState<string>("");
  const [eyePos, setEyePos] = useState<string>("");
  const [timeline, setTimeline] = useState<'Current' | 'Historic' | null>(null);
  const [age, setAge] = useState("");
  const [months, setMonths] = useState("");

  // Knowledge steps
  const knowledgeItems = [
    { id: "esr", title: "ESR Indicator Check", detail: "Hold GB14 (forehead). A weak or inhibited muscle = emotional work indicated." },
    { id: "permission", title: "Permission to Correct", detail: "Always ask permission for deep emotional layers. If denied, perform Harmonic Rocking first to down-regulate." },
    { id: "timeline", title: "Timeline", detail: "Current (known stress) or Historic (past event/trauma). Historic requires age regression." },
    { id: "emotion", title: "Emotion → Organ → Muscle", detail: "Select primary emotion → linked organ → eye position → re-challenge ESR." },
  ];

  const goToStep = (next: "process" | "result") => setStep(next);
  const goBack = () => setStep("knowledge");

  if (step === "knowledge") {
    return (
      <section className="min-h-screen bg-[linear-gradient(135deg,#1e1b16_0%,#0f0d0a_100%)] text-white p-4 sm:p-6 lg:p-8">
        <div className="max-w-xl mx-auto">
          <header className="flex items-center justify-between mb-8 animate-in fade-in slide-in-from-top-2 duration-300">
            <div>
              <h1 className="text-3xl font-serif font-bold tracking-wider">Self Work</h1>
              <p className="text-[12px] font-medium uppercase tracking-widest opacity-60">Personal Emotional Integration</p>
            </div>
            <button
              onClick={() => setShowInfo((s) => !s)}
              className="rounded-xl bg-white/10 p-2 hover:bg-white/20 transition-colors"
              aria-label="Info"
              title="How this works"
            >
              <Info size={20} className="text-amber-400" />
            </button>
          </header>

          <div className="space-y-4">
            {knowledgeItems.map((item) => (
              <article
                key={item.id}
                className="bg-white/10 rounded-2xl border border-white/5 p-5 hover:bg-white/15 transition-all cursor-pointer group"
                onClick={() => setStep("permission")}
              >
                <h2 className="text-lg font-serif font-semibold mb-1">{item.title}</h2>
                <p className="text-[12px] opacity-60 line-clamp-2">{item.detail}</p>
              </article>
            ))}
          </div>

          <button
            onClick={() => setStep("permission")}
            className="mt-6 w-full rounded-2xl bg-amber-600/20 border border-amber-400/30 px-6 py-3 text-amber-300 text-sm font-semibold uppercase tracking-wider transition-all hover:bg-amber-600/30"
          >
            Start Emotional Integration Process
          </button>
        </div>
      </section>
    );
  }

  if (step === "permission" || step === "timeline" || step === "emotionSelect" || step === "organSelect" || step === "eyeSelect" || step === "result") {
    return (
      <section className="min-h-screen bg-[linear-gradient(135deg,#0d0a08_0%,#1a1412_100%)] text-white overflow-x-hidden relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl animate-in fade-in slide-in-from-top-1 duration-500 opacity-80 pointer-events-none"></div>

        <header className="fixed top-0 left-0 right-0 z-20 px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between border-b border-white/5 bg-gradient-to-b from-[rgba(13,10,8,0.8)] to-transparent">
          <button
            onClick={() => setStep("knowledge")}
            className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-wider opacity-70 hover:opacity-100 transition-opacity"
            aria-label="Back to knowledge"
          >
            <ChevronLeft size={16} className="opacity-70" /> Back
          </button>
          <h1 className="text-xl font-serif font-bold">Emotional Integration</h1>
        </header>

        <main className="pt-20 pb-32 sm:pt-12 lg:pt-24">
          {step === "permission" && (
            <section className="max-w-2xl mx-auto mb-10">
              <h2 className="text-2xl font-serif font-bold mb-4">1. ESR Indicator Check</h2>
              <div className="bg-white/5 rounded-2xl p-6 backdrop-blur-sm">
                <p className="text-[13px] leading-relaxed">
                  Hold ESR points (Gallbladder 14) on the forehead. If the indicator muscle <span className="text-amber-400 underline">inhibits</span>, or a weak muscle <span className="text-emerald-400 underline">locks</span>, Emotional Integration is indicated. Then press continue.
                </p>
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => setStep("permission")}
                    className="flex-1 rounded-lg bg-amber-600/20 border border-amber-400/30 px-4 py-2 text-amber-300 text-sm font-medium uppercase tracking-wider transition-all hover:bg-amber-600"
                  >
                    Permission Granted
                  </button>
                  <button
                    onClick={() => setStep("knowledge")}
                    className="flex-1 rounded-lg bg-white/10 border border-white/20 px-4 py-2 text-sm font-medium uppercase tracking-wider transition-all hover:bg-white/15"
                  >
                    Skip
                  </button>
                </div>
              </div>
            </section>
          )}

          {step === "permission" && (
            <section className="max-w-2xl mx-auto mb-10">
              <h2 className="text-2xl font-serif font-bold mb-4">2. Permission to Correct</h2>
              <div className="bg-white/5 rounded-2xl p-6 backdrop-blur-sm">
                <p className="text-[13px] leading-relaxed">
                  "This can be quite big, but it's quite quick and very powerful. Do we have permission to correct this?"
                </p>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => setStep("timeline")}
                    className="rounded-lg bg-amber-600/20 border border-amber-400/30 px-4 py-2 text-amber-300 text-sm font-medium uppercase tracking-wider w-full transition-all hover:bg-amber-600"
                  >
                    Yes, I have permission
                  </button>
                  <button
                    onClick={() => setStep("knowledge")}
                    className="rounded-lg bg-white/10 border border-white/20 px-4 py-2 text-sm font-medium uppercase tracking-wider w-full transition-all hover:bg-white/15"
                  >
                    No — down-regulate first
                  </button>
                </div>
              </div>
            </section>
          )}

          {step === "timeline" && (
            <section className="max-w-2xl mx-auto mb-10">
              <h2 className="text-2xl font-serif font-bold mb-4">3. Identify Timeline</h2>
              <div className="bg-white/5 rounded-2xl p-6 backdrop-blur-sm">
                <div className="space-y-1 mb-4">
                  <h3 className="text-sm font-medium">Current</h3>
                  <p className="text-xs opacity-60">Is this emotional stress known / current?</p>
                </div>
                <div className="grid grid-cols-1 gap-3 mt-4">
                  <button
                    onClick={() => { setTimeline('Current'); setStep('emotionSelect'); }}
                    className="rounded-lg bg-amber-600/20 border border-amber-400/30 px-6 py-3 text-amber-300 text-sm font-medium uppercase tracking-wider w-full transition-all hover:bg-amber-600 text-left"
                  >
                    <div>
                      <div className="font-medium text-sm">Current</div>
                      <div className="text-[11px] text-amber-300">Known stress or pattern</div>
                    </div>
                    <Zap size={18} className="text-amber-400 float-right" />
                  </button>
                  <button
                    onClick={() => { setTimeline('Historic'); setStep('age'); }}
                    className="rounded-lg bg-white/10 border border-white/20 px-6 py-3 text-sm font-medium uppercase tracking-wider w-full transition-all hover:bg-white/15 text-left"
                  >
                    <div>
                      <div className="font-medium text-sm">Historic</div>
                      <div className="text-[11px] text-white/60">Past event or trauma</div>
                    </div>
                    <History size={18} className="text-white/60 float-right" />
                  </button>
                </div>
              </div>
            </section>
          )}

          {step === "emotionSelect" && (
            <section className="max-w-2xl mx-auto mb-10">
              <h2 className="text-2xl font-serif font-bold mb-4">4. Primary Emotion</h2>
              <div className="grid grid-cols-1 gap-3">
                {PRIMARY_EMOTIONS.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => {
                      setEmotion(e);
                      setOrgan("");
                      setEyePos("");
                      setStep("organSelect");
                    }}
                    className={cn(
                      "rounded-lg px-4 py-3 text-sm font-medium uppercase tracking-wider group transition-all hover:bg-white/15",
                      "bg-white/10 border border-white/20",
                      emotion?.id === e.id && "bg-amber-600/20 border-amber-400/30"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center text-white",
                        "bg-amber-500",
                        e.color
                      )}>
                        <Heart size={14} className="fill-current" />
                      </div>
                      <div>
                        <span className="font-medium text-sm">{e.label}</span>
                        <span className="text-[10px] text-amber-300">{e.element} Element</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {step === "organSelect" && emotion && (
            <section className="max-w-2xl mx-auto mb-10">
              <h2 className="text-2xl font-serif font-bold mb-4">5. Priority Organ</h2>
              <div className="bg-white/5 rounded-2xl p-6 backdrop-blur-sm">
                <p className="text-[13px] leading-relaxed mb-4">
                  Which organ is holding the <span className="text-amber-400 font-medium">{emotion.label}</span>?
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {emotion.organs?.map((org: string) => (
                    <button
                      key={org}
                      onClick={() => { setOrgan(org); setStep("eyeSelect"); }}
                      className="rounded-lg bg-amber-600/20 border border-amber-400/30 px-4 py-2 text-sm font-medium uppercase tracking-wider w-full transition-all hover:bg-amber-600"
                    >
                      {org}
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-[11px] text-amber-400/60">
                  <em>Tap an organ to continue.</em>
                </p>
              </div>
            </section>
          )}

          {step === "eyeSelect" && organ && (
            <section className="max-w-2xl mx-auto mb-10">
              <h2 className="text-2xl font-serif font-bold mb-4">6. Eye Position</h2>
              <div className="bg-white/5 rounded-2xl p-6 backdrop-blur-sm">
                <p className="text-[13px] leading-relaxed mb-4">
                  Select the eye position associated with {emotion.label}:
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => { setEyePos("default"); setStep("result"); }}
                    className="rounded-lg bg-amber-600/20 border border-amber-400/30 px-4 py-2 text-sm font-medium uppercase tracking-wider w-full transition-all hover:bg-amber-600"
                  >
                    Default / Natural
                  </button>
                  <button
                    onClick={() => { setEyePos("up"); setStep("result"); }}
                    className="rounded-lg bg-amber-600/20 border border-amber-400/30 px-4 py-2 text-sm font-medium uppercase tracking-wider w-full transition-all hover:bg-amber-600"
                  >
                    Look Up
                  </button>
                  <button
                    onClick={() => { setEyePos("down"); setStep("result"); }}
                    className="rounded-lg bg-amber-600/20 border border-amber-400/30 px-4 py-2 text-sm font-medium uppercase tracking-wider w-full transition-all hover:bg-amber-600"
                  >
                    Look Down
                  </button>
                </div>
              </div>
            </section>
          )}

          {step === "result" && (
            <section className="max-w-2xl mx-auto text-center p-8">
              <h2 className="text-3xl font-serif font-bold mb-2">Integration Complete</h2>
              <p className="text-[13px] text-amber-300/60 mb-6 leading-relaxed">
                Emotional Integration processed. Note any shifts in awareness, emotion, or physical sensation.
              </p>
              <div className="text-4xl font-serif font-bold text-amber-300 mb-2">
                {timeline && age ? `${timeline} — Age ${age}` : "—"}
              </div>
              <p className="text-[12px] text-amber-400/60 mb-6">
                ESR re-checked. Note any inhibition or release.
              </p>
              <button
                onClick={() => {
                  const summary = `Emotional Integration: ${emotion?.label || ""} (${organ || ""}, ${timeline || ""} ${age || ""}) | Eye: ${eyePos || ""}`;
                  setResult(summary);
                  setStep("result-saved");
                }}
                className="mt-6 rounded-2xl bg-amber-600 px-6 py-3 text-white text-sm font-semibold uppercase tracking-wider transition-all hover:bg-amber-500"
              >
                Save to Session Log
              </button>

              {step === "result-saved" && (
                <p className="mt-4 text-[12px] text-amber-400/60">
                  ✅ Saved. You can close this page and return to settings.
                </p>
              )}
            </section>
          )}
        </main>
      </section>
    );
  }

  if (step === "result-saved") {
    return (
      <section className="min-h-screen bg-[linear-gradient(135deg,#1e1b16_0%,#0f0d0a_100%)] text-white flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="rounded-2xl bg-amber-950/80 border border-amber-500/30 p-8 text-center backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Heart size={48} className="text-amber-400 mb-4 animate-bounce" />
          <h1 className="text-4xl font-serif font-bold mb-2">Saved ✅</h1>
          <p className="text-[13px] text-amber-400/60 mb-6">
            Your emotional integration session has been logged.
          </p>
          <button
            onClick={() => setStep("knowledge")}
            className="rounded-lg bg-amber-600 px-6 py-3 text-white text-sm font-semibold uppercase tracking-wider transition-all hover:bg-amber-500"
          >
            Another Session
          </button>
          <a
            href="/settings"
            className="mt-4 inline-flex items-center gap-2 text-sm text-amber-300/60 underline hover:text-amber-200 transition-colors"
          >
            ← Back to Settings
          </a>
        </div>
      </section>
    );
  }

  return null;
}