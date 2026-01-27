export type Pronoun = "He/Him" | "She/Her" | "They/Them" | "Other";
export type AppointmentTag = "Kinesiology" | "Community Kinesiology";
export type AppointmentStatus = "Scheduled" | "Completed" | "Cancelled" | "No Show";

export interface Appointment {
  id: string; // APP-xxxx
  clientId: string;
  date: Date;
  tag: AppointmentTag;
  status: AppointmentStatus;
  notes: string;
  goal: string;
  issue: string;
  acupoints: string;
}

export interface Client {
  id: string;
  name: string;
  pronouns: Pronoun;
  born: Date;
  suburb: string[];
  email: string;
  phone: string;
}