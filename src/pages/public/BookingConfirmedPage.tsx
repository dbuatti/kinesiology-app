import { useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { trackConversion, trackEvent } from "@/lib/analytics";
import { getUtmParams } from "@/lib/utm";

/**
 * Landing page for Cal.com booking confirmations.
 *
 * Configure each Cal.com event type's "Redirect URL on booking" to point here,
 * e.g. https://kinesiology-app.vercel.app/booking-confirmed?practice=kinesiology
 * Cal.com appends booking details as query params. We fire the Google Ads
 * conversion + a `book_session` event, then show a friendly confirmation.
 */
export default function BookingConfirmedPage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const practice = params.get("practice") || params.get("event") || "kinesiology";
    trackEvent("book_session", { practice, ...getUtmParams() });
    trackConversion(undefined, 1, "AUD");
  }, []);

  return (
    <div className="landing min-h-screen flex items-center justify-center bg-background text-foreground px-5 py-12">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 className="text-primary" size={36} />
        </div>
        <h1 className="font-serif text-3xl font-medium tracking-tight">You're booked in</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          Your session is confirmed. You'll receive a confirmation email with the
          details and a calendar invite shortly.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/"
            className="inline-flex h-11 items-center justify-center rounded-full bg-brand px-6 text-[14px] font-medium text-white hover:brightness-110"
          >
            Back to home
          </Link>
          <Link
            to="/privacy"
            className="inline-flex h-11 items-center justify-center rounded-full border border-border px-6 text-[14px] font-medium text-foreground hover:bg-muted"
          >
            Privacy policy
          </Link>
        </div>
        <div className="mt-10 flex items-center justify-center gap-2 text-[13px] text-muted-foreground">
          <BrandLogo className="text-[14px]" /> <span>· Daniele Buatti</span>
        </div>
      </div>
    </div>
  );
}