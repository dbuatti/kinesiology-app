export type Pronoun = string;
export type AppointmentTag = "Kinesiology" | "Community Kinesiology" | string;
export type AppointmentStatus = "Scheduled" | "Completed" | "Cancelled" | "No Show" | "AP" | "OPEN" | string;

export interface MuscleTestResult {
  id: string;
  appointment_id: string;
  muscle_name: string;
  status: 'Normotonic' | 'Inhibition' | 'Hypertonic' | 'Switching' | 'Dysfunctional';
  created_at: string;
}

export interface Appointment {
  id: string; 
  display_id?: string;
  clientId: string;
  date: Date;
  tag: AppointmentTag;
  status: AppointmentStatus;
  notes: string;
  goal: string;
  issue: string;
  acupoints: string;
  // New CSV fields
  name?: string;
  additional_notes?: string;
  priority_pattern?: string;
  session_north_star?: string;
  modes_balances?: string;
  journal?: string;
  notion_link?: string;
  bolt_score?: number | null;
  // Heart/Brain Coherence fields
  heart_rate?: number | null;
  breath_rate?: number | null;
  coherence_score?: number | null;
  // Range of Motion/Cogs fields
  sagittal_plane_notes?: string | null;
  frontal_plane_notes?: string | null;
  transverse_plane_notes?: string | null;
  // Hydration tracking fields
  hydrated?: boolean | null;
  hydration_notes?: string | null;
  // Emotion Assessment fields
  emotion_mode?: string | null;
  emotion_primary_selection?: string | null;
  emotion_secondary_selection?: string[] | null;
  emotion_notes?: string | null;
  // Fakuda Step Test field
  fakuda_notes?: string | null;
  // Sharpened Rhombergs Test field
  sharpened_rhombergs_notes?: string | null;
  // Frontal Lobe Assessment field
  frontal_lobe_notes?: string | null;
  // Luscher Colour Assessment fields
  luscher_color_1?: string | null;
  luscher_color_2?: string | null;
  // Sympathetic Down Regulation fields
  harmonic_rocking_notes?: string | null;
  t1_reset_notes?: string | null;
  diaphragm_reset_notes?: string | null;
  vagus_nerve_notes?: string | null;
  // Gait Reflex Integration
  gait_notes?: string | null;
  // Lymphatic System Assessment
  lymphatic_suture_side?: string | null;
  lymphatic_priority_zone?: string | null;
  lymphatic_notes?: string | null;
}

export interface Client {
  id: string;
  name: string;
  pronouns: string;
  born: Date;
  suburbs: string[]; // Updated from suburb to match DB
  email: string;
  phone: string;
  occupation?: string;
  marital_status?: string;
  children?: string;
  chatgpt_url?: string;
  journal?: string;
  created_at?: string;
  is_practitioner?: boolean;
}