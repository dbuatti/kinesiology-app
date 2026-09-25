import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CALCOM_CONFIG } from "@/config/integrations";
import { ArrowRight, ArrowUpRight, Clock, MapPin, Shirt, Wind } from "lucide-react";
import { BrandMark } from "@/components/layout/BrandMark";
import { cn } from "@/lib/utils";

const BookButton = ({ className = "", size = "lg" }: { className?: string; size?: "lg" | "sm" }) => (
  <Button
    asChild
    className={cn(
      "group gap-2 rounded-full bg-chart-purple text-white shadow-[inset_0_1px_0_hsl(0_0%_100%/0.2),0_0_0_1px_hsl(var(--chart-purple)),0_10px_28px_-10px_hsl(var(--chart-purple)/0.7)] hover:bg-chart-purple hover:brightness-110",
      size === "lg" ? "h-12 px-6 text-[15px]" : "h-9 px-4 text-[13px]",
      className
    )}
  >
    <a href={CALCOM_CONFIG.BOOKING_URL} target="_blank" rel="noopener noreferrer">
      Book a first session
      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
    </a>
  </Button>
);

/** Concentric "resonance" rings — the brand motif, drawn large and faint. */
const Rings = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 600 600" className={className} aria-hidden>
    {[60, 120, 180, 240, 300].map((r, i) => (
      <circle key={r} cx="300" cy="300" r={r} fill="none" stroke="currentColor" strokeOpacity={0.14 - i * 0.022} strokeWidth="1" />
    ))}
  </svg>
);

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <p className="mb-4 flex items-center gap-2 text-[13px] font-medium text-chart-purple">
    <span className="h-px w-6 bg-chart-purple/50" />
    {children}
  </p>
);

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      {/* Atmosphere */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[900px] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_20%_0%,hsl(var(--chart-purple)/0.16),transparent_70%),radial-gradient(50%_50%_at_90%_10%,hsl(var(--primary)/0.10),transparent_70%)]" />
        <Rings className="absolute -right-40 -top-40 h-[760px] w-[760px] text-chart-purple" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-b from-transparent to-background" />
      </div>

      {/* Nav */}
      <header
        className={cn(
          "sticky top-0 z-40 transition-[background-color,border-color,box-shadow] duration-300",
          scrolled ? "border-b border-border/70 bg-background/75 backdrop-blur-xl" : "border-b border-transparent"
        )}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-5 pt-[env(safe-area-inset-top)] sm:px-8">
          <a href="#top" className="flex items-center gap-2.5">
            <BrandMark className="h-8 w-8" />
            <span className="leading-none">
              <span className="block font-serif text-[19px] font-medium tracking-[-0.02em]">Resonance</span>
              <span className="mt-0.5 block text-[11px] text-muted-foreground">Kinesiology · Toorak</span>
            </span>
          </a>
          <nav className="ml-6 hidden items-center gap-1 text-[14px] text-muted-foreground md:flex">
            {[
              ["How it works", "#how"],
              ["About", "#about"],
              ["Questions", "#faq"],
            ].map(([label, href]) => (
              <a key={href} href={href} className="rounded-full px-3 py-1.5 hover:bg-foreground/[0.05] hover:text-foreground">
                {label}
              </a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="rounded-full text-[13px] text-muted-foreground">
              <Link to="/portal/login">Client log in</Link>
            </Button>
            <BookButton size="sm" className="hidden sm:inline-flex" />
          </div>
        </div>
      </header>

      <main id="top" className="relative z-10">
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-10 sm:px-8 md:grid-cols-[1.25fr_1fr] md:pt-20 lg:gap-20">
          <div>
            <Eyebrow>FNH kinesiology with Daniele Buatti</Eyebrow>
            <h1 className="font-serif text-[44px] font-medium leading-[1.02] tracking-[-0.03em] sm:text-[58px] lg:text-[68px]">
              Some things don't respond to <em className="italic text-chart-purple">trying harder.</em>
            </h1>
            <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-muted-foreground">
              FNH kinesiology is hands-on nervous system work: assessment, movement, breath, and the patterns sitting underneath them. 60 minutes, on a table, in a Toorak studio. You keep your clothes on.
            </p>
            <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <BookButton />
              <p className="text-[13px] text-muted-foreground">Opens Cal.com. Pick a time, no account needed.</p>
            </div>
            <dl className="mt-10 grid max-w-lg grid-cols-3 divide-x divide-border rounded-2xl border border-border bg-card/70 backdrop-blur">
              {[
                { icon: Clock, k: "Session", v: "60 minutes" },
                { icon: MapPin, k: "Studio", v: "Toorak" },
                { icon: Wind, k: "Per session", v: "$70" },
              ].map((f) => (
                <div key={f.k} className="px-4 py-3">
                  <dt className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
                    <f.icon size={12} /> {f.k}
                  </dt>
                  <dd className="mt-0.5 text-[15px] font-medium">{f.v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative mx-auto w-full max-w-sm md:max-w-none">
            <div className="absolute -inset-6 rounded-[40px] bg-[radial-gradient(closest-side,hsl(var(--chart-purple)/0.22),transparent)] blur-2xl" aria-hidden />
            <figure className="relative overflow-hidden rounded-[28px] border border-border bg-card p-3 shadow-2xl">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[20px] bg-muted">
                <img src="/headshot.jpeg" alt="Daniele Buatti" className="h-full w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/55 to-transparent" />
                <figcaption className="absolute inset-x-4 bottom-4 text-white">
                  <p className="font-serif text-xl leading-tight">Daniele Buatti</p>
                  <p className="text-[12.5px] text-white/80">Diploma of Kinesiology · Functional Neuro Health</p>
                </figcaption>
              </div>
              <ul className="grid gap-2 p-3 pt-4">
                {[
                  "Every session starts with an assessment, not a template",
                  "You leave with written notes and one or two things to practise",
                  "We track the same markers session to session, so progress isn't just a feeling",
                ].map((line) => (
                  <li key={line} className="flex items-start gap-2.5 text-[13.5px] leading-snug">
                    <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-chart-purple" />
                    {line}
                  </li>
                ))}
              </ul>
            </figure>
          </div>
        </section>

        {/* Who this is for */}
        <section className="border-t border-border/70">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 sm:px-8 md:grid-cols-[1fr_1.4fr] lg:gap-20">
            <div>
              <Eyebrow>Who this is for</Eyebrow>
              <h2 className="font-serif text-[34px] font-medium leading-[1.1] tracking-[-0.025em] sm:text-[40px]">
                People usually arrive with something specific and physical.
              </h2>
            </div>
            <div>
              <ul className="divide-y divide-border border-y border-border">
                {[
                  "a jaw that won't unclench, or teeth you grind in your sleep",
                  "a breath that never quite arrives all the way in",
                  "neck and shoulders that massage helps for about two days",
                  "a diagnosis that landed recently and hasn't been absorbed yet",
                  "thoughts on a loop that no amount of understanding has interrupted",
                ].map((line, i) => (
                  <li key={line} className="flex items-baseline gap-5 py-4 text-[16px] leading-relaxed">
                    <span className="w-6 shrink-0 font-serif text-sm tabular-nums text-chart-purple">0{i + 1}</span>
                    {line}
                  </li>
                ))}
              </ul>
              <p className="mt-8 text-[17px] leading-relaxed text-muted-foreground">
                And usually something less specific underneath it: a long habit of handling things alone, and a quiet suspicion that it's a bit embarrassing to be asking for help this late.{" "}
                <span className="text-foreground">It isn't. Almost everyone gets here later than they'd have liked.</span>
              </p>
            </div>
          </div>
        </section>

        {/* What actually happens */}
        <section id="how" className="scroll-mt-20 bg-muted/40">
          <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
            <Eyebrow>What actually happens</Eyebrow>
            <div className="grid gap-5 md:grid-cols-[1.35fr_1fr]">
              <div className="rounded-3xl border border-border bg-card p-7 shadow-sm sm:p-9">
                <h3 className="font-serif text-[28px] font-medium tracking-[-0.02em]">Your first session</h3>
                <ol className="relative mt-6 space-y-5 before:absolute before:bottom-2 before:left-[11px] before:top-2 before:w-px before:bg-border">
                  {[
                    "We talk first, and for longer than you might expect. History, what you've already tried, what your body is doing.",
                    "Then the table. Fully clothed. Hands-on work around the diaphragm, ribs, collarbone and jaw.",
                    "Some standing movement and balance testing.",
                    "A breath-hold measure, so there's a number to come back to.",
                    "Written notes by email afterwards, plus one or two small practices. Not a program. Two things.",
                  ].map((line, i) => (
                    <li key={line} className="relative flex gap-4">
                      <span className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-chart-purple/30 bg-card text-[11px] font-medium tabular-nums text-chart-purple">
                        {i + 1}
                      </span>
                      <span className="pt-0.5 text-[15px] leading-relaxed">{line}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="flex flex-col gap-5">
                <div className="rounded-3xl border border-border bg-card p-7 shadow-sm sm:p-9">
                  <h3 className="font-serif text-[28px] font-medium tracking-[-0.02em]">Every session after that</h3>
                  <ul className="mt-5 space-y-3 text-[15px] leading-relaxed text-muted-foreground">
                    <li>We start with what's happened since.</li>
                    <li>We return to what was left unfinished.</li>
                    <li className="text-foreground">Some sessions follow the plan. Some follow whatever you walked in carrying. Both count as the work.</li>
                  </ul>
                </div>
                <div className="relative flex-1 overflow-hidden rounded-3xl bg-[hsl(262_40%_14%)] p-7 text-white shadow-lg sm:p-9">
                  <Rings className="absolute -bottom-40 -right-40 h-[420px] w-[420px] text-white" />
                  <Shirt className="relative h-5 w-5 text-white/60" />
                  <p className="relative mt-4 font-serif text-[22px] leading-snug">Something you can move in. Everything stays on.</p>
                  <div className="relative mt-6">
                    <BookButton size="sm" className="bg-white text-[hsl(262_40%_14%)] shadow-none hover:bg-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How long this takes */}
        <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <div className="grid gap-10 md:grid-cols-[1fr_1.4fr] lg:gap-20">
            <div>
              <Eyebrow>How long this takes</Eyebrow>
              <h2 className="font-serif text-[34px] font-medium leading-[1.1] tracking-[-0.025em] sm:text-[40px]">Not one session.</h2>
            </div>
            <div>
              <div className="mb-8 grid grid-cols-3 gap-2" aria-hidden>
                {[
                  ["1", "Orientation"],
                  ["3–4", "Things start moving"],
                  ["5+", "Where it lasts"],
                ].map(([n, label], i) => (
                  <div key={n} className="relative">
                    <div className={cn("h-1.5 rounded-full", i === 0 ? "bg-chart-purple/35" : i === 1 ? "bg-chart-purple/65" : "bg-chart-purple")} />
                    <p className="mt-3 font-serif text-2xl tabular-nums">{n}</p>
                    <p className="text-[13px] text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
              <p className="text-[17px] leading-relaxed text-muted-foreground">
                The first is mostly orientation. Things tend to start moving around the third or fourth, and the sessions after that are where anything durable happens.
              </p>
              <p className="mt-4 text-[17px] leading-relaxed text-muted-foreground">
                If you're someone who tends to stop things around week five, say so at the start and we'll build something in for that.{" "}
                <span className="text-foreground">It's a common pattern, not a character flaw.</span>
              </p>
            </div>
          </div>
        </section>

        {/* What this isn't */}
        <section className="border-y border-border/70 bg-muted/30">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-12 sm:px-8 md:flex-row md:items-center">
            <p className="shrink-0 font-serif text-2xl tracking-[-0.02em]">What this isn't</p>
            <ul className="flex flex-wrap gap-2 md:ml-auto md:justify-end">
              {["Not a massage.", "Not a diagnosis.", "Not a single-session fix."].map((line) => (
                <li key={line} className="rounded-full border border-border bg-card px-4 py-2 text-[14px] shadow-xs">{line}</li>
              ))}
              <li className="w-full text-[14px] leading-relaxed text-muted-foreground md:text-right">
                Not a replacement for medical or psychological care. It works alongside it, and I'd rather you have both.
              </li>
            </ul>
          </div>
        </section>

        {/* About */}
        <section id="about" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20 sm:px-8">
          <div className="grid items-center gap-10 md:grid-cols-[280px_1fr] lg:gap-16">
            <img
              src="/headshot.jpeg"
              alt="Daniele Buatti"
              className="mx-auto aspect-square w-48 rounded-full object-cover shadow-xl ring-8 ring-card md:w-full md:rounded-[28px]"
              loading="lazy"
            />
            <div>
              <Eyebrow>About</Eyebrow>
              <p className="font-serif text-[28px] font-medium leading-snug tracking-[-0.02em]">
                Hi, I'm Daniele. I hold a Diploma of Kinesiology from the College of Complementary Medicine, and work within the Functional Neuro Health framework.
              </p>
              <p className="mt-5 text-[17px] leading-relaxed text-muted-foreground">
                I also spend most of my week as a music director and vocal coach, which is less of a detour than it sounds. Both jobs are about what a body does under pressure, and how much of that is old habit rather than fact.
              </p>
              <p className="mt-4 text-[17px] leading-relaxed text-muted-foreground">
                What I find genuinely interesting is watching that shift happen in a session: someone stands differently, breathes differently, and the thing they walked in carrying is just lighter. I don't get tired of seeing that.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-20 border-t border-border/70">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 sm:px-8 md:grid-cols-[1fr_1.4fr] lg:gap-20">
            <div>
              <Eyebrow>Questions</Eyebrow>
              <h2 className="font-serif text-[34px] font-medium leading-[1.1] tracking-[-0.025em] sm:text-[40px]">Before you book</h2>
              <p className="mt-4 text-[15px] text-muted-foreground">
                Anything else —{" "}
                <a href="mailto:info@danielebuatti.com" className="text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground">
                  info@danielebuatti.com
                </a>
              </p>
            </div>
            <Accordion type="single" collapsible className="rounded-2xl border border-border bg-card px-5 shadow-xs">
              {[
                { q: "Do I need to know what's wrong?", a: "No. Most people can't name it, and naming it is part of the work." },
                { q: "Will I have to talk about my family?", a: "Sometimes it comes up. You set the pace, and you can stop anything." },
                { q: "Can I do this while I'm seeing a therapist or GP?", a: "Yes, and please do." },
                { q: "What do I wear?", a: "Something you can move in. Everything stays on." },
                { q: "What if I cry, or shake, or nothing happens?", a: "All three are normal." },
                { q: "What's your cancellation policy?", a: "24 hours' notice, please. Inside that window the session is still charged, since that time was held for you. Life happens though, so if something genuine comes up, just message me." },
              ].map(({ q, a }, i, arr) => (
                <AccordionItem key={q} value={q} className={cn(i === arr.length - 1 && "border-b-0")}>
                  <AccordionTrigger className="py-5 text-left text-[15px] font-medium hover:no-underline">{q}</AccordionTrigger>
                  <AccordionContent className="pb-5 text-[15px] leading-relaxed text-muted-foreground">{a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Closing */}
        <section className="px-5 pb-24 sm:px-8">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[32px] bg-[hsl(262_40%_14%)] px-6 py-16 text-center text-white shadow-2xl sm:px-12 sm:py-20">
            <Rings className="absolute left-1/2 top-1/2 h-[900px] w-[900px] -translate-x-1/2 -translate-y-1/2 text-white" />
            <div className="absolute inset-0 bg-[radial-gradient(60%_80%_at_50%_0%,hsl(var(--chart-purple)/0.45),transparent_70%)]" aria-hidden />
            <div className="relative">
              <BrandMark className="mx-auto h-11 w-11" />
              <h2 className="mx-auto mt-6 max-w-2xl font-serif text-[36px] font-medium leading-[1.08] tracking-[-0.025em] sm:text-[48px]">
                Some things don't respond to trying harder.
              </h2>
              <p className="mt-4 text-[15px] text-white/70">60 minutes · Toorak studio · $70</p>
              <div className="mt-8 flex justify-center">
                <BookButton className="bg-white text-[hsl(262_40%_14%)] shadow-none hover:bg-white" />
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 pb-[calc(2rem+env(safe-area-inset-bottom))] text-[13px] text-muted-foreground sm:flex-row sm:items-center sm:px-8">
          <span className="flex items-center gap-2">
            <BrandMark className="h-5 w-5" /> Resonance Kinesiology · Daniele Buatti
          </span>
          <span className="flex flex-wrap items-center gap-x-4 gap-y-1 sm:ml-auto">
            <a href="mailto:info@danielebuatti.com" className="hover:text-foreground">info@danielebuatti.com</a>
            <a href="https://danielebuatti.com/voice-piano-services" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-foreground">
              Also teaches voice and piano <ArrowUpRight size={12} />
            </a>
          </span>
        </div>
      </footer>

      {/* Phone: booking always one tap away */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/85 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl sm:hidden">
        <BookButton className="w-full justify-center" />
      </div>
    </div>
  );
}
