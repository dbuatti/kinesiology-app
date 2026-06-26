import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const INTAKE_FIELDS = [
  'name', 'email', 'phone', 'born', 'home_address',
  'referral_source', 'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relationship',
  'occupation', 'children', 'change_one_thing', 'never_been_same_since', 'chief_complaint',
  'health_problem_severity', 'seen_medical_doctor', 'symptoms_worse_stress', 'symptoms_worse_fatigue',
  'pain_movement', 'current_stress_level', 'therapies_used', 'therapies_other', 'therapies_success',
  'specific_illnesses', 'covid_vaccinated', 'covid_shots', 'allergies_asthma',
  'energy_worse_time', 'family_medical_history', 'alcohol_frequency',
  'sleep_schedule', 'sleep_quality_details', 'concussion_history', 'concussion_details',
  'birthing_experience', 'avoided_emotion', 'craved_emotion', 'stress_response',
  'most_craved_human_need', 'startled_by_loud_noises', 'emotional_regulation_time', 'additional_notes',
];

export function calculateIntakeCompletion(client: Record<string, any>): { filled: number; total: number; percent: number } {
  let filled = 0;
  for (const field of INTAKE_FIELDS) {
    const val = client[field];
    if (val != null && val !== '' && !(Array.isArray(val) && val.length === 0)) {
      filled++;
    }
  }
  return { filled, total: INTAKE_FIELDS.length, percent: Math.round((filled / INTAKE_FIELDS.length) * 100) };
}

interface IntakeStatusBadgeProps {
  client: Record<string, any>;
  showLabel?: boolean;
}

export const IntakeStatusBadge = ({ client, showLabel }: IntakeStatusBadgeProps) => {
  const { filled, total, percent } = calculateIntakeCompletion(client);

  const getColor = () => {
    if (percent === 0) return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
    if (percent < 50) return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300";
    if (percent < 100) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";
    return "bg-emerald-500 text-white";
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge className={cn("border-none text-[9px] font-semibold cursor-default shrink-0", getColor())}>
          {percent === 100 ? "✓" : `${percent}%`}
        </Badge>
      </TooltipTrigger>
      <TooltipContent className="rounded-xl text-xs font-medium">
        {percent === 0
          ? "Intake form not started"
          : percent === 100
          ? "Intake form complete"
          : `Intake ${percent}% complete (${filled}/${total} fields)`}
      </TooltipContent>
    </Tooltip>
  );
};
