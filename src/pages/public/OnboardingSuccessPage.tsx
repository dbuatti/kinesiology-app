import { CheckCircle2 } from "lucide-react";

const OnboardingSuccessPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted px-6 py-16">
      <div className="w-full max-w-md bg-background rounded-[2.5rem] shadow-xl overflow-hidden text-center">
        <div className="h-1.5 bg-indigo-600" />
        <div className="p-10 sm:p-12">
          <div className="mx-auto w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-6">
            <CheckCircle2 className="text-emerald-600" size={36} />
          </div>
          <div className="text-[11px] font-black tracking-[0.3em] uppercase text-indigo-600 mb-3">
            Payment Received
          </div>
          <h1 className="text-2xl font-black text-foreground mb-3">You're all set!</h1>
          <p className="text-muted-foreground leading-relaxed text-sm">
            Your payment is confirmed and your session is locked in. You'll find the
            booking details in your confirmation email.
          </p>

          <div className="mt-8 pt-6 border-t border-border text-left">
            <div className="font-bold text-foreground">Daniele Buatti</div>
            <div className="text-indigo-600 text-[11px] font-black tracking-[0.1em] uppercase">
              Functional Neuro Health
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingSuccessPage;
