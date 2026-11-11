import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion, animate, useMotionValue } from "framer-motion";
import { Heart, History, Eye, Zap, Sparkles, Brain, Download, Share2, Trash2, Home, BookOpen, Clock, User, CheckCircle2, Wind, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRIMARY_EMOTIONS, EYE_POSITIONS } from "@/data/emotion-data";
import LimitingBeliefsSelfWork from "@/components/crm/LimitingBeliefsSelfWork";
import BreathRecoveryTool from "@/components/crm/BreathRecoveryTool";

// ─── Self Work · phone-first toolkit ─────────────────────────────────────────
// One persistent shell (swipe-right + floating glass dock own all navigation —
// no back buttons), three tools (Emotional Integration, Breath Recovery,
// Limiting Beliefs), one Reference hub with tab memory, one History log.
//
// The dock is Liquid-Glass style: tap-drag (scrub) across it and the glass
// follows your finger with spring physics while nearby icons magnify.

type Screen = "home" | "integration" | "breath" | "beliefs" | "history" | "reference" | "saved";
type Phase = "timeline" | "age" | "emotion" | "organ" | "eyes" | "result";
type RefTab = "esr" | "organs" | "eyes";

interface SessionLog {
  id: string;
  timestamp: number;
  emotion: string;
  organ: string;
  eyePos: string;
  timeline?: string;
  age?: string;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

const footerItems = [
  { id: "home", label: "Home", icon: Home },
  { id: "history", label: "History", icon: Clock },
  { id: "reference", label: "Reference", icon: BookOpen },
  { id: "profile", label: "Profile", icon: User, href: "/settings" },
] as const;

/** Tabs the dock scrub can land on — Profile leaves the app, so it's tap-only. */
const SCRUB_IDS = ["home", "history", "reference"] as const;

type FooterTarget = "home" | "history" | "reference" | "settings";

// ——— Color system ———
// Deep ink-teal base with sea-glass mint accents for mobile-first readability
const C = {
  bg: "bg-[linear-gradient(180deg,#0A1411_0%,#0E1B16_50%,#0A1411_100%)]",
  card: "bg-white/[0.03] backdrop-blur-md border-white/[0.03]",
  border: "border-white/[0.04]",
  accent: "bg-emerald-300/15 border-emerald-300/20 text-emerald-200",
  accentSolid: "bg-emerald-300 text-[#07120D]",
  accentHover: "hover:bg-emerald-200",
  muted: "bg-white/[0.04] border-white/[0.06] text-white/60",
  mutedHover: "hover:bg-white/10",
  mint: "text-emerald-200",
  mintBright: "text-emerald-200",
  emerald: "text-emerald-300",
  text: "text-white",
  textMuted: "text-white/55",
  textDim: "text-white/30",
};

function Footer({ current, onNavigate, haptic, reducedMotion }: { current: Screen; onNavigate: (target: FooterTarget) => void; haptic: (type?: "light" | "medium" | "heavy") => void; reducedMotion: boolean }) {
  const iconRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const labelRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const glareRef = useRef<HTMLDivElement | null>(null);
  const navRef = useRef<HTMLElement | null>(null);
  const dragging = useRef(false);
  const suppressClick = useRef(false);
  const raf = useRef(0);
  const lastX = useRef<number | null>(null);

  const applyMag = (x: number | null) => {
    if (reducedMotion) {
      iconRefs.current.forEach((icon) => { if (icon) icon.style.transform = ""; });
      labelRefs.current.forEach((label) => { if (label) label.style.transform = ""; });
      if (glareRef.current) { glareRef.current.style.opacity = "0"; glareRef.current.style.background = ""; }
      return;
    }
    iconRefs.current.forEach((icon, i) => {
      if (!icon) return;
      const btn = icon.closest("button");
      const label = labelRefs.current[i];
      if (!btn || x == null) {
        icon.style.transform = "";
        if (label) label.style.transform = "";
        return;
      }
      const r = btn.getBoundingClientRect();
      const d = Math.abs(x - (r.left + r.width / 2));
      const p = Math.max(0, 1 - d / 110);
      icon.style.transform = p <= 0 ? "" : `translateY(${(-p * 8).toFixed(1)}px) scale(${(1 + p * 0.5).toFixed(3)})`;
      if (label) label.style.transform = p <= 0 ? "" : `translateY(${(-p * 2).toFixed(1)}px) scale(${(1 + p * 0.12).toFixed(3)})`;
    });
    if (glareRef.current && navRef.current && x != null) {
      const navR = navRef.current.getBoundingClientRect();
      const pct = Math.max(5, Math.min(95, ((x - navR.left) / navR.width) * 100));
      glareRef.current.style.opacity = "1";
      glareRef.current.style.background = `radial-gradient(circle at ${pct.toFixed(1)}% 30%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.08) 18%, transparent 38%)`;
    } else if (glareRef.current) {
      glareRef.current.style.opacity = "0";
      glareRef.current.style.background = "";
    }
  };

  const scheduleMag = (x: number | null) => {
    lastX.current = x;
    if (raf.current) return;
    raf.current = requestAnimationFrame(() => {
      raf.current = 0;
      applyMag(lastX.current);
    });
  };

  const scrubTo = (x: number) => {
    let best: FooterTarget | null = null;
    let bestD = Infinity;
    const nav = document.getElementById("selfwork-dock");
    if (!nav) return;
    const btns = nav.querySelectorAll("button");
    btns.forEach((btn) => {
      const id = btn.dataset.tab;
      if (!id || !(SCRUB_IDS as readonly string[]).includes(id)) return;
      const r = btn.getBoundingClientRect();
      const d = Math.abs(x - (r.left + r.width / 2));
      if (d < bestD) { bestD = d; best = id as FooterTarget; }
    });
    if (best && best !== current && bestD < 80) {
      suppressClick.current = true;
      haptic("light");
      onNavigate(best);
    }
  };

  useEffect(() => () => { if (raf.current) cancelAnimationFrame(raf.current); }, []);

  return (
    <footer
      className="fixed bottom-0 inset-x-0 z-30 px-4"
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      <nav
        ref={navRef}
        id="selfwork-dock"
        onPointerDown={() => { dragging.current = true; }}
        onPointerMove={(e) => {
          scheduleMag(e.clientX);
          if (dragging.current && (e.pointerType !== "mouse" || (e.buttons & 1) === 1)) scrubTo(e.clientX);
        }}
        onPointerUp={() => { dragging.current = false; scheduleMag(null); }}
        onPointerCancel={() => { dragging.current = false; scheduleMag(null); }}
        onPointerLeave={(e) => { if (e.pointerType === "mouse") { dragging.current = false; scheduleMag(null); } }}
        className="relative grid grid-cols-4 rounded-[26px] border border-white/15 overflow-hidden touch-manipulation select-none"
        style={{
          background: "linear-gradient(135deg, rgba(30,35,50,0.72), rgba(12,14,22,0.78))",
          boxShadow: "inset 0 1px 1px rgba(255,255,255,0.18), inset 0 -1px 1px rgba(0,0,0,0.35), 0 8px 32px rgba(0,0,0,0.5)",
          backdropFilter: "blur(22px) saturate(1.5)",
          WebkitBackdropFilter: "blur(22px) saturate(1.5)",
          touchAction: "pan-y",
        }}
      >
        {/* specular sweep across the dock */}
        <div
          className="pointer-events-none absolute inset-0 rounded-[26px]"
          style={{ background: "linear-gradient(115deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.03) 28%, transparent 45%)" }}
        />
        {/* dynamic Liquid Glass highlight that follows the scrub finger */}
        <div
          ref={glareRef}
          className="pointer-events-none absolute inset-0 rounded-[26px] opacity-0 transition-opacity duration-200"
          style={{ mixBlendMode: "overlay" }}
        />
        {footerItems.map((item, i) => {
          const isActive =
            (item.id === "home" && current === "home") ||
            (item.id === "history" && current === "history") ||
            (item.id === "reference" && current === "reference");
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              data-tab={item.id}
              onClick={() => {
                if (suppressClick.current) { suppressClick.current = false; return; }
                if ("href" in item && item.href) { window.location.href = item.href; return; }
                onNavigate(item.id as FooterTarget);
              }}
              className={cn("relative flex flex-col items-center gap-1 py-3 px-2 transition-colors duration-200 min-h-[60px] active:scale-95 touch-manipulation select-none [-webkit-tap-highlight-color:transparent]", isActive ? "text-emerald-200" : "text-white/40 hover:text-white/60")}
              aria-label={item.label}
            >
              {isActive && (
                <motion.span
                  layoutId="selfwork-dock-glass"
                  className="absolute inset-x-2 inset-y-1.5 rounded-[18px] border border-white/20"
                  style={{
                    background: "linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.04) 60%)",
                    boxShadow: "inset 0 1px 1px rgba(255,255,255,0.35), inset 0 -1px 1px rgba(0,0,0,0.25), 0 4px 16px rgba(0,0,0,0.35)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                  }}
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                />
              )}
              <span ref={(el) => { iconRefs.current[i] = el; }} className="relative block will-change-transform">
                <Icon size={20} />
              </span>
              <span ref={(el) => { labelRefs.current[i] = el; }} className="relative block will-change-transform text-[10px] font-medium tracking-wide">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </footer>
  );
}

function ScreenTitle({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="relative mb-6 text-center">
      <p className="text-[11px] font-medium uppercase tracking-widest text-emerald-200/70">{eyebrow}</p>
      <h1 className="text-2xl font-sans font-bold tracking-wide text-emerald-200">{title}</h1>
      {action && <div className="absolute right-0 top-1/2 -translate-y-1/2">{action}</div>}
    </div>
  );
}

function StepCard({ title, subtitle, children, className = "" }: { title: string; subtitle: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl p-4 border border-white/[0.04] backdrop-blur-sm transition-all duration-250", className)}>
      <div className="mb-4">
        <h2 className="text-xl font-sans font-bold mb-1 text-emerald-200">{title}</h2>
        <p className="text-[11px] text-emerald-200/80">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

const SMALL_BTN =
  "rounded-xl py-3 px-4 text-sm font-medium uppercase tracking-wider transition-all min-h-[48px] touch-manipulation select-none [-webkit-tap-highlight-color:transparent]";

function newId() {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  } catch { /* older iOS fallback below */ }
  return `sw-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function relativeDay(ts: number) {
  const days = Math.floor((Date.now() - ts) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

/** Full-screen card that slides in from the right on push and tracks a left-edge
 *  drag to slide back, revealing Home behind it like a UINavigationController. */
function SwipeableScreen({
  active,
  onInactive,
  reducedMotion,
  children,
}: {
  active: boolean;
  onInactive: () => void;
  reducedMotion: boolean;
  children: React.ReactNode;
}) {
  const x = useMotionValue(0);
  const width = typeof window !== "undefined" ? window.innerWidth : 375;
  const dragStartX = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isVisible, setIsVisible] = useState(active);

  useEffect(() => {
    if (active) {
      setIsVisible(true);
      if (reducedMotion) return;
      x.set(width);
      const controls = animate(x, 0, { type: "spring", stiffness: 380, damping: 34 });
      return () => controls.stop();
    } else {
      if (reducedMotion) { setIsVisible(false); onInactive(); return; }
      const controls = animate(x, width, {
        type: "spring", stiffness: 300, damping: 32,
        onComplete: () => { setIsVisible(false); onInactive(); },
      });
      return () => controls.stop();
    }
  }, [active, reducedMotion, width, x, onInactive]);

  if (!isVisible) return null;

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.clientX > 28) return;
    dragStartX.current = e.clientX;
    setIsDragging(true);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = Math.max(0, e.clientX - dragStartX.current);
    x.set(dx);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    const dx = Math.max(0, e.clientX - dragStartX.current);
    if (dx > 90) {
      animate(x, width, {
        type: "spring", stiffness: 300, damping: 32,
        onComplete: () => { setIsVisible(false); onInactive(); },
      });
    } else {
      animate(x, 0, { type: "spring", stiffness: 420, damping: 34 });
    }
  };

  return (
    <motion.div
      className="absolute inset-0 z-10 bg-[#0A1411]"
      style={{ x }}
    >
      {children}
      {/* invisible left-edge gesture strip; the rest of the screen scrolls normally */}
      <div
        className="absolute top-0 bottom-0 left-0 w-7 z-20 touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      />
    </motion.div>
  );
}

function HomeContent({
  history,
  weekCount,
  startIntegration,
  goTo,
  haptic,
  setRefTab,
  onShowExport,
}: {
  history: SessionLog[];
  weekCount: number;
  startIntegration: () => void;
  goTo: (next: Screen, dir?: 1 | -1) => void;
  haptic: (type?: "light" | "medium" | "heavy") => void;
  setRefTab: (t: RefTab) => void;
  onShowExport: () => void;
}) {
  return (
    <>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-sans font-bold tracking-wide text-emerald-200">Self Work</h1>
        <p className="text-sm font-medium uppercase tracking-widest text-emerald-200/70">Emotional Integration Toolkit</p>
        {history.length > 0 && (
          <p className="mt-2 text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>
            {history.length} session{history.length === 1 ? "" : "s"} · {weekCount} this week · last {relativeDay(history[0].timestamp)}
          </p>
        )}
      </div>

      <div className="mb-3">
        <button
          onClick={startIntegration}
          className="w-full rounded-2xl py-5 px-6 text-[17px] font-semibold transition-all min-h-[56px] flex items-center justify-center gap-3 active:scale-[0.99] touch-manipulation select-none [-webkit-tap-highlight-color:transparent] bg-emerald-300 text-[#07120D] hover:bg-emerald-200 active:bg-emerald-200"
        >
          <Heart size={24} className="shrink-0" />
          <span>Start Emotional Integration</span>
        </button>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-3">
        <button
          onClick={() => { haptic(); goTo("breath", 1); }}
          className={cn("rounded-2xl p-4 text-left transition-all min-h-[88px] flex flex-col justify-between gap-2 bg-white/5 border border-white/10 hover:bg-white/10 active:bg-white/15 active:scale-[0.99]")}
        >
          <Wind size={22} className="text-emerald-200" />
          <span><span className="block font-semibold text-sm">Breath Recovery</span><span className="block text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>~5–10 min · BOLT</span></span>
        </button>
        <button
          onClick={() => { haptic(); goTo("beliefs", 1); }}
          className={cn("rounded-2xl p-4 text-left transition-all min-h-[88px] flex flex-col justify-between gap-2 bg-white/5 border border-white/10 hover:bg-white/10 active:bg-white/15 active:scale-[0.99]")}
        >
          <Brain size={22} className="text-emerald-200" />
          <span><span className="block font-semibold text-sm">Limiting Beliefs</span><span className="block text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>Shift the story</span></span>
        </button>
      </div>

      <div className="mb-3 grid grid-cols-3 gap-2">
        {(["esr", "organs", "eyes"] as RefTab[]).map((t) => (
          <button
            key={t}
            onClick={() => { haptic(); setRefTab(t); goTo("reference", 1); }}
            className={cn("rounded-xl py-3 px-2 text-[11px] font-medium uppercase tracking-wider transition-all min-h-[48px]", C.muted, C.mutedHover, "active:scale-[0.98]")}
          >
            {t === "esr" ? "ESR" : t === "organs" ? "Organs" : "Eyes"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => { haptic(); goTo("history", 1); }}
          className={cn("rounded-xl py-3 px-3 text-sm font-medium uppercase tracking-wider transition-all min-h-[48px] flex items-center justify-center gap-2", C.muted, C.mutedHover, "active:scale-[0.98]")}
        >
          <History size={14} /> History{history.length > 0 ? ` · ${history.length}` : ""}
        </button>
        <button
          onClick={() => { haptic(); onShowExport(); }}
          className={cn("rounded-xl py-3 px-3 text-sm font-medium uppercase tracking-wider transition-all min-h-[48px] flex items-center justify-center gap-2", C.muted, C.mutedHover, "active:scale-[0.98]")}
        >
          <Download size={14} /> Export
        </button>
      </div>
    </>
  );
}

export default function SelfWorkPage() {
  const [screen, setScreen] = useState<Screen>("home");
  const [phase, setPhase] = useState<Phase>("timeline");
  const [refTab, setRefTab] = useState<RefTab>("esr");
  const [emotion, setEmotion] = useState<{ id: string; label: string; organs?: string[] } | null>(null);
  const [organ, setOrgan] = useState("");
  const [eyePos, setEyePos] = useState("");
  const [timeline, setTimeline] = useState<"Current" | "Historic" | null>(null);
  const [age, setAge] = useState("");
  const [months, setMonths] = useState("");
  const [history, setHistory] = useState<SessionLog[]>([]);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [armedClear, setArmedClear] = useState(false);
  const [armedDelete, setArmedDelete] = useState<string | null>(null);
  const [savedKind, setSavedKind] = useState<"integration" | "beliefs">("integration");
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    try {
      const stored = localStorage.getItem("selfWorkHistory");
      if (stored) setHistory(JSON.parse(stored));
    } catch { /* corrupted cache — start fresh */ }
    const handleBeforeInstall = () => setShowInstallPrompt(true);
    window.addEventListener("beforeinstallprompt", handleBeforeInstall as EventListener);
    // Match the browser chrome / overscroll colour to this screen so the
    // status bar area doesn't flash a different dark tone.
    const meta = document.querySelector('meta[name="theme-color"]');
    const prev = meta?.getAttribute("content") ?? null;
    if (meta) meta.setAttribute("content", "#0A1411");
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall as EventListener);
      if (meta && prev) meta.setAttribute("content", prev);
    };
  }, []);

  const persist = useCallback((logs: SessionLog[]) => {
    setHistory(logs);
    try { localStorage.setItem("selfWorkHistory", JSON.stringify(logs.slice(0, 50))); } catch { /* storage full — keep in memory */ }
  }, []);

  const haptic = (type: "light" | "medium" | "heavy" = "light") => {
    if ("vibrate" in navigator) navigator.vibrate(type === "light" ? 10 : type === "medium" ? 20 : 30);
  };

  const goTo = useCallback((next: Screen, _dir?: 1 | -1) => {
    setScreen(next);
  }, []);

  const goNavigate = useCallback((target: FooterTarget) => {
    haptic("light");
    if (target === "settings") { window.location.href = "/settings"; return; }
    if (target === "home") { setPhase("timeline"); setScreen("home"); }
    else { setScreen(target); }
  }, []);

  const goHome = useCallback(() => {
    haptic("light");
    setPhase("timeline");
    setScreen("home");
  }, []);

  const startIntegration = useCallback(() => {
    haptic();
    setEmotion(null);
    setOrgan("");
    setEyePos("");
    setTimeline(null);
    setAge("");
    setMonths("");
    setPhase("timeline");
    goTo("integration", 1);
  }, [goTo]);

  const saveLog = useCallback((log: Omit<SessionLog, "id" | "timestamp">) => {
    persist([{ ...log, id: newId(), timestamp: Date.now() }, ...history].slice(0, 50));
  }, [history, persist]);

  const exportHistory = () => {
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: "application/json" });
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
      try { await navigator.share({ title: "Self Work Session", text }); haptic("light"); } catch { /* dismissed */ }
    } else {
      try { await navigator.clipboard.writeText(text); haptic("light"); } catch { /* clipboard blocked */ }
    }
  };

  const weekCount = history.filter((h) => Date.now() - h.timestamp < 7 * 86400000).length;

  // ── Reference content ──
  const esrContent = (
    <div className="space-y-4">
      <h3 className="text-lg font-sans font-semibold flex items-center gap-2"><Heart size={20} className={C.mintBright} /> ESR Indicator Check</h3>
      <div className={cn("rounded-xl p-4", C.card, C.border)}>
        <p className="text-[13px] leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>Hold <strong>GB14 (forehead)</strong> ESR points bilaterally.</p>
        <div className="mt-3 grid grid-cols-2 gap-3 text-[12px]">
          <div className={cn("rounded-lg p-3", C.card, C.border)}><span className={C.mintBright}>Inhibits</span> → Indicator muscle goes weak</div>
          <div className={cn("rounded-lg p-3", C.card, C.border)}><span className={C.emerald}>Locks</span> → Weak muscle becomes strong</div>
        </div>
        <p className="mt-3 text-[12px]" style={{ color: "rgba(255,255,255,0.6)" }}>Either response = emotional integration indicated.</p>
      </div>
    </div>
  );

  const organContent = (
    <div className="space-y-4">
      <h3 className="text-lg font-sans font-semibold flex items-center gap-2"><Sparkles size={20} className={C.mintBright} /> Emotion → Organ → Muscle Map</h3>
      <div className={cn("rounded-xl p-4", C.card, C.border)}>
        <div className="space-y-3">
          {PRIMARY_EMOTIONS.map((e) => (
            <div key={e.id} className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.03)" }}>
              <div className="flex items-center gap-2 mb-2">
                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center text-white", e.color)}><Heart size={12} className="fill-current" /></div>
                <span className="font-medium">{e.label}</span>
                <span className="text-[10px]" style={{ color: "rgba(110,231,183,0.8)" }}>{e.element} Element</span>
              </div>
              <div className="ml-9 text-[11px] space-y-1" style={{ color: "rgba(255,255,255,0.7)" }}>
                {e.organs?.map((org: string) => (
                  <div key={org} className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full" style={{ background: "rgba(110,231,183,0.5)" }} /><span>{org}</span></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const eyesContent = (
    <div className="space-y-4">
      <h3 className="text-lg font-sans font-semibold flex items-center gap-2"><Eye size={20} className={C.mintBright} /> NLP Eye Accessing Cues</h3>
      <div className={cn("rounded-2xl overflow-hidden", C.card, C.border)}>
        <div className="aspect-video flex items-center justify-center p-4" style={{ background: "rgba(255,255,255,0.02)" }}>
          <img loading="lazy" decoding="async" src="/images/eye-modes.png" alt="NLP Eye Accessing Cues Reference" className="max-w-full h-auto opacity-90 rounded-xl" onError={(e) => { e.currentTarget.style.display = "none"; }} />
        </div>
      </div>
      <div className={cn("rounded-xl p-4", C.card, C.border)}>
        <p className="text-[12px] mb-3" style={{ color: "rgba(255,255,255,0.7)" }}>Eye positions access different neurological pathways:</p>
        <div className="space-y-2">
          {EYE_POSITIONS.map((ep) => (
            <div key={ep.id} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
              <span className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: "rgba(110,231,183,0.15)", color: "rgba(110,231,183,1)" }}>{ep.pos}</span>
              <div className="flex-1 min-w-0">
                <span className="font-medium text-sm block">{ep.label}</span>
                <span className="text-[11px] block" style={{ color: "rgba(255,255,255,0.5)" }}>{ep.sub}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const refTabs: { id: RefTab; label: string }[] = [
    { id: "esr", label: "ESR" },
    { id: "organs", label: "Organs" },
    { id: "eyes", label: "Eyes" },
  ];

  let content: React.ReactNode = null;

  // ══ HOME ══
  if (screen === "home") {
    content = (
      <HomeContent
        history={history}
        weekCount={weekCount}
        startIntegration={startIntegration}
        goTo={goTo}
        haptic={haptic}
        setRefTab={setRefTab}
        onShowExport={() => setShowExport(true)}
      />
    );
  }

  // ══ EMOTIONAL INTEGRATION FLOW ══
  else if (screen === "integration") {
    const flowSteps = [
      { key: "timeline", label: "Timeline" },
      { key: "emotion", label: "Emotion" },
      { key: "organ", label: "Organ" },
      { key: "eyes", label: "Eyes" },
      { key: "result", label: "Save" },
    ];
    const flowOrder = ["timeline", "age", "emotion", "organ", "eyes", "result"];
    content = (
      <>
        <div className="mb-5 flex items-center justify-center gap-2 px-2 pt-1">
          {flowSteps.map((s, i) => {
            const isActive = phase === s.key;
            const isPast = flowOrder.indexOf(phase) > flowOrder.indexOf(s.key);
            return (
              <div key={s.key} className="flex items-center gap-1.5">
                <div className="flex flex-col items-center gap-0.5">
                  <div className={cn(
                    "w-2.5 h-2.5 rounded-full transition-all duration-300",
                    isActive ? "bg-emerald-200 scale-125 ring-2 ring-emerald-200/20" : isPast ? "bg-emerald-200/50" : "bg-white/10"
                  )} />
                  <span className={cn("text-[8px] tracking-wider font-medium", isActive ? "text-emerald-200" : isPast ? "text-emerald-200/70" : "text-white/20")}>{s.label}</span>
                </div>
                {i < flowSteps.length - 1 && <div className={cn("w-5 h-[1px] -mt-3", isPast ? "bg-emerald-200/35" : "bg-white/10")} />}
              </div>
            );
          })}
        </div>

        {phase === "timeline" && (
          <StepCard title="Identify Timeline" subtitle="Is this emotional stress current or historic?">
            <div className="grid grid-cols-1 gap-3">
              <button onClick={() => { haptic(); setTimeline("Current"); setPhase("emotion"); }} className={cn("rounded-xl p-4 text-left transition-all min-h-[56px] active:scale-[0.99]", C.accent, C.accentHover)}>
                <div className="font-medium">Current</div>
                <div className="text-[11px] mt-0.5" style={{ color: "rgba(110,231,183,0.9)" }}>Known stress or pattern</div>
              </button>
              <button onClick={() => { haptic(); setTimeline("Historic"); setPhase("age"); }} className={cn("rounded-xl p-4 text-left transition-all min-h-[56px] active:scale-[0.99]", C.muted, C.mutedHover)}>
                <div className="font-medium">Historic</div>
                <div className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>Past event or trauma — age regression</div>
              </button>
            </div>
          </StepCard>
        )}

        {phase === "age" && (
          <StepCard title="Timeline Regression" subtitle="Challenge the system for the specific age of origin.">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>Age</label>
                <input type="number" inputMode="numeric" placeholder="e.g. 5" className="w-full h-12 rounded-lg text-base font-medium text-center bg-white/5 border border-white/10 text-white" value={age} onChange={(e) => setAge(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>Months (optional)</label>
                <input type="number" inputMode="numeric" placeholder="e.g. 4" className="w-full h-12 rounded-lg text-base font-medium text-center bg-white/5 border border-white/10 text-white" value={months} onChange={(e) => setMonths(e.target.value)} />
              </div>
            </div>
            <p className="mt-3 text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>Tip: challenge in blocks (1–10, 10–20) then narrow down.</p>
            <div className="mt-4">
              <button disabled={!age} onClick={() => { haptic(); setPhase("emotion"); }} className={cn(SMALL_BTN, "w-full", C.accentSolid, C.accentHover, !age && "opacity-50")}>Continue</button>
            </div>
          </StepCard>
        )}

        {phase === "emotion" && (
          <StepCard title="Primary Emotion" subtitle="Challenge for the priority emotion.">
            <div className="grid grid-cols-1 gap-2">
              {PRIMARY_EMOTIONS.map((e) => (
                <button key={e.id} onClick={() => { haptic(); setEmotion(e); setOrgan(""); setPhase("organ"); }} className={cn("rounded-xl p-3 flex items-center gap-3 text-left transition-all min-h-[56px] border active:scale-[0.99]", emotion?.id === e.id ? "bg-emerald-300/15 border-emerald-300/30 text-emerald-200" : "bg-white/5 border-white/10 text-white/70")}>
                  <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0", e.color)}><Heart size={16} className="fill-current" /></div>
                  <div className="flex-1 min-w-0"><span className="font-medium text-sm">{e.label}</span><span className="text-[10px] block mt-0.5 text-emerald-200/80">{e.element} Element</span></div>
                </button>
              ))}
            </div>
          </StepCard>
        )}

        {phase === "organ" && emotion && (
          <StepCard title={`Emotion: ${emotion.label}`} subtitle="Select the priority organ holding this emotion:">
            <div className="grid grid-cols-2 gap-2">
              {emotion.organs?.map((o: string) => (
                <button key={o} onClick={() => { haptic(); setOrgan(o); setPhase("eyes"); }} className="rounded-xl py-3 px-3 text-sm font-medium uppercase tracking-wider transition-all min-h-[52px] bg-emerald-300/15 border border-emerald-300/30 text-emerald-200 hover:bg-emerald-300/30 active:bg-emerald-300/40 active:scale-[0.98]">{o}</button>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-center" style={{ color: "rgba(110,231,183,0.5)" }}><em>Tap an organ to continue</em></p>
          </StepCard>
        )}

        {phase === "eyes" && emotion && organ && (
          <StepCard title={`Organ: ${organ}`} subtitle={`Emotion: ${emotion.label} — choose eye position:`}>
            <div className="grid grid-cols-1 gap-2">
              {EYE_POSITIONS.map((ep) => (
                <button key={ep.id} onClick={() => { haptic(); setEyePos(ep.label); setPhase("result"); }} className="rounded-xl p-3 flex items-center gap-3 text-left transition-all min-h-[56px] bg-emerald-300/15 border border-emerald-300/30 text-emerald-200 hover:bg-emerald-300/30 active:bg-emerald-300/40 active:scale-[0.99]">
                  <span className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: "rgba(110,231,183,0.15)", color: "rgba(110,231,183,1)" }}>{ep.pos}</span>
                  <span className="flex-1 min-w-0"><span className="font-medium text-sm block">{ep.label}</span><span className="text-[10px] block" style={{ color: "rgba(110,231,183,0.7)" }}>{ep.sub}</span></span>
                </button>
              ))}
            </div>
          </StepCard>
        )}

        {phase === "result" && emotion && organ && (
          <StepCard title="Integration Complete" subtitle="Note shifts in awareness, emotion, or physical sensation." className="text-center">
            <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(110,231,183,0.2), rgba(110,231,183,0.05))", boxShadow: "0 0 40px rgba(110,231,183,0.15)" }}><Heart size={36} className={C.mintBright} /></div>
            <div className="space-y-3 mb-6 text-left">
              {[
                ["Emotion", emotion.label],
                ["Organ", organ],
                ["Eye Position", eyePos],
                ...(timeline ? [["Timeline", `${timeline}${age ? ` — age ${age}` : ""}`]] : []),
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
                  <span className="text-[11px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.5)" }}>{k}</span>
                  <span className="font-medium">{v}</span>
                </div>
              ))}
            </div>
            <button onClick={() => { haptic("medium"); saveLog({ emotion: emotion.label, organ, eyePos, timeline: timeline || undefined, age: age || undefined }); setSavedKind("integration"); goTo("saved", 1); }} className={cn(SMALL_BTN, "w-full", C.accentSolid, C.accentHover)}>Save to Session Log</button>
          </StepCard>
        )}
      </>
    );
  }

  // ══ BREATH RECOVERY ══
  else if (screen === "breath") {
    content = (
      <BreathRecoveryTool
        onSave={(organSummary) => saveLog({ emotion: "Breath Recovery", organ: organSummary, eyePos: "N/A" })}
        onDone={goHome}
      />
    );
  }

  // ══ LIMITING BELIEFS ══
  else if (screen === "beliefs") {
    content = (
      <LimitingBeliefsSelfWork
        onComplete={(summary) => {
          saveLog({ emotion: summary, organ: "Limiting Beliefs", eyePos: "N/A" });
          setSavedKind("beliefs");
          goTo("saved", 1);
        }}
      />
    );
  }

  // ══ SAVED ══
  else if (screen === "saved") {
    const isIntegration = savedKind === "integration";
    content = (
      <StepCard title="Saved" subtitle="Your session has been logged to history." className="text-center">
        <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.05))", boxShadow: "0 0 40px rgba(16,185,129,0.15)" }}>
          <CheckCircle2 size={36} className="text-emerald-400" />
        </div>
        <p className="text-[13px] mb-1" style={{ color: "rgba(255,255,255,0.6)" }}>
          {isIntegration ? "Emotional integration complete. ESR re-checked." : "Belief shifted. Notice what feels lighter."}
        </p>
        <p className="text-[11px] mb-6" style={{ color: "rgba(255,255,255,0.4)" }}>Note any shifts in awareness, emotion, or physical sensation.</p>
        <button onClick={() => { haptic(); if (isIntegration) startIntegration(); else goTo("beliefs", 1); }} className={cn(SMALL_BTN, "w-full", C.accentSolid, C.accentHover)}>Another Session</button>
        <button onClick={() => { haptic(); goTo("history", 1); }} className="mt-3 w-full rounded-xl py-3 px-4 text-sm font-medium uppercase tracking-wider transition-all min-h-[48px] bg-white/10 border border-white/20 hover:bg-white/15 active:bg-white/20">View History</button>
      </StepCard>
    );
  }

  // ══ HISTORY ══
  else if (screen === "history") {
    const doClear = () => {
      if (!armedClear) { haptic(); setArmedClear(true); return; }
      persist([]);
      setArmedClear(false);
      haptic("heavy");
    };
    content = (
      <>
        <ScreenTitle
          eyebrow={`${history.length} session${history.length === 1 ? "" : "s"}`}
          title="History"
          action={
            history.length > 0 ? (
              <button
                onClick={doClear}
                onBlur={() => setArmedClear(false)}
                aria-label="Clear all history"
                className={cn(
                  "w-10 h-10 flex items-center justify-center rounded-full transition-all",
                  armedClear ? "bg-red-500/20 text-red-300" : "text-white/40 active:text-white active:bg-white/10"
                )}
              >
                <Trash2 size={18} />
              </button>
            ) : undefined
          }
        />
        {history.length === 0 ? (
          <div className="rounded-2xl p-10 text-center bg-white/[0.02] border border-white/[0.04]">
            <History size={48} className="mx-auto mb-4" style={{ color: "rgba(255,255,255,0.25)" }} />
            <p className="text-[15px] font-medium text-white/80">No sessions yet</p>
            <p className="text-[13px] mt-1 mb-5" style={{ color: "rgba(255,255,255,0.5)" }}>Start your first emotional integration.</p>
            <button
              onClick={startIntegration}
              className="rounded-xl py-3 px-6 text-[15px] font-semibold transition-all min-h-[48px] touch-manipulation select-none [-webkit-tap-highlight-color:transparent] bg-emerald-300 text-[#07120D] hover:bg-emerald-200 active:bg-emerald-200 active:scale-[0.99]"
            >
              Begin Integration
            </button>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden border border-white/[0.04] bg-white/[0.02]">
            {history.map((log) => {
              const armed = armedDelete === log.id;
              return (
                <article key={log.id} className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.04] last:border-b-0">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[15px] truncate">{log.emotion}</p>
                    <p className="text-[12px] mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>{log.organ} · {log.eyePos} · {relativeDay(log.timestamp)}</p>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      onClick={() => shareSession(log)}
                      aria-label="Share session"
                      className="w-10 h-10 flex items-center justify-center rounded-full text-white/40 active:text-white active:bg-white/10 transition-all"
                    >
                      <Share2 size={18} />
                    </button>
                    <button
                      onClick={() => {
                        haptic();
                        if (!armed) { setArmedDelete(log.id); return; }
                        persist(history.filter((x) => x.id !== log.id));
                        setArmedDelete(null);
                      }}
                      onBlur={() => armed && setArmedDelete(null)}
                      aria-label="Delete session"
                      className={cn(
                        "w-10 h-10 flex items-center justify-center rounded-full transition-all",
                        armed ? "bg-red-500/20 text-red-300" : "text-white/40 active:text-white active:bg-white/10"
                      )}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </>
    );
  }

  // ══ REFERENCE HUB ══
  else {
    content = (
      <>
        <ScreenTitle eyebrow="In-session reference" title="Reference" />
        <div className="relative grid grid-cols-3 gap-1 p-1 mb-4 rounded-2xl border border-white/10 bg-white/[0.03]">
          {refTabs.map((t) => {
            const active = refTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => { haptic("light"); setRefTab(t.id); }}
                className={cn("relative rounded-xl py-3 text-[12px] font-semibold uppercase tracking-wider transition-all min-h-[48px] active:scale-[0.98]", active ? "text-emerald-200" : "text-white/50")}
              >
                {active && (
                  <motion.span
                    layoutId="selfwork-ref-glass"
                    className="absolute inset-0 rounded-xl border border-white/15"
                    style={{
                      background: "linear-gradient(135deg, rgba(255,255,255,0.14), rgba(255,255,255,0.03) 60%)",
                      boxShadow: "inset 0 1px 1px rgba(255,255,255,0.22), 0 4px 16px rgba(0,0,0,0.3)",
                      backdropFilter: "blur(12px)",
                      WebkitBackdropFilter: "blur(12px)",
                    }}
                    transition={{ type: "spring", stiffness: 500, damping: 38 }}
                  />
                )}
                <span className="relative">{t.label}</span>
              </button>
            );
          })}
        </div>
        <motion.div
          key={refTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          className={cn("rounded-2xl p-5", C.card, C.border)}
        >
          {refTab === "esr" && esrContent}
          {refTab === "organs" && organContent}
          {refTab === "eyes" && eyesContent}
        </motion.div>
      </>
    );
  }

  // ── Persistent shell: one section, one dock. The dock never unmounts, so the
  // glass pill + magnification survive screen changes and the pill can slide.
  // The section itself is the scroll container so iOS rubber-band bounce and
  // pull-to-refresh are suppressed, giving a native-app feel.
  return (
    <section
      className={cn("h-dvh text-white overflow-y-auto overflow-x-hidden overscroll-y-none no-scrollbar", C.bg)}
      style={{
        paddingBottom: "calc(7rem + env(safe-area-inset-bottom))",
        WebkitOverflowScrolling: "auto",
        WebkitTapHighlightColor: "transparent",
        WebkitTouchCallout: "none",
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      <main className="relative min-h-dvh pt-[max(1.5rem,env(safe-area-inset-top))] px-4 sm:px-6 max-w-2xl mx-auto">
        {/* Home screen sits behind the current card so the edge-swipe reveals it */}
        {screen !== "home" && (
          <div className="absolute inset-0 z-0 overflow-hidden">
            <HomeContent
              history={history}
              weekCount={weekCount}
              startIntegration={startIntegration}
              goTo={goTo}
              haptic={haptic}
              setRefTab={setRefTab}
              onShowExport={() => setShowExport(true)}
            />
          </div>
        )}

        {screen === "home" ? (
          <div className="relative z-10">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={screen}
                initial={reducedMotion ? { opacity: 0 } : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reducedMotion ? { opacity: 0 } : { opacity: 0 }}
                transition={{ duration: reducedMotion ? 0 : 0.18 }}
              >
                {content}
              </motion.div>
            </AnimatePresence>
          </div>
        ) : (
          <SwipeableScreen active onInactive={() => setScreen("home")} reducedMotion={!!reducedMotion}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={screen}
                initial={reducedMotion ? { opacity: 0 } : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reducedMotion ? { opacity: 0 } : { opacity: 0 }}
                transition={{ duration: reducedMotion ? 0 : 0.18 }}
              >
                {content}
              </motion.div>
            </AnimatePresence>
          </SwipeableScreen>
        )}
      </main>

      <Footer current={screen} onNavigate={goNavigate} haptic={haptic} reducedMotion={!!reducedMotion} />

      {/* ── Global overlays (not tied to the Home card) ── */}
      <AnimatePresence>
        {showExport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.18 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowExport(false)}
          >
            <motion.div
              initial={reducedMotion ? false : { y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 32 }}
              className="absolute bottom-0 inset-x-0 rounded-t-3xl border-t border-white/10 bg-[#121C17]"
              style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mt-3 mb-5" />
              <div className="px-5 pb-6 space-y-5">
                <div>
                  <h2 className="text-lg font-sans font-semibold mb-1">Export Session History</h2>
                  <p className="text-[13px]" style={{ color: "rgba(255,255,255,0.55)" }}>Download your session history as JSON for backup or analysis.</p>
                </div>
                <div className="space-y-2">
                  <button onClick={() => { exportHistory(); setShowExport(false); }} className={cn("w-full rounded-xl py-3.5 text-[17px] font-semibold transition-all min-h-[52px] flex items-center justify-center gap-2 touch-manipulation select-none [-webkit-tap-highlight-color:transparent]", C.accentSolid, C.accentHover)}><Download size={18} /> Export JSON</button>
                  <button onClick={() => setShowExport(false)} className="w-full rounded-xl py-3.5 text-[17px] font-medium transition-all min-h-[52px] touch-manipulation select-none [-webkit-tap-highlight-color:transparent] bg-white/10 text-white/90 hover:bg-white/15 active:bg-white/20">Cancel</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showInstallPrompt && (
        <div className="fixed bottom-24 left-4 right-4 max-w-xl mx-auto z-50">
          <div className={cn("rounded-2xl p-4", C.accentSolid, "shadow-xl")}>
            <div className="flex items-center justify-between">
              <div><p className="font-semibold">Install Self Work</p><p className="text-[12px] opacity-90">Add to home screen for offline access</p></div>
              <button onClick={() => setShowInstallPrompt(false)} aria-label="Dismiss" className="w-11 h-11 flex items-center justify-center rounded-lg opacity-70"><X size={16} /></button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
