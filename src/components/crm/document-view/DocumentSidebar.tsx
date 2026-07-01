
import { cn } from '@/lib/utils';
import {
  Compass, ShieldCheck, List, Zap, ClipboardCheck,
  Activity, Brain, Heart, ArrowDownCircle, ArrowUpCircle,
  Eye, Droplets, ShieldAlert, Layers, Baby, Dumbbell,
  Wind, Sparkles
} from 'lucide-react';

interface DocumentSidebarProps {
  activeSection: string;
  scrollTo: (id: string) => void;
  openGuides: Record<string, boolean>;
  toggleGuide: (title: string) => void;
}

export const OUTLINE_ITEMS = [
  { id: "p-sec",       label: "P — Preliminary",             icon: Compass,         letter: "P", color: "text-slate-600 dark:text-slate-300" },
  { id: "e-sec",       label: "E — Ease System",             icon: ShieldCheck,     letter: "E", color: "text-blue-600 dark:text-blue-400" },
  { id: "a-sec",       label: "A — Align Hierarchy",         icon: List,            letter: "A", color: "text-violet-600 dark:text-violet-400" },
  { id: "a-reflexes",  label: "  Primitive Reflexes",        icon: Baby,            letter: null, color: "text-muted-foreground" },
  { id: "a-nerves",    label: "  Cranial Nerves",            icon: Zap,             letter: null, color: "text-muted-foreground" },
  { id: "a-muscles",   label: "  Muscle Assessment",         icon: Dumbbell,        letter: null, color: "text-muted-foreground" },
  { id: "c-sec",       label: "C — Correct",                 icon: Zap,             letter: "C", color: "text-amber-600 dark:text-amber-400" },
  { id: "c-afferent",  label: "  Afferent (Bottom-Up)",      icon: ArrowDownCircle, letter: null, color: "text-muted-foreground" },
  { id: "c-efferent",  label: "  Efferent (Top-Down)",       icon: ArrowUpCircle,   letter: null, color: "text-muted-foreground" },
  { id: "c-emotional", label: "  Emotional Protocol",        icon: Heart,           letter: null, color: "text-muted-foreground" },
  { id: "e2-sec",      label: "E — Embed",                   icon: ClipboardCheck,  letter: "E", color: "text-emerald-600 dark:text-emerald-400" },
];

export const CORRECTIONS_GUIDE = [
  {
    title: "T1 Sympathetic Reset",
    icon: Zap,
    accentClass: "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/40",
    dotClass: "bg-amber-500",
    steps: [
      "Palpate bilateral anterior first rib (T1). Find restricted or tender side.",
      "Test contralateral Psoas — should be inhibited (confirms SNS lock).",
      "Move ipsilateral shoulder into external rotation. Maintain gentle traction.",
      "Hold 45–90s until tenderness dissolves. Re-assess Psoas — should now clear.",
    ]
  },
  {
    title: "Diaphragm Reset",
    icon: Wind,
    accentClass: "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/40",
    dotClass: "bg-blue-500",
    steps: [
      "Challenge tender points either side of sternum at xiphoid process.",
      "Palpate neck at C4 level (usually contralateral to tender point).",
      "Lift the rib cage superiorly toward the neck. Hold 45–90s.",
      "Release very slowly. Listen for deep sigh, yawn, or belly gurgle.",
    ]
  },
  {
    title: "Vagus Nerve Process",
    icon: Brain,
    accentClass: "bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800/40",
    dotClass: "bg-violet-500",
    steps: [
      "Contact Occiput–Atlas or Auricular reflex point with monitoring hand.",
      "Challenge: Organ / Gland → Polarity (IN/OUT) → Spinal segment match.",
      "Select Lovett partner. Apply Medulla Breathing for 30s (Blocked Inhalation or Forced Exhalation).",
      "Re-test vagal function indicator and the priority organ. Confirm shift.",
    ]
  },
  {
    title: "Harmonic Rocking",
    icon: Heart,
    accentClass: "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/40",
    dotClass: "bg-rose-500",
    steps: [
      "One hand on belly button, other on Kidney 27 points (below clavicle).",
      "Rock gently for 2–3 minutes in a figure-8 or circular motion.",
      "Observe for parasympathetic shift: sigh, yawn, pupil dilation, gut sound.",
    ]
  },
  {
    title: "Emotional Protocol (9 Steps)",
    icon: Sparkles,
    accentClass: "bg-pink-50 dark:bg-pink-950/30 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800/40",
    dotClass: "bg-pink-500",
    steps: [
      "ESR Indicator Check — hold GB14 frontal points. Test indicator muscle.",
      "Permission Check — 'Is it safe to explore this emotion now?' (IM test).",
      "Timeline: Current event vs. Historic root (test which is priority).",
      "Timeline Regression — find age/month of origin via IM muscle chain.",
      "Primary Emotion — Hurt / Worry / Sadness / Fear / Anger. Find the element.",
      "Priority Organ — must match the emotion's TCM element via IM test.",
      "Energy Polarity — challenge IN vs OUT. Find the correct direction.",
      "Eye Position (NLP) — Up/Horiz/Down × Left/Right for memory or constructed.",
      "Correction: Hold ESR + pulse point + eye position. Wait for shift. Upload positive.",
    ]
  },
];

const DocumentSidebar = ({ activeSection, scrollTo }: DocumentSidebarProps) => {
  return (
    <aside className="w-72 shrink-0 sticky top-[64px] max-h-[calc(100vh-120px)] overflow-y-auto pb-8 space-y-8 print:hidden hidden lg:block custom-scrollbar">

      {/* Document Outline */}
      <div className="space-y-1.5">
        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] px-1 mb-3">Document Outline</p>
        {OUTLINE_ITEMS.map((item) => {
          const isActive = activeSection === item.id;
          const isSubItem = !item.letter;
          return (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-all text-left",
                isSubItem ? "ml-4 w-[calc(100%-1rem)]" : "",
                isActive
                  ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-black"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40 font-bold"
              )}
            >
              <item.icon size={isSubItem ? 12 : 13} className={isActive ? "text-indigo-500" : "opacity-50"} />
              <span className={isSubItem ? "text-[10px]" : "text-xs"}>{item.label.trimStart()}</span>
            </button>
          );
        })}
      </div>

      <div className="h-px bg-border" />

      {/* Protocol Reference Guides — always expanded */}
      <div className="space-y-5">
        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] px-1">Protocol Reference</p>
        {CORRECTIONS_GUIDE.map((guide) => (
          <div key={guide.title} className={cn("rounded-2xl border p-4 space-y-3", guide.accentClass)}>
            <div className="flex items-center gap-2.5">
              <guide.icon size={14} className="shrink-0" />
              <span className="text-xs font-black">{guide.title}</span>
            </div>
            <ol className="space-y-2">
              {guide.steps.map((step, idx) => (
                <li key={idx} className="flex gap-2 items-start text-[10px] leading-relaxed opacity-80">
                  <span className={cn("font-black shrink-0 w-4 text-right mt-px", guide.dotClass.replace('bg-', 'text-'))}>
                    {idx + 1}.
                  </span>
                  <span className="font-medium">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default DocumentSidebar;
