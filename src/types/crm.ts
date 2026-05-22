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

export interface CranialNerveTest {
  id: string;
  appointment_id: string;
  user_id: string;
  nerve_id: string;
  is_inhibited: boolean;
  is_stimulated: boolean;
  is_priority: boolean;
  is_primary_priority: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PrimitiveReflexTest {
  id: string;
  appointment_id: string;
  user_id: string;
  reflex_id: string;
  is_inhibited: boolean;
  is_stimulated: boolean;
  is_priority: boolean;
  is_primary_priority: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string; 
  display_id?: string;
  user_id: string;
  client_id: string;
  date: Date;
  tag: AppointmentTag;
  status: AppointmentStatus;
  notes: string;
  goal: string;
  issue: string;
  acupoints: string;
  is_paid?: boolean;
  payment_received?: boolean;
  payment_link?: string | null;
  payment_method?: string | null;
  notion_page_id?: string | null;
  notion_planner_id?: string | null;
  calcom_booking_id?: string | null;
  name?: string;
  price_amount?: number | null;
  price_currency?: string | null;
  additional_notes?: string;
  priority_pattern?: string;
  session_north_star?: string;
  next_session_note?: string | null;
  modes_balances?: string;
  journal?: string;
  notion_link?: string;
  bolt_score?: number | null;
  heart_rate?: number | null;
  breath_rate?: number | null;
  coherence_score?: number | null;
  sagittal_plane_notes?: string | null;
  frontal_plane_notes?: string | null;
  transverse_plane_notes?: string | null;
  hydrated?: boolean | null;
  hydration_notes?: string | null;
  emotion_mode?: string | null;
  emotion_primary_selection?: string | null;
  emotion_secondary_selection?: string[] | null;
  emotion_notes?: string | null;
  fakuda_notes?: string | null;
  sharpened_rhombergs_notes?: string | null;
  frontal_lobe_notes?: string | null;
  righting_reflex_notes?: string | null;
  luscher_color_1?: string | null;
  luscher_color_2?: string | null;
  harmonic_rocking_notes?: string | null;
  t1_reset_notes?: string | null;
  diaphragm_reset_notes?: string | null;
  vagus_nerve_notes?: string | null;
  gait_notes?: string | null;
  lymphatic_suture_side?: string | null;
  lymphatic_priority_zone?: string | null;
  lymphatic_notes?: string | null;
  current_stress_level?: number | null;
  sleep_quality?: string | null;
  digestive_health?: string | null;
  medications_supplements?: string | null;
  send_onboarding?: boolean;
  metadata?: any;
}

export interface Client {
  id: string;
  user_id: string;
  name: string;
  pronouns: string;
  born: Date | null;
  suburbs: string[];
  email: string | null;
  phone: string | null;
  occupation?: string | null;
  marital_status?: string | null;
  children?: string | null;
  chatgpt_url?: string | null;
  journal?: string | null;
  created_at?: string;
  is_practitioner?: boolean;
  stripe_customer_id?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  medical_history?: string | null;
  referral_source?: string | null;
  medications_supplements?: string | null;
  current_stress_level?: number | null;
  sleep_quality?: string | null;
  digestive_health?: string | null;
  notion_page_id?: string | null;
  notion_link?: string | null;
}

export interface AppointmentWithClient extends Appointment {
  clients: Client;
}