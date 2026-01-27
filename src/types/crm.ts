export type Pronoun = string;
export type AppointmentTag = "Kinesiology" | "Community Kinesiology" | string;
export type AppointmentStatus = "Scheduled" | "Completed" | "Cancelled" | "No Show" | string;

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
  notion_link?: string; // For those Notion session links
}

export interface Client {
  id: string;
  name: string;
  pronouns: string;
  born: Date;
  suburb: string[];
  email: string;
  phone: string;
  occupation?: string;
  marital_status?: string;
  children?: string;
  chatgpt_url?: string;
  journal?: string;
  created_at?: string;
}