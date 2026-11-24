import { Link } from "react-router-dom";
import { BrandLogo } from "@/components/layout/BrandLogo";

export default function PrivacyPage() {
  return (
    <div className="landing min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
        <Link to="/" className="mb-8 inline-flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground">
          <BrandLogo className="text-[15px]" /> <span>· Home</span>
        </Link>
        <h1 className="font-serif text-3xl font-medium tracking-tight text-foreground">Privacy policy</h1>
        <p className="mt-2 text-[13px] text-muted-foreground">Last updated: 25 November 2026. Applies to Resonance Kinesiology (Daniele Buatti), Melbourne, Australia.</p>

        <div className="mt-8 space-y-6 text-[15px] leading-relaxed text-foreground/90">
          <section>
            <h2 className="text-lg font-medium">What we collect</h2>
            <p>When you book or complete an intake, we collect your name, contact details, health history, goals, session notes, and (if you use the client portal) your login email. We also record basic attribution (UTM campaign parameters and referrer) so we know how you found us.</p>
          </section>
          <section>
            <h2 className="text-lg font-medium">How we use it</h2>
            <p>To provide kinesiology services, schedule and confirm appointments, send reminders and follow-ups, process payments, and (with your consent) send occasional updates about new programs. We do not sell your data.</p>
          </section>
          <section>
            <h2 className="text-lg font-medium">AI-assisted tools</h2>
            <p>Some internal tools use AI to draft emails, summarise session notes, or suggest follow-ups. Clinical findings are only sent to an AI provider with your explicit consent, and we do not use your data to train models.</p>
          </section>
          <section>
            <h2 className="text-lg font-medium">Storage &amp; security</h2>
            <p>Data is stored with Supabase (Postgres) with row-level security. Payments are processed by Stripe; we never store card details. Access is limited to the practitioner.</p>
          </section>
          <section>
            <h2 className="text-lg font-medium">Your rights</h2>
            <p>You can request a copy, correction, or deletion of your personal information at any time by emailing <a className="underline" href="mailto:info@danielebuatti.com">info@danielebuatti.com</a>. We respond within 30 days.</p>
          </section>
          <section>
            <h2 className="text-lg font-medium">Cookies</h2>
            <p>We use a small number of cookies/local storage entries for sign-in sessions, theme preference, and (if enabled) anonymous analytics. You can disable analytics cookies in your browser at any time.</p>
          </section>
          <section>
            <h2 className="text-lg font-medium">Contact</h2>
            <p>Questions about this policy: <a className="underline" href="mailto:info@danielebuatti.com">info@danielebuatti.com</a>.</p>
          </section>
        </div>

        <p className="mt-10 text-[12px] text-muted-foreground">
          This policy is a working draft and should be reviewed by a qualified professional before relying on it for compliance purposes.
        </p>
      </div>
    </div>
  );
}