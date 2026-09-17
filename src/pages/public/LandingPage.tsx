import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CALCOM_CONFIG } from "@/config/integrations";
import { cn } from "@/lib/utils";
import { ArrowRight, Brain, Mic, Sparkles } from "lucide-react";

type Service = "fnh" | "voice";

const CONTENT: Record<Service, {
  label: string;
  icon: typeof Brain;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  orbClass: string;
  heading: string;
  subheading: string;
  points: string[];
  steps: string[];
  cta: string;
  bookingUrl: string;
}> = {
  fnh: {
    label: "FNH Kinesiology",
    icon: Brain,
    colorClass: "text-chart-purple",
    bgClass: "bg-chart-purple/10",
    borderClass: "border-chart-purple/30",
    orbClass: "bg-chart-purple/20",
    heading: "Get to the root of it, not just the symptom.",
    subheading:
      "FNH (Functional Neuro-Health) sessions look at how your brain and nervous system are actually running — stress patterns, old reflexes, the stuff that keeps showing up no matter what else you've tried.",
    points: [
      "A real assessment first — not a generic protocol",
      "Sessions build on each other, tracked over time",
      "Practical, not woo — you'll understand what we're doing and why",
    ],
    steps: [
      "Book your first assessment",
      "We map what's actually going on — nervous system, old patterns, what's stuck",
      "Sessions build from there, tracked so you can see real progress",
    ],
    cta: "Book an FNH assessment",
    bookingUrl: CALCOM_CONFIG.BOOKING_URL,
  },
  voice: {
    label: "Voice & Piano",
    icon: Mic,
    colorClass: "text-chart-destructive",
    bgClass: "bg-chart-destructive/10",
    borderClass: "border-chart-destructive/30",
    orbClass: "bg-chart-destructive/20",
    heading: "Sing and play like you mean it.",
    subheading:
      "Whether you're prepping for an audition, working on technique, or just want to actually enjoy singing again — lessons are built around what you're trying to do, not a fixed curriculum.",
    points: [
      "Technique that holds up under pressure, not just in the room",
      "Repertoire chosen for you, not off a generic list",
      "Same teacher every week — I get to know how you actually work",
    ],
    steps: [
      "Book a lesson — no audition, no commitment",
      "We figure out what you actually need to work on",
      "Weekly sessions, same teacher, repertoire that fits you",
    ],
    cta: "Book a lesson",
    bookingUrl: CALCOM_CONFIG.VOICE_COACHING_URL,
  },
};

export default function LandingPage() {
  const [service, setService] = useState<Service>("fnh");
  const content = CONTENT[service];
  const Icon = content.icon;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className={cn("absolute top-[-10%] left-[-10%] w-[55%] h-[55%] blur-[160px] rounded-full transition-colors duration-700 opacity-60 dark:opacity-40", content.orbClass)} />
        <div className={cn("absolute bottom-[-15%] right-[-10%] w-[45%] h-[45%] blur-[140px] rounded-full transition-colors duration-700 opacity-40 dark:opacity-25", content.orbClass)} />
      </div>

      <header className="relative z-10 flex items-center justify-between px-6 py-6 md:px-12 max-w-5xl mx-auto">
        <div className="flex items-center gap-2 font-serif text-lg font-bold text-foreground">
          <span className="text-primary">✦</span> Resonance Kinesiology
        </div>
        <Button asChild variant="ghost" size="sm" className="text-xs">
          <Link to="/portal/login">Already a client? Log in</Link>
        </Button>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 pb-24">
        <div className="flex items-center gap-1.5 bg-muted p-1.5 rounded-xl w-fit mx-auto mb-12">
          {(Object.keys(CONTENT) as Service[]).map((key) => {
            const c = CONTENT[key];
            const ItemIcon = c.icon;
            return (
              <button
                key={key}
                onClick={() => setService(key)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors",
                  service === key ? cn("bg-card shadow-sm", c.colorClass) : "text-muted-foreground hover:text-foreground",
                )}
              >
                <ItemIcon className="h-4 w-4" /> {c.label}
              </button>
            );
          })}
        </div>

        <div key={service} className="animate-in fade-in duration-500">
          <div className="text-center max-w-2xl mx-auto">
            <div className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-widest mb-6", content.bgClass, content.borderClass, content.colorClass)}>
              <Sparkles className="h-3 w-3" /> {content.label}
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight text-foreground mb-6">
              {content.heading}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-10">
              {content.subheading}
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto mb-12">
            {content.points.map((p) => (
              <div key={p} className={cn("rounded-2xl border p-5 text-sm text-foreground leading-relaxed", content.borderClass, content.bgClass)}>
                {p}
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center gap-4 mb-20">
            <Button asChild size="lg" className={cn("h-14 px-8 text-base font-bold rounded-2xl gap-2", content.bgClass, content.colorClass, "hover:opacity-90")}>
              <a href={content.bookingUrl} target="_blank" rel="noopener noreferrer">
                <Icon className="h-5 w-5" /> {content.cta} <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
            <p className="text-xs text-muted-foreground">Opens Cal.com in a new tab — pick a time that works, no account needed.</p>
          </div>

          <div className="max-w-3xl mx-auto mb-20">
            <h2 className="text-center text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-8">How it works</h2>
            <div className="grid sm:grid-cols-3 gap-6">
              {content.steps.map((step, i) => (
                <div key={step} className="text-center">
                  <div className={cn("w-8 h-8 rounded-full border flex items-center justify-center mx-auto mb-3 text-xs font-bold", content.borderClass, content.colorClass)}>
                    {i + 1}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto border-t border-border pt-14 text-center">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">About</h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            Daniele Buatti works across two practices in Melbourne — FNH kinesiology and voice/piano coaching — bringing the same approach to both: a real assessment before anything else, sessions that build on what actually happened last time, and no generic scripts. If something isn't working, you'll hear about it, and it'll change.
          </p>
        </div>
      </main>

      <footer className="relative z-10 border-t border-border py-10 text-center text-xs text-muted-foreground">
        Resonance Kinesiology — Daniele Buatti · <a href="mailto:info@danielebuatti.com" className="underline">info@danielebuatti.com</a>
      </footer>
    </div>
  );
}
