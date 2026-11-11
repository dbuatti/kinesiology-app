import { useState, useEffect, useRef, useCallback } from "react";
import { Heart, Wind, Play, Pause, RotateCcw, ArrowRight, CheckCircle2, Plus, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Breath Recovery Exercise (FNH Phase E · Embed) ──────────────────────────
// Guided nasal-breathing protocol to rebuild a low BOLT score:
// Settle 30s → gentle air hunger 3–4 min → optional small holds → wind down 1 min.
// Gentle reduced breathing only — never forced big breaths, never straining.

type PhaseKey = "settle" | "airHunger" | "holds" | "windDown";

const PHASES: { key: PhaseKey; title: string; subtitle: string; secs: number }[] = [
  { key: "settle", title: "Settle", subtitle: "Easy nasal breathing — let the system settle.", secs: 30 },
  { key: "airHunger", title: "Gentle Air Hunger", subtitle: "Slow and quieten the breath until a slight, comfortable air hunger.", secs: 180 },
  { key: "holds", title: "Small Holds (Optional)", subtitle: "After a gentle exhale, hold only until a mild urge — then recover.", secs: 0 },
  { key: "windDown", title: "Wind Down", subtitle: "Easy, quiet nasal breathing to finish.", secs: 60 },
];

const HOLD_RECOVER_SECS = 20;
const HOLD_ROUNDS = 3;

const C = {
  card: "bg-white/[0.03] backdrop-blur-md border-white/[0.03]",
  border: "border-white/[0.04]",
  accent: "bg-emerald-300/15 border-emerald-300/20 text-emerald-200",
  accentSolid: "bg-emerald-300 text-[#07120D]",
  muted: "bg-white/[0.04] border-white/[0.06] text-white/60",
};

function fmt(totalSecs: number) {
  const m = Math.floor(totalSecs / 60);
  const s = totalSecs % 60;
  return m > 0 ? `${m}:${String(s).padStart(2, "0")}` : `${s}s`;
}

interface Props {
  onSave: (organSummary: string) => void;
  onDone: () => void;
}

export default function BreathRecoveryTool({ onSave, onDone }: Props) {
  const [started, setStarted] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [secsLeft, setSecsLeft] = useState(PHASES[0].secs);
  const [phaseTotal, setPhaseTotal] = useState(PHASES[0].secs);
  const [running, setRunning] = useState(false);
  const [boltBefore, setBoltBefore] = useState("");
  const [boltAfter, setBoltAfter] = useState("");
  const [saved, setSaved] = useState(false);
  // Holds state machine
  const [holdRound, setHoldRound] = useState(1);
  const [holding, setHolding] = useState(false);
  const [holdSecs, setHoldSecs] = useState(0);
  const [recoverLeft, setRecoverLeft] = useState(0);
  const wakeLock = useRef<{ release: () => void } | null>(null);

  const phase = PHASES[phaseIdx];
  const done = phaseIdx >= PHASES.length;

  const haptic = (type: "light" | "medium" | "heavy" = "light") => {
    if ("vibrate" in navigator) navigator.vibrate(type === "light" ? 10 : type === "medium" ? 20 : 30);
  };

  // Soft in-app chime using the Web Audio API — no external asset needed.
  const playChime = () => {
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(528, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(264, ctx.currentTime + 0.6);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.65);
    } catch { /* audio blocked or unsupported — non-fatal */ }
  };

  // Keep the screen awake during the practice (iPhone sleeps mid-session otherwise).
  const lockScreen = useCallback(async () => {
    try {
      if ("wakeLock" in navigator) {
        wakeLock.current = await (navigator as unknown as { wakeLock: { request: (t: string) => Promise<{ release: () => void }> } }).wakeLock.request("screen");
      }
    } catch { /* unsupported — non-fatal */ }
  }, []);
  const unlockScreen = useCallback(() => {
    try { wakeLock.current?.release(); } catch { /* noop */ }
    wakeLock.current = null;
  }, []);
  useEffect(() => () => unlockScreen(), [unlockScreen]);

  // Timed phases countdown
  useEffect(() => {
    if (!running || done || phase.key === "holds") return;
    if (secsLeft <= 0) {
      haptic("medium");
      playChime();
      if (phaseIdx + 1 >= PHASES.length) {
        setRunning(false);
        setPhaseIdx(PHASES.length);
        unlockScreen();
      } else {
        const next = PHASES[phaseIdx + 1];
        setPhaseIdx(phaseIdx + 1);
        setSecsLeft(next.secs);
        setPhaseTotal(next.secs);
      }
      return;
    }
    const t = setTimeout(() => setSecsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [running, secsLeft, phaseIdx, done, phase.key, unlockScreen]);

  // Holds: count-up while pinching, countdown while recovering
  useEffect(() => {
    if (!running || phase.key !== "holds") return;
    if (holding) {
      const t = setTimeout(() => setHoldSecs((s) => s + 1), 1000);
      return () => clearTimeout(t);
    }
    if (recoverLeft > 0) {
      if (recoverLeft <= 1) {
        haptic("medium");
        playChime();
        if (holdRound >= HOLD_ROUNDS) {
          const next = PHASES[phaseIdx + 1];
          setPhaseIdx(phaseIdx + 1);
          setSecsLeft(next.secs);
          setPhaseTotal(next.secs);
        } else {
          setHoldRound((r) => r + 1);
          setHoldSecs(0);
        }
        setRecoverLeft(0);
        return;
      }
      const t = setTimeout(() => setRecoverLeft((s) => s - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [running, holding, recoverLeft, phase.key, phaseIdx, holdRound]);

  const begin = () => {
    haptic();
    setStarted(true);
    setRunning(true);
    lockScreen();
  };

  const skipPhase = () => {
    haptic("light");
    setHolding(false);
    setRecoverLeft(0);
    if (phaseIdx + 1 >= PHASES.length) {
      setRunning(false);
      setPhaseIdx(PHASES.length);
      unlockScreen();
    } else {
      const next = PHASES[phaseIdx + 1];
      setPhaseIdx(phaseIdx + 1);
      setSecsLeft(next.secs);
      setPhaseTotal(next.secs);
      if (next.key === "holds") { setHoldRound(1); setHoldSecs(0); }
    }
  };

  const restart = () => {
    haptic();
    setPhaseIdx(0);
    setSecsLeft(PHASES[0].secs);
    setPhaseTotal(PHASES[0].secs);
    setHoldRound(1);
    setHolding(false);
    setHoldSecs(0);
    setRecoverLeft(0);
    setRunning(true);
    lockScreen();
  };

  const progress = phase.key === "holds" || phaseTotal === 0 ? 0 : 1 - secsLeft / phaseTotal;

  // ── Start screen: dosing + BOLT baseline + safety ──
  if (!started) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl p-4 border border-white/[0.04] backdrop-blur-sm">
          <div className="mb-4">
            <h2 className="text-xl font-sans font-bold mb-1 text-emerald-200">Breath Recovery</h2>
            <p className="text-[11px] text-emerald-200/80">FNH Phase E · ~5–10 min · nasal breathing only</p>
          </div>
          <div className="space-y-2 text-[13px] leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>
            <p><strong className="text-emerald-200">1 · Settle (30s)</strong> — easy nose breathing.</p>
            <p><strong className="text-emerald-200">2 · Air hunger (3–4 min)</strong> — slow and quieten until a slight, comfortable urge for air. Never strain or gasp.</p>
            <p><strong className="text-emerald-200">3 · Small holds (optional)</strong> — exhale, pinch, hold to a <em>mild</em> urge only, recover calmly. ×3.</p>
            <p><strong className="text-emerald-200">4 · Wind down (1 min)</strong> — easy quiet breathing.</p>
          </div>
        </div>

        <div className={cn("rounded-xl p-4", C.card, C.border)}>
          <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.6)" }}>BOLT before (optional)</label>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="number" inputMode="numeric" min={0} max={80} placeholder="e.g. 18"
              value={boltBefore} onChange={(e) => setBoltBefore(e.target.value)}
              className="w-full h-12 rounded-lg text-base font-medium text-center bg-white/5 border border-white/10 text-white"
            />
            <span className="text-xs shrink-0" style={{ color: "rgba(255,255,255,0.5)" }}>secs</span>
          </div>
          <p className="mt-2 text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>Target 25+ functional · building toward 40+. Practice twice daily.</p>
        </div>

        <div className="rounded-xl p-4 border border-red-400/20 bg-red-500/[0.06]">
          <p className="text-[12px] leading-relaxed flex gap-2" style={{ color: "rgba(255,255,255,0.75)" }}>
            <TriangleAlert size={16} className="shrink-0 mt-0.5 text-red-300" />
            <span>Gentle reduced breathing only — no big deep breaths. Stop and breathe normally if lightheaded, anxious, or stirred up.</span>
          </p>
        </div>

        <button
          onClick={begin}
          className="w-full rounded-2xl py-5 px-6 text-lg font-semibold uppercase tracking-wider transition-all min-h-[60px] flex items-center justify-center gap-3 bg-emerald-300 text-[#07120D] hover:bg-emerald-200 active:bg-emerald-200 active:scale-[0.99]"
        >
          <Play size={22} className="shrink-0" /> Begin Practice
        </button>
      </div>
    );
  }

  // ── Completion screen ──
  if (done) {
    if (saved) {
      return (
        <div className="rounded-2xl p-4 border border-white/[0.04] backdrop-blur-sm text-center">
          <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.05))", boxShadow: "0 0 40px rgba(16,185,129,0.15)" }}>
            <CheckCircle2 size={36} className="text-emerald-400" />
          </div>
          <h2 className="text-xl font-sans font-bold mb-1 text-emerald-200">Practice Complete</h2>
          <p className="text-[11px] text-emerald-200/80 mb-6">Logged — twice daily builds CO₂ tolerance.</p>
          <button onClick={() => { haptic("light"); onDone(); }} className="w-full rounded-xl px-6 py-3.5 text-sm font-semibold uppercase tracking-wider transition-all min-h-[48px] bg-emerald-300 text-[#07120D] hover:bg-emerald-200 active:bg-emerald-200 active:scale-[0.99]">Done</button>
        </div>
      );
    }
    return (
      <div className="rounded-2xl p-4 border border-white/[0.04] backdrop-blur-sm">
        <div className="mb-4 text-center">
          <h2 className="text-xl font-sans font-bold mb-1 text-emerald-200">Wind Down Complete</h2>
          <p className="text-[11px] text-emerald-200/80">Note any shift — calmer, warmer hands, clearer nose.</p>
        </div>
        <div className={cn("rounded-xl p-4 mb-4", C.card, C.border)}>
          <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.6)" }}>BOLT after (optional)</label>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="number" inputMode="numeric" min={0} max={80} placeholder="e.g. 22"
              value={boltAfter} onChange={(e) => setBoltAfter(e.target.value)}
              className="w-full h-12 rounded-lg text-base font-medium text-center bg-white/5 border border-white/10 text-white"
            />
            <span className="text-xs shrink-0" style={{ color: "rgba(255,255,255,0.5)" }}>secs</span>
          </div>
        </div>
        <button
          onClick={() => {
            haptic("medium");
            const b = boltBefore.trim();
            const a = boltAfter.trim();
            onSave(b || a ? `BOLT ${b || "?"}→${a || "?"}` : "No BOLT recorded");
            setSaved(true);
          }}
          className="w-full rounded-xl px-6 py-3.5 text-sm font-semibold uppercase tracking-wider transition-all min-h-[48px] bg-emerald-300 text-[#07120D] hover:bg-emerald-200 active:bg-emerald-200 active:scale-[0.99]"
        >
          Save to Session Log
        </button>
      </div>
    );
  }

  // ── Active practice ──
  return (
    <div className="space-y-4">
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 px-2">
        {PHASES.map((p, i) => (
          <div key={p.key} className="flex items-center gap-1.5">
            <div className={cn(
              "w-2.5 h-2.5 rounded-full transition-all duration-300",
              i === phaseIdx ? "bg-emerald-200 scale-125 ring-2 ring-emerald-200/20" : i < phaseIdx ? "bg-emerald-200/50" : "bg-white/10"
            )} />
            {i < PHASES.length - 1 && <div className={cn("w-5 h-[1px]", i < phaseIdx ? "bg-emerald-200/35" : "bg-white/10")} />}
          </div>
        ))}
      </div>

      <div className="rounded-2xl p-5 border border-white/[0.04] backdrop-blur-sm text-center">
        <p className="text-[11px] font-medium uppercase tracking-widest mb-1 text-emerald-200/70">Phase {phaseIdx + 1} of {PHASES.length}</p>
        <h2 className="text-2xl font-sans font-bold mb-1 text-emerald-200">{phase.title}</h2>
        <p className="text-[12px] mb-5" style={{ color: "rgba(255,255,255,0.6)" }}>{phase.subtitle}</p>

        {phase.key === "holds" ? (
          <div className="space-y-4">
            <p className="text-[11px] font-medium uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.5)" }}>Round {holdRound} of {HOLD_ROUNDS}</p>
            {!holding && recoverLeft <= 0 ? (
              <>
                <p className="text-[14px] leading-relaxed" style={{ color: "rgba(255,255,255,0.8)" }}>
                  Breathe out gently through the nose, pinch, and hold.
                  Tap the moment you feel a <strong>mild</strong> urge — never push to strong.
                </p>
                <button
                  onClick={() => { haptic(); setHolding(true); setHoldSecs(0); }}
                  className="w-full rounded-xl px-6 py-4 text-sm font-semibold uppercase tracking-wider transition-all min-h-[56px] bg-emerald-300 text-[#07120D] hover:bg-emerald-200 active:bg-emerald-200 active:scale-[0.99]"
                >
                  Start Hold
                </button>
              </>
            ) : holding ? (
              <>
                <div className="text-6xl font-sans font-bold tabular-nums text-emerald-200">{fmt(holdSecs)}</div>
                <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.6)" }}>Holding… release at the first mild urge</p>
                <button
                  onClick={() => { haptic("medium"); setHolding(false); setRecoverLeft(HOLD_RECOVER_SECS); }}
                  className="w-full rounded-xl px-6 py-4 text-sm font-semibold uppercase tracking-wider transition-all min-h-[56px] bg-emerald-300 text-[#07120D] active:scale-[0.99]"
                >
                  I Feel the Urge — Release
                </button>
              </>
            ) : (
              <>
                <div className="text-6xl font-sans font-bold tabular-nums text-emerald-300">{fmt(recoverLeft)}</div>
                <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.6)" }}>Recover — small, calm nasal breaths</p>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="text-7xl font-sans font-bold tabular-nums text-emerald-200 mb-4">{fmt(secsLeft)}</div>
            <div className="h-1.5 rounded-full overflow-hidden mb-5" style={{ background: "rgba(255,255,255,0.08)" }}>
              <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${Math.round(progress * 100)}%`, background: "rgba(110,231,183,0.8)" }} />
            </div>
          </>
        )}

        {/* Transport controls */}
        <div className="flex items-center justify-center gap-3 mt-2">
          <button
            onClick={() => { haptic("light"); setRunning((r) => !r); }}
            aria-label={running ? "Pause" : "Resume"}
            className="w-14 h-14 rounded-full flex items-center justify-center bg-emerald-300 text-[#07120D] active:scale-95 transition-transform"
          >
            {running ? <Pause size={24} /> : <Play size={24} className="ml-0.5" />}
          </button>
          <button
            onClick={restart}
            aria-label="Restart phase"
            className="w-12 h-12 rounded-full flex items-center justify-center bg-white/[0.06] border border-white/10 text-white/70 active:scale-95 active:bg-white/10 transition-all"
          >
            <RotateCcw size={18} />
          </button>
          <button
            onClick={skipPhase}
            aria-label="Skip phase"
            className="h-12 px-4 rounded-full flex items-center gap-1 bg-white/[0.06] border border-white/10 text-white/70 text-[12px] font-medium uppercase tracking-wider active:scale-95 active:bg-white/10 transition-all"
          >
            Skip <ArrowRight size={16} />
          </button>
        </div>

        {phase.key === "airHunger" && (
          <button
            onClick={() => { haptic("light"); setSecsLeft((s) => s + 60); setPhaseTotal((t) => t + 60); }}
            className="mt-4 inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 min-h-[44px] text-[12px] font-medium bg-white/[0.04] border border-white/[0.06] text-white/60 active:bg-white/10"
          >
            <Plus size={14} /> Extend 1 min (to 4 min)
          </button>
        )}
      </div>

      <div className="rounded-xl p-4 border border-red-400/20 bg-red-500/[0.06]">
        <p className="text-[12px] leading-relaxed flex gap-2" style={{ color: "rgba(255,255,255,0.75)" }}>
          <TriangleAlert size={16} className="shrink-0 mt-0.5 text-red-300" />
          <span>Lightheaded? Stop, breathe normally through the nose. Never strain or gasp.</span>
        </p>
      </div>

      <p className="text-center text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
        <Heart size={11} className="inline mr-1" /> Nose only · screen stays awake during practice
      </p>
    </div>
  );
}
