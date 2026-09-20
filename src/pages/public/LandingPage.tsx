import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CALCOM_CONFIG } from "@/config/integrations";
import { ArrowRight, Sparkles } from "lucide-react";

const BookButton = ({ className = "" }: { className?: string }) => (
  <Button asChild size="lg" className={`h-14 px-8 text-base font-bold rounded-2xl gap-2 bg-chart-purple text-white shadow-lg shadow-chart-purple/20 hover:bg-chart-purple/90 hover:shadow-xl hover:shadow-chart-purple/30 transition-all ${className}`}>
    <a href={CALCOM_CONFIG.BOOKING_URL} target="_blank" rel="noopener noreferrer">
      <Sparkles className="h-5 w-5" /> Book a first session <ArrowRight className="h-4 w-4" />
    </a>
  </Button>
);

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[55%] h-[55%] blur-[160px] rounded-full opacity-60 dark:opacity-40 bg-chart-purple/20" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[45%] h-[45%] blur-[140px] rounded-full opacity-40 dark:opacity-25 bg-chart-purple/20" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-6 pb-6 pt-[max(1.5rem,env(safe-area-inset-top))] md:px-12 max-w-3xl mx-auto">
        <div className="flex items-center gap-2 font-serif text-lg font-bold text-foreground">
          <span className="text-primary">✦</span> Resonance Kinesiology
        </div>
        <Button asChild variant="ghost" size="sm" className="text-xs">
          <Link to="/portal/login">Already a client? Log in</Link>
        </Button>
      </header>

      <main className="relative z-10 max-w-3xl mx-auto px-6 md:px-12 pb-24">
        {/* Hero */}
        <div className="text-center max-w-2xl mx-auto pt-6 pb-16">
          <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight text-foreground mb-6">
            Some things don't respond to trying harder.
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed mb-8">
            FNH kinesiology is hands-on nervous system work: assessment, movement, breath, and the patterns sitting underneath them. 60 minutes, on a table, in a Toorak studio. You keep your clothes on.
          </p>

          <ul className="text-left max-w-md mx-auto space-y-3 mb-10">
            {[
              "Every session starts with an assessment, not a template",
              "You leave with written notes and one or two things to practise",
              "We track the same markers session to session, so progress isn't just a feeling",
            ].map((line) => (
              <li key={line} className="flex items-start gap-2.5 text-sm text-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-chart-purple shrink-0" />
                {line}
              </li>
            ))}
          </ul>

          <div className="flex flex-col items-center gap-3">
            <BookButton />
            <p className="text-xs text-muted-foreground">
              Opens Cal.com. Pick a time, no account needed. $70 / 60 minutes.
            </p>
          </div>
        </div>

        {/* Who this is for */}
        <section className="mb-16">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-6 text-center">Who this is for</h2>
          <p className="text-base text-foreground leading-relaxed mb-4">People usually arrive with something specific and physical:</p>
          <ul className="space-y-2.5 mb-6">
            {[
              "a jaw that won't unclench, or teeth you grind in your sleep",
              "a breath that never quite arrives all the way in",
              "neck and shoulders that massage helps for about two days",
              "a diagnosis that landed recently and hasn't been absorbed yet",
              "thoughts on a loop that no amount of understanding has interrupted",
            ].map((line) => (
              <li key={line} className="flex items-start gap-2.5 text-sm text-muted-foreground leading-relaxed">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-chart-purple/60 shrink-0" />
                {line}
              </li>
            ))}
          </ul>
          <p className="text-base text-foreground leading-relaxed">
            And usually something less specific underneath it: a long habit of handling things alone, and a quiet suspicion that it's a bit embarrassing to be asking for help this late. It isn't. Almost everyone gets here later than they'd have liked.
          </p>
        </section>

        {/* What actually happens */}
        <section className="mb-16">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-6 text-center">What actually happens</h2>
          <div className="grid sm:grid-cols-2 gap-8 mb-10">
            <div className="rounded-2xl border border-chart-purple/30 bg-chart-purple/10 p-6">
              <h3 className="font-serif font-bold text-lg text-foreground mb-4">Your first session</h3>
              <ul className="space-y-2.5">
                {[
                  "We talk first, and for longer than you might expect. History, what you've already tried, what your body is doing.",
                  "Then the table. Fully clothed. Hands-on work around the diaphragm, ribs, collarbone and jaw.",
                  "Some standing movement and balance testing.",
                  "A breath-hold measure, so there's a number to come back to.",
                  "Written notes by email afterwards, plus one or two small practices. Not a program. Two things.",
                ].map((line) => (
                  <li key={line} className="text-sm text-foreground leading-relaxed">{line}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-border bg-muted/30 p-6">
              <h3 className="font-serif font-bold text-lg text-foreground mb-4">Every session after that</h3>
              <ul className="space-y-2.5">
                {[
                  "We start with what's happened since.",
                  "We return to what was left unfinished.",
                  "Some sessions follow the plan. Some follow whatever you walked in carrying. Both count as the work.",
                ].map((line) => (
                  <li key={line} className="text-sm text-foreground leading-relaxed">{line}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex justify-center">
            <BookButton />
          </div>
        </section>

        {/* How long this takes */}
        <section className="mb-16 max-w-xl mx-auto text-center">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-6">How long this takes</h2>
          <p className="text-base text-muted-foreground leading-relaxed mb-4">
            Not one session. The first is mostly orientation. Things tend to start moving around the third or fourth, and the sessions after that are where anything durable happens.
          </p>
          <p className="text-base text-muted-foreground leading-relaxed">
            If you're someone who tends to stop things around week five, say so at the start and we'll build something in for that. It's a common pattern, not a character flaw.
          </p>
        </section>

        {/* What this isn't */}
        <section className="mb-16 max-w-xl mx-auto">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-6 text-center">What this isn't</h2>
          <ul className="space-y-2 text-center">
            {[
              "Not a replacement for medical or psychological care. It works alongside it, and I'd rather you have both.",
              "Not a massage.",
              "Not a diagnosis.",
              "Not a single-session fix.",
            ].map((line) => (
              <li key={line} className="text-sm text-muted-foreground leading-relaxed">{line}</li>
            ))}
          </ul>
        </section>

        {/* About */}
        <div className="max-w-2xl mx-auto border-t border-border pt-14 mb-16 flex flex-col items-center text-center">
          <img
            src="/headshot.jpeg"
            alt="Daniele Buatti"
            className="w-28 h-28 rounded-full object-cover mb-6 shadow-lg"
            loading="lazy"
          />
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">About</h2>
          <p className="text-base text-muted-foreground leading-relaxed mb-4">
            Hi, I'm Daniele. I hold a Diploma of Kinesiology from the College of Complementary Medicine, and work within the Functional Neuro Health framework.
          </p>
          <p className="text-base text-muted-foreground leading-relaxed mb-4">
            I also spend most of my week as a music director and vocal coach, which is less of a detour than it sounds. Both jobs are about what a body does under pressure, and how much of that is old habit rather than fact.
          </p>
          <p className="text-base text-muted-foreground leading-relaxed">
            What I find genuinely interesting is watching that shift happen in a session: someone stands differently, breathes differently, and the thing they walked in carrying is just lighter. I don't get tired of seeing that.
          </p>
        </div>

        {/* FAQ */}
        <section className="max-w-xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-6 text-center">Questions</h2>
          <Accordion type="single" collapsible>
            {[
              { q: "Do I need to know what's wrong?", a: "No. Most people can't name it, and naming it is part of the work." },
              { q: "Will I have to talk about my family?", a: "Sometimes it comes up. You set the pace, and you can stop anything." },
              { q: "Can I do this while I'm seeing a therapist or GP?", a: "Yes, and please do." },
              { q: "What do I wear?", a: "Something you can move in. Everything stays on." },
              { q: "What if I cry, or shake, or nothing happens?", a: "All three are normal." },
              { q: "What's your cancellation policy?", a: "24 hours' notice, please. Inside that window the session is still charged, since that time was held for you. Life happens though, so if something genuine comes up, just message me." },
            ].map(({ q, a }) => (
              <AccordionItem key={q} value={q}>
                <AccordionTrigger className="text-sm font-semibold text-foreground">{q}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed">{a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        <div className="flex justify-center">
          <BookButton />
        </div>
      </main>

      <footer className="relative z-10 border-t border-border py-10 text-center text-xs text-muted-foreground">
        Resonance Kinesiology · Daniele Buatti · <a href="mailto:info@danielebuatti.com" className="underline">info@danielebuatti.com</a>
        <br className="sm:hidden" />
        <span className="sm:before:content-['·'] sm:before:mx-2">
          Also teaches voice and piano — <a href="https://danielebuatti.com/voice-piano-services" target="_blank" rel="noopener noreferrer" className="underline">lessons</a>
        </span>
      </footer>
    </div>
  );
}
