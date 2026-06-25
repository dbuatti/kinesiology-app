import { Sparkles } from "lucide-react";

// A client's onboarding counts as "new" for 14 days after they submit it,
// so the practitioner can spot fresh profile info at a glance.
export const isRecentOnboarding = (ts?: string | null): boolean => {
  if (!ts) return false;
  const t = new Date(ts).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t < 14 * 24 * 60 * 60 * 1000;
};

const NewInfoBadge = ({ submittedAt, className = "" }: { submittedAt?: string | null; className?: string }) => {
  if (!isRecentOnboarding(submittedAt)) return null;
  return (
    <span
      title={`Onboarding submitted ${submittedAt ? new Date(submittedAt).toLocaleDateString() : ""}`}
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-black uppercase tracking-wider shadow-sm ${className}`}
    >
      <Sparkles size={9} /> New
    </span>
  );
};

export default NewInfoBadge;
