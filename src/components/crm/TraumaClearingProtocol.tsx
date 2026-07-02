

import { useState } from 'react';
import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
  Heart,
  Info,
  Lightbulb,
  List,
  Printer,
  Search,
  Shield,
  Sparkles,
  Target,
  Wind,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

type CollapsibleSectionProps = {
  title: string;
  icon: typeof Heart;
  color: string;
  desc: string;
  number?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
};

const CollapsibleSection = ({ title, icon: Icon, color, desc, number, defaultOpen = false, children }: CollapsibleSectionProps) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          {number && (
            <span className="text-lg font-bold text-muted-foreground/40 tabular-nums shrink-0">{number}</span>
          )}
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0", color)}>
            <Icon size={15} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">{title}</h4>
            <p className="text-[10px] text-muted-foreground font-medium">{desc}</p>
          </div>
        </div>
        {open ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
};

const TraumaClearingProtocol = () => {
  const SectionTitle = ({ children, icon: Icon, color }: any) => (
    <div className="flex items-center gap-4 border-b border-border pb-2 mb-4 mt-8 first:mt-0">
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-primary-foreground shadow-sm", color)}>
        <Icon size={16} />
      </div>
      <h2 className="text-2xl font-medium text-foreground">{children}</h2>
    </div>
  );

  return (
    <div
      className="w-full py-2 px-2 animate-in fade-in duration-700 pb-20"
      style={{ fontFamily: 'Georgia, serif' }}
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="space-y-2">
          <Badge className="bg-chart-destructive/10 text-chart-destructive border-none font-semibold text-[10px] uppercase tracking-wider px-4 py-1 rounded-full">
            Clinical Protocol • v11.4
          </Badge>
          <h1 className="text-4xl font-medium text-foreground tracking-tight">Trauma Clearing &amp; Somatic Processing</h1>
          <p className="text-lg text-muted-foreground">Identity Shifting Trauma Clearing Process</p>
        </div>
        <Button asChild variant="outline" className="rounded-xl h-12 px-6 font-medium">
          <Link to="/resources/print">
            <Printer size={18} className="mr-2" /> Print
          </Link>
        </Button>
      </div>

      {/* Goal */}
      <div className="p-6 bg-indigo-50 rounded-xl border border-indigo-200 mb-8">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <Target size={20} />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Goal</p>
            <p className="text-sm font-bold text-indigo-900 leading-relaxed">
              Neutralise a replaying traumatic memory by identifying and clearing the "stuck" negative identity (identity shifting), without over-focusing on trauma unless it's clearly driving a PNI semantic response.
            </p>
          </div>
        </div>
      </div>

      {/* When to use */}
      <section className="mb-8">
        <SectionTitle icon={AlertTriangle} color="bg-amber-500">When to Use This</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 bg-card rounded-xl border border-border shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 size={14} className="text-emerald-500" />
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Use When</span>
            </div>
            <ul className="space-y-2 text-sm font-medium text-foreground">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <span>A memory is <strong>replaying</strong>, or repeatedly triggering a response.</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <span>You suspect it's <strong>running underneath</strong> and driving a <strong>PNI somatic response</strong>.</span>
              </li>
            </ul>
          </div>
          <div className="p-5 bg-card rounded-xl border border-rose-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={14} className="text-rose-500" />
              <span className="text-xs font-bold text-rose-600 uppercase tracking-widest">Caution</span>
            </div>
            <p className="text-sm font-medium text-foreground leading-relaxed">
              Avoid giving a traumatic event extra weight <strong>unless</strong> you have good reason it's a primary driver.
            </p>
          </div>
        </div>
      </section>

      {/* Step-by-step */}
      <section className="mb-8">
        <SectionTitle icon={List} color="bg-chart-primary">Step-by-Step Process</SectionTitle>

        <div className="space-y-4">
          {/* Step 1 */}
          <CollapsibleSection
            title="Permission & Sovereignty Check"
            icon={Shield}
            color="bg-emerald-600"
            desc="Conscious permission + body confirmation."
            number="1"
            defaultOpen
          >
            <div className="space-y-4 text-sm">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-3">
                <p className="font-bold text-emerald-900">Ask for conscious permission:</p>
                <p className="text-emerald-800 font-medium italic pl-4 border-l-2 border-emerald-400">
                  "Do we have permission to work through this traumatic memory?"
                </p>
              </div>
              <div className="p-4 bg-muted rounded-xl space-y-3">
                <p className="font-bold text-foreground">Confirm with the body (optional but recommended):</p>
                <p className="text-muted-foreground">
                  Check a <strong>body yes/no</strong> (e.g., felt sense) and/or <strong>muscle test</strong> for added certainty.
                </p>
              </div>
              <div className="p-4 bg-rose-50 rounded-xl border border-rose-200">
                <p className="font-bold text-rose-800">
                  If the person says <strong>no</strong> (consciously or in the body):
                </p>
                <p className="text-rose-700 font-medium mt-1">Stop. Honour sovereignty.</p>
              </div>
            </div>
          </CollapsibleSection>

          {/* Step 2 */}
          <CollapsibleSection
            title="Locate the 'Worst Frozen Moment'"
            icon={Eye}
            color="bg-indigo-600"
            desc="Find the single snapshot that carries the charge."
            number="2"
            defaultOpen
          >
            <div className="space-y-3 text-sm">
              <div className="p-4 bg-muted rounded-lg space-y-3">
                <div>
                  <p className="font-bold text-foreground">Script:</p>
                  <p className="text-muted-foreground italic pl-4 border-l-2 border-indigo-300 mt-1">
                    "Bring your mind to the traumatic memory or negative experience."
                  </p>
                </div>
                <div>
                  <p className="font-bold text-foreground">Then:</p>
                  <p className="text-muted-foreground italic pl-4 border-l-2 border-indigo-300 mt-1">
                    "Take your mind back to the <strong>worst part</strong> of the frozen moment — the worst moment of that negative experience."
                  </p>
                </div>
                <div>
                  <p className="font-bold text-foreground">Once it lands:</p>
                  <p className="text-muted-foreground italic pl-4 border-l-2 border-indigo-300 mt-1">
                    "Now <strong>freeze it there</strong>. Keep feeling this frozen moment."
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                {[
                  { t: "Vision", d: "A single image that holds the charge." },
                  { t: "Feeling", d: "A somatic or emotional imprint." },
                  { t: "Sensory", d: "Any other sensory anchor." },
                ].map(item => (
                  <div key={item.t} className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                    <p className="font-bold text-xs text-indigo-700">{item.t}</p>
                    <p className="text-[11px] text-indigo-600 font-medium mt-0.5">{item.d}</p>
                  </div>
                ))}
              </div>
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-xs font-medium text-amber-800 leading-relaxed">
                  <strong>Note:</strong> The "worst moment" is usually <strong>one single snapshot</strong> in the sequence — not the entire event.
                </p>
              </div>
            </div>
          </CollapsibleSection>

          {/* Step 3 */}
          <CollapsibleSection
            title="Extract the Stuck Negative Identity"
            icon={Brain}
            color="bg-rose-600"
            desc="Name the identity the client is being in that frozen moment."
            number="3"
            defaultOpen
          >
            <div className="space-y-3 text-sm">
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-bold text-foreground">Ask:</p>
                <p className="text-muted-foreground italic pl-4 border-l-2 border-rose-300 mt-1">
                  "In this frozen moment, what kind of person are you being?"
                </p>
              </div>
              <div className="space-y-2">
                <p className="font-medium text-muted-foreground">Capture the identity label(s):</p>
                <div className="flex flex-wrap gap-2">
                  {["small person", "fearful person", "scared person", "angry person"].map(label => (
                    <Badge key={label} className="bg-rose-100 text-rose-700 border-none font-bold text-[10px] uppercase tracking-wider">{label}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* Step 4 */}
          <CollapsibleSection
            title="Run the Identity Shifting Loop"
            icon={Zap}
            color="bg-amber-500"
            desc="Clear the stuck identity by cycling through embodiment, resource, and re-check."
            number="4"
            defaultOpen
          >
            <div className="space-y-4 text-sm">
              {/* Phase A */}
              <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 space-y-3">
                <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">A. Fully Feel the Negative Identity</p>
                <p className="text-rose-800 font-medium italic pl-4 border-l-2 border-rose-400">
                  "Feel yourself being a <strong>fearful person</strong>."
                </p>
                <div className="bg-white/60 rounded-lg p-3 space-y-2 text-rose-800">
                  <p className="font-medium">Ask: "What does it feel like?"</p>
                  <p className="italic text-rose-600">"It feels heavy..."</p>
                  <p className="font-medium mt-2">Then deepen embodiment:</p>
                  <p className="italic text-rose-600">"Now feel what 'heaviness' — what happens in you when you feel heaviness?"</p>
                </div>
              </div>

              {/* Phase B */}
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-3">
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">B. Find the Opposite / Resource Identity</p>
                <p className="text-emerald-800 font-medium italic pl-4 border-l-2 border-emerald-400">
                  "What are you when you are <strong>not</strong> being fearful person?"
                </p>
                <p className="text-emerald-700 font-medium">(e.g., "Calm")</p>
              </div>

              {/* Phase C */}
              <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200 space-y-3">
                <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">C. Install the Resource Identity (Embodiment Sequence)</p>
                <div className="bg-white/60 rounded-lg p-3 space-y-1.5 text-indigo-800">
                  <p className="italic">"Okay, feel <strong>calm</strong>."</p>
                  <p className="italic">"What happens in yourself when you feel calm?"</p>
                  <p className="italic text-indigo-500">"I relax."</p>
                  <p className="italic mt-2">"Now feel <strong>relaxed</strong>."</p>
                  <p className="italic">"What does relaxation feel like?"</p>
                </div>
              </div>

              {/* Phase D */}
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-3">
                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">D. Re-check the Negative Identity</p>
                <p className="text-amber-800 font-medium italic pl-4 border-l-2 border-amber-400">
                  "Can you still feel yourself being a fearful person?"
                </p>
                <div className="p-3 bg-white/60 rounded-lg">
                  <p className="text-sm font-bold text-amber-800">Repeat as needed:</p>
                  <ul className="mt-2 space-y-1 text-xs text-amber-700 font-medium">
                    <li className="flex items-start gap-2"><div className="w-1 h-1 rounded-full bg-amber-500 mt-1.5 shrink-0" /><span>Keep clearing against the <strong>future</strong></span></li>
                    <li className="flex items-start gap-2"><div className="w-1 h-1 rounded-full bg-amber-500 mt-1.5 shrink-0" /><span>Keep clearing against <strong>scenarios</strong></span></li>
                    <li className="flex items-start gap-2"><div className="w-1 h-1 rounded-full bg-amber-500 mt-1.5 shrink-0" /><span>Until the negative identity is <strong>no longer accessible</strong> ("gone")</span></li>
                  </ul>
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* Step 5 */}
          <CollapsibleSection
            title="Re-test the Frozen Moment"
            icon={Target}
            color="bg-emerald-600"
            desc="Return to the memory and assess if the charge remains."
            number="5"
            defaultOpen
          >
            <div className="space-y-3 text-sm">
              <div className="p-4 bg-muted rounded-lg space-y-3">
                <div>
                  <p className="font-bold text-foreground">Bring them back:</p>
                  <p className="text-muted-foreground italic pl-4 border-l-2 border-emerald-400 mt-1">
                    "Now take your mind back to the frozen moment — the worst part of that experience."
                  </p>
                </div>
                <div>
                  <p className="font-bold text-foreground">Ask:</p>
                  <p className="text-muted-foreground italic pl-4 border-l-2 border-emerald-400 mt-1">
                    "Does it still feel like a problem?"
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-rose-50 rounded-xl border border-rose-200">
                  <p className="font-bold text-xs text-rose-700 uppercase tracking-widest mb-1">If Yes</p>
                  <p className="text-xs text-rose-800 font-medium leading-relaxed">
                    Extract the <strong>next identity layer(s)</strong> and repeat step 4 (the loop).
                    You may clear multiple identities for the same moment — sometimes 3, sometimes 1.
                  </p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                  <p className="font-bold text-xs text-emerald-700 uppercase tracking-widest mb-1">If No</p>
                  <p className="text-xs text-emerald-800 font-medium leading-relaxed">
                    Proceed to step 6 — confirmation.
                  </p>
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* Step 6 */}
          <CollapsibleSection
            title="Confirm Neutrality (Clinic Check)"
            icon={CheckCircle2}
            color="bg-emerald-600"
            desc="Verify the memory is no longer charged."
            number="6"
            defaultOpen
          >
            <div className="space-y-3 text-sm">
              <p className="font-medium leading-relaxed">
                Confirm the moment is <strong>neutral</strong>.
              </p>
              <div className="p-4 bg-muted rounded-xl space-y-2">
                <p className="font-bold text-foreground">Optional clinical confirmation:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li className="flex items-start gap-2"><div className="w-1 h-1 rounded-full bg-chart-primary mt-1.5 shrink-0" /> Muscle test while they think of the moment.</li>
                  <li className="flex items-start gap-2"><div className="w-1 h-1 rounded-full bg-chart-primary mt-1.5 shrink-0" /> Confirm it does <strong>not</strong> create an inhibition response or a change in muscle tone.</li>
                </ul>
              </div>
            </div>
          </CollapsibleSection>
        </div>
      </section>

      {/* Outcome */}
      <section className="mb-8">
        <SectionTitle icon={Sparkles} color="bg-emerald-600">Outcome</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-emerald-50 rounded-xl border border-emerald-200 space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-600" />
              <h4 className="text-sm font-bold text-emerald-800">Neutral Memory</h4>
            </div>
            <p className="text-sm font-medium text-emerald-700 leading-relaxed">
              The traumatic moment becomes <strong>neutral</strong> — no longer charged or triggering.
            </p>
          </div>
          <div className="p-6 bg-indigo-50 rounded-xl border border-indigo-200 space-y-3">
            <div className="flex items-center gap-2">
              <Wind size={18} className="text-indigo-600" />
              <h4 className="text-sm font-bold text-indigo-800">Identity Cleared</h4>
            </div>
            <p className="text-sm font-medium text-indigo-700 leading-relaxed">
              The stuck identity is cleared, reducing downstream semantic and physiological reactivity.
            </p>
          </div>
        </div>
      </section>

      {/* Key Points */}
      <section className="mb-8">
        <SectionTitle icon={Lightbulb} color="bg-amber-500">Key Points</SectionTitle>
        <div className="p-4 bg-muted rounded-lg space-y-3">
          {[
            '"Worst moment" is usually one single snapshot in the sequence — a vision, feeling, or sensory imprint.',
            'You may clear multiple identities for the same moment — sometimes 3, sometimes 1.',
            'Keep clearing against the future and scenarios until the negative identity is no longer accessible.',
            'Maintain client sovereignty at all times. If no (conscious or in the body), stop.',
          ].map((point, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                {i + 1}
              </div>
              <p className="text-sm font-medium text-muted-foreground leading-relaxed">{point}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Image */}
      <section className="mb-8">
        <SectionTitle icon={Eye} color="bg-slate-700">Process Diagram</SectionTitle>
        <div className="rounded-xl overflow-hidden bg-muted border border-border shadow-inner flex items-center justify-center p-4">
          <img
            src="/images/FNH - Trauma Clearing Process.png"
            alt="Trauma Clearing Process Diagram"
            className="max-w-full h-auto rounded-lg"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement?.classList.add('hidden');
            }}
          />
        </div>
      </section>

      {/* Clinical Note */}
      <div className="mt-8 p-8 bg-card text-card-foreground rounded-xl flex items-start gap-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10"><Info size={100} /></div>
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm shrink-0 relative z-10">
          <Lightbulb size={24} />
        </div>
        <div className="space-y-1 relative z-10">
          <p className="text-[10px] font-semibold text-chart-primary uppercase tracking-wider">Identity Shifting</p>
          <p className="text-base text-muted-foreground/60 font-medium leading-relaxed">
            "The stuck identity is not who the person is — it's who they learned to be in response to the trauma. By giving it a name and clearing it, the system can return to its natural state."
          </p>
        </div>
      </div>
    </div>
  );
};

export default TraumaClearingProtocol;
