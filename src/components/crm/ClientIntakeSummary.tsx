import { ReactNode } from "react";
import { Heart, ShieldAlert, Activity, Zap, User, Brain } from "lucide-react";

interface ClientIntakeSummaryProps {
  data: Record<string, unknown>;
}

function Section({ title, icon: Icon, children }: { title: string; icon?: React.ComponentType<{ size?: number; className?: string }>; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-background/60 p-4">
      <div className="mb-2 flex items-center gap-1.5">
        {Icon && <Icon size={12} className="text-primary" />}
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.09em] text-primary">
          {title}
        </h3>
      </div>
      <div className="divide-y divide-border/60">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value || value === "null" || value === "undefined" || value === "—") return null;
  return (
    <div className="py-2 first:pt-0 last:pb-0">
      <div className="text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-[13px] leading-relaxed text-foreground whitespace-pre-wrap">{value}</div>
    </div>
  );
}

function MultiRow({ label, value }: { label: string; value?: string[] | null }) {
  if (!value || !Array.isArray(value) || value.length === 0) return null;
  return (
    <div className="py-2 first:pt-0 last:pb-0">
      <div className="text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground">{label}</div>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {value.map((v, i) => (
          <span
            key={i}
            className="inline-flex items-center rounded-md border border-border bg-muted px-1.5 py-0.5 text-[11px] font-medium text-foreground"
          >
            {v}
          </span>
        ))}
      </div>
    </div>
  );
}

const yesNo = (v: unknown): string | undefined => {
  if (v === true || v === "true") return "Yes";
  if (v === false || v === "false") return "No";
  if (v == null || v === "") return undefined;
  return String(v);
};

const fmtDate = (v: unknown): string | undefined => {
  if (!v) return undefined;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleDateString();
};

export default function ClientIntakeSummary({ data }: ClientIntakeSummaryProps) {
  const d = (data || {}) as Record<string, any>;
  const arr = (v: unknown): string[] | undefined =>
    Array.isArray(v) ? v.map(String) : v ? [String(v)] : undefined;

  return (
    <div className="space-y-3">
      <Section title="Personal details" icon={User}>
        <Row label="Name" value={d.name} />
        <Row label="Date of birth" value={fmtDate(d.born)} />
        <Row label="Email" value={d.email} />
        <Row label="Phone" value={d.phone} />
        <Row label="Address" value={d.home_address} />
        <Row label="Work / daily life" value={d.occupation} />
        <Row label="Children" value={yesNo(d.children)} />
        <Row label="How they found us" value={d.referral_source} />
        <Row
          label="Emergency contact"
          value={[d.emergency_contact_name, d.emergency_contact_relationship, d.emergency_contact_phone]
            .filter(Boolean)
            .join(" · ")}
        />
      </Section>

      <Section title="What brings them here" icon={Zap}>
        <Row label="Main thing they want help with" value={d.chief_complaint} />
        <Row label="One thing they'd change" value={d.change_one_thing} />
        <Row label="Never been the same since" value={d.never_been_same_since} />
        <Row label="Intensity / disruption" value={d.health_problem_severity} />
        <Row label="Current stress level" value={d.current_stress_level != null ? `${d.current_stress_level}/10` : undefined} />
        <Row label="Seen a doctor?" value={yesNo(d.seen_medical_doctor)} />
      </Section>

      <Section title="Symptoms & patterns" icon={Activity}>
        <Row label="Worse when stressed?" value={yesNo(d.symptoms_worse_stress)} />
        <Row label="Worse when tired / run down?" value={yesNo(d.symptoms_worse_fatigue)} />
        <Row label="Movement effect" value={d.pain_movement} />
        <Row label="Energy dips" value={d.energy_worse_time} />
        <Row label="Sleep / wake times" value={d.sleep_schedule} />
        <MultiRow label="Sleep quality" value={arr(d.sleep_quality_details)} />
      </Section>

      <Section title="Health history" icon={ShieldAlert}>
        <Row label="Illnesses / flare-ups" value={d.specific_illnesses} />
        <Row label="Allergies / asthma / immune reactions" value={d.allergies_asthma} />
        <Row label="COVID-19 vaccinated?" value={yesNo(d.covid_vaccinated)} />
        <Row
          label="Concussion / head injury"
          value={
            yesNo(d.concussion_history) === "Yes"
              ? `Yes — ${d.concussion_details || "no details given"}`
              : yesNo(d.concussion_history)
          }
        />
        <MultiRow label="Birth experience" value={arr(d.birthing_experience)} />
        <MultiRow label="Family health history" value={arr(d.family_medical_history)} />
        <Row label="Alcohol" value={d.alcohol_frequency} />
      </Section>

      <Section title="Nervous system & emotional patterns" icon={Heart}>
        <Row label="Most avoided feeling" value={d.avoided_emotion} />
        <Row label="Wants more of" value={d.craved_emotion} />
        <Row label="Craving most right now" value={d.most_craved_human_need} />
        <MultiRow label="Stress response" value={arr(d.stress_response)} />
        <Row label="Startled by loud noises?" value={yesNo(d.startled_by_loud_noises)} />
        <Row label="Time to settle after trigger" value={d.emotional_regulation_time} />
      </Section>

      <Section title="What they've already tried" icon={Zap}>
        <MultiRow label="Therapies / approaches" value={arr(d.therapies_used)} />
        <Row label="What helped / what didn't" value={d.therapies_success} />
        <Row label="Other" value={d.therapies_other} />
      </Section>

      <Section title="Goals & expectations" icon={Brain}>
        <Row label="What 'working' looks like" value={d.goal_working} />
        <Row label="After 12 sessions" value={d.goal_12_sessions} />
        <Row label="What helps them feel safe" value={d.goal_safe_feeling} />
        <Row label="Anything else" value={d.additional_notes} />
      </Section>
    </div>
  );
}
