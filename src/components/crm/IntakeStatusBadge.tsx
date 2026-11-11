import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const KINESIOLOGY_INTAKE_FIELDS = [
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

// Voice/piano student onboarding: shared contact + voice-specific answers.
// Unified People stores these on `clients` (mirrored from voice_onboarding).
const VOICE_INTAKE_FIELDS = [
  'name', 'email', 'phone',
  'voice_goals', 'voice_experience_level', 'voice_mobile',
];

const isFilled = (val: unknown) =>
  val != null && val !== '' && !(Array.isArray(val) && val.length === 0);

function fieldsFor(client: Record<string, any>): { fields: string[]; label: string } {
  const practices: string[] = client.practices || ['kinesiology'];
  const isVoiceOnly = !practices.includes('kinesiology');
  if (isVoiceOnly) return { fields: VOICE_INTAKE_FIELDS, label: 'Voice onboarding' };
  return { fields: KINESIOLOGY_INTAKE_FIELDS, label: 'Intake' };
}

export function calculateIntakeCompletion(client: Record<string, any>): { filled: number; total: number; percent: number } {
  const { fields } = fieldsFor(client);
  let filled = 0;
  for (const field of fields) {
    if (isFilled(client[field])) filled++;
  }
  return { filled, total: fields.length, percent: Math.round((filled / fields.length) * 100) };
}

interface IntakeStatusBadgeProps {
  client: Record<string, any>;
  showLabel?: boolean;
}

export const IntakeStatusBadge = ({ client, showLabel }: IntakeStatusBadgeProps) => {
  const { filled, total, percent } = calculateIntakeCompletion(client);
  const { label } = fieldsFor(client);

  const getColor = () => {
    if (percent === 0) return "bg-muted text-muted-foreground dark:bg-card dark:text-muted-foreground";
    if (percent < 50) return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300";
    if (percent < 100) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";
    return "bg-emerald-500 text-primary-foreground";
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge className={cn("border-none text-[10px] font-semibold cursor-default shrink-0", getColor())}>
          {percent === 100 ? "✓" : `${percent}%`}
        </Badge>
      </TooltipTrigger>
      <TooltipContent className="rounded-xl text-xs font-medium">
        {percent === 0
          ? `${label} not started`
          : percent === 100
          ? `${label} complete`
          : `${label} ${percent}% complete (${filled}/${total} fields)`}
      </TooltipContent>
    </Tooltip>
  );
};
