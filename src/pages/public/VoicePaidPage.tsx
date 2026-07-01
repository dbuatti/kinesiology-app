import { CheckCircle2 } from "lucide-react";

/**
 * Public (no-auth) page clients land on after completing Stripe Checkout.
 * Used as the `success_url` for voice lesson payments.
 */
const VoicePaidPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6 py-16">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-xl overflow-hidden text-center">
        <div className="h-1.5 bg-rose-600" />
        <div className="p-10 sm:p-12">
          <div className="mx-auto w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-6">
            <CheckCircle2 className="text-emerald-600" size={36} />
          </div>
          <div className="text-[11px] font-black tracking-[0.3em] uppercase text-rose-600 mb-3">
            Payment Received
          </div>
          <h1 className="text-2xl font-black text-slate-800 mb-3">Thank you! 🎵</h1>
          <p className="text-slate-500 leading-relaxed text-sm">
            Your payment is confirmed and your lesson is locked in. You’ll find the
            booking details in your confirmation email — I’m looking forward to working
            with you.
          </p>

          <div className="mt-8 pt-6 border-t border-slate-100 text-left">
            <div className="font-bold text-slate-800">Daniele Buatti</div>
            <div className="text-rose-600 text-[11px] font-black tracking-[0.1em] uppercase">
              Voice Coach
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoicePaidPage;
