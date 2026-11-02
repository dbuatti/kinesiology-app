import { ReactNode } from "react";
import { Heart, ShieldAlert, Activity, Zap, User, Brain, Bed, AlertTriangle, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClientIntakeSummaryProps {
  data: Record<string, unknown>;
  onClose?: () => void;
}

function Label({ children, icon: Icon }: { children: ReactNode; icon?: React.ComponentType<{ size?: number }> }) {
  return (
    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-amber-400/80">
      {Icon && <Icon size={10} />}
      <span>{children}</span>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value || value === "null" || value === "undefined") return null;
  return (
    <div className="py-1.5 border-b border-white/[0.04] last:border-0">
      <div className="text-[10px] font-medium text-amber-400/60">{label}</div>
      <div className="text-[12px] font-medium text-white/80 mt-0.5 leading-snug">{value}</div>
    </div>
  );
}

function MultiRow({ label, value }: { label: string; value?: string[] | null }) {
  if (!value || !Array.isArray(value) || value.length === 0) return null;
  return (
    <div className="py-1.5 border-b border-white/[0.04] last:border-0">
      <div className="text-[10px] font-medium text-amber-400/60">{label}</div>
      <div className="text-[12px] text-white/70 mt-0.5 leading-snug flex flex-wrap gap-1.5">
        {value.map((v, i) => (
          <span key={i} className="inline-block rounded-md bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 text-[10.5px]">{v}</span>
        ))}
      </div>
    </div>
  );
}

export default function ClientIntakeSummary({ data }: ClientIntakeSummaryProps) {
  const d = data || {};
  return (
    <div className="space-y-4 text-sm">
      {/* Section 1 — Personal */}
      <section>
        <Label icon={User}>Personal</Label>
        <Row label="Name" value={`${d.name || "—"}`} />
        <Row label="Age / DOB" value={d.born ? new Date(d.born).toLocaleDateString() : "—"} />
        <Row label="Work / Life" value={d.occupation || "—"} />
        <Row label="Children" value={d.children ? (d.children === "true" ? "Yes" : d.children.toString()) : "—"} />
        <Row label="How found us" value={d.referral_source || "—"} />
      </section>

      {/* Section 2 — Why here */}
      <section>
        <Label icon={Zap}>Why here</Label>
        <Row label="Main complaint" value={d.chief_complaint || "—"} />
        <Row label="Duration" value={d.chief_complaint ? (d.chief_complaint.length < 20 ? "—" : "See complaint above") : "—"} />
        <Row label="Would change" value={d.change_one_thing || "—"} />
        <Row label="Never same since" value={d.never_been_same_since || "—"} />
        <Row label="Severity" value={d.health_problem_severity ? { Mild: "Mild", Moderate: "Moderate", Severe: "Severe", Extreme: "Extreme" }[d.health_problem_severity as string] || d.health_problem_severity.toString() : "—"} />
        <Row label="Stress level (1-10)" value={d.current_stress_level ? String(d.current_stress_level) + "/10" : "—"} />
        <Row label="Seen doctor?" value={d.seen_medical_doctor ? "Yes" : d.seen_medical_doctor === false ? "No" : "—"} />
      </section>

      {/* Section 3 — Symptoms / Pattern */}
      <section>
        <Label icon={Activity}>Symptoms & Pattern</Label>
        <Row label="Stress worsens?" value={d.symptoms_worse_stress ? (d.symptoms_worse_stress === true || d.symptoms_worse_stress === "true" ? "Yes" : d.symptoms_worse_stress.toString()) : "—"} />
        <Row label="Tired worsens?" value={d.symptoms_worse_fatigue ? (d.symptoms_worse_fatigue === true || d.symptoms_worse_fatigue === "true" ? "Yes" : d.symptoms_worse_fatigue.toString()) : "—"} />
        <Row label="Movement effect" value={d.pain_movement || "—"} />
        <Row label="Energy dips" value={d.energy_worse_time || "—"} />
        <Row label="Sleep" value={(d.sleep_schedule ? d.sleep_schedule.toString() : "—") + (d.sleep_quality_details ? ` · ${Array.isArray(d.sleep_quality_details) ? d.sleep_quality_details.join(", ") : d.sleep_quality_details.toString()}` : "")} />
      </section>

      {/* Section 4 — Health / Birth / Injuries */}
      <section>
        <Label icon={ShieldAlert}>Health & Birth</Label>
        <Row label="Illnesses / flares" value={d.specific_illnesses || "—"} />
        <Row label="Allergies / asthma" value={d.allergies_asthma || "—"} />
        <Row label="Concussion / head injury" value={d.concussion_history ? (d.concussion_history === true || d.concussion_history === "true" ? "Yes — " + (d.concussion_details || "—") : d.concussion_history.toString()) : "No"} />
        <Row label="Birth experience" value={Array.isArray(d.birthing_experience) ? d.birthing_experience.join(", ") : (d.birthing_experience || "—")} />
        <MultiRow label="Family history" value={Array.isArray(d.family_medical_history) ? d.family_medical_history : (d.family_medical_history ? [d.family_medical_history.toString()] : undefined)} />
        <Row label="Alcohol" value={d.alcohol_frequency || "—"} />
      </section>

      {/* Section 5 — Emotional / Nervous system */}
      <section>
        <Label icon={Heart}>Emotional Patterns</Label>
        <Row label="Most avoided feeling" value={d.avoided_emotion || "—"} />
        <Row label="Most craved emotion" value={d.craved_emotion || "—"} />
        <Row label="Most craved need" value={d.most_craved_human_need || "—"} />
        <Row label="Stress response" value={Array.isArray(d.stress_response) ? d.stress_response.join(", ") : d.stress_response || "—"} />
        <Row label="Loud noise startle" value={d.startled_by_loud_noises ? (d.startled_by_loud_noises === true || d.startled_by_loud_noises === "true" ? "Yes" : d.startled_by_loud_noises === "false" ? "No" : d.startled_by_loud_noises.toString()) : "—"} />
        <Row label="Regulation time" value={d.emotional_regulation_time || "—"} />
      </section>

      {/* Section 6 — What tried */}
      <section>
        <Label icon={Zap}>What Has Been Tried</Label>
        <MultiRow label="Therapies / approaches" value={Array.isArray(d.therapies_used) ? d.therapies_used : (d.therapies_used ? [d.therapies_used.toString()] : undefined)} />
        <Row label="What helped / what didn't" value={d.therapies_success || "—"} />
        <Row label="Other" value={d.therapies_other || "—"} />
      </section>

      {/* Section 7 — Goals */}
      <section>
        <Label icon={Brain}>Goals & Expectations</Label>
        <Row label="Working goal" value={d.goal_working || "—"} />
        <Row label="12-session vision" value={d.goal_12_sessions || "—"} />
        <Row label="Safe / calm feeling" value={d.goal_safe_feeling || "—"} />
        <Row label="Notes" value={d.additional_notes || "—"} />
      </section>
    </div>
  );
}
